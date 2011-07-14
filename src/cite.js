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
	
	function isWithinActiveEditable (range) {
		return (
			jQuery(range.commonAncestorContainer).is('.aloha-editable-active')
				||
			jQuery(range.commonAncestorContainer).parents('.aloha-editable-active').length > 0
		);
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
				
			var blockQuoteBtn = new Aloha.ui.Button({
					iconClass: nsClass + ' ' + nsClass('button', 'block-button'),
					size: 'small',
					onclick: function () {
						that.addBlockQuote();
					}
				});
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				blockQuoteBtn,
				'Citation', // TODO: Aloha.i18n(Aloha, 'cite.tab.citation')
				1
			);
			
			var inlineQuoteBtn = new Aloha.ui.Button({
					iconClass: nsClass + ' ' + nsClass('button', 'inline-button'),
					size: 'small',
					onclick: function () {
						that.addInlineQuote();
					}
				});
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				inlineQuoteBtn,
				'Citation', // TODO: Aloha.i18n(Aloha, 'cite.tab.citation')
				1
			);
		},
		
		addBlockQuote: function () {
			var sel = rangy.getSelection();
			
			// Only add quotes to areas which are under active aloha-editables
			if (!isWithinActiveEditable(sel.getRangeAt(0))) {
				return;
			};
			
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				flowWrapper = jQuery('<q class="' + classes + '">'),
				blockWrapper = jQuery('<blockquote class="' + classes + '">');
			
			if (sel.isCollapsed) {
				var parent = jQuery(sel.focusNode).parent();
				var isFlow =  domUtils.allowsNesting(flowWrapper[0], parent[0]);
				
				jQuery(sel.focusNode).wrap(isFlow ? flowWrapper : blockWrapper);
			} else {
				var rangeObject = Aloha.Selection.getRangeObject();
				
				var isPartial = false;
				
				if (rangeObject.startContainer.nodeType === 3
						&& rangeObject.startOffset > 0
							&& rangeObject.startOffset < rangeObject.startContainer.data.length) {
					isPartial = true;
				}
				
				if (rangeObject.endContainer.nodeType === 3
						&& rangeObject.endOffset > 0
							&& rangeObject.endOffset < rangeObject.endContainer.data.length) {
					isPartial = true;
				}
				
				if (isPartial) {
					domUtils.addMarkup(rangeObject, flowWrapper, false);
				} else {
					var parent = jQuery(rangeObject.startContainer).parent();
					var isFlow =  domUtils.allowsNesting(flowWrapper[0], parent[0]);
					domUtils.addMarkup(rangeObject, isFlow ? flowWrapper : blockWrapper, false);
				}
			}
		},
		
		addInlineQuote: function () {
			var sel = rangy.getSelection();
			
			// Only add quotes to areas which are under active aloha-editables
			if (!isWithinActiveEditable(sel.getRangeAt(0))) {
				return;
			};
			
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				flowWrapper = jQuery('<q class="' + classes + '">');
			
			if (sel.isCollapsed) {
				jQuery(sel.focusNode).wrap(flowWrapper);
			} else {
				domUtils.addMarkup(Aloha.Selection.getRangeObject(), flowWrapper, false);
			}
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
