/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
(function (global) {
	'use strict';

	// Establish Aloha namespace.
	global.Aloha = global.Aloha || {};

	// Establish defaults namespace.
	Aloha.defaults = {};

	// Establish the settings object if none exists.
	Aloha.settings = Aloha.settings || {};

	// @TODO: Carrying define() in Aloha does not seem to serve us in anyway.
	//        It is simply confusing, so I propose that we get rid of it as
	//        quickly as we can from the API.
	Aloha.define = define;

	// Determins the base path of Aloha Editor which is supposed to be the path
	// of aloha.js (this file).
	Aloha.settings.baseUrl = Aloha.settings.baseUrl || getBaseUrl();

	// Aloha base path is defined by a script tag with the data attribute
	// data-aloha-plugins and the filename aloha.js
	// no jQuery at this stage...
	function getBaseUrl() {
		var baseUrl = './',
		    script,
		    scripts = document.getElementsByTagName('script'),
		    i, j = scripts.length,
		    regexAlohaJs = /\/aloha.js$/,
		    regexJs = /[^\/]*\.js$/;

		for (i = 0; i < j && (script = scripts[i]); i++) {
			// take aloha.js or first ocurrency of data-aloha-plugins
			// and script ends with .js
			if (regexAlohaJs.test(script.src)) {
				baseUrl = script.src.replace(regexAlohaJs , '');
				break;
			}
			if ('./' === baseUrl && script.getAttribute('data-aloha-plugins')
				&& regexJs.test(script.src)) {
				baseUrl = script.src.replace(regexJs , '');
			}
		}

		return baseUrl;
	}

	/**
	 * Merges properites of all  passed arguments into a new one.
	 * Duplicate properties will be "seived" out.
	 * Works in a similar way to jQuery.extend.
	 */
	function mergeObjects () {
		var clone = {};
		var objects = Array.prototype.slice.call(arguments);
		var name;
		var i;
		for (i = 0; i < objects.length; i++) {
			var obj = objects[i];
			for (name in obj) {
				if (obj.hasOwnProperty(name)) {
					clone[name] = objects[i][name];
				}
			}
		}
		return clone;
	}

	var baseUrl = Aloha.settings.baseUrl;

	var defaultConfig = {
		context: 'aloha',
		locale: 'en',
		baseUrl: baseUrl
	};

	// Aside from requirejs, jquery and jqueryui are the only external
	// dependencies that Aloha must have provided to it.
	var defaultPaths = {
		jquery: 'vendor/jquery-1.7.2',
		jqueryui: 'vendor/jquery-ui-1.9m6'
	};

	var browserPaths = {
		PubSub: 'vendor/pubsub/js/pubsub-unminified',
		'Class': 'vendor/class',
		RepositoryBrowser: 'vendor/repository-browser/js/repository-browser-unminified',
		jstree: 'vendor/jquery.jstree',              // Mutates jquery
		jqgrid: 'vendor/jquery.jqgrid',              // Mutates jquery
		'jquery-layout': 'vendor/jquery.layout',     // Mutates jquery
		'jqgrid-locale-en': 'vendor/grid.locale.en', // Mutates jqgrid
		'jqgrid-locale-de': 'vendor/grid.locale.de', // Mutates jqgrid
		'repository-browser-i18n-de': 'vendor/repository-browser/js/repository-browser-unminified',
		'repository-browser-i18n-en': 'vendor/repository-browser/js/repository-browser-unminified'
	};

	var requireConfig = mergeObjects(defaultConfig, Aloha.settings.requireConfig);

	requireConfig.paths = mergeObjects(defaultPaths, browserPaths, requireConfig.paths);

	// Create define() wrappers that will provide the initialized objects that
	// the user passes into Aloha via require() calls.
	var predefinedModules = Aloha.settings.predefinedModules || {};

	// jQuery is treated specially in that, if it is available we will add it
	// to the predefiedModules list as "jquery."
	if (Aloha.settings.jQuery) {
		predefinedModules.jquery = Aloha.settings.jQuery;
	}

	function createDefine (name, module) {
		define(name, function () {
			return module;
		});
	}

	var moduleName;
	for (moduleName in predefinedModules) if (predefinedModules.hasOwnProperty(moduleName)) {
		createDefine(moduleName, predefinedModules[moduleName]);
		delete requireConfig.paths[moduleName];
	}

	// Configure require and expose the Aloha.require.
	var alohaRequire = require.config(requireConfig);
	Aloha.require = function (callback) {
		// Pass the Aloha object to the given callback.
		if (1 === arguments.length && typeof callback === 'function') {
			return alohaRequire(['aloha'], callback);
		}
		return alohaRequire.apply(this, arguments);
	};

	var deferredReady;

	Aloha.bind = function (type, fn) {
		Aloha.require(['jquery'], function (jQuery) {
			// We will only need to load jQuery once ...
			Aloha.bind = function (type, fn) {
				deferredReady = deferredReady || jQuery.Deferred();
				if ('aloha-ready' === type) {
					if ('alohaReady' !== Aloha.stage) {
						deferredReady.done(fn);
					} else {
						fn();
					}
				} else {
					jQuery(Aloha, 'body').bind(type, fn);
				}
				return this;
			};
			Aloha.bind(type, fn);
		});
	   return this;
	};

	Aloha.trigger = function (type, data) {
		Aloha.require(['jquery'], function (jQuery) {
			Aloha.trigger = function (type, data) {
				deferredReady = deferredReady || jQuery.Deferred();
				if ('aloha-ready' === type) {
					jQuery(deferredReady.resolve);
				}
				jQuery(Aloha, 'body').trigger(type, data);
				return this;
			};
			Aloha.trigger(type, data);
		});
		return this;
	};

	Aloha.ready = function (fn) {
		this.bind('aloha-ready', fn);
		return this;
	};

	define('aloha', [], function () {
	    // Load Aloha dependencies...
	    require(requireConfig, [
				'jquery',
				'util/json2'
			], function (jQuery) {
			// Provide Aloha.jQuery for compatibility with old implementations
			// that which expect it to be there.
			Aloha.jQuery = jQuery;

	        // Load Aloha core files ...
	        require(requireConfig, [
					'vendor/jquery.json-2.2.min',
					'vendor/jquery.store',
					'aloha/rangy-core',
					'util/class',
					'util/lang',
					'util/range',
					'util/dom',
					'aloha/core',
					'aloha/editable',
					'aloha/console',
					'aloha/markup',
					'aloha/message',
					'aloha/plugin',
					'aloha/selection',
					'aloha/command',
					'aloha/jquery.aloha',
					'aloha/sidebar',
					'util/position',
					'aloha/repositorymanager',
					'aloha/repository',
					'aloha/repositoryobjects',
					'aloha/contenthandlermanager'
				], function () {
				// ... and have jQuery call the Aloha.init method when the dom
				// is ready.
				jQuery(Aloha.init);
			});
		});

	    return Aloha;
	});

	// Trigger a loading of Aloha dependencies.
	require(requireConfig, ['aloha'], function () {});
}(window));
