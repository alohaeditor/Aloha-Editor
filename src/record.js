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

	var NOT_TRANSIENT = 0;
	var DISCARDED_TRANSIENT = 1;
	var TRANSIENT = 2;
	var SPECIAL_PRIVATE_VALUE = {};

	/**
	 * Gets the values from a record, ensuring that it has the correct
	 * length, expanding it using the given defaults if necessary.
	 * @private
	 */
	function ensureDefaults(record, defaults) {
		var values = record._record_values;
		var valuesLen = values.length;
		if (valuesLen < defaults.length) {
			values = values.concat(defaults.slice(valuesLen));
			record._record_values = values;
		}
		return values;
	}

	/**
	 * Creates a new record instance given an existing instance.
	 * @private
	 */
	function newInstanceFromExisting(record, values) {
		var Record = record.constructor;
		return new Record(values, SPECIAL_PRIVATE_VALUE);
	}

	/**
	 * Create a clone of the given record and its value array,
	 * presumably so that the values array can be written to without
	 * mutating the existing record.
	 * @private
	 */
	function cloneForWrite(record) {
		return newInstanceFromExisting(record, record._record_values.slice(0));
	}

	/**
	 * Ensures the record is of the correct type and its transience is
	 * of the correct level.
	 * @private
	 */
	function assertRead(record, Record) {
		Assert.assert(!Record || record.constructor === Record,
		              Assert.RECORD_WRONG_TYPE);
		var transience = record._record_transience;
		Assert.assert(transience === NOT_TRANSIENT || transience === TRANSIENT,
		              Assert.READ_FROM_DISCARDED_TRANSIENT);
	}

	/**
	 * Ensures the record is of the correct type and its transience is
	 * of the correct level.
	 * @private
	 */
	function assertWrite(record, Record) {
		Assert.assert(!Record || record.constructor === Record,
		              Assert.RECORD_WRONG_TYPE);
		Assert.assert(record._record_transience === NOT_TRANSIENT,
		              Assert.PERSISTENT_WRITE_TO_TRANSIENT);
	}

	/**
	 * Ensures the record is of the correct type and its transience is
	 * of the correct level.
	 * @private
	 */
	function assertTransientWrite(record, Record) {
		Assert.assert(!Record || record.constructor === Record,
		              Assert.RECORD_WRONG_TYPE);
		Assert.assert(record._record_transience === TRANSIENT,
		              Assert.TRANSIENT_WRITE_TO_PERSISTENT);
	}

	/**
	 * Returns the given transient record as a persistent record.
	 *
	 * Discards the given transient record. See asTransient().
	 *
	 * @param record {!Record} transient record
	 * @return {!Record} persistent record
	 */
	function asPersistent(record) {
		assertTransientWrite(record);
		record._record_transience = DISCARDED_TRANSIENT;
		return newInstanceFromExisting(record, record._record_values);
	}

	/**
	 * Allocates a new transient record and discards the given transient
	 * record.
	 * @private
	 */
	function discardTransient(record) {
		var newRecord = asPersistent(record);
		newRecord._record_transience = TRANSIENT;
		return newRecord;
	}

	/**
	 * Returns the given record as a transient record.
	 *
	 * A record's set() and delay() functions are persistent, which
	 * means they will return a new record instead of mutating a given
	 * record. Obviously, returning a new record is less efficient than
	 * just mutating an existing record. Transients are an optimization
	 * that can be used when lots of updates to a record happen at once.
	 *
	 * The returned transient record can be used with the transient
	 * versions of set() and delay(). By convention, transient versions
	 * of setters are suffixed with the 'T' character. Non transient
	 * setters can't be used with transients and cause an error.
	 *
	 * Updating a transient record, or converting a transient record to
	 * a persistent record will discard the transient record, and any
	 * reads or updates to the discarded record will cause an error.
	 *
	 * One can freely convert between transient and persistent records
	 * by using persitentRecord.asTransient() and
	 * transientRecord.asPersistent().
	 *
	 * @param record {!Record} persistent record
	 * @return {!Record} transient record
	 */
	function asTransient(record) {
		assertRead(record);
		var newRecord = cloneForWrite(record);
		newRecord._record_transience = TRANSIENT;
		return newRecord;
	}

	/**
	 * Gets a value of a record.
	 * @private
	 */
	function getValue(record, offset, defaults) {
		var values = ensureDefaults(record, defaults);
		return values[offset];
	}

	/**
	 * Sets a value on a record.
	 * @private
	 */
	function setValue(record, newValue, offset, defaults) {
		var newRecord = cloneForWrite(record);
		var values = ensureDefaults(newRecord, defaults);
		values[offset] = newValue;
		return newRecord;
	}

	/**
	 * Like setValue() but accepts a transient record.
	 * @private
	 */
	function setValueT(record, newValue, offset, defaults) {
		var newRecord = discardTransient(record);
		var values = ensureDefaults(newRecord, defaults);
		values[offset] = newValue;
		return newRecord;
	}

	/**
	 * Checks whether a value is a value delayed by calling delay().
	 * @private
	 */
	function isDelayValue(value) {
		return Array.isArray(value) && value[0] === SPECIAL_PRIVATE_VALUE;
	}

	/**
	 * Realizes a value that was delayed by calling delay().
	 * @private
	 */
	function realizeDelayValue(delayValue) {
		var value;
		if (delayValue.length > 3) {
			value = delayValue[3];
		} else {
			value = delayValue[1](delayValue[2]);
			delayValue[3] = value;
		}
		return value;
	}

	/**
	 * Adds a field to the given type.
	 *
	 * The only way to access the field is through the returned accessor
	 * (see accessor.js).
	 *
	 * Fields may be added at any time, even after instances have been
	 * constructed, and using the returned accessor to get the field's
	 * value from already existing instances works as expected. Adding
	 * fields to types one didn't define and has no control over is a
	 * feature and allows one to avoid wrapping records.
	 *
	 * The optional defaultValue argument can be used to set the value
	 * the field has before being set the first time.
	 *
	 * @param Record {function}
	 * @param defaultValue {*}
	 * @return {!Field} the new field
	 */
	function addField(Record, defaultValue) {
		var defaults = Record._record_defaults;
		var offset = Record._record_defaults.length;
		function get(record) {
			assertRead(record, Record);
			var value = getValue(record, offset, defaults);
			if (isDelayValue(value)) {
				value = realizeDelayValue(value);
				var values = ensureDefaults(record, defaults);
				values[offset] = value;
			}
			return value;
		}
		function set(record, newValue) {
			assertWrite(record, Record);
			return setValue(record, newValue, offset, defaults);
		}
		function setT(record, newValue) {
			assertTransientWrite(record, Record);
			return setValueT(record, newValue, offset, defaults);
		}
		defaults.push(defaultValue);
		set.setT = setT;
		return Accessor(get, set);
	}

	/**
	 * Sets the value of the given field to the given value.
	 *
	 * The given record will not be modified, instead a new record will
	 * be returned that reflects the updated field.
	 *
	 * @param record {!Record}
	 * @param field {!Field} a field of the given record
	 * @param newValue {*} the value to set the field to
	 * @return {!Record} a new record with the given field updated in it
	 */
	function set(record, field, newValue) {
		return field.set(record, newValue);
	}

	/**
	 * Gets the value of the given field from the given record.
	 *
	 * @param record {!Record}
	 * @param field {!Field} a field of the given record
	 * @return {*} the value of the given field on the given record
	 */
	function get(record, field) {
		return field.get(record);
	}

	/**
	 * Like set() but accepts a transient record.
	 */
	function setT(record, field, newValue) {
		return field.set.setT(record, newValue);
	}

	/**
	 * Sets a field on the given record to the value returned by the
	 * given function.
	 *
	 * The call to the given function will be delayed until the field is
	 * accessed, and will be cached such that the function will only be
	 * called once. The optional `arg` argument may be used as an
	 * argument to the given function.
	 *
	 * The given record will not be modified, instead a new record will
	 * be returned that reflects the updated field.
	 *
	 * @param record {!Record}
	 * @param field {!Field} a field of the given record
	 * @param fn {function} a function that returns the value to set
	 * @param arg {*} an optional argument to the given function
	 * @return a new record with the given field updated in it
	 */
	function delay(record, field, fn, arg) {
		return set(record, field, [SPECIAL_PRIVATE_VALUE, fn, arg]);
	}

	/**
	 * Like delay() but accepts a transient record.
	 */
	function delayT(record, field, fn, arg) {
		return setT(record, field, [SPECIAL_PRIVATE_VALUE, fn, arg]);
	}

	/**
	 * Adds fields to the given type.
	 *
	 * The given fieldMap is a map of field name to defaultValue. The
	 * field will be added to the type using Type.addField(), and it
	 * will be made available on the type's prototype as a method.
	 *
	 * @param Record {function}
	 * @param fieldMap {Object.<string,*>}
	 * @return void
	 */
	function extend(Record, fieldMap) {
		Maps.forEach(fieldMap, function (defaultValue, name) {
			var field = addField(Record, defaultValue);
			Record.prototype[name] = Accessor.asMethod(field);
		});
	}

	/**
	 * Defines a record.
	 *
	 * The optional fieldMap can be used to add some initial
	 * fields. Providing it in the call to define() is the same as
	 * calling Type.extend() after the call to define().
	 *
	 * The optional init function will be called every time a new
	 * instance of the defined record is created. The init function
	 * accepts two arguments, the first of which is the new record
	 * instance, which it must return (possibly updated), and the second
	 * of which is an optional argument passed to the constructor
	 * function.
	 *
	 * The returned type is a constructor function. The prototype of the
	 * constructor function can be freely modified. The constructor
	 * function must not be invoked with the new keyword, it must
	 * instead be used as a function.
	 *
	 * Example:
	 *<pre>
	 *     var MyType = define({
	 *        myField: someDefaultValue
	 *     }, function (record, optionalArgument) {
	 *        record = record.myField(optionalArgument);
	 *        return record;
	 *     });
	 *     
	 *     var myInstance = MyType(optionalArgument);
	 *</pre>
	 * @param fieldMap {?Object.<string,*>}
	 * @param init {?function}
	 * @return a new record type
	 * @memberOf Record
	 */
	function define(fieldMap, init) {
		if (Fn.is(fieldMap)) {
			init = fieldMap;
			fieldMap = null;
		}
		init = init || Fn.identity;
		var defaults = [];
		function Record(arg, specialPrivateValue) {
			if (specialPrivateValue !== SPECIAL_PRIVATE_VALUE) {
				return init(new Record(defaults, SPECIAL_PRIVATE_VALUE), arg);
			}
			this._record_values = arg;
			this._record_transience = NOT_TRANSIENT;
		}
		Fn.extendType(Record, {
			asTransient : asTransient,
			asPersistent: asPersistent,
			get: get,
			set: set,
			setT: setT,
			delay: delay,
			delayT: delayT
		});
		Record.addField = Fn.partial(addField, Record);
		Record.extend   = Fn.partial(extend, Record);
		Record._record_defaults = defaults;
		if (fieldMap) {
			extend(Record, fieldMap);
		}
		return Record;
	}

	/**
	 * Returns a new field that can be used in place of the given field
	 * and which calls the given hooks whenever the field is updated.
	 *
	 * The given setters will be called after the field is updated, must
	 * return the record given to them, and may update it.
	 *
	 * Useful to recompute other fields whenever a field is set.
	 *
	 * @param field {!Field} a field of a Record
	 * @param afterSet {function} invoked after the field is set
	 * @param afterSetT {?function} like afterSet but accepts a transient record
	 * @return field {!Field} a new field
	 * @memberOf Record
	 */
	function hookSetter(field, afterSet, afterSetT) {
		var set = field.set;
		var setT = set.setT;
		afterSetT = afterSetT || function (record) {
			return afterSet(record.asPersistent()).asTransient();
		};
		var newAccessor = Accessor(field.get, function (record, value) {
			record = set(record, value);
			record = afterSet(record);
			return record;
		});
		newAccessor.set.setT = function (record, value) {
			record = setT(record, value);
			record = afterSetT(record);
			return record;
		};
		return newAccessor;
	}

	/**
	 * Similar to hookSetter() except the given recopute and recomputeT
	 * functions recompute a value of the given computedField instead of
	 * updating the record directly.
	 *
	 * @param observedField {!Field} a field of a Record
	 * @param computedField {!Field} a field that is recomputed
	 * @param recompute {function} given a record computes the value for computedField
	 * @param recomputeT {?function} like recompute but gets a transient record
	 * @return field {!Field} a new field
	 * @memberOf Record
	 */
	function hookSetterRecompute(observedField, computedField, recompute, recomputeT) {
		return hookSetter(observedField, function (record) {
			return computedField.set(record, recompute(record));
		}, recomputeT ? function (recordT) {
			return computedField.set.setT(recordT, recomputeT(recordT));
		} : null);
	}

	return {
		'define'              : define,
		'hookSetter'          : hookSetter,
		'hookSetterRecompute' : hookSetterRecompute
	};
});
