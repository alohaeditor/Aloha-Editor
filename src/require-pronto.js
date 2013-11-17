'use strict';

/**
 * A minimal define() implementation.
 *
 * Only supports the full define pattern:
 * define('module', ['dep1', 'dep2', ...], function (Dep1, Dep2) { ... });
 */
var define = (function () {
	var deps = {},
	    defs = {};
	function define(module, deps, fn) {
		deps[module] = deps;
		defs[module] = fn;
	}
	// Make it available to the world.
	define.deps = deps;
	define.defs = defs;
	return define;
}());

/**
 * A minimal synchronous require() implementation.
 *
 * It is assumed that all modules have already been loaded and defined
 * with define().
 *
 * Only supports the synchronous require pattern:
 * var Module = require('module');
 *
 * NB: "maximum call stack size exceeded" messages are indicative of a
 * recursive dependency.
 */
var require = (function () {
	var instances = {};
	function require(module) {
		var deps,
		    depInstances,
		    def,
		    instance,
		    i;
		if (instances.hasOwnProperty(module)) {
			return instances[module];
		}
		deps = define.deps[module];
		depInstances = [];
		// NB: If an error occurs here because deps is undefined, then
		// it is probable that the module has a syntax error - check the
		// console!
		for (i = 0; i < deps.length; i++) {
			depInstances.push(require(deps[i]));
		}
		def = define.defs[module];
		instance = def.apply(null, depInstances);
		instances[module] = instance;
		return instance;
	};
	// Make it available to the world.
	require.instances = instances;
	return require;
}());
