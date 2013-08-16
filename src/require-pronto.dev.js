(function (global) {
	'use strict';

	// depends on require-pronto.js
	var wrappedRequire = global.require;
	var wrappedDefine = global.define;

	/**
	 * "maximum call stack size exceeded" messages are indicative of a
	 * recursive dependency.
	 *
	 * Supports the synchronous convention var instance = require('module');
	 */
	function require(modules, fn) {
		if (!fn) {
			return wrappedRequire(modules);
		}
		require.loadRec(modules, function () {
			var instances = [],
			    i;
			for (i = 0; i < modules.length; i++) {
				instances.push(wrappedRequire(modules[i]));
			}
			fn.apply(null, instances);
		}, []);
	}
	require.waiting = {};

	/**
	 * Only works if it is called from javascript that is loaded via a a
	 * script element with src attribute (<script src="..."></script>)
	 * and if that element is present in the document when the page
	 * loads (not injected dynamically into the DOM).
	 *
	 * The attribute 'data-pronto-name' is read from the script element
	 * and used as the module name. Returns null if the attribute
	 * doesn't exist on the script element.
	 */
	function currentModuleInfo() {
		var scripts = document.getElementsByTagName('script');
		var script;
		// On IE, it's the first script element that is in interactive readyState.
		// On other browsers, it's the last script element.
		for (var i = 0; i < scripts.length; i++) {
			script = scripts[i];
			if ('interactive' === script.readyState) {
				break;
			}
		}
		var name = null;
		var src = null;
		if (   script
			&& script.getAttribute) {
			if (script.getAttribute('data-pronto-name')) {
				name = script.getAttribute('data-pronto-name');
			}
			if (script.getAttribute('src')) {
				src = script.getAttribute('src');
			}
		}
		return [name, (src ? src.replace(/\/[^\/]+$/, '') : '')];
	}

	function define(module, deps, fn) {
		var path;
		if (null != module && 'string' !== typeof module) {
			fn = deps;
			deps = module;
			var moduleInfo = currentModuleInfo();
			module = moduleInfo[0];
			path = moduleInfo[1];
		}
		if (null == module) {
			throw "The form define([], ...) without module name must be"
				+ " loaded via a call to require(), and not by"
				+ " including it via a script tag in the page."
				+ " Use require('name') to include the module or"
				+ " use the form define('name', [], ...) to define"
				+ " the module.";
		}
		define.deps[module] = deps;
		define.defs[module] = fn;
		define.path[module] = path;
		require.done(module);
	}
	define.deps = wrappedDefine.deps;
	define.defs = wrappedDefine.defs;
	define.path = [];

	require.loadRec = function (modules, fn, paths) {
		require.loadMany(modules, function () {
			var nestedDeps = [],
			    nestedPath = [],
			    i, j, k;
			for (i = 0; i < modules.length; i++) {
				// define.deps for each module will be filled during loading
				nestedDeps = nestedDeps.concat(define.deps[modules[i]]);
				var len = define.deps[modules[i]].length;
				for (k = 0; k < len; k++) {
					nestedPath.push(define.path[modules[i]]);
				}
			}
			if (nestedDeps.length) {
				require.loadRec(nestedDeps, fn, nestedPath);
			} else {
				fn();
			}
		}, paths);
	};

	require.load = function (module, fn, path) {
		var waiting = require.waiting,
		    url;
		if (define.defs[module]) {
			// already loaded
			fn();
			return;
		}
		if (!waiting[module]) {
			waiting[module] =  [];
			if (null != path) {
				url = path + '/' + module + '.js';
			} else {
				url = module + '.js';
			}
			if (require.urlPrefix) {
				url = require.urlPrefix + url;
			}
			document.write('<script src="' + url + '" data-pronto-name="' + module + '"></script>');
		}
		waiting[module].push(fn);
	};

	require.done = function (module) {
		var fns = require.waiting[module],
		    i;
		if (!define.defs[module]) {
			throw 'module "' + module + '" doesn\'t contain a correct define';
		}
		if (fns) {
			// Will not be loaded again since it is already defined, so let it
			// be garbage collected.
			delete require.waiting[module];
			for (i = 0; i < fns.length; i++) {
				fns[i]();
			}
		}
	};

	require.loadMany = function (modules, fn, paths) {
		var waitCount = modules.length,
		    i;
		function makeCb() {
			return function () {
				if (!(--waitCount)) {
					fn();
				}
			};
		}
		for (i = 0; i < modules.length; i++) {
			require.load(modules[i], makeCb(), paths[i]);
		}
		if (!modules.length) {
			fn();
		}
	};

	global.require = require;
	global.define = define;
}(window));
