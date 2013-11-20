'use strict';

// depends on require-pronto.js

/**
 * "maximum call stack size exceeded" messages are indicative of a
 * recursive dependency.
 *
 * Supports the synchronous convention var instance = require('module');
 */
var require = (function (wrappedRequire) {
	var waiting = {};

	function done(module) {
		var fns = waiting[module],
		    i;
		if (!define.defs[module]) {
			throw 'module "' + module + '" doesn\'t contain a correct define';
		}
		if (fns) {
			// Will not be loaded again since it is already defined, so let it
			// be garbage collected.
			delete waiting[module];
			for (i = 0; i < fns.length; i++) {
				fns[i]();
			}
		}
	}

	function load(module, fn, path) {
		var url;
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
				if (require.urlPrefix) {
					url = require.urlPrefix + url;
				}
			}
			document.write('<script src="' + url + '" data-pronto-name="' + module + '"></script>');
		}
		waiting[module].push(fn);
	}

	function nthCall(n, fn) {
		return function () {
			if (!n--) {
				fn();
			}
		};
	}

	function loadMany(modules, fn, paths) {
		var cb = nthCall(modules.length - 1, fn),
		    i;
		for (i = 0; i < modules.length; i++) {
			load(modules[i], cb, paths[i]);
		}
	}

	function loadRec(modules, fn, paths) {
		if (!modules.length) {
			fn();
		}
		loadMany(modules, function () {
			var cb = nthCall(modules.length - 1, fn);
			for (var i = 0; i < modules.length; i++) {
				var deps = define.deps[modules[i]];
				var paths = [];
				for (var j = 0; j < deps.length; j++) {
					paths.push(define.paths[modules[i]]);
				}
				loadRec(deps, cb, paths);
			}
		}, paths);
	}

	function require (modules, fn) {
		if (!fn) {
			return wrappedRequire(modules);
		}
		loadRec(modules, function () {
			var instances = [],
			    i;
			for (i = 0; i < modules.length; i++) {
				instances.push(wrappedRequire(modules[i]));
			}
			fn.apply(null, instances);
		}, []);
	}

	// Make it available to the world.
	require.waiting = waiting;
	require.done = done;
	return require;
}(require));

var define = (function (wrappedDefine) {
	var paths = {};

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
		var scripts = document.getElementsByTagName('script'),
		    script,
		    name = null,
		    src = null,
		    i;
		// On IE, it's the first script element that is in interactive readyState.
		// On other browsers, it's the last script element.
		for (i = 0; i < scripts.length; i++) {
			script = scripts[i];
			if ('interactive' === script.readyState) {
				break;
			}
		}
		if (script && script.getAttribute) {
			if (script.getAttribute('data-pronto-name')) {
				name = script.getAttribute('data-pronto-name');
			}
			if (script.getAttribute('src')) {
				src = script.getAttribute('src');
			}
		}
		return [name, (src && src.match(/\//) ? src.replace(/(^|\/)[^\/]+$/, '') : null)];
	}

	function define(module, deps, fn) {
		var path,
		    moduleInfo;
		if (null != module && 'string' !== typeof module) {
			fn = deps;
			deps = module;
			moduleInfo = currentModuleInfo();
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
		define.paths[module] = path;
		require.done(module);
	}

	// Make it available to the world.
	define.deps = wrappedDefine.deps;
	define.defs = wrappedDefine.defs;
	define.paths = paths;
	return define;
}(define));
