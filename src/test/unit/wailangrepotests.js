/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

define(
[],
function() {
	'use strict';
	
	var repositoryId1 = 'wai-languages',
		timeout = 5000,
		manager,
		repository,
		testOrder = [
		runBasicTests,
		runQueryTests
	];
		
	function str (str) {
		return str.replace(/\s+/g, ' ');
	};
	
	// Test whether Aloha can load modules
	asyncTest('Aloha.require repository modules.', function() {
		var timeout = setTimeout(function() {
			ok(false, 'Aloha was not initialized within 60 seconds');
			start();
		}, 10000);
		// All other tests are done when Aloha is ready
		Aloha.require( ['aloha/repository', 'aloha/repositorymanager'],
				function ( Repository, Manager ) {
			manager = Manager;
			repository = Repository;
			Aloha.ready( runNextTest );
			clearTimeout(timeout);
			ok(true, 'Aloha Event was fired');
			start();
		});
	});
	

	
	function runNextTest () {
		if ( testOrder.length ) {
			var test = testOrder.shift();
			if ( typeof test === 'function' ) {
				test();
			}
		}
	};
	
	function runBasicTests (callbackNextTests) {
		module("Basic Tests");
		
		test(
			'Test registering of repository',
			function () {
				equal(
					manager.repositories.length, 1,
					'Check that repository manager contains 1 registered ' +
					'repository.'
				);
				
				equal(
					manager.repositories[0] && manager.repositories[0].repositoryId, repositoryId1,
					'Check that the id of the first registered repository is "'
					+ repositoryId1 + '."'
				);
				
				runNextTest();
			}
		);
	};
	
	
	function runQueryTests () {
		module("Query tests (WAI-LANG repository)");
		
		asyncTest(
			'Test querying the wai-lang repository.',
			function () {
				var starttime = new Date;
				
				manager.query({
					queryString : 'de',
					query: 'de',
					objectTypeFilter: ['language']
				}, function (response) {
						ok(
							response && (typeof response === 'object'),
							'Check that repository manager returns a response ' +
							'object.'
						);
						
						ok( response.results > 0,
								'Check that the response contains results.');
						
							
						
						start();
						
						runNextTest();
					
				});
			}
		);
	};
	
});