/**
 * Design goals and features:
 * - persistent datastructure with custom setters and custom memoized getters
 * - small code size
 * - fast for a small constant number of fields
 * - compatible with google closure compiler advanced optimizations
 * - fields can have getters and setters on the prototype for convenience
 * - private fields without needing getters and setters on the prototype
 * - record.merge(values) shares values array (values must be persistent)
 * - transient support with linear-time record.asTransient()
 * - optional init function (default calls record.merge())
 */
define(['functions', 'maps', 'accessor', 'assert'],
/** @exports Record */ function (Fn, Maps, Accessor, Assert) {
	'use strict';

	var DEFAULT_FOR_COMPUTED_FIELDS = {};
	var NOT_TRANSIENT = 0;
	var DISCARDED_TRANSIENT = 1;
	var TRANSIENT = 2;

	function ensureDefaults(record, defaults) {
		var values = record._record_values;
		var valuesLen = values.length;
		if (valuesLen < defaults.length) {
			values = values.concat(defaults.slice(valuesLen));
			record._record_values = values;
		}
		return values;
	}

	function ensureTypeDefaults(record) {
		var Record = record.constructor;
		return ensureDefaults(record, Record._record_defaults);
	}

	function initWithValues(record, values) {
		if (!values) {
			return record;
		}
		var defaults = record._record_values;
		record._record_values = values;
		ensureDefaults(record, defaults);
		return record;
	}

	function newInstanceFromExisting(record, values) {
		var Record = record.constructor;
		var newRecord = new Record();
		newRecord._record_values = values;
		return newRecord;
	}

	function clone(record) {
		return newInstanceFromExisting(record, record._record_values);
	}

	function cloneForWrite(record) {
		return newInstanceFromExisting(record, record._record_values.slice(0));
	}

	function assertRead(record, Record) {
		Assert.assert(!Record || record.constructor === Record,
		              Assert.RECORD_WRONG_TYPE);
		var transience = record._record_transience;
		Assert.assert(transience === NOT_TRANSIENT || transience === TRANSIENT,
		              Assert.READ_FROM_DISCARDED_TRANSIENT);
	}

	function assertWrite(record, Record) {
		Assert.assert(!Record || record.constructor === Record,
		              Assert.RECORD_WRONG_TYPE);
		Assert.assert(record._record_transience === NOT_TRANSIENT,
		              Assert.PERSISTENT_WRITE_TO_TRANSIENT);
	}

	function assertTransientWrite(record, Record) {
		Assert.assert(!Record || record.constructor === Record,
		              Assert.RECORD_WRONG_TYPE);
		Assert.assert(record._record_transience === TRANSIENT,
		              Assert.TRANSIENT_WRITE_TO_PERSISTENT);
	}

	function asPersistent(record) {
		assertTransientWrite(record);
		record._record_transience = DISCARDED_TRANSIENT;
		return clone(record);
	}

	function discardTransient(record) {
		var newRecord = asPersistent(record);
		newRecord._record_transience = TRANSIENT;
		return newRecord;
	}

	function asTransient(record) {
		assertRead(record);
		var newRecord = cloneForWrite(record);
		newRecord._record_transience = TRANSIENT;
		return newRecord;
	}

	function getValue(record, offset, defaults) {
		var values = ensureDefaults(record, defaults);
		return values[offset];
	}

	function setValue(record, newValue, offset, defaults) {
		var newRecord = cloneForWrite(record);
		var values = ensureDefaults(newRecord, defaults);
		values[offset] = newValue;
		return newRecord;
	}

	function setValueT(record, newValue, offset, defaults) {
		var newRecord = discardTransient(record);
		var values = ensureDefaults(newRecord, defaults);
		values[offset] = newValue;
		return newRecord;
	}

	function addField(Record, defaultValue) {
		var defaults = Record._record_defaults;
		var offset = Record._record_defaults.length;
		function get(record) {
			assertRead(record, Record);
			return getValue(record, offset, defaults);
		}
		function set(record, newValue) {
			assertWrite(record, Record);
			return setValue(record, newValue, offset, defaults);
		}
		var field = Accessor(get, set);
		field.setT = function setT(record, newValue) {
			assertTransientWrite(record, Record);
			return setValueT(record, newValue, offset, defaults);
		};
		defaults.push(defaultValue);
		return field;
	}

	function defineBase(init) {
		var defaults = [];
		function Record(values) {
			if (!(this instanceof Record)) {
				return init(new Record(), values);
			}
			this._record_values = defaults;
			this._record_transience = NOT_TRANSIENT;
		}
		Maps.extend(Record.prototype, {
			asTransient: Fn.asMethod1(asTransient),
			asPersistent: Fn.asMethod1(asPersistent)
		});
		Record._record_defaults = defaults;
		return Record;
	}

	function lazyFn(computedGet, arg) {
		var value = DEFAULT_FOR_COMPUTED_FIELDS;
		return function (returnMemoized) {
			var memoized = DEFAULT_FOR_COMPUTED_FIELDS !== value;
			if (returnMemoized) {
				return memoized;
			} else {
				if (!memoized) {
					value = computedGet(arg);
				}
				return value;
			}
		};
	}

	function constantFn(value) {
		return function (returnMemoized) {
			if (returnMemoized) {
				return true;
			} else {
				return value;
			}
		}
	}

	function wrapBasicField(field, descriptor) {
		var computable = descriptor.computable;
		var computedSet = descriptor.set;
		var computedSetT = descriptor.setT;
		Assert.assert(!(computedSet && computedSetT), Assert.ONLY_ONE_OF_SET_OR_SETT);
		var setT = field.setT;
		var set = field.set;
		var get = field.get;
		var compute = null;
		var computeT = null;
		var isMemoized = null;
		if (computable) {
			var wrappedSetT = setT;
			var wrappedSet = set;
			var wrappedGet = get;
			set = function (record, newValue) {
				return wrappedSet(record, constantFn(newValue));
			};
			setT = function (record, newValue) {
				return wrappedSetT(record, constantFn(newValue));
			};
			get = function (record) {
				return wrappedGet(record)(false);
			};
			isMemoized = function (record) {
				return wrappedGet(record)(true);
			};
			compute = function (record, fn, arg) {
				return wrappedSet(record, lazyFn(fn, arg));
			};
			computeT = function (record, fn, arg) {
				return wrappedSetT(record, lazyFn(fn, arg));
			};
		}
		if (computedSetT) {
			var wrappedAgainSetT = setT;
			set = function (record, newValue) {
				return asPersistent(computedSetT(asTransient(record), newValue, wrappedAgainSetT));
			};
			setT = function (record, newValue) {
				return computedSetT(record, newValue, wrappedAgainSetT);
			};
		}
		if (computedSet) {
			var wrappedAgainSet = set;
			set = function (record, newValue) {
				return computedSet(record, newValue, wrappedAgainSet);
			};
			setT = function (record, newValue) {
				return asTransient(computedSet(asPersistent(record), newValue, wrappedAgainSet));
			};
		}
		if (computable || computedSetT || computedSet) {
			field = Accessor(get, set);
			field.setT       = setT;
			field.compute    = compute;
			field.computeT   = computeT;
			field.isMemoized = isMemoized;
		}
		field.descriptor = descriptor;
		return field;
	}

	function addFieldWithDescriptor(Record, descriptor) {
		var defaultValue = descriptor.defaultValue;
		var field = addField(Record, descriptor.computable ? constantFn(defaultValue) : defaultValue);
		field = wrapBasicField(field, descriptor);
		Record._record_fields.push(field);
		return field;
	}

	function extend(Record, fieldMap) {
		Maps.forEach(fieldMap, function (descriptor, name) {
			descriptor = Maps.extend({name: name}, descriptor);
			var field = addFieldWithDescriptor(Record, descriptor);
			var method = Accessor.asMethod(field);
			method.setT       = field.setT;
			method.compute    = field.compute;
			method.computeT   = field.computeT;
			method.isMemoized = field.isMemoized;
			method.descriptor = field.descriptor;
			Record.prototype[name] = method;
		});
	}

	function fieldsFromRecord(record) {
		var Record = record.constructor;
		return Record._record_fields;
	}

	// TODO mergeValues must consider computed fields like mergeValueMap does
	function mergeValues(record, values) {
		assertRead(record);
		return initWithValues(clone(record), values);
	}

	/**
	 * Returns an updated version of the given transient record that has
	 * the values in the given map set in it.
	 *
	 * Doesn't call computed setters. There is no implementation that
	 * calls computed setters from a map since that may cause
	 * unpredictable behaviour if a setter reads from another field on
	 * the record that is also set, but which may be set before or after
	 * the first, depending on the order the fields were defined in.
	 */
	function mergeValueMapT(record, valueMap) {
		if (!valueMap) {
			return record;
		}
		record = discardTransient(record);
		var values = ensureTypeDefaults(record);
		fieldsFromRecord(record).forEach(function (field, i) {
			var name = field.descriptor.name;
			if (valueMap.hasOwnProperty(name)) {
				var value = valueMap[name];
				if (field.descriptor.computable) {
					value = constantFn(value);
				}
				values[i] = value;
			}
		});
		return record;
	}

	/**
	 * Like mergeValueMapT() but for persistent records.
	 */
	function mergeValueMap(record, valueMap) {
		return asPersistent(mergeValueMapT(asTransient(record), valueMap));
	}

	function defaultInit(record, valueArrayOrMap) {
		if (Array.isArray(valueArrayOrMap)) {
			return initWithValues(record, valueArrayOrMap);
		}
		return mergeValueMap(record, valueArrayOrMap);
	}

	function define(fieldMap, init) {
		if (Fn.is(fieldMap)) {
			init = fieldMap;
			fieldMap = null;
		}
		var Record = defineBase(init || defaultInit);
		Record._record_fields = [];
		Record.addField = Fn.partial(addFieldWithDescriptor, Record);
		Record.extend = Fn.partial(extend, Record);
		Maps.extend(Record.prototype, {
			mergeValues: Fn.asMethod1(mergeValues),
			mergeValueMap: Fn.asMethod1(mergeValueMap),
			mergeValueMapT: Fn.asMethod1(mergeValueMapT)
		});
		if (fieldMap) {
			extend(Record, fieldMap);
		}
		return Record;
	}

	return {
		define: define
	};
});
