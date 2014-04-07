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
		var Type = Record.defineStrict();
		var one = Type.addField(1);
		var two = Type.addField(2);
		var three = Type.addField(3);

		var record = Type();
		equal(one.get(record), 1);
		equal(two.get(record), 2);
		equal(three.get(record), 3);
	});

	test('construct', function () {
		var Type = Record.defineStrict();
		var one = Type.addField(1);
		var two = Type.addField(2);
		var three = Type.addField(3);
		var record = Type(values);
		equal(one.get(record), values[0]);
		equal(two.get(record), values[1]);
		equal(three.get(record), values[2]);
	});

	test('init', function () {
		var InitType = Record.defineStrict(function (record, initValues) {
			equal(values, initValues);
			record = two.set(record, 'init');
			return record;
		});
		var one = InitType.addField(1);
		var two = InitType.addField(2);
		var three = InitType.addField(3);
		var record = InitType(values);
		// Must be the default since we ignore all init values
		equal(one.get(record), 1);
		equal(two.get(record), 'init');
	});

	test('reuse values instance', function () {
		var Type = Record.defineStrict();
		var one = Type.addField(1);
		var two = Type.addField(2);
		var three = Type.addField(3);
		var record = Type(values);
		ok(record._record_values === values);
	});
	
	test('update', function () {
		var Type = Record.defineStrict();
		var one = Type.addField(1);
		var two = Type.addField(2);
		var three = Type.addField(3);

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
		var Type = Record.defineStrict();
		var one = Type.addField(1);
		var two = Type.addField(2);
		var three = Type.addField(3);

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
			one: 1,
			two: 2,
			three: 3
		}, init);
	}

	test('defaults map', function () {
		var Type = defineType();
		var record = Type();
		equal(record.one(), 1);
		equal(record.two(), 2);
		equal(record.three(), 3);
	});

	test('init map', function () {
		var Type = defineType(function (record) {
			return record.two('init');
		});
		var record = Type();
		equal(record.one(), 1);
		equal(record.two(), 'init');
	});

	test('update map', function () {
		var Type = defineType();
		var record = Type();
		var record1 = record.two('updated');
		equal(record.one()   , 1);
		equal(record.two()   , 2);
		equal(record.three() , 3);
		equal(record1.one()  , 1);
		equal(record1.two()  , 'updated');
		equal(record1.three(), 3);
	});

	test('computed get', function () {
		var computedState = null;
		function computedGet(record) {
			computedState = record.field2();
			return computedState;
		}
		var Type = Record.define({
			field1: 'field1',
			field2: 'field2'
		});
		var record = Type();
		equal(record.field1(), 'field1');
		var record1 = record.field1.compute(record, computedGet, record);
		equal(computedState, null);
		equal(record1.field1(), 'field2');
		equal(computedState, 'field2');
		computedState = null;
		equal(record1.field1(), 'field2');
		equal(computedState, null);
		equal(record.field1(), 'field1');
	});

}(window.aloha));
