/* jquery.aloha.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/**
 * IMPORTANT!
 * Don't add any more custom jquery extensions here.
 * Instead use the define(...) mechanism to define a module and to
 * import it where you need it.
 */
define([
	'aloha/core',
	'aloha/selection',
	'jquery',
	'aloha/console'
], function (
	Aloha,
	Selection,
	jQuery,
	console
) {
	'use strict';

	var XMLSerializer = window.XMLSerializer;

	/**
	 * jQuery between Extension
	 *
	 * insert either html code, a dom object OR a jQuery object inside of an existing text node.
	 * if the chained jQuery object is not a text node, nothing will happen.
	 *
	 * @param content HTML Code, DOM object or jQuery object to be inserted
	 * @param offset character offset from the start where the content should be inserted
	 */
	jQuery.fn.between = function (content, offset) {
		var offSize, fullText;

		if (this[0].nodeType !== 3) {
			// we are not in a text node, just insert the element at the corresponding position
			offSize = this.children().size();
			if (offset > offSize) {
				offset = offSize;
			}
			if (offset <= 0) {
				this.prepend(content);
			} else {
				this.children().eq(offset - 1).after(content);
			}
		} else {
			// we are in a text node so we have to split it at the correct position
			if (offset <= 0) {
				this.before(content);
			} else if (offset >= this[0].length) {
				this.after(content);
			} else {
				fullText = this[0].data;
				this[0].data = fullText.substring(0, offset);
				this.after(fullText.substring(offset, fullText.length));
				this.after(content);
			}
		}
	};

	/**
	 * Make the object contenteditable. Care about browser version (name of contenteditable attribute depends on it)
	 */
	jQuery.fn.contentEditable = function (b) {
		// ie does not understand contenteditable but contentEditable
		// contentEditable is not xhtml compatible.
		var $el = jQuery(this);
		var ce = 'contenteditable';

		// Check
		if (Aloha.browser.msie && parseInt(Aloha.browser.version, 10) == 7) {
			ce = 'contentEditable';
		}

		if (typeof b === 'undefined') {

			// For chrome use this specific attribute. The old ce will only
			// return 'inherit' for nested elements of a contenteditable.
			// The isContentEditable is a w3c standard compliant property which works in IE7,8,FF36+, Chrome 12+
			if (typeof $el[0] === 'undefined') {
				console.warn('The jquery object did not contain any valid elements.'); // die silent
				return undefined;
			}
			if (typeof $el[0].isContentEditable === 'undefined') {
				console.warn('Could not determine whether the is editable or not. I assume it is.');
				return true;
			}

			return $el[0].isContentEditable;
		}

		if (b === '') {
			$el.removeAttr(ce);
		} else {
			if (b && b !== 'false') {
				b = 'true';
			} else {
				b = 'false';
			}
			$el.attr(ce, b);
		}

		return $el;
	};

	/**
	 * jQuery Aloha Plugin.
	 *
	 * Makes the elements in a jQuery selection set Aloha editables.
	 *
	 * @return jQuery container of holding DOM elements that have been
	 *         aloha()fied.
	 * @api
	 */
	jQuery.fn.aloha = function () {
		var $elements = this;
		Aloha.bind('aloha-plugins-loaded', function () {
			$elements.each(function (_, elem) {
				if (!Aloha.isEditable(elem)) {
					new Aloha.Editable(jQuery(elem)).init();
				}
			});
		});
		return $elements;
	};

	/**
	 * jQuery destroy elements as editable
	 *
	 * destroy all mached elements editable capabilities
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	jQuery.fn.mahalo = function () {
		return this.each(function () {
			if (Aloha.isEditable(this)) {
				Aloha.getEditableById(jQuery(this).attr('id')).destroy();
			}
		});
	};

	/**
	 * jQuery alohaText gets contents for an Aloha Editor editable
	 *
	 * getContents forall editable
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	jQuery.fn.alohaText = function () {
		return this.each(function () {
			if (Aloha.isEditable(this)) {
				Aloha.getEditableById(jQuery(this).attr('id')).getContents();
			}
		});
	};

	/**
	 * jQuery Extension
	 * new Event which is triggered whenever a selection (length >= 0) is made in
	 * an Aloha Editable element
	 */
	jQuery.fn.contentEditableSelectionChange = function (callback) {
		var that = this;

		// update selection when keys are pressed
		this.keyup(function (event) {
			var rangeObject = Selection.getRangeObject();
			callback(event);
		});

		// update selection on doubleclick (especially important for the first automatic selection, when the Editable is not active yet, but is at the same time activated as the selection occurs
		this.dblclick(function (event) {
			callback(event);
		});

		// update selection when text is selected
		this.mousedown(function (event) {
			// remember that a selection was started
			that.selectionStarted = true;
		});

		jQuery(document).mouseup(function (event) {
			Selection.eventOriginalTarget = that;
			if (that.selectionStarted) {
				callback(event);
			}
			Selection.eventOriginalTarget = false;
			that.selectionStarted = false;
		});

		return this;
	};

	/**
	 * Fetch the outerHTML of an Element
	 * @version 1.0.0
	 * @date February 01, 2011
	 * @package jquery-sparkle {@link http://www.balupton/projects/jquery-sparkle}
	 * @author Benjamin Arthur Lupton {@link http://balupton.com}
	 * @copyright 2011 Benjamin Arthur Lupton {@link http://balupton.com}
	 * @license MIT License {@link http://creativecommons.org/licenses/MIT/}
	 * @return {String} outerHtml
	 */
	jQuery.fn.outerHtml = jQuery.fn.outerHtml || function () {
		var $el = jQuery(this),
			el = $el.get(0);
		if (typeof el.outerHTML != 'undefined') {
			return el.outerHTML;
		}
		try {
			// Gecko-based browsers, Safari, Opera.
			return (new XMLSerializer()).serializeToString(el);
		} catch (e) {
			try {
				// Internet Explorer.
				return el.xml;
			} catch (e2) {}
		}
	};

	jQuery.fn.zap = function () {
		return this.each(function () {
			jQuery(this.childNodes).insertBefore(this);
		}).remove();
	};

	jQuery.fn.textNodes = function (excludeBreaks, includeEmptyTextNodes) {
		var ret = [],
			doSomething = function (el) {
				var i, childLength;
				if ((el.nodeType === 3 && jQuery.trim(el.data) && !includeEmptyTextNodes) || (el.nodeType === 3 && includeEmptyTextNodes) || (el.nodeName == "BR" && !excludeBreaks)) {
					ret.push(el);
				} else {
					for (i = 0, childLength = el.childNodes.length; i < childLength; ++i) {
						doSomething(el.childNodes[i]);
					}
				}
			};

		doSomething(this[0]);

		return jQuery(ret);
	};

	/**
	 * extendObjects is like jQuery.extend, but it does not extend arrays
	 */
	jQuery.extendObjects = jQuery.fn.extendObjects = function (arg1, arg2) {
		var options, name, src, copy, copyIsArray, clone,
		    start = 1,
		    target = arg1 || {},
			length = arguments.length,
		    deep = false,
		    i;


		// Handle a deep copy situation
		if (typeof target === "boolean") {
			deep = target;
			target = arg2 || {};
			// skip the boolean and the target
			start = 2;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if (typeof target !== "object" && !jQuery.isFunction(target)) {
			target = {};
		}

		// extend jQuery itself if only one argument is passed
		if (length === start) {
			target = this;
			--start;
		}

		for (i = start; i < length; i++) {
			// Only deal with non-null/undefined values
			if ((options = arguments[i]) != null) {
				// Extend the base object
				for (name in options) {
					if (options.hasOwnProperty(name)) {

						src = target[name];
						copy = options[name];

						// Prevent never-ending loop
						if (target === copy) {
							continue;
						}

						// Recurse if we're merging plain objects or arrays
						if (deep && copy && (jQuery.isPlainObject(copy) || true === (copyIsArray = jQuery.isArray(copy)))) {
							if (copyIsArray) {
								copyIsArray = false;
								clone = src && jQuery.isArray(src) ? src : [];

							} else {
								clone = src && jQuery.isPlainObject(src) ? src : {};
							}

							// Never move original objects, clone them
							if (jQuery.isArray(copy)) {
								// don't extend arrays
								target[name] = copy;
							} else {
								target[name] = jQuery.extendObjects(deep, clone, copy);
							}

							// Don't bring in undefined values
						} else if (copy !== undefined) {
							target[name] = copy;
						}
					}
				}
			}
		}

		// Return the modified object
		return target;
	};

	/**
	 * Check whether element has scrollbars visible
	 */
	function hasScroll(el, index, match) {
		if (!el.style) {
			return false;
		}
		var $el = jQuery(el), sX = $el.css('overflow-x'), sY = $el
			.css('overflow-y'), hidden = 'hidden', visible = 'visible',
			scroll = 'scroll', axis = match[3];

		if (!axis) {
			if (sX === sY && (sY === hidden || sY === visible)) {
				return false;
			}
			if (sX === scroll || sY === scroll) {
				return true;
			}
		} else if (axis === 'x') {
			if (sX === hidden || sX === visible) {
				return false;
			}
			if (sX === scroll) {
				return true;
			}
		} else if (axis === 'y') {
			if (sY === hidden || sY === visible) {
				return false;
			}
			if (sY === scroll) {
				return true;
			}
		}

		// Compare client and scroll dimensions to see if a scrollbar is
		// needed

		return $el.innerHeight() < el.scrollHeight
				|| $el.innerWidth() < el.scrollWidth;
	}

	jQuery.expr[':'].hasScroll = hasScroll;

	/*
	 * jQuery Hotkeys Plugin
	 * Copyright 2010, John Resig
	 * Dual licensed under the MIT or GPL Version 2 licenses.
	 *
	 * Based upon the plugin by Tzury Bar Yochay:
	 * http://github.com/tzuryby/hotkeys
	 *
	 * Original idea by:
	 * Binny V A, http://www.openjs.com/scripts/events/keyboard_shortcuts/
	 */

	jQuery.hotkeys = {
		version: "0.8",

		specialKeys: {
			8: "backspace",
			9: "tab",
			13: "return",
			16: "shift",
			17: "ctrl",
			18: "alt",
			19: "pause",
			20: "capslock",
			27: "esc",
			32: "space",
			33: "pageup",
			34: "pagedown",
			35: "end",
			36: "home",
			37: "left",
			38: "up",
			39: "right",
			40: "down",
			45: "insert",
			46: "del",
			96: "0",
			97: "1",
			98: "2",
			99: "3",
			100: "4",
			101: "5",
			102: "6",
			103: "7",
			104: "8",
			105: "9",
			106: "*",
			107: "+",
			109: "-",
			110: ".",
			111: "/",
			112: "f1",
			113: "f2",
			114: "f3",
			115: "f4",
			116: "f5",
			117: "f6",
			118: "f7",
			119: "f8",
			120: "f9",
			121: "f10",
			122: "f11",
			123: "f12",
			144: "numlock",
			145: "scroll",
			188: ",",
			190: ".",
			191: "/",
			224: "meta"
		},

		shiftNums: {
			"`": "~",
			"1": "!",
			"2": "@",
			"3": "#",
			"4": "$",
			"5": "%",
			"6": "^",
			"7": "&",
			"8": "*",
			"9": "(",
			"0": ")",
			"-": "_",
			"=": "+",
			";": ": ",
			"'": "\"",
			",": "<",
			".": ">",
			"/": "?",
			"\\": "|"
		}
	};

	function applyKeyHandler(handler, context, args, event) {
		// Don't fire in text-accepting inputs that we didn't directly bind to
		if (context !== event.target && (/textarea|input|select/i.test(event.target.nodeName) || event.target.type === "text")) {
			return;
		}
		return handler.apply(context, args);
	}

	function keyHandler(handleObj) {
		var origHandler, keys, handle, i;

		// Only care when a possible input has been specified
		if (typeof handleObj.data !== "string") {
			return;
		}

		origHandler = handleObj.handler;
		keys = handleObj.data.toLowerCase().split(" ");
		handle = {};

		for (i = 0; i < keys.length; i++) {
			handle[keys[i]] = true;
		}

		handleObj.handler = function (event) {
			// The original comment that was added with this condition says:
			// "Don't fire in contentEditable true elements"
			// But this is incorrect.
			// What this condition does is it skips hotkey events for
			// any target unless it is directly bound.
			// The condition event.target.contentEditable !== true will
			// always be true, because contentEditable is a string
			// attribute that is never strictly equal true.
			//if (this !== event.target && event.target.contentEditable !== true) {
			//return;
			//}
			// Below is what this condition really does. Ideally, I'd
			// like to remove this condition since it was not there in
			// the original implementation by John Resig and it could
			// interfere with other plugins, but when I removed it, I
			// was unable to input any space characters into an
			// editable.
			// TODO figure out a way to safely remove this
			if (this !== event.target) {
				return;
			}

			// Keypress represents characters, not special keys
			var special = event.type !== "keypress" && jQuery.hotkeys.specialKeys[event.which],
				modif = "",
				character;

			// check combinations (alt|ctrl|shift+anything)
			if (event.altKey && special !== "alt") {
				modif += "alt+";
			}

			if (event.ctrlKey && special !== "ctrl") {
				modif += "ctrl+";
			}

			// TODO: Need to make sure this works consistently across platforms
			if (event.metaKey && !event.ctrlKey && special !== "meta") {
				modif += "meta+";
			}

			if (event.shiftKey && special !== "shift") {
				modif += "shift+";
			}

			if (special) {
				if (handle[modif + special]) {
					return applyKeyHandler(origHandler, this, arguments, event);
				}
			} else {
				character = String.fromCharCode(event.which).toLowerCase();

				if (handle[modif + character]) {
					return applyKeyHandler(origHandler, this, arguments, event);
				}

				if (handle[modif + jQuery.hotkeys.shiftNums[character]]) {
					return applyKeyHandler(origHandler, this, arguments, event);
				}

				// "$" can be triggered as "Shift+4" or "Shift+$" or just "$"
				if (modif === "shift+") {
					if (handle[jQuery.hotkeys.shiftNums[character]]) {
						return applyKeyHandler(origHandler, this, arguments, event);
					}
				}
			}
		};
	}

	jQuery.each(['keydown', 'keyup', 'keypress'], function () {
		jQuery.event.special[this] = {
			add: keyHandler
		};
	});

});
