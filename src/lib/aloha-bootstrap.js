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
(function () {
	'use strict';

	var deferredReady;
	var alohaRequire;

	// Ensure Aloha settings namespace and default.
	window.Aloha = window.Aloha || {};

	// Establish defaults.  Users should use settings.
	Aloha.defaults = {};

	// Establish the settings object if not set by user.
	Aloha.settings = Aloha.settings || {};

	// Aloha define, require, preserve original require
	Aloha._require = require;
	Aloha.define = define;

	// Determins the base path of Aloha Editor which is supposed to be the path
	// of aloha.js (this file).
	Aloha.settings.baseUrl = Aloha.settings.baseUrl || getBaseUrl();

	// Aloha base path is defined by a script tag with the data attribute
	// data-aloha-plugins and the filename aloha.js
	// no jQuery at this stage...
	function getBaseUrl() {
		var baseUrl = './',
		    script,
		    scripts = document.getElementsByTagName('script'),
		    i, j = scripts.length,
		    regexAlohaJs = /\/aloha.js$/,
		    regexJs = /[^\/]*\.js$/;

		for (i = 0; i < j && (script = scripts[i]); i++) {
			// take aloha.js or first ocurrency of data-aloha-plugins
			// and script ends with .js
			if (regexAlohaJs.test(script.src)) {
				baseUrl = script.src.replace(regexAlohaJs , '');
				break;
			}
			if ('./' === baseUrl && script.getAttribute('data-aloha-plugins')
				&& regexJs.test(script.src)) {
				baseUrl = script.src.replace(regexJs , '');
			}
		}

		return baseUrl;
	}

	// Prepare the require config object.
    var requireConfig = Aloha.settings.requireConfig;
    if (!requireConfig.context) {
        requireConfig.context = 'aloha';
    }
    if (!requireConfig.baseUrl) {
        requireConfig.baseUrl = Aloha.settings.baseUrl;
    }
    if (!requireConfig.locale) {
        requireConfig.locale = Aloha.settings.locale;
    }

	// configure require and expose the Aloha.require function
	alohaRequire = require.config(Aloha.settings.requireConfig);
	Aloha.require = function (callback) {
		// passes the Aloha object to the passed callback function
		if (arguments.length == 1 && typeof callback === 'function') {
			return alohaRequire(['aloha'], callback);
		}
		return alohaRequire.apply(this, arguments);
	};

	// create promise for 'aloha-ready' when Aloha is not yet ready
	// and fire later when 'aloha-ready' is triggered all other events bind

	Aloha.bind = function (type, fn) {
        Aloha.require(['jQuery'], function (jQuery) {
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
        });
       return this;
	};

	Aloha.trigger = function (type, data) {
        Aloha.require(['jQuery'], function (jQuery) {
            deferredReady = deferredReady || jQuery.Deferred();
            if ('aloha-ready' === type) {
                jQuery(deferredReady.resolve);
            }
            jQuery(Aloha, 'body').trigger(type, data);
        });
		return this;
	};

	Aloha.ready = function (fn) {
		this.bind('aloha-ready', fn);
		return this;
	};
}());

define('aloha', [], function () {
	// Load Aloha dependencies...
	require(Aloha.settings.requireConfig, [
			'jQuery',
			'util/json2'
		], function (jQuery) {
		Aloha.jQuery = jQuery;

		// Load Aloha core files...
		require(Aloha.settings.requireConfig, [
				'vendor/jquery.json-2.2.min',
				'vendor/jquery.store',
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
			], function () {
			// ... and have jQuery call the Aloha.init method when the dom is
			// ready.
			jQuery(Aloha.init);
		});
	});

	return Aloha;
});
