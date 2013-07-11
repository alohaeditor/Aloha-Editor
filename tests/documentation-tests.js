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
		var namespace = namespaces.slice(0, 1);

		test(namespace, function () {
			var module = api[namespace];
			var counter = Aloha.Maps.keys(module).length;

			function proceed() {
				next(api, namespaces.slice(1, namespaces.length), runner, next);
			}

			Aloha.Maps.forEach(module, function (obj, name) {
				var type = typeof obj;

				if ('function' !== type && 'object' !== type) {
					if (0 === --counter) {
						proceed();
					}
					return;
				}

				ok(
					MANDOX_SIGNET.test(mandox(obj)),
					'Expecting documentation for `' + name + (
						'function' === type ? '()' : ''
					) + '`'
				);

				if (0 === --counter) {
					proceed();
				}
			});
		});
	}));
});
