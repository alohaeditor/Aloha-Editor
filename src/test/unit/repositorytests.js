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
		runTests();
	});
	
	var repositoryId1 = 'testRepo1';
	var repositoryId2 = 'testRepo2';
	var timeout = 5000;
	
	//-------------------------------------------------------------------------
	// Test for managing a single repository
	//-------------------------------------------------------------------------
	
	function runTests () {
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
				var starttime = new Date;
				
				stop();
				Manager.query({
					// Make the repository repsond 1 second too late
					delay : timeout + 1000,
				}, function (response) {
					var elapsed = (new Date) - starttime;
					// We will accept a slight delay in when this callback is
					// invoked to accomodate minor lag in execution. We use
					// (elapsed - 5000) and not Math.abs(elapsed - 5000)
					// however because elapsed should under no correct
					// circumstances ever be under the 5 second timeout window
					var grace = 10; // ... it is *amazing*
					
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
					
					start();
				});
				
				// Wait until the previous query has timed out before
				// performing this next query
				stop();
				setTimeout(function () {
					var starttime = new Date;
					
					Manager.query({
						// Make sure the repository finish before the timeout
						delay : timeout / 2
					}, function (response) {
						ok(
							true,
							'The repository invoked this callback after ' +
							((new Date) - starttime) + ' seconds.'
						);
						
						start();
					});
				}, timeout + 1200);
				
				start();
			}
		);
		
		asyncTest(
			'Test response object for Aloha.RepositoryManager.query method',
			function () {
				stop();
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
				
				stop();
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
				
				start();
			}
		);
		
		asyncTest(
			'Tests for overlapping queries',
			function () {
				var starttime = new Date;
				var numOpenQueries = 0;
				
				// Check whether the results of timed-out queries leak into
				// subsequent calls
				stop();
				++numOpenQueries;
				Manager.query({
					delay    : timeout + 2000,
					maxItems : 3
				}, function (response) {
					equal(
						response.results, 0,
						'Check that response object contains 0 results ' +
						'because it timed-out @ ' + ((new Date) - starttime) +
						'.'
					);
					
					--numOpenQueries;
					equal(
						numOpenQueries, 1,
						'Check that there is still 1 more query open.'
					);
					
					start();
				});
				
				// This next query should callback just before the previous
				// query times-out, and should finish after the previous has
				// timed-out
				stop();
				++numOpenQueries;
				setTimeout(function () {
					Manager.query({
						delay  : timeout - 100,
						maxItems : 2
					}, function (response) {
						equal(
							response.results, 2,
							'Check that response object contains 2 results @ ' +
							((new Date) - starttime) + '.'
						);
						
						--numOpenQueries;
						equal(
							numOpenQueries, 0,
							'Check that there is the last query to be closed' +
							' (ie: there are 0 opened queries).'
						);
						
						start();
						
						//-----------------------------------------------------
						// Starting test batch 2
						//-----------------------------------------------------
						runMultipleReposTest();
					});
				}, timeout - 500); 
				
				// Before the previous query is complete, start another query
				++numOpenQueries;
				stop();
				Manager.query({
					maxItems : 4
				}, function (response) {
					equal(
						response.results, 4,
						'Check that response object returns the results for ' +
						'the correct callback @ ' + ((new Date) - starttime) +
						'.'
					);
					
					--numOpenQueries;
					equal(
						numOpenQueries, 2,
						'Check that there are 2 more queries still open.'
					);
					
					start();
				});
				
				start();
			}		
		);
	};
	
	//-------------------------------------------------------------------------
	// Tests for managing multiple repositories
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
					'Check that the id of the second registered repository ' +
					'is "' + repositoryId2 + '."'
				);
				
				equal(
					Manager.repositories[0].repositoryId, repositoryId1,
					'Check that the id of the first registered repository is' +
					' still "' + repositoryId1 + '."'
				);
				
				start();
			}
		);
		
		asyncTest(
			'Test queries to multiple repositories through the repository manager',
			function () {
				stop();
				Manager.query({
					maxItems : 2
				}, function (response) {
					equal(
						response.results, 3,
						'Check that a total of 2 + 1 results are returned ' +
						'from the 2 registered repositories'
					);
					
					start();
				});
				
				stop();
				Manager.query({
					delay    : timeout + 500,
					maxItems : 5
				}, function (response) {
					equal(
						response.results, 1,
						'Check that only 1 result is returned because 1 of ' +
						'the 2 repos timed-out.'
					);
					
					equal(
						response.items[0].repositoryId,
						'testRepo2',
						'Check that only the results only include those from' +
						' the second repository returned results.'
					);
					
					start();
				});
				
				start();
			}
		);
	};
	
});
