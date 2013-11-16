/* browsers.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function Browsers() {
	'use strict';

	/**
	 * CSS vendor prefix string for the host user agent.
	 *
	 * @type {string}
	 */
	var VENDOR_PREFIX = '';

	var testElem = document.createElement('div');
	var prefixes = ['-webkit', '-moz', '-o'];
	var style = testElem.style;
	var i;
	for (i = 0; i < prefixes.length; i++) {
		if (style.hasOwnProperty(prefixes[i] + '-transform')) {
			VENDOR_PREFIX = prefixes[i];
		}
	}

	// Adapted from http://code.jquery.com/jquery-migrate-git.js
	var ua = navigator.userAgent.toLowerCase();
	var info = /(chrome)[ \/]([\w.]+)/.exec(ua)
	        || /(webkit)[ \/]([\w.]+)/.exec(ua)
	        || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua)
	        || /(msie) ([\w.]+)/.exec(ua)
	        || (ua.indexOf('compatible') < 0
	            && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua));

	var vendor, version, ie7, chrome, safari, webkit;
	ie7 = chrome = safari = webkit = false;

	if (info) {
		vendor = info[1];
		version = info[2];
		ie7 = ('msie' === version) && (parseInt(version, 10) < 8);

		// Chrome is Webkit, but Webkit is also Safari.
		if ('chrome' === vendor) {
			webkit = true;
		} else if ('webkit' === vendor) {
			safari = true;
		}
	}

	var exports = {
		ie7               : ie7,
		chrome            : chrome,
		webkit            : webkit,
		safari            : safari,
		vendor            : vendor,
		version           : version,
		hasRemoveProperty : !!testElem.style.removeProperty,
		VENDOR_PREFIX     : VENDOR_PREFIX
	};

	if (info) {
		exports[vendor] = true;
	}

	exports['ie7'] = exports.ie7;
	exports['chrome'] = exports.chrome;
	exports['webkit'] = exports.webkit;
	exports['safari'] = exports.safari;
	exports['vendor'] = exports.vendor;
	exports['version'] = exports.version;
	exports['hasRemoveProperty'] = exports.hasRemoveProperty;
	exports['VENDOR_PREFIX'] = exports.VENDOR_PREFIX;

	return exports;
});
