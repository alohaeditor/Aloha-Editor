(function (aloha) {
	'use strict';

	var Record = aloha.Record;
	var Fn     = aloha.fn;
	var values = [{one: 'one'}, 'two', 3];

    module('record');

	function defineType(init) {
		return Record.define({
			one: 1,
			two: 2,
			three: 3
		}, init);
	}

	test('defaults', function () {
		var Type = defineType();
		var record = Type();
		equal(record.one(), 1);
		equal(record.two(), 2);
		equal(record.three(), 3);
	});

	test('init', function () {
		var InitType = defineType(function (record, initValues) {
			equal(values, initValues);
			record = record.two('init');
			return record;
		});
		var record = InitType(values);
		equal(record.one(), 1);
		equal(record.two(), 'init');
	});

	test('update', function () {
		var Type = defineType();
		var record = Type();
		var record1 = record.two('updated');
		equal(record.one(), 1);
		equal(record.two(), 2);
		equal(record.three(), 3);
		equal(record1.one(), 1);
		equal(record1.two(), 'updated');
		equal(record1.three(), 3);
	});
	     
	test('transients', function () {
		var Type = defineType();
		var record1 = Type();
		equal(record1.two(), 2);
		var record2 = record1.asTransient();
		equal(record2.two(), 2);
		var record3 = record2.setT(record2.two, 'update');
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

	test('delayed get', function () {
		var delayedState = null;
		function delayedGet(record) {
			delayedState = record.field2();
			return delayedState;
		}
		var Type = Record.define({
			field1: 'field1',
			field2: 'field2'
		});
		var record = Type();
		equal(record.field1(), 'field1');
		var record1 = record.delay(record.field1, delayedGet, record);
		equal(delayedState, null);
		equal(record1.field1(), 'field2');
		equal(delayedState, 'field2');
		delayedState = null;
		equal(record1.field1(), 'field2');
		equal(delayedState, null);
		equal(record.field1(), 'field1');
	});

}(window.aloha));
