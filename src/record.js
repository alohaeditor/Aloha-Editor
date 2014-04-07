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

	function getValues(record) {
		assertRead(record);
		return record._record_values;
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

	function addBasicField(Record, defaultValue) {
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

	function defineBasic(init) {
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

	function computableFromBasicField(field) {
		var compute = null;
		var computeT = null;
		var isMemoized = null;
		var setT = field.setT;
		var set = field.set;
		var get = field.get;
		var wrappedSetT = setT;
		var wrappedSet = set;
		var wrappedGet = get;
		set = true && function (record, newValue) {
			return wrappedSet(record, constantFn(newValue));
		};
		setT = true && function (record, newValue) {
			return wrappedSetT(record, constantFn(newValue));
		};
		get = true && function (record) {
			return wrappedGet(record)(false);
		};
		// @deprecated makes no sense
		isMemoized = true && function (record) {
			return wrappedGet(record)(true);
		};
		compute = true && function (record, fn, arg) {
			return wrappedSet(record, lazyFn(fn, arg));
		};
		computeT = true && function (record, fn, arg) {
			return wrappedSetT(record, lazyFn(fn, arg));
		};
		field = Accessor(get, set);
		field.setT       = setT;
		field.compute    = compute;
		field.computeT   = computeT;
		field.isMemoized = isMemoized;
		return field;
	}

	function addComputableField(Record, defaultValue) {
		return computableFromBasicField(
			addBasicField(Record, constantFn(defaultValue))
		);
	}

	function extend(Record, addField, fieldMap) {
		Maps.forEach(fieldMap, function (defaultValue, name) {
			var field = addField(Record, defaultValue);
			var method = Accessor.asMethod(field);
			method.setT = field.setT;
			if (field.compute) {
				method.compute    = field.compute;
				method.computeT   = field.computeT;
				method.isMemoized = field.isMemoized;
			}
			Record.prototype[name] = method;
		});
	}

	function getValuesComputed(record) {
		assertRead(record);
		// TODO like getValues() but compute values
		Assert.notImplemented();
	}

	function define(addField, getValues, fieldMap, init) {
		if (Fn.is(fieldMap)) {
			init = fieldMap;
			fieldMap = null;
		}
		var Record = defineBasic(init || initWithValues);
		Record.addField         = Fn.partial(addField, Record);
		Record.extend           = Fn.partial(extend, addField, Record);
		Record.prototype.values = Fn.asMethod(getValues);
		if (fieldMap) {
			extend(Record, addField, fieldMap);
		}
		return Record;
	}

	var defineStrict = Fn.partial(define, addBasicField     , getValues);
	var defineLazy   = Fn.partial(define, addComputableField, getValuesComputed);

	return {
		define      : defineLazy,
		defineStrict: defineStrict
	};
});
