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
(function AlohaCitePluginClosure (window, undefined) {
	
	'use strict';
	
	var GENTICS = window.GENTICS,
	      Aloha = window.Aloha,
		 jQuery = window.alohaQuery || window.jQuery,
	          $ = jQuery;
	
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
			var that = this,
				
				addBtn = new Aloha.ui.Button({
					iconClass: nsClass + ' ' + nsClass('button'),
					size: 'small',
					onclick: function () {
						alert(1);
					}
				});
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				addBtn,
				'Mark selection as quote', // TODO: Aloha.i18n(Aloha, 'citeplugin.tab.format')
				1
			);
		},
		
		addQuotes: function () {
			var that = this,
				range = Aloha.Selection.getRangeObject(),
				id = clss + '-' + (++uid),
				classes = [mkclass('wrapper'), id],
				wrapper = $('<div class="' + classes.join(' ') + '">');
			
			console.log(range);
			
			// Determine whether to use <q> or <blockquote>
			domUtils.allowsNesting($('<q>')[0], $('<div>')[0]) //false
			domUtils.allowsNesting($('<q>')[0], $('<span>')[0]) //true
			domUtils.allowsNesting($('<blockquote>')[0], $('<div>')[0]) // true;
			
			domUtil.addMarkup(range, wrapper);
			
			// if the wrapper element does not exist, it means that there
			// was nothing in the selection to wrap around, indicating an
			// empty selection
			if (!jQuery('.' + id).length) {
				// TODO: notify user
				return;
			}
			
			domUtil.doCleanup({'merge' : true, 'removeempty' : true}, range);
			
			
		},
		
		subscribeToEvents: function () {
			var that = this;
			
			Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
				var effective = [],
					i = rangeObject.markupEffectiveAtStart.length;
				
				while (i--) {
					effective.push(rangeObject.markupEffectiveAtStart[i]);
				}
				
				console.log(effective);
			});
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
