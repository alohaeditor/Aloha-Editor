/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define('repositorytests', [

	'aloha/jquery',
	'aloha/repository'

], function(aQuery, repository) {
	
	'use strict';
	
	// Test whether Aloha is properly initialized
	asyncTest('Aloha Startup Test', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 60000);
		aQuery('body').bind('aloha', function() {
			clearTimeout(timeout);
			ok(true, 'Aloha Event was fired');
			start();
		});
	});
	
	var repositoryId = 'test.repo';
	
	// Create, and register a test repository
	new (repository.AbstractRepository.extend({
		
		_constructor: function() {
			this._super(repositoryId, 'testRepositoryName');
		},
		init  : function () {},
		query : function (params, callback) {
			var timer;
			
			timer = setTimeout(function () {
				clearTimeout(timer);
				timer = undefined;
				
				var results = [];
				
				callback(results);
			}, 5234);
		} //,
		  // getChildren: function (params, callback) { return true; },
		  // makeClean:   function (obj) {},
		  // markObject:  function (obj, repositoryItem) {}
		
	}))();
	
	// All other tests are done when Aloha is ready
	aQuery('body').bind('aloha', function() {
		
		var Manager = Aloha.RepositoryManager;
		
		test(
			'Test Repository registration in Aloha.RepositoryManager',
			function () {
				equal(
					Manager.repositories.length, 1,
					'Check that repository manager contains one registered repository.'
				);
				
				equal(
					Manager.repositories[0].repositoryId, repositoryId,
					'Check that the id of the first registered repository is "' + repositoryId + '."'
				);
			}
		);
		
		asyncTest(
			'Test Querying Aloha.RepositoryManager',
			function () {
				var timeout;
				var starttime;
				var params = {};
				
				var timeout = setTimeout(function () {
					ok(false, 'Repository manager did not invoke callback within 5 seconds.');
					start();
				}, 5050); // We offer 50 milliseconds grace for slow execution
				
				var callback = function () {
					ok(
						true,
						'Check that repository manager invoked callback.\
						 Callback invoked after ' + ((new Date) - starttime) + ' seconds.'
					);
					
					if (timeout) {
						clearTimeout(timeout);
						timeout = undefined;
					}
					
					start();
				};
				
				starttime = new Date;
				
				Manager.query(params, callback);
			}
		);
		
	});
});
