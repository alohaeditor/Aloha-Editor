require(['../src/api'], function (Aloha) {
	'use strict';

	module('Documentation');

	var MANDOX_SIGNET = /^\-+ mandox\:/;

	(function next(api, namespaces, runner, proceed) {
		if (namespaces.length) {
			setTimeout(function () {
				runner(api, namespaces, runner, proceed || next);
			}, 500);
		}
	}(Aloha, Aloha.Maps.keys(Aloha), function (api, namespaces, runner, next) {
		var namespace = namespaces.pop();

		test(namespace, function () {
			var modules = Aloha.Maps.keys(api[namespace]);
			var counter = modules.length;

			function proceed() {
				next(api, namespaces.slice(1, namespaces.length), runner, next);
			}

			Aloha.Maps.forEach(api[namespace], function (obj, name) {
				var type = typeof obj;

				if ('function' !== type && 'object' !== type) {
					if (0 === --counter) {
						proceed();
					}
					return;
				}

				var dox = mandox(obj);

				ok(
					MANDOX_SIGNET.test(dox),
					'Expecting documentation for `' + name + (
						'function' === type ? '()' : ''
					) + '`'
				);

				// console.log('%s:\n%s', name, dox);

				if (0 === --counter) {
					proceed();
				}
			});
		});
	}));
});
