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
	
	function hex2rgb (hex) {
		hex = hex.replace('#', '').split('');
		
		if (hex.length == 3) {
			hex[5] = hex[4] = hex[2];
			hex[3] = hex[2] = hex[1];
			hex[1] = hex[0];
		}
		
		var rgb = [];
		for (var i = 0; i < 3; i++) {
			rgb[i] = parseInt('0x' + hex[i * 2] + hex[i * 2 + 1]);
		}
		
		return rgb;
	};
	
	function renderTemplate (str) {
		return (typeof str === 'string') ? str.supplant(nsClasses) : str;
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
			$(range.commonAncestorContainer).is('.aloha-editable-active')
				||
			$(range.commonAncestorContainer).parents('.aloha-editable-active').length > 0
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
			$('body').bind('aloha-sidebar-initialized', function (ev, sidebar) {
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
								<div class="{panel-field} {link-field}" style="margin: 5px;"><input type="text" /></div>\
								<div class="{panel-btns}"><button>Done</button></div>'
								
								//<div class="{panel-label}">Note:</div>\
								//<div class="{panel-field} {note-field}"><textarea></textarea></div>
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
							idx = that.indexOfCitation(id),
							content = this.content;
						
						if (idx == -1) {
							idx = that.citations.push({uid:uid, link:null, notes:null}) - 1;
						}
						
						content.attr('data-cite-id', id);
						content.find(nsSel('link-field input')).val(effective.attr('cite')).focus();
						content.find(nsSel('note-field textarea')).val(that.citations[idx].note);
					}
					
				});
				
				sidebar.addPanel({
					id		 : nsClass('sidebar-panel-2'),
					title	 : 'Test',
					content	 : '',
					expanded : true,
					activeOn : 'q,blockquote,i,b,a,p,h2',
					onInit	 : function () {},
					onActivate : function (effective) {
						this.renderEffectiveParents(
							effective, function (el) {
								return el.html();
							}
						);
					} 
				});
			});
			
			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed', function(event, rangeObject){
				var buttons = $('button' + nsSel('button'));
			
				$.each(that.buttons, function(index, button) {
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
		indexOfCitation: function (uid) {
			var c = this.citations,
				max = c.length,
				min = 0,
				mid,
				cuid;
			
			while (min < max) {
				mid = (min + max) >> 1; // Math.floor(i) / 2 == i >> 1 == ~~(i / 2)
				if ((cuid = c[mid].uid) == uid) {
					return mid;
				} else if (cuid > uid) {
					max = mid;
				} else if (cuid < uid) {
					min = mid + 1;
				}
			}
			
			return -1;
		},
		
		addBlockQuote: function () {
			var sel = rangy.getSelection();
			
			// Only add quotes to areas which are under active aloha-editables
			if (!isWithinActiveEditable(sel.getRangeAt(0))) {
				return;
			};
			
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				flowWrapper = $('<q class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes})),
				blockWrapper = $('<blockquote class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes})),
				wrapper;
			
			if (sel.isCollapsed) {
				var parent = $(sel.focusNode).parent();
				var isFlow =  domUtils.allowsNesting(flowWrapper[0], parent[0]);
				wrapper = isFlow ? flowWrapper : blockWrapper;
				$(sel.focusNode).wrap(wrapper);
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
					wrapper = flowWrapper;
					domUtils.addMarkup(rangeObject, flowWrapper, false);
				} else {
					var parent = $(rangeObject.startContainer).parent();
					var isFlow =  domUtils.allowsNesting(flowWrapper[0], parent[0]);
					wrapper = isFlow ? flowWrapper : blockWrapper
					domUtils.addMarkup(rangeObject, wrapper, false);
				}
			}
			
			//this.addCiteToFooter(uid);
			
			this.sidebar.open()
				.activatePanel(nsClass('sidebar-panel'), wrapper);
		},
		
		addInlineQuote: function () {
			var sel = rangy.getSelection();
			
			// Only add quotes to areas which are under active aloha-editables
			if (!isWithinActiveEditable(sel.getRangeAt(0))) {
				return;
			};
			
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				wrapper = $('<q class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes}));
			
			if (sel.isCollapsed) {
				$(sel.focusNode).wrap(wrapper);
			} else {
				domUtils.addMarkup(Aloha.Selection.getRangeObject(), wrapper, false);
			}
			
			//this.addCiteToFooter(uid);
			
			this.sidebar.open()
				.activatePanel(nsClass('sidebar-panel'), wrapper);
		},
		
		addCiteToFooter: function (uid) {
			var wrapper = $(nsSel(uid)).last(),
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
			
			if ($('.aloha-editable-active').siblings('ol.references').length == 0) {
				$('.aloha-editable-active')
					.after(renderTemplate('<ol class="references">'))
					.after('<h2>References</h2>');
			}
			
			$('.aloha-editable-active').siblings('ol.references').append(
				'<li id="{note}"><a href="#{ref}">^</a> &nbsp; <span></span></li>'.supplant({
					ref	 : ref,
					note : note
				})
			);
		},
		
		addCiteDetails: function (uid, link, note) {
			this.citations[this.indexOfCitation(uid)] = {
				uid : uid,
				link: link,
				note: note,
			};
			
			if (link) {
				// Update link attribute
				var el = $(nsSel(uid)).attr('cite', link);
				
				// Highlight animation to happy user
				var round = Math.round;
				var from = hex2rgb('#fdff9a');
				var to = hex2rgb('#000');
				
				from.push(1);
				to.push(0.1);
				
				var diff = [to[0] - from[0], to[1] - from[1], to[2] - from[2], to[3] - from[3]];
				
				el.css({
					__tick: 0,
					'background-color': 'rgba(' + from.join(',') + ')',
					'box-shadow': '0 0 20px rgba(' + from.join(',') + ')'
				}).animate({__tick: 1}, {
						duration: 500,
						easing: 'linear',
						step: function (val, fx) {
							var rgba = [
								round(from[0] + diff[0] * val),
								round(from[1] + diff[1] * val),
								round(from[2] + diff[2] * val),
									  from[3] + diff[3] * val
							];
							
							$(this).css({
								'background-color': 'rgba(' + rgba.join(',') + ')',
								'box-shadow': '0 0 ' + (20 * (1 - val)) + 'px rgba(' + from.join(',') + ')'
							});
						}
					});
			}
			
			/* For generating reference list
			$('li#cite-note-' + uid + ' span').html(
				(link == ''
					? '' : '<a class="external" target="_blank" href="{url}">{url}</a>.'.supplant({url:link}))
				+ note
			);
			*/
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
		$(function () {
			$('body').bind('alohacoreloaded', function () {
				// Paranoia...
				if (!Aloha.Cite) {
					Aloha.Cite = createPlugin();
				};
			});
		});
	}
	
})(window);
