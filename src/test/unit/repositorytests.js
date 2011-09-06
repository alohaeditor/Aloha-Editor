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
	
	// All other tests are done when Aloha is ready
	aQuery('body').bind('aloha', function() {
		runSingleRepoTests(runMultipleReposTest);
	});
	
	var repositoryId1 = 'testRepo1';
	var repositoryId2 = 'testRepo2';
	
	//-------------------------------------------------------------------------
	// Single Repository
	//-------------------------------------------------------------------------
	
	function runSingleRepoTests (runNextBatchOfTests) {
		var Manager = Aloha.RepositoryManager;
		
		// Create, and register a test repository
		new (repository.AbstractRepository.extend({
			_constructor: function() {
				this._super(repositoryId1, 'testRepository1Name');
			},
			query: function (params, callback) {
				var delay = params &&
						    (typeof params.delay === 'number')
								? params.delay : 0;
				
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
			}
		}))();
		
		module("SINGLE REPOSITORY");
		
		test(
			'Test Repository registration in Aloha.RepositoryManager',
			function () {
				equal(
					Manager.repositories.length, 1,
					'Check that repository manager contains 1 registered ' +
					'repository.'
				);
				
				equal(
					Manager.repositories[0].repositoryId, repositoryId1,
					'Check that the id of the first registered repository is "'
					+ repositoryId1 + '."'
				);
			}
		);
		
		asyncTest(
			'Test timeouts for Aloha.RepositoryManager.query method',
			function () {
				// We wait until *just* before the repository manager does,
				// once it is evident that a timeout will happen
				var timeout = setTimeout(function () {
					ok(
						true,
						'Repository manager waited 5 (4.99) seconds for ' +
						'repositories to complete queries'
					);
					
					start();
				}, 4999);
				
				var delay = 6000;
				var starttime = new Date;
				
				Manager.query({
					delay : delay
				}, function () {
					var elapsed = (new Date) - starttime;
					// We will accept a slight delay in when this callback is
					// invoked to accomodate minor lag in execution. We use
					// (elapsed - 5000) and not Math.abs(elapsed - 5000)
					// however because elapsed should under no correct
					// circumstances ever be under the 5 second timeout window
					var grace = 10; // ... it is *amazing*
					
					ok(
						(elapsed - 5000) < grace,
						'The repository manager correctly timed-out on a ' +
						'repository that was taking too long to fulfull the ' +
						'query method. This callback was invoked after ' +
						elapsed + ' seconds.'
					);
					
					start();
				});
				
				// Wait until the previous query has timed out before
				// performing this next query
				setTimeout(function () {
					var starttime = new Date;
					
					Manager.query({
						delay : 1234
					}, function () {
						ok(
							true,
							'The repository invoked this callback after ' +
							((new Date) - starttime) + ' seconds.'
						);
						
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
					ok(
						response && (typeof response === 'object'),
						'Check that repository manager returns a response ' +
						'object.'
					);
					
					equal(
						response.results, 0,
						'Check that the response object contains 0 results.'
					);
					
					equal(
						response.items.length, 0,
						'Check that the response object\'s "items" property ' +
						'is an empty array.'
					);
					
					start();
				});
				
				var expectedItems = Math.round(Math.random() * 100);
				
				Manager.query({
					maxItems: expectedItems
				}, function (response) {
					equal(
						response.results, expectedItems,
						'Check that response object contains "' +
						expectedItems + '" results.'
					);
					
					equal(
						response.results, response.items.length,
						'Check that the "results" property matches the ' +
						'length of the "items" array in the response object.'
					);
					
					start();
				});
				
				if (typeof runNextBatchOfTests === 'function') {
					runNextBatchOfTests();
				}
			}
		);
	};
	
	//-------------------------------------------------------------------------
	// Multiple Repositories
	//-------------------------------------------------------------------------
	
	function runMultipleReposTest () {
		var Manager = Aloha.RepositoryManager;
		
		// Create, a second repository
		new (repository.AbstractRepository.extend({
			_constructor: function() {
				this._super(repositoryId2, 'testRepository2Name');
			},
			// Will always immediately return one object
			query: function (params, callback) {
				callback([{}]);
			}
		}))();
		
		module("MULTIPLE REPOSITORIES");
		
		test(
			'Test how repository manager handles 2 repositories',
			function () {
				equal(
					Manager.repositories.length, 2,
					'Check that repository manager contains 2 registered ' +
					'repositories.'
				);
				
				equal(
					Manager.repositories[1].repositoryId, repositoryId2,
					'Check that the id of the second registered repository is "'
					+ repositoryId2 + '."'
				);
				
				equal(
					Manager.repositories[0].repositoryId, repositoryId1,
					'Check that the id of the first registered repository is still "'
					+ repositoryId1 + '."'
				);
					
				start();
			}
		);
	};
	
});
