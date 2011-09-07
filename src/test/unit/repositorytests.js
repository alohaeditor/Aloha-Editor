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
	
	function str (str) {
		return str.replace(/\s+/g, ' ');
	};
	
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
		runSingleRepoTests(/*runMultipleReposTest*/);
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
				var timeout = 5000;
				var starttime = new Date;
				
				Manager.query({
					// Make the repository repsond 1 second too late
					delay : timeout + 1000,
				}, function (response, debug) {
					var elapsed = (new Date) - starttime;
					// We will accept a slight delay in when this callback is
					// invoked to accomodate minor lag in execution. We use
					// (elapsed - 5000) and not Math.abs(elapsed - 5000)
					// however because elapsed should under no correct
					// circumstances ever be under the 5 second timeout window
					var grace = 10; // ... it is *amazing*
					
					debugger;
					
					ok(
						(elapsed - timeout) < grace,
						str('												  \
							Check that the repository manager times-out on a  \
							repository that was taking more than the allowed  \
							' + timeout + ' +/= ' + grace + ' milliseconds to \
							respond.\nThis callback was invoked after		  \
							' + elapsed + ' milliseconds.					  \
						')
					);
					
					ok(
						elapsed >= timeout,
						str('												  \
							Check that repository manager waited at least the \
							expected ' + timeout + ' milliseconds for		  \
							repositories to respond before automatically	  \
							invoking the callback function.\nThe manager	  \
							waited ' + elapsed + ' milliseconds.			  \
						')
					);
				});
				
				// Wait until the previous query has timed out before
				// performing this next query
				setTimeout(function () {
					var starttime = new Date;
					
					Manager.query({
						// Make sure the repository finish before the timeout
						delay : timeout / 2
					}, function (response, debug) {
						ok(
							true,
							'The repository invoked this callback after ' +
							((new Date) - starttime) + ' seconds.'
						);
						
						start();
					});
				}, timeout + 1200);
			}
		);
		
		asyncTest(
			'Test response object for Aloha.RepositoryManager.query method',
			function () {
				Manager.query({
					maxItems : 0
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
				
				var numItemsToFetch = Math.round(Math.random() * 100);
				
				Manager.query({
					maxItems: numItemsToFetch
				}, function (response) {
					equal(
						response.results, numItemsToFetch,
						'Check that response object contains "' +
						numItemsToFetch + '" results.'
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
			'Test that we have 2 repositories registered',
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
		
		asyncTest(
			'Test queries to multiple repositories through the repository manager',
			function () {
				Manager.query({
					maxItems : 2
				}, function (response) {
					equal(
						response.results, 3,
						'Check that on a total of 2 + 1 results are returned' +
						' from the 2 registered repositories'
					);
					
					start();
				});
			}
		);
	};
	
});
