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
		});
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
	function currentModuleName(module) {
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
		if (   script
			&& script.getAttribute
			&& script.getAttribute('data-pronto-name')) {
			name = script.getAttribute('data-pronto-name');
		}
		return name;
	}

	function define(module, deps, fn) {
		if (null != module && 'string' !== typeof module) {
			fn = deps;
			deps = module;
			module = currentModuleName();
		}
		if (null == module) {
			throw "The form define([], ...) without module name must be"
				+ " loaded via a call to require(), and not by"
				+ " including it via a script tag in the page."
				+ " Use require('name') to include the module or"
				+ " use the form define('name', [], ...) to define"
				+ " the module."
		}
		define.deps[module] = deps;
		define.defs[module] = fn;
		require.done(module);
	}
	define.deps = wrappedDefine.deps;
	define.defs = wrappedDefine.defs;

	require.loadRec = function (modules, fn) {
		require.loadMany(modules, function () {
			var nestedDeps = [],
			    i, j;
			for (i = 0; i < modules.length; i++) {
				// define.deps for each module will be filled during loading
				nestedDeps = nestedDeps.concat(define.deps[modules[i]]);
			}
			if (nestedDeps.length) {
				require.loadRec(nestedDeps, fn);
			} else {
				fn();
			}
		});
	};

	require.load = function (module, fn) {
		var waiting = require.waiting,
		    url;
		if (define.defs[module]) {
			// already loaded
			fn();
			return;
		}
		if (!waiting[module]) {
			waiting[module] =  [];
			url = module + '.js';
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

	require.loadMany = function (modules, fn) {
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
			require.load(modules[i], makeCb());
		}
		if (!modules.length) {
			fn();
		}
	};

	global.require = require;
	global.define = define;
}(window));
