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
		var Type = Record.defineStrict({
			one: 1,
			two: 2,
			three: 3
		});

		var record = Type();
		equal(record.one(), 1);
		equal(record.two(), 2);
		equal(record.three(), 3);
	});

	test('construct', function () {
		var Type = Record.defineStrict({
			one: 1,
			two: 2,
			three: 3
		});

		var record = Type(values);
		equal(record.one(), values[0]);
		equal(record.two(), values[1]);
		equal(record.three(), values[2]);
	});

	test('init', function () {
		var InitType = Record.defineStrict({
			one: 1,
			two: 2,
			three: 3
		}, function (record, initValues) {
			equal(values, initValues);
			record = record.two('init');
			return record;
		});

		var record = InitType(values);
		equal(record.one(), 1);
		equal(record.two(), 'init');
	});

	test('reuse values instance', function () {
		var Type = Record.defineStrict({
			one: 1,
			two: 2,
			three: 3
		});

		var record = Type(values);
		ok(record._record_values === values);
	});

	test('update', function () {
		var Type = Record.defineStrict({
			one: 1,
			two: 2,
			three: 3
		});

		var record = Type(values);
		var record1 = record.two('updated');
		equal(record.one(), values[0]);
		equal(record.two(), values[1]);
		equal(record.three(), values[2]);
		equal(record1.one(), values[0]);
		equal(record1.two(), 'updated');
		equal(record1.three(), values[2]);
	});
	     
	test('transients', function () {
		var Type = Record.defineStrict({
			one: 1,
			two: 2,
			three: 3
		});

		var record1 = Type(values);
		equal(record1.two(), 'two');
		var record2 = record1.asTransient();
		equal(record2.two(), 'two');
		var record3 = record2.two.setT(record2, 'update');
		equal(record3.two(), 'update');
		throws(function () {
			record2.two();
		});
		var record4 = record3.asPersistent();
		equal(record4.two(), 'update');
		throws(function () {
			record2.two();
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
