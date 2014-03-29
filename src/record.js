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
 *
 * TODO: computed getters should compute from a defaultComputeFrom value
 * analogous to defaultValue which.
 */
define(['functions', 'maps', 'accessor', 'assert'], function (Fn, Maps, Accessor, Assert) {
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

	function assertRead(record) {
		var transience = record._record_transience;
		Assert.assert(transience === NOT_TRANSIENT || transience === TRANSIENT, 'read-from-discarded-transient');
	}

	function assertWrite(record) {
		Assert.assert(record._record_transience === NOT_TRANSIENT, 'persistent-write-to-transient');
	}

	function assertTransientWrite(record) {
		Assert.assert(record._record_transience === TRANSIENT, 'transient-write-to-persistent');
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
			assertRead(record);
			return getValue(record, offset, defaults);
		}
		function set(record, newValue) {
			assertWrite(record);
			return setValue(record, newValue, offset, defaults);
		}
		var field = Accessor(get, set);
		field.setT = function setT(record, newValue) {
			assertTransientWrite(record);
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

	function mergeValues(record, values) {
		assertRead(record);
		return initWithValues(clone(record), values);
	}

	function define(init) {
		var Record = defineBase(init || initWithValues);
		Record.addField = Fn.partial(addField, Record);
		Record.prototype.merge = Fn.asMethod1(mergeValues);
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

	function addFieldWithDescriptor(Record, descriptor) {
		var computedGet = descriptor.get;
		var computedSet = descriptor.set;
		var computedSetT = descriptor.setT;
		var defaultValue = descriptor.defaultValue;
		Assert.assert(!(computedSet && computedSetT), 'only-one-of-set-setT');
		var field = addField(Record, computedGet ? constantFn(defaultValue) : defaultValue);
		var setT = field.setT;
		var set = field.set;
		if (computedGet) {
			var get = field.get;
			var wrappedSet = set;
			var wrappedSetT = setT;
			set = field.set = function (record, newValue) {
				return wrappedSet(record, constantFn(newValue));
			};
			setT = field.setT = function (record, newValue) {
				return wrappedSetT(record, constantFn(newValue));
			};
			field.get = function (record) {
				return get(record)(false);
			};
			field.isMemoized = function (record) {
				return get(record)(true);
			};
			/**
			 * To understand computeLazily, think you are setting the
			 * value at the time you call computeLazily, from the
			 * argument passed to computeLazily, not later from an
			 * updated argument.
			 */
			field.computeLazily = function (record, arg) {
				return wrappedSet(record, lazyFn(computedGet, arg));
			};
			field.computeLazilyT = function (record, arg) {
				return wrappedSetT(record, lazyFn(computedGet, arg));
			};
			field.isComputed = Fn.returnTrue;
		} else {
			field.isComputed = Fn.returnFalse;
		}
		if (computedSetT) {
			field.set = function (record, newValue) {
				return asPersistent(computedSetT(asTransient(record), newValue, setT));
			};
			field.setT = function (record, newValue) {
				return computedSetT(record, newValue, setT);
			};
		}
		if (computedSet) {
			field.set = function (record, newValue) {
				return computedSet(record, newValue, set);
			};
			field.setT = function (record, newValue) {
				return asTransient(computedSet(asPersistent(record), newValue, set));
			};
		}
		field.fieldName = descriptor.name;
		Record._record_fields.push(field);
		return field;
	}

	function extend(Record, fieldMap) {
		Maps.forEach(fieldMap, function (descriptor, name) {
			Assert.assert(descriptor, 'no-descriptor');
			descriptor = Fn.is(descriptor) ? {get: descriptor} : descriptor;
			descriptor = Maps.extend({name: name}, descriptor);
			var field = addFieldWithDescriptor(Record, descriptor);
			var method = Accessor.asMethod(field);
			method.setT = field.setT;
			method.computeLazily = field.computeLazily;
			method.computeLazilyT = field.computeLazilyT;
			method.isComputed = field.isComputed;
			method.isMemoized = field.isMemoized;
			Record.prototype[name] = method;
		});
	}

	function fieldsFromRecord(record) {
		var Record = record.constructor;
		return Record._record_fields;
	}

	/**
	 * @deprecated confusing semantics
	 *
	 * Recomputes all lazy fields from the given transient record.
	 *
	 * Useful to ensure that a computed field will receive a record in
	 * which all other recomputed fields are available to it for
	 * reading. The only other way to ensure this is to call
	 * record.computeLazily() on each individual field in dependency
	 * order.
	 */
	function computeLazilyAllFromSelfT(record) {
		record = discardTransient(record);
		fieldsFromRecord(record).forEach(function (field) {
			if (field.isComputed()) {
				field.computeLazilyT(record, record);
				// We cheat and reuse the transient instance so that
				// every recomputed field gets the same instance and
				// they can call each other in any order.
				record._record_transience = TRANSIENT;
			}
		});
		record._record_transience = NOT_TRANSIENT;
		return record.asTransient();
	}

	/**
	 * @depreacted confusing semantics
	 *
	 * Like computeLazilyAllFromSelfT() but for persistent records.
	 */
	function computeLazilyAllFromSelf(record) {
		return asPersistent(computeLazilyAllFromSelfT(asTransient(record)));
	}

	/**
	 * Returns an updated version of the given transient record that has
	 * the values in the given map set in it.
	 *
	 * Doesn't call computed setters since that may cause unpredictable
	 * behaviour if a setter reads from another field on the record that
	 * is also set, but which may be set before or after the first
	 * depending the order the fields were defined.
	 */
	function mergeMapT(record, valueMap) {
		if (!valueMap) {
			return record;
		}
		record = discardTransient(record);
		var values = ensureTypeDefaults(record);
		fieldsFromRecord(record).forEach(function (field, i) {
			var name = field.fieldName;
			if (valueMap.hasOwnProperty(name)) {
				var value = valueMap[name];
				if (field.isComputed()) {
					value = constantFn(value);
				}
				values[i] = value;
			}
		});
		return record;
	}

	/**
	 * Like mergeMapT() but for persistent records.
	 */
	function mergeMap(record, valueMap) {
		return asPersistent(mergeMapT(asTransient(record), valueMap));
	}

	function addFieldWithoutName(Record, defaultValue) {
		var field = addField(Record, defaultValue);
		Record._record_fields.push(field);
		return field;
	}

	function defineMap(fieldMap, init) {
		var Record = defineBase(init || mergeMap);
		Record._record_fields = [];
		Record.addField = Fn.partial(addFieldWithoutName, Record);
		Record.addFieldWithDescriptor = Fn.partial(addFieldWithDescriptor, Record);
		Record.extend = Fn.partial(extend, Record);
		Maps.extend(Record.prototype, {
			merge: Fn.asMethod1(mergeMap),
			mergeT: Fn.asMethod1(mergeMapT),
			computeLazilyAllFromSelf: Fn.asMethod1(computeLazilyAllFromSelf),
			computeLazilyAllFromSelfT: Fn.asMethod1(computeLazilyAllFromSelfT)
		});
		if (fieldMap) {
			extend(Record, fieldMap);
		}
		return Record;
	}

	return {
		define: define,
		defineMap: defineMap
	};
});
