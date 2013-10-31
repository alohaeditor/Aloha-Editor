/* require-pronto.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
(function (global) {

	function define(module, deps, fn) {
		define.deps[module] = deps;
		define.defs[module] = fn;
	}
	define.deps = {};
	define.defs = {};

	/**
	 * Synchronous require only for dependencies in define.defs.
	 *
	 * "maximum call stack size exceeded" messages are indicative of a
	 * recursive dependency.
	 */
	function require(module) {
		if (require.instances.hasOwnProperty(module)) {
			return require.instances[module];
		}
		var deps = define.deps[module];
		var depVals = [];
		// NB: If an error occurs here because deps is undefined, then
		// it is probable that the module has a syntax error - check the
		// console!
		for (var i = 0; i < deps.length; i++) {
			depVals[i] = require(deps[i]);
		}
		var def = define.defs[module];
		var instance = def.apply(null, depVals);
		require.instances[module] = instance;
		return instance;
	}
	require.instances = {};

	global.define = define;
	global.require = require;
}(window));
