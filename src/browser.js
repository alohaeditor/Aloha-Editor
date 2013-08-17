/* browser.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 */
define([], function Browser() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('browser');
	}

	/**
	 * Adapted from http://code.jquery.com/jquery-migrate-git.js
	 */
	var matched = (function () {
		var ua = navigator.userAgent.toLowerCase();
		var match = /(chrome)[ \/]([\w.]+)/.exec(ua)
				 || /(webkit)[ \/]([\w.]+)/.exec(ua)
				 || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua)
				 || /(msie) ([\w.]+)/.exec(ua)
				 || (ua.indexOf('compatible') < 0
		             && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua))
				 || [];
		return {
			browser: match[1] || '',
			version: match[2] || '0'
		};
	}());

	/**
	 * Browser vendor and version properties.
	 *
	 * @type {Object}
	 */
	var browser = {};

	if (matched.browser) {
		browser[matched.browser] = true;
		browser.version = matched.version;
	}

	// Chrome is Webkit, but Webkit is also Safari.
	if (browser.chrome) {
		browser.webkit = true;
	} else {
		browser.safari = true;
	}

	var testElem = document.createElement('div');

	/**
	 * Browser and feature detection functions.
	 *
	 * browser.browser
	 * browser.ie
	 * browser.hasRemoveProperty
	 */
	var exports = {
		ie7: browser.msie && parseInt(browser.version, 10) < 8,
		browser: browser,
		hasRemoveProperty: !!testElem.style.removeProperty
	};

	exports['ie7'] = exports.ie7;
	exports['browser'] = exports.browser;
	exports['hasRemoveProperty'] = exports.hasRemoveProperty;

	return exports;
});
