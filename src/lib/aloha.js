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

	/**
	 * Gets the configuration for loading Aloha.
	 *
	 * If Aloha.settings.baseUrl is not specified, it will be taken from
	 * the first script element that has a data-aloha-plugins attribute,
	 * or, if there is no such script element, the first script element
	 * of which the src attribute matches /\/aloha.js$/.
	 *
	 * If Aloha.settings.plugins.load is not specified, it will be taken
	 * from the data-aloha-plugins attribute from the first script
	 * element carrying this attribute.
	 *
	 * @return
	 *       A map with two properties:
	 *       baseUrl - the path to aloha.js (this file).
	 *       plugins - an array of plugins to load.
	 */
	function getLoadConfig() {
		var scripts = document.getElementsByTagName('script'),
		    script,
		    pluginsConfigured = Aloha.settings.plugins && Aloha.settings.plugins.load,
		    baseUrlConfigured = Aloha.settings.baseUrl,
		    plugins = [],
		    baseUrl = './',
		    pluginsAttr,
		    regexAlohaJs = /\/aloha\.js$/,
            regexStripFilename = /\/[^\/]*\.js$/,
		    i;

		if (!pluginsConfigured || !baseUrlConfigured) {
			for (i = 0; i < scripts.length; i++) {
				script = scripts[i];
				pluginsAttr = script.getAttribute('data-aloha-plugins');
				if (pluginsAttr) {
					plugins = pluginsAttr;
					baseUrl = script.src.replace(regexStripFilename, '');
					break;
				}
				if (!baseUrl && regexAlohaJs.test(script.src)) {
					baseUrl = script.src.replace(regexAlohaJs, '');
				}
			}
		}

		if (pluginsConfigured) {
			plugins = pluginsConfigured;
		}

		if (baseUrlConfigured) {
			baseUrl = baseUrlConfigured;
		}

		if (typeof plugins === 'string' && plugins !== '') {
			plugins = plugins.replace(/\s+/g, '').split(',');
		}

		return {
			baseUrl: baseUrl,
			plugins: plugins
		};
	}

	/**
	 * Extends the given map with plugin specific requirejs path configuration.
	 *
	 * plugin-name: bundle-path/plugin-name/lib
	 * plugin-name/nls: bundle-path/plugin-name/nls
	 * plugin-name/css: bundle-path/plugin-name/css
	 * plugin-name/vendor: bundle-path/plugin-name/vendor
	 * plugin-name/res: bundle-path/plugin-name/res
	 */
	function mergePluginPaths(paths, bundlePath, pluginName) {
		var resourceFolders = ['nls', 'css', 'vendor', 'res'],
		    resourceFolder,
		    i;
		paths[pluginName] = bundlePath + '/' + pluginName + '/lib';
		for (i = 0; i < resourceFolders.length; i++) {
			var resourceFolder = resourceFolders[i];
			paths[pluginName + '/' + resourceFolder]
				= bundlePath + '/' + pluginName + '/' + resourceFolder;
		}
	}

	/**
	 * Gets the configuration for loading the given plugins.
	 *
	 * The bundle-path for each given plugin is determined in the following manner:
	 * Aloha.settings.basePath + (Aloha.settings.bundles[bundleName] || "../plugins/bundle-name")
	 *
	 * @param plugins
	 *        An array of plugins to get the configuration for in the
	 *        form "bundle-name/plugin-name"
	 * @return
	 *        A map with the following properties:
	 *        paths - requirejs path configuration for each plugin (mergePluginPaths())
	 *        entryPoints - an array of requirejs entry points ("link/link-plugin")
	 *        baseUrlByName - ("link" => "bundle-path/link")
	 *        names - an array of plugin names (the same as the given
	 *                array with the bundle-name stripped)
	 */
	function getPluginLoadConfig(plugins) {
		var paths = {},
		    entryPoints = [],
		    names = [],
		    baseUrlByName = {},
		    parts,
		    bundleName,
		    pluginName,
		    basePath = Aloha.settings.basePath || '',
		    bundlePath,
		    bundles = Aloha.settings.bundles || {},
		    i;
		for (i = 0; i < plugins.length; i++) {
			parts = plugins[i].split('/');
			bundleName = parts[0];
			pluginName = parts[1];
			if (bundles[bundleName]) {
				bundlePath = basePath + bundles[bundleName];
			} else {
				bundlePath = basePath + '../plugins/' + bundleName;
			}
			mergePluginPaths(paths, bundlePath, pluginName);
			baseUrlByName[pluginName] = bundlePath + '/' + pluginName;
			entryPoints.push(pluginName + '/' + pluginName + '-plugin');
		}
		return {
			paths: paths,
			entryPoints: entryPoints,
			baseUrlByName: baseUrlByName,
			names: names
		};
	}

	/**
	 * Merges properites of all given arguments into a new one.
	 * Duplicate properties will be "seived" out.
	 * Works in a similar way to jQuery.extend.
	 * Necessary because we must not assume that jquery was already
	 * loaded.
	 */
	function mergeObjects () {
		var clone = {};
		var objects = Array.prototype.slice.call(arguments);
		var name;
		var i;
		var obj;
		for (i = 0; i < objects.length; i++) {
			obj = objects[i];
			for (name in obj) {
				if (obj.hasOwnProperty(name)) {
					clone[name] = objects[i][name];
				}
			}
		}
		return clone;
	}

	function createDefine(name, module) {
		if (!name || !module)debugger;
		define(name, function () {
			return module;
		});
	}

	global.Aloha = global.Aloha || {};
	Aloha.defaults = {};
	Aloha.settings = Aloha.settings || {};

	var loadConfig = getLoadConfig();
	var pluginConfig = getPluginLoadConfig(loadConfig.plugins);

	Aloha.settings.baseUrl = loadConfig.baseUrl;
	Aloha.settings.loadedPlugins = pluginConfig.names;
	Aloha.settings._pluginBaseUrlByName = pluginConfig.baseUrlByName;

	var defaultConfig = {
		context: 'aloha',
		locale: Aloha.settings.locale || 'en',
		baseUrl: Aloha.settings.baseUrl
	};

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

	var requireConfig = mergeObjects(
		defaultConfig,
		Aloha.settings.requireConfig
	);

	requireConfig.paths = mergeObjects(
		defaultPaths,
		browserPaths,
		pluginConfig.paths,
		requireConfig.paths
	);

	// Create define() wrappers that will provide the initialized objects that
	// the user passes into Aloha via require() calls.
	var predefinedModules = Aloha.settings.predefinedModules || {};

	if (Aloha.settings.jQuery) {
		predefinedModules.jquery = Aloha.settings.jQuery;
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


	// TODO this hierarchical chain of require calls should not really
	//      be necessary if each file properly specifies its dependencies.
	define('aloha', [], function() {

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
			], function() {

				// Some core files provide default settings in Aloha.defaults.
				Aloha.settings = jQuery.extendObjects( true, {}, Aloha.defaults, Aloha.settings );

				Aloha.stage = 'loadPlugins';
				require(requireConfig, pluginConfig.entryPoints, function() {
					// jQuery calls Aloha.init when the dom is ready.
					jQuery(function(){
						// Rangy must be initialized only after the body
						// is available since it accesses the body
						// element during initialization.
						window.rangy.init();
						Aloha.init();
					});
				});
			});
		});
		return Aloha;
	});

	// Trigger a loading of Aloha dependencies.
	Aloha.stage = 'loadingAloha';
	require(requireConfig, ['aloha'], function () {});

}(window));
