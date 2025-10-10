/* pluginmanager.js is part of Aloha Editor project http://aloha-editor.org
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
/** @typedef {import('./plugin').AlohaPlugin} AlohaPlugin */
/**
 * @typedef {object} PluginManager
 * @property {Map.<string, AlohaPlugin>} plugins Map of registered plugins.
 * @property {Set.<string>} initializedPlugins A set of plugin names which have been initialized.
 * @property {function(Array.<string>):Promise.<void>} init Initialize all provided plugins.
 */
// Do not add dependencies that require depend on aloha/core
define([
	'util/class',
	'aloha/plugincontenthandlermanager'
], function (
	Class,
	PluginContentHandlerManager
) {
	'use strict';

	var Aloha = window.Aloha;

	/**
	 * The Plugin Manager controls the lifecycle of all Aloha Plugins.
	 *
	 * @namespace Aloha
	 * @class PluginManager
	 * @singleton
	 * @type {PluginManager}
	 */
	const manager = new (Class.extend(/** @type {PluginManager} */ ({

		plugins: new Map(),
		initializedPlugins: new Set(),

		init: function (pluginList) {
			// Because all plugins are enabled by default if specific plugins
			// are not specified.
			if (manager.plugins && 0 === pluginList.length) {
				pluginList = manager.plugins.keys();
			}

			/**
			 * Plugins which are already initialized or which are requested
			 * are available/included for dependency checks.
			 */
			const availablePlugins = new Set(manager.initializedPlugins);
			/**
			 * Set of dependencies which are absent/missing and would therefore
			 * cause a deadlock if it contains elements.
			 * @type {Set.<string>}
			 */
			const missingDependencies = new Set();
			/**
			 * Inverse mapping of dependency as key and the plugins as values.
			 * Used for printing a detailed error message and for quicker lookups.
			 * @type {Map.<string, Set.<string>>}
			 */
			const inverseDependencies = new Map();
			/**
			 * A map which contains the remaining requirements/dependencies of
			 * each plugin.
			 * @type {Map.<string, Set.<string>>}
			 */
			const waitingForDependencies = new Map();

			for (const pluginName of pluginList) {
				const plugin = manager.plugins.get(pluginName);
				if (plugin == null) {
					throw new Error(`Cannot initialize Plugin ${pluginName}, as it is not registered!`);
				}

				// Set the default value for enabled
				plugin.settings = plugin.settings || {};
				if (plugin.settings.enabled == null) {
					plugin.settings.enabled = true;
				}

				// If it isn't enabled, we don't want to initialize it
				if (!plugin.settings.enabled) {
					continue;
				}

				missingDependencies.delete(pluginName);
				availablePlugins.add(pluginName);
				waitingForDependencies.set(pluginName, new Set());

				if (!Array.isArray(plugin.dependencies)) {
					continue;
				}

				for (const dep of plugin.dependencies) {
					if (!inverseDependencies.has(dep)) {
						inverseDependencies.set(dep, new Set());
					}
					inverseDependencies.get(dep).add(pluginName);

					if (!availablePlugins.has(dep)) {
						missingDependencies.add(dep);
					}
					if (!manager.initializedPlugins.has(dep)) {
						waitingForDependencies.get(pluginName).add(dep);
					}
				}
			}

			if (missingDependencies.size > 0) {
				const deps = Array.from(missingDependencies).map(function(dep) {
					return `  Dependency "${dep}" needed by ["${Array.from(inverseDependencies.get(dep)).join('", "')}"]`;
				});
				throw new Error(`Could not resolve needed plugin-dependencies:\n${deps.join('\n')}`);
			}

			return new Promise(function(resolve, reject) {
				let hasError = false;

				// Flags which prevent extra calls to `initializeNextPlugins`
				/** If the initialization is still running. */
				let working = false;
				/** If it should call the init again after it's done. */
				let queued = false;

				/**
				 * Finalizes the plugin initialization.
				 * @param {AlohaPlugin} plugin The plugin which has been initialized 
				 */
				function finalizePlugin(plugin) {
					manager.initializedPlugins.add(plugin.name);
					PluginContentHandlerManager.registerPluginContentHandler(plugin);

					// Mark this plugin as resolved in all plugins which have this as dependency
					const dependents = inverseDependencies.get(plugin.name);
					if (dependents) {
						for (const dep of dependents) {
							if (waitingForDependencies.has(dep)) {
								waitingForDependencies.get(dep).delete(plugin.name);
							}
						}
					}

					if (working) {
						queued = true;
					} else {
						queued = false;
						initializeNextPlugins();
					}
				}

				function initializeNextPlugins() {
					// Start the work
					working = true;

					// If we have encountered an error while initializing,
					// then we don't want to continue initializing plugins.
					if (hasError) {
						return;
					}

					if (waitingForDependencies.size === 0) {
						// If all plugins have been initialized, we can resolve
						if (availablePlugins.size === manager.initializedPlugins.size) {
							resolve();
						}
						return;
					}

					const keys = waitingForDependencies.keys();
					for (const pluginName of keys) {
						const deps = waitingForDependencies.get(pluginName);
						// If it's still waiting for dependencies to resolve,
						// then we have to wait this out.
						if (deps.size !== 0) {
							continue;
						}

						// Remove it from the map since we initialize it now.
						waitingForDependencies.delete(pluginName);

						// Get the plugin itself and try to initialize it
						const plugin = manager.plugins.get(pluginName);
						/** @type {void|Promise<void>} */
						let result;

						try {
							result = plugin.init();
						} catch (error) {
							hasError = true;
							reject(new Error(`Error while initializing Plugin "${pluginName}"!`, {
								cause: error,
							}));
						}

						// Check if it's a promise
						if (result != null && typeof result === 'object' && typeof result.then === 'function') {
							result.then(function() {
								finalizePlugin(plugin);
							}).catch(function(error) {
								hasError = true;
								reject(new Error(`Error while initializing Plugin "${pluginName}"!`, {
									cause: error,
								}));
							});
						} else {
							finalizePlugin(plugin);
						}
					}

					working = false;
					if (queued) {
						queued = false;
						initializeNextPlugins();
					}
				}

				initializeNextPlugins();
			});
		},

		/**
		 * Register a plugin
		 * @param {AlohaPlugin} plugin plugin to register
		 */
		register: function (plugin) {
			if (!plugin.name) {
				throw new Error('Plugin does not have an name.');
			}

			if (manager.plugins.has(plugin.name)) {
				throw new Error('Already registered the plugin "' + plugin.name + '"!');
			}

			this.plugins.set(plugin.name, plugin);
		},

		/**
		 * Pass the given jQuery object, which represents an editable to all plugins, so that they can make the content clean (prepare for saving)
		 * @param obj jQuery object representing an editable
		 * @return void
		 * @hide
		 */
		makeClean: function (obj) {
			const registeredPlugins = Array.from(this.plugins.values());
			for (const plugin of registeredPlugins) {
				if (Aloha.Log.isDebugEnabled()) {
					Aloha.Log.debug(this, 'Passing contents of HTML Element with id { ' + obj.attr('id') + ' } for cleaning to plugin { ' + plugin.name + ' }');
				}
				plugin.makeClean(obj);
			}
		},

		/**
		 * Expose a nice name for the Plugin Manager
		 * @hide
		 */
		toString: function () {
			return 'pluginmanager';
		}

	})))();

	return manager;
});
