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
			var delay = params && (typeof params.delay === 'number') ? params.delay : 0;
			
			setTimeout(function () {
				var results = [];
				
				if (params && params.maxItems) {
					var l = params.maxItems + 1;
					while (--l) {
						results.push({});
					}
				}
				
				callback(results);
			}, delay);
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
			'Test timeouts for Aloha.RepositoryManager.query method',
			function () {
				// We wait until *just* before the repository manager does,
				// once it is evident that a timeout will happen
				var timeout = setTimeout(function () {
					ok(true, 'Repository manager waited 5 (4.99) seconds for repositories to complete queries');
					start();
				}, 4999);
				
				var delay = 6000;
				var starttime = new Date;
				
				Manager.query({
					delay : delay
				}, function () {
					if (timeout) {
						clearTimeout(timeout);
						timeout = undefined;
					}
					
					var elapsed = (new Date) - starttime;
					// We will accept a slight delay in when this callback is
					// invoked to accomodate minor lag in execution.
					// We use (elapsed - 5000) and not Math.abs(elapsed - 5000)
					// however because of the elapsed should under no correct
					// circumstances be under the 5 second timeout window
					var grace = 10; // ... it is amazing
					
					ok(
						(elapsed - 5000) < grace,
						'The repository manager correctly timed-out on a ' +
						'repository that was taking too long to fulfull the ' +
						'query method. This callback was invoked after ' +
						elapsed + ' seconds.'
					);
					
					start();
				});
				
				// Wait until the previous query has timed out before invoking this one
				setTimeout(function () {
					starttime = new Date;
					
					Manager.query({
						delay : 1234
					}, function () {
						ok(true, 'The repository invoked this callback after ' + ((new Date) - starttime) + ' seconds.');
						start();
					});
				}, delay + 100);
			}
		);
		
		asyncTest(
			'Test response object for Aloha.RepositoryManager.query method',
			function () {
				Manager.query({
					maxItems: 0
				}, function (response) {
					ok(response && (typeof response === 'object'), 'Check that repository manager returns a response object.');
					
					equal(
						response.results, 0,
						'Check that the response object contains 0 results.'
					);
					
					equal(
						response.items.length, 0,
						'Check that the response object\'s "items" property is an empty array.'
					);
					
					start();
				});
				
				Manager.query({
					maxItems: 12
				}, function (response) {
					equal(response.results, 12, 'Check that response object contains 12 results.');
					
					equal(
						response.results, response.items.length,
						'Check that the "results" property matches the length of the "items" array in the response object.'
					);
					
					start();
				});
			}
		);
		
	});
});
