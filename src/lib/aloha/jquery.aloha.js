/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright © 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
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

define(
[ 'aloha/core', 'aloha/selection', 'aloha/jquery', 'aloha/console' ],
function( Aloha, Selection, jQuery, console ) {
	"use strict";
	
	var
//		$ = jQuery,
//		Aloha = window.Aloha,
//		console = window.console,
		XMLSerializer = window.XMLSerializer;

	/**
	 * jQuery between Extension
	 *
	 * insert either html code, a dom object OR a jQuery object inside of an existing text node.
	 * if the chained jQuery object is not a text node, nothing will happen.
	 *
	 * @param content HTML Code, DOM object or jQuery object to be inserted
	 * @param offset character offset from the start where the content should be inserted
	 */
	jQuery.fn.between = function(content, offset) {
		var
			offSize,
			fullText;

		if (this[0].nodeType !== 3) {
			// we are not in a text node, just insert the element at the corresponding position
			offSize = this.children().size();
			if (offset > offSize) {
				offset = offSize;
			}
			if (offset <= 0) {
				this.prepend(content);
			} else {
				this.children().eq(offset -1).after(content);
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
	jQuery.fn.contentEditable = function( b ) {
		// ie does not understand contenteditable but contentEditable
		// contentEditable is not xhtml compatible.
		var	$el = jQuery(this);
		var	ce = 'contenteditable';

		// Check
		if (jQuery.browser.msie && parseInt(jQuery.browser.version,10) == 7 ) {
			ce = 'contentEditable';
		}
		
		if (typeof b === 'undefined' ) {
			
			// For chrome use this specific attribute. The old ce will only
			// return 'inherit' for nested elements of a contenteditable.
			// The isContentEditable is a w3c standard compliant property which works in IE7,8,FF36+, Chrome 12+
			if (typeof $el[0] === 'undefined' ) {
				console.error('The jquery object did not contain any valid elements.');
				return undefined;
			}
			if (typeof $el[0].isContentEditable === 'undefined') {
				console.warn('Could not determine whether the is editable or not. I assume it is.');
				return true;
			} else { 
				return $el[0].isContentEditable;
			}
		} else if (b === '') {
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
	 * jQuery Aloha Plugin
	 *
	 * turn all dom elements to continous text
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	jQuery.fn.aloha = function() {
		var $this = jQuery( this );

		Aloha.bind( 'aloha-ready', function() {
			$this.each( function() {
				// create a new aloha editable object for each passed object
				if ( !Aloha.isEditable( this ) ) {
					new Aloha.Editable( jQuery( this ) );
				}
			});
		});

		// Chain
		return $this;
	};

	/**
	 * jQuery destroy elements as editable
	 *
	 * destroy all mached elements editable capabilities
	 * @return	jQuery object for the matched elements
	 * @api
	 */
	jQuery.fn.mahalo = function() {
		return this.each(function() {
			if (Aloha.isEditable(this)) {
				Aloha.getEditableById(jQuery(this).attr('id')).destroy();
			}
		});
	};

	/**
	 * jQuery Extension
	 * new Event which is triggered whenever a selection (length >= 0) is made in
	 * an Aloha Editable element
	 */
	jQuery.fn.contentEditableSelectionChange = function(callback) {
		var that = this;

		// update selection when keys are pressed
		this.keyup(function(event){
			var rangeObject = Selection.getRangeObject();
			callback(event);
		});

		// update selection on doubleclick (especially important for the first automatic selection, when the Editable is not active yet, but is at the same time activated as the selection occurs
		this.dblclick(function(event) {
			callback(event);
		});

		// update selection when text is selected
		this.mousedown(function(event){
			// remember that a selection was started
			that.selectionStarted = true;
		});
		jQuery(document).mouseup(function(event) {
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
	jQuery.fn.outerHtml = jQuery.fn.outerHtml || function(){
		var
			$el = jQuery(this),
			el = $el.get(0);
			if (typeof el.outerHTML != 'undefined') {
				return el.outerHTML;
			} else {
				try {
					// Gecko-based browsers, Safari, Opera.
					return (new XMLSerializer()).serializeToString(el);
				 } catch (e) {
					try {
					  // Internet Explorer.
					  return el.xml;
					} catch (e) {}
				}
			}
	
	};


	jQuery.fn.zap = function () {
		return this.each(function(){ jQuery(this.childNodes).insertBefore(this); }).remove();
	};

	jQuery.fn.textNodes = function(excludeBreaks, includeEmptyTextNodes) {
			var
				ret = [],
				doSomething = function(el){
					if (
						(el.nodeType === 3 && jQuery.trim(el.data) && !includeEmptyTextNodes) ||
						(el.nodeType === 3 && includeEmptyTextNodes) ||
						(el.nodeName =="BR" && !excludeBreaks)) {
						ret.push(el);
					} else {
						for (var i=0, childLength = el.childNodes.length; i < childLength; ++i) {
							doSomething(el.childNodes[i]);
						}
					}
				};
			
			doSomething(this[0]);

			return jQuery(ret);
	};

});
