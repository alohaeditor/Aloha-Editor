/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Add a Multisplitbutton to format a paragraph as a blockquote.
 * Behaves like other Multisplit-buttons.
 */
(function CiteClosure (window, undefined) {
	
	'use strict';
	
	var GENTICS = window.GENTICS,
	      Aloha = window.Aloha,
		 jQuery = window.alohaQuery || window.jQuery,
		  rangy = window.rangy,	
	          $ = jQuery; 
	
	// Pseudo-namespace prefix
	var ns = 'aloha-cite',
		uid  = +new Date,
		// namespaced classnames
		nsClasses = {
			quote		  : nsClass('quote'),
			blockquote	  : nsClass('blockquote'),
			'panel-label' : nsClass('panel-label'),
			'panel-field' : nsClass('panel-field'),
			'panel-btns'  : nsClass('panel-btns'),
			'link-field'  : nsClass('link-field'),
			'note-field'  : nsClass('note-field'),
			references	  : nsClass('references')
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
		$.each(arguments, function () { strBldr.push('.' + (this == '' ? prx : prx + '-' + this)); });
		return strBldr.join(' ').trim();
	};
	
	// Creates string with this component's namepsace prefixed the each classname
	function nsClass () {
		var strBldr = [], prx = ns;
		$.each(arguments, function () { strBldr.push(this == '' ? prx : prx + '-' + this); });
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
		
		citations: [],
		
		_constructor: function () {
			this._super('cite');
		},
		
		init: function () {
			var that = this;
			
			this.buttons = [];
			
			this.buttons[0] = new Aloha.ui.Button({
				name	  : 'quote',
				text	  : 'Quote',					// that.i18n('button.' + button + '.text'),
				tooltip	  : 'Add quote on selection',	// that.i18n('button.' + button + '.tooltip'),
				iconClass : nsClass('button', 'inline-button'),
				onclick	  : function() {
					that.addInlineQuote();
				}
			});
			
			this.buttons[1] = new Aloha.ui.Button({
				name	  : 'blockquote',
				text	  : 'Blockquote',					// that.i18n('button.' + button + '.text'),
				tooltip	  : 'Add blockquote on selection',	// that.i18n('button.' + button + '.tooltip'),
				iconClass : nsClass('button', 'block-button'),
				onclick	  : function() {
					that.addBlockQuote();
				}
			});
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.buttons[0],
				'Citation',
				1
			);
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.buttons[1],
				'Citation',
				1
			);
			
			this.sidebar = null;
			
			// Add another panel after sidebar has been initialized
			jQuery('body').bind('aloha-sidebar-initialized', function (ev, sidebar) {
				that.sidebar = sidebar.addPanel({
					id		 : nsClass('sidebar-panel'),
					title	 : 'Citation',
					content	 : '',
					expanded : true,
					activeOn : '.aloha-cite-wrapper',
					onInit	 : function () {
						var plugin = Aloha.Cite,
							that = this,
							content = this.setContent(renderTemplate(
						   '<div class="{panel-label}">Link:</div>\
							<div class="{panel-field} {link-field}"><input type="text" /></div>\
							<div class="{panel-label}">Note:</div>\
							<div class="{panel-field} {note-field}"><textarea></textarea></div>\
							<div class="{panel-btns}"><button>Save</button></div>'
						)).content;
						
						content.find('button').click(function () {
							var content = that.content;
							plugin.addCiteDetails(
								content.attr('data-cite-id'),
								content.find(nsSel('link-field input')).val(),
								content.find(nsSel('note-field textarea')).val()
							);
						});
					},
					onActivate: function (effective) {
						var id = effective.attr('data-cite-id'),
							idx = that.indexOfCitation(id);
						
						if (idx > -1) {
							var citation = that.citations[idx],
								content = this.content;
							content.attr('data-cite-id', id);
							content.find(nsSel('link-field intput')).val(citation.link);
							content.find(nsSel('note-field textarea')).val(citation.note);
						}
					}
				});
			});
			
			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed', function(event, rangeObject){
				var buttons = jQuery('button' + nsSel('button'));
			
				jQuery.each(that.buttons, function(index, button) {
					// set to false to prevent multiple buttons to be active when they should not
					var statusWasSet = false,
						tagName,
						effective = rangeObject.markupEffectiveAtStart,
						i  = effective.length;
					
					// check whether any of the effective items are citation tags
					while (i--) {
						tagName = effective[i].tagName.toLowerCase();
						if ('q' == tagName || 'blockquote' == tagName) {
							statusWasSet = true;
							break;
						}
					}
					
					// Remove pressed class from both button
					buttons.removeClass(nsClass('pressed'));
					
					// Add pressed class to the button that matches and break loop
					if (statusWasSet) {
						buttons.filter(nsSel(tagName == 'q' ? 'inline-button' : 'block-button'))
							.addClass(nsClass('pressed'));
						return false;
					}
				});
			});
		},
		
		// Do a binary search through all citations for a given uid in O(log N) time
		// The bit shifting may be a *bit* of an overkill (pun intended),
		// but if were are working through a big list this will be significantly more performant
		// Math.floor(i) / 2 == i >> 1 == ~~(i / 2)
		indexOfCitation: function (uid) {
			var c = this.citations,
				max = c.length,
				min = 0,
				mid,
				cuid;
			
			while (min < max) {
				mid = (min + max) >> 1;
				if ((cuid = c[mid].uid) == uid) {
					return mid;
				} else if (cuid > uid) {
					max = mid;
				} else if (cuid < uid) {
					min = mid + 1;
				}
			}
		},
		
		addBlockQuote: function () {
			var sel = rangy.getSelection();
			
			// Only add quotes to areas which are under active aloha-editables
			if (!isWithinActiveEditable(sel.getRangeAt(0))) {
				return;
			};
			
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				flowWrapper = jQuery('<q class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes})),
				blockWrapper = jQuery('<blockquote class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes}));
			
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
			
			this.addCiteToFooter(uid);
			this.sidebar.open();
		},
		
		addInlineQuote: function () {
			var sel = rangy.getSelection();
			
			// Only add quotes to areas which are under active aloha-editables
			if (!isWithinActiveEditable(sel.getRangeAt(0))) {
				return;
			};
			
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				wrapper = jQuery('<q class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes}));
			
			if (sel.isCollapsed) {
				jQuery(sel.focusNode).wrap(wrapper);
			} else {
				domUtils.addMarkup(Aloha.Selection.getRangeObject(), wrapper, false);
			}
			
			this.addCiteToFooter(uid);
			
			this.sidebar.open()
				.activatePanel(nsClass('sidebar-panel'), wrapper);
		},
		
		addCiteToFooter: function (uid) {
			var wrapper = jQuery(nsSel(uid)).last(),
				count = this.citations.push({uid:uid, link:null, notes:null}),
				note = 'cite-note-' + uid,
				ref = 'cite-ref-' + uid;
			
			wrapper.append(
				'<sup id="{ref}"><a href="#{note}">[{index}]</a></sup>'.supplant({
					ref	  : ref,
					note  : note,
					index : count + ''
				})
			);
			
			if (jQuery('.aloha-editable-active').siblings('ol.references').length == 0) {
				jQuery('.aloha-editable-active').after(renderTemplate('<ol class="references">'));
			}
			
			jQuery('.aloha-editable-active').siblings('ol.references').append(
				'<li id="{note}"><a href="#{ref}">^</a> &nbsp; <span></span></li>'.supplant({
					ref	 : ref,
					note : note
				})
			);
		},
		
		addCiteDetails: function (uid, link, note) {
			jQuery('li#cite-note-' + uid + ' span').html(
				(link == ''
					? '' : '<a class="external" target="_blank" href="{url}">{url}</a>.'.supplant({url:link}))
				+ note
			);
		},
		
		toString: function () {
			return 'cite';
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
