/* aloha.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
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
		var scripts,
		    script,
		    plugins = Aloha.settings.plugins && Aloha.settings.plugins.load,
		    baseUrl = Aloha.settings.baseUrl,
		    pluginsAttr,
		    regexAlohaJs = /\/aloha\.js$/,
            regexStripFilename = /\/[^\/]*\.js$/,
		    i;

		if (!plugins || !baseUrl) {
			scripts = document.getElementsByTagName('script');
			for (i = 0; i < scripts.length; i++) {
				script = scripts[i];
				pluginsAttr = script.getAttribute('data-aloha-plugins');
				if (null != pluginsAttr) {
					if (!plugins) {
						plugins = pluginsAttr;
					}
					baseUrl = script.src.replace(regexStripFilename, '');
					break;
				}
				if (!baseUrl && regexAlohaJs.test(script.src)) {
					baseUrl = script.src.replace(regexAlohaJs, '');
				}
			}
		}

		if (typeof plugins === 'string' && plugins !== '') {
			plugins = plugins.replace(/\s+/g, '').split(',');
		}

		return {
			baseUrl: baseUrl,
			plugins: plugins || []
		};
	}

	function isDeferInit() {
		var scripts = document.getElementsByTagName('script');
		for (var i = 0; i < scripts.length; i++) {
			var attr = scripts[i].getAttribute('data-aloha-defer-init');
			if ("true" === attr) {
				return true;
			}
		}
		return false;
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
		    map = {},
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
			map[pluginName] = {'jquery': 'aloha/jquery'};
		}
		return {
			paths: paths,
			entryPoints: entryPoints,
			baseUrlByName: baseUrlByName,
			names: names,
			map: map
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
		define(name, function () {
			return module;
		});
	}

	function load() {

		Aloha.defaults = {};
		Aloha.settings = Aloha.settings || {};

		var loadConfig = getLoadConfig();
		var pluginConfig = getPluginLoadConfig(loadConfig.plugins);

		Aloha.settings.baseUrl = loadConfig.baseUrl;
		Aloha.settings.loadedPlugins = pluginConfig.names;
		Aloha.settings._pluginBaseUrlByName = pluginConfig.baseUrlByName;

		var coreMap = {
			'aloha':             {'jquery': 'aloha/jquery'},
			'aloha/jquery':      {'jquery': 'jquery'}, // avoid a circular dependency
			'jqueryui':          {'jquery': 'aloha/jquery'},
			'vendor':            {'jquery': 'aloha/jquery'},
			'util':              {'jquery': 'aloha/jquery'},
			'RepositoryBrowser': {'jquery': 'aloha/jquery'},
			'jstree':            {'jquery': 'aloha/jquery'},
			'jqgrid':            {'jquery': 'aloha/jquery'},
			'jqgrid-locale-en':  {'jquery': 'aloha/jquery'},
			'jqgrid-locale-de':  {'jquery': 'aloha/jquery'},
			'jquery-layout':     {'jquery': 'aloha/jquery'}
		};

		/**
		 * Map the 'jquery' module to the 'aloha/jquery' module. This
		 * enforces Aloha modules to always use aloha/jquery instead of
		 * jquery. One could also just write
		 * define(['aloha/jquery']... to require Aloha's jquery, but
		 * this is problematic in vendor files that don't know anything
		 * about Aloha. Each key in the map is either the module name,
		 * or the firs part of the module name. For example, the mapping
		 * under the key 'aloha' will take effect for all modules with
		 * names like aloha/xxx.  When a new 'paths' entry is added
		 * (browserPaths or other), an entry should also be added the
		 * moduleMap to rename the jquery dependency.
		 * See also define('aloha/jquery', ... below.
		 */
		var moduleMap = mergeObjects(coreMap, pluginConfig.map)

		var defaultConfig = {
			context: 'aloha',
			locale: Aloha.settings.locale || 'en',
			baseUrl: Aloha.settings.baseUrl,
			map: moduleMap
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
			Aloha.require(['aloha/jquery'], function (jQuery) {
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
			Aloha.require(['aloha/jquery'], function (jQuery) {
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

		Aloha.unbind = function (typeOrEvent) {
			Aloha.require(['aloha/jquery'], function (jQuery) {
				Aloha.unbind = function (typeOrEvent) {
					jQuery(Aloha, 'body').unbind(typeOrEvent);
				};
				Aloha.unbind(typeOrEvent);
			});
		};

		Aloha.ready = function (fn) {
			this.bind('aloha-ready', fn);
			return this;
		};

		/**
		 * This makes sure that all Aloha modules will receive the same jQuery.
		 *
		 * This is a workaround for when a user includes his own
		 * jQuery _after_ aloha.js has been loaded.
		 *
		 * If multiple 'jquery's are included in the page, each version
		 * will make its own call to define(), and depending on when an
		 * Aloha module is loaded, it may receive a different
		 * 'jquery'. However, 'aloha/jquery' will not be redefined and
		 * will therefore point always to only one particular version.
		 *
		 * !!Important!! to be certain that 'aloha/jquery' points to
		 * the jQuery intended for Aloha, it can't be loaded
		 * dynamically, because if a user loads his own jQuery after
		 * aloha.js, then there is no way to tell whether it is the
		 * user's jQuery or Aloha's jQuery that has finished
		 * loading. Instead, jQuery must be loaded before aloha.js and
		 * passed in to us.
		 */
		var jQueryThatWasPassedToUs = Aloha.settings.jQuery;
		define('aloha/jquery', ['jquery'], function (jQuery) {
			// We prefer Aloha.settings.jQuery, since a dynamically loaded
			// jQuery may have been redefined by a user's jQuery.
			return jQueryThatWasPassedToUs || jQuery;
		});

		define('aloha', [
			'aloha/jquery',
			'util/json2',
			'aloha/rangy-core',
			'util/class',
			'util/lang',
			'util/range',
			'util/dom',
			'aloha/core',
			'aloha/editable',
			'aloha/console',
			'aloha/markup',
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
		], function(jQuery) {

			// Provide Aloha.jQuery for compatibility with old implementations
			// that which expect it to be there.
			Aloha.jQuery = jQuery;

			// Some core files provide default settings in Aloha.defaults.
			Aloha.settings = jQuery.extendObjects( true, {}, Aloha.defaults, Aloha.settings );

			return Aloha;
		});

		// TODO aloha should not make the require call itself. Instead,
		// user code should require and initialize aloha.
		Aloha.stage = 'loadingAloha';
		require(requireConfig, ['aloha', 'aloha/jquery'], function (Aloha, jQuery) {
			Aloha.stage = 'loadPlugins';
			require(requireConfig, pluginConfig.entryPoints, function() {
				jQuery(function(){
					// Rangy must be initialized only after the body
					// is available since it accesses the body
					// element during initialization.
					window.rangy.init();
					// The same for Aloha, but probably only because it
					// depends on rangy.
					Aloha.init();
				});
			});
		});
	} // end load()

	global.Aloha = global.Aloha || {};
	if (global.Aloha.deferInit || isDeferInit()) {
		global.Aloha.deferInit = load;
	} else {
		// Unless init is deferred above, aloha mus be loaded
		// immediately in the development version, but later in the
		// compiled version. The reason loading must be delayed in the
		// compiled version is that the "include" directive in the r.js
		// build profile, which lists the plugins that will be compiled
		// into aloha.js, will include the plugins *after* this
		// file. Since the require() call that loads the plugins is in
		// this file, it will not see any of the plugin's defines that
		// come after this file. The call to Aloha._load is only made in
		// compiled mode in closure-end.frag. The call to load() below
		// is only made in development mode because the excludeStart and
		// excludeEnd r.js pragmas will exclude everything inbetween in
		// the compiled version.
		// TODO ideally the bootstrap file should not make the require
		//      call at all. Instead, user code should require and
		//      initialize aloha.
		Aloha._load = load;
		//>>excludeStart("alohaLoadInEndClosure", pragmas.alohaLoadInEndClosure);
		load();
		//>>excludeEnd("alohaLoadInEndClosure");
	}
}(window));
