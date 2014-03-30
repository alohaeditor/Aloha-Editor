(function (aloha) {
	'use strict';

	var Record = aloha.Record;
	var Fn     = aloha.fn;

	var values = [{one: 'one'}, 'two', 3];
	var valuesIncomplete = [{four: 'four'}];
	var valuesIncompleteCopy = valuesIncomplete.slice(0);
	var valueMap = {one: values[0], two: values[1], three: values[2]};
	var valueMapIncomplete = {two: valueMap.two};
	var valueMapIncompleteCopy = {two: valueMap.two};

    module('record');

	test('defaults', function () {
		var Type = Record.define();
		var one = Type.addField({defaultValue: 1});
		var two = Type.addField({defaultValue: 2});
		var three = Type.addField({defaultValue: 3});

		var record = Type();
		equal(one.get(record), 1);
		equal(two.get(record), 2);
		equal(three.get(record), 3);
	});

	test('construct', function () {
		var Type = Record.define();
		var one = Type.addField({defaultValue: 1});
		var two = Type.addField({defaultValue: 2});
		var three = Type.addField({defaultValue: 3});
		var record = Type(values);
		equal(one.get(record), values[0]);
		equal(two.get(record), values[1]);
		equal(three.get(record), values[2]);
	});

	test('init', function () {
		var InitType = Record.define(function (record, initValues) {
			equal(values, initValues);
			record = two.set(record, 'init');
			return record;
		});
		var one = InitType.addField({defaultValue: 1});
		var two = InitType.addField({defaultValue: 2});
		var three = InitType.addField({defaultValue: 3});
		var record = InitType(values);
		// Must be the default since we ignore all init values
		equal(one.get(record), 1);
		equal(two.get(record), 'init');
	});

	test('reuse values instance', function () {
		var Type = Record.define();
		var one = Type.addField({defaultValue: 1});
		var two = Type.addField({defaultValue: 2});
		var three = Type.addField({defaultValue: 3});
		var record = Type(values);
		ok(record._record_values === values);
	});
	
	test('merge with defaults', function () {
		var Type = Record.define();
		var one = Type.addField({defaultValue: 1});
		var two = Type.addField({defaultValue: 2});
		var three = Type.addField({defaultValue: 3});
		var record = Type(values);
		var record1 = record.mergeValues(valuesIncomplete);
		equal(one.get(record), values[0]);
		equal(two.get(record), values[1]);
		equal(one.get(record1), valuesIncomplete[0]);
		equal(two.get(record1), values[1]);
		// No mutation of values passed to constructor
		deepEqual(valuesIncomplete, valuesIncompleteCopy);
	});

	test('update', function () {
		var Type = Record.define();
		var one = Type.addField({defaultValue: 1});
		var two = Type.addField({defaultValue: 2});
		var three = Type.addField({defaultValue: 3});

		var record = Type(values);
		var record1 = two.set(record, 'updated');
		equal(one.get(record), values[0]);
		equal(two.get(record), values[1]);
		equal(three.get(record), values[2]);
		equal(one.get(record1), values[0]);
		equal(two.get(record1), 'updated');
		equal(three.get(record1), values[2]);
	});
	     
	test('transients', function () {
		var Type = Record.define();
		var one = Type.addField({defaultValue: 1});
		var two = Type.addField({defaultValue: 2});
		var three = Type.addField({defaultValue: 3});

		var record1 = Type(values);
		equal(two.get(record1), 'two');
		var record2 = record1.asTransient();
		equal(two.get(record2), 'two');
		var record3 = two.setT(record2, 'update');
		equal(two.get(record3), 'update');
		throws(function () {
			two.get(record2);
		});
		var record4 = record3.asPersistent();
		equal(two.get(record4), 'update');
		throws(function () {
			two.get(record2);
		});
	});

	function defineType(init) {
		return Record.define({
			one: {defaultValue: 1},
			two: {defaultValue: 2},
			three: {defaultValue: 3}
		}, init);
	}

	test('defaults map', function () {
		var Type = defineType();
		var record = Type();
		equal(record.one(), 1);
		equal(record.two(), 2);
		equal(record.three(), 3);
	});

	test('construct map', function () {
		var Type = defineType();
		var record = Type(valueMap);
		equal(record.one(), valueMap.one);
		equal(record.two(), valueMap.two);
		equal(record.three(), valueMap.three);
	});

	test('init map', function () {
		var Type = defineType(function (record, initMap) {
			equal(valueMap, initMap);
			return record.two('init');
		});
		var record = Type(valueMap);
		// Must be the default since we ignore all init values
		equal(record.one(), 1);
		equal(record.two(), 'init');
	});

	test('update map', function () {
		var Type = defineType();
		var record = Type(valueMap);
		var record1 = record.two('updated');
		equal(record.one()   , valueMap.one);
		equal(record.two()   , valueMap.two);
		equal(record.three() , valueMap.three);
		equal(record1.one()  , valueMap.one);
		equal(record1.two()  , 'updated');
		equal(record1.three(), valueMap.three);
	});

	test('merge map with defaults', function () {
		var Type = defineType();
		var record = Type(valueMap);
		var record1 = record.mergeValueMap(valueMapIncomplete);
		equal(record.one(), valueMap.one);
		equal(record.two(), valueMap.two);
		equal(record1.one(), valueMap.one);
		equal(record1.two(), valueMapIncomplete.two);
		// No mutation of values passed to constructor
		deepEqual(valueMapIncomplete, valueMapIncompleteCopy);
	});

	test('computedGet', function () {
		var computedValue = {};
		var computedState = null;
		function lazyFn(record) {
			computedState = record.computed();
			return computedState;
		}
		var Type = Record.define({
			lazy: {defaultValue: 'lazy', compute: lazyFn},
			computed: {defaultValue: computedValue}
		});
		var record = Type();
		equal(record.lazy(), 'lazy');
		var record1 = record.lazy.compute(record, record);
		equal(computedState, null);
		equal(record1.lazy(), computedValue);
		equal(computedState, computedValue);
		computedState = null;
		equal(record1.lazy(), computedValue);
		equal(computedState, null);
		equal(record.lazy(), 'lazy');
	});

	test('computedSet', function () {
		var numSet = 0;
		function computedSet(record, value, set) {
			numSet++;
			return set(record, value + numSet);
		}
		var Type = Record.define({
			num: {defaultValue: 0, set: computedSet}
		});
		var record = Type();
		var record1 = record.num(1);
		equal(record1.num(), 2);
		equal(numSet, 1);
		var record2 = record1.num(2);
		equal(record2.num(), 4);
		equal(numSet, 2);
	});

}(window.aloha));
