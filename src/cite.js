/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * TODO: Should this plugin be called quotes or cite
 *
 * Add a Multisplitbutton to format a paragraph as a blockquote.
 * Behaves like other Multisplit-buttons.
 */
(function CiteClosure (window, undefined) {
	
	'use strict';
	
	var GENTICS = window.GENTICS,
	      Aloha = window.Aloha,
		 jQuery = window.alohaQuery || window.jQuery,
	          $ = jQuery,
		  rangy = window.rangy; 
	
	// Pseudo-namespace prefix for Sidebar elements
	var ns = 'aloha-cite',
		uid  = +(new Date),
		// namespaced classnames
		nsClasses = {
			quote: nsClass('quote'),
			blockquote: nsClass('blockquote')
		},
		domUtils = GENTICS.Utils.Dom;
	
	// ------------------------------------------------------------------------
	// Local (helper) functions
	// ------------------------------------------------------------------------
	
	String.prototype.supplant = function (/*'lDelim, rDelim,'*/ obj) {
		return this.replace(/\{([a-z0-9\-\_]+)\}/ig, function (str, p1, offset, s) {
			var replacement = obj[p1] || str;
			return (typeof replacement == 'function') ? replacement() : replacement;
		});
	};
	
	function renderTemplate (str) {
		return (typeof str == 'string') ? str.supplant(nsClasses) : str;
	};
	
	// Creates a selector string with this component's namepsace prefixed the each classname
	function nsSel () {
		var strBldr = [], prx = ns;
		$.each(arguments, function () { strBldr.push('.' + prx + '-' + this); });
		return strBldr.join(' ').trim();
	};
	
	// Creates string with this component's namepsace prefixed the each classname
	function nsClass () {
		var strBldr = [], prx = ns;
		$.each(arguments, function () { strBldr.push(prx + '-' + this); });
		return strBldr.join(' ').trim();
	};
	
	// ------------------------------------------------------------------------
	// Plugin
	// ------------------------------------------------------------------------
	var Cite = {
		_constructor: function () {
			this._super('cite');
		},
		
		init: function () {
			var that = this;
				
			var addBlockQuoteBtn = new Aloha.ui.Button({
					iconClass: nsClass + ' ' + nsClass('button', 'block-button'),
					size: 'small',
					onclick: function () {
						that.addBlockQuote();
					}
				});
			
			var addInlineQuote = new Aloha.ui.Button({
					iconClass: nsClass + ' ' + nsClass('button', 'inline-button'),
					size: 'small',
					onclick: function () {
						that.addInlineQuote();
					}
				});
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				addBlockQuoteBtn,
				'Citation', // TODO: Aloha.i18n(Aloha, 'citeplugin.tab.format')
				1
			);
		},
		
		addBlockQuote: function () {
			var rangySel = rangy.getSelection(),
				rangyRange = rangySel.getRangeAt(0);
			
			// Only wrap area under aloha control
			if (jQuery(rangyRange.commonAncestorContainer).parents('.aloha-editable-active').length == 0) {
				return;
			};
			
			var that = this,
				wrapper = jQuery('<blockquote class="' + [nsClass('wrapper'), nsClass(++uid)].join(' ') + '">')[0];
			
			if (rangySel.isCollapsed) {
				jQuery(rangySel.focusNode).wrap(wrapper);
			} else {
				;
				
				// Can we wrap a blockquote around this range?
				if (rangyRange.canSurroundContents(wrapper)) {
					rangyRange.surroundContents(wrapper);
				} else {
					console.warn('Cannot add a blockquote to this selection');
				}
			}
		},
		
		addInlineQuote: function () {
			var that = this,
				alohaRange = Aloha.Selection.getRangeObject(),
				rangySel = rangy.getSelection(),
				id = ns + '-' + (++uid),
				classes = [nsClass('wrapper'), id].join(' '),
				wrapper = jQuery('<blockquote class="' + classes + '">');
			
			if (rangySel.isCollapsed) {
				jQuery(rangySel.focusNode).wrap(wrapper);
			} else {
				var rangyRange = rangySel.getRangeAt(0); //rangySel.getAllRanges();
				
				// Can we wrap a blockquote around this range?
				if (rangyRange.canSurroundContents(jQuery('<blockquote>')[0])) {
					//domUtils.addMarkup(alohaRange, );
					domUtils.doCleanup({'merge' : true, 'removeempty' : true}, alohaRange);
				} else {
					console.warn('Cannot add a blockquote to this selection');
				}
					domUtils.addMarkup(alohaRange, jQuery('<blockquote class="' + classes + '">'));
					domUtils.doCleanup({'merge' : true, 'removeempty' : true}, alohaRange);
			}
			
			// Determine whether to use <q> or <blockquote>
			//domUtils.allowsNesting($('<q>')[0], $('<div>')[0]) //false
			//domUtils.allowsNesting($('<q>')[0], $('<span>')[0]) //true
			//domUtils.allowsNesting($('<blockquote>')[0], $('<div>')[0]) // true;
		},
		
		getEffectiveMarkup: function () {
			var range = Aloha.Selection.getRangeObject(),
				elems = [],
				i = range.markupEffectiveAtStart.length;
			
			console.log(range);
			
			while (i--) {
				elems.push(range.markupEffectiveAtStart[i]);
			}
			
			return elems;
		}
		
	}; // Cite
	
	function createPlugin () {
		return new (Aloha.Plugin.extend(Cite))();
	}
	
	// Create Aloha.Cite if Aloha is present
	//	(ie: This file was loaded by Aloha itself)
	// Otherwise wait until alohacoreloaded is triggered
	//	(ie: We are probably including this file from the document head)...
	if (Aloha && Aloha.Plugin) {
		Aloha.Cite = createPlugin();
	} else {
		// Load plugin once Aloha is ready.
		// We do this until requireJS brings peace to the land.
		jQuery(function () {
			jQuery('body').bind('alohacoreloaded', function () {
				// Paranoia...
				if (!Aloha.Cite) {
					Aloha.Cite = createPlugin();
				};
			});
		});
	}
	
})(window);
