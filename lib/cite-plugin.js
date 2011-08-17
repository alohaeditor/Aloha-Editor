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

define(
[
	// js
	'aloha/jquery',	
	'aloha/plugin',
	'aloha/floatingmenu',
	'aloha-plugin!common/format',
	'i18n!aloha/nls/i18n',
	// css
	'css!cite/css/cite.css'
],
function CiteClosure ($, Plugin, FloatingMenu, Format, i18nCore) {
	
	'use strict';

	var
		GENTICS = window.GENTICS,
		  Aloha = window.Aloha,
		  rangy = window.rangy;	
	
	var
		// Pseudo-namespace prefix
		ns = 'aloha-cite',
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
			rgb[i] = parseInt('0x' + hex[i * 2] + hex[i * 2 + 1], 10);
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
	
	// ------------------------------------------------------------------------
	// Plugin
	// ------------------------------------------------------------------------
	return Plugin.create('cite', {
		
		citations: [],
		
		init: function () {
			var that = this;
			
			this.buttons = [];
			
			this.buttons[0] = new Aloha.ui.Button({
				name	  : 'quote',
				text	  : 'Quote',					// that.i18n('button.' + button + '.text'),
				tooltip	  : 'Add quote on selection',	// that.i18n('button.' + button + '.tooltip'),
				iconClass : nsClass('button','inline-button'),
				size	  : 'small',
				toggle	  : true,
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
			
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.buttons[0],
				i18nCore.t('floatingmenu.tab.format'),
				1
			);
			
			/*
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.buttons[1],
				i18nCore.t('floatingmenu.tab.format'),
				1
			);
			*/
			

			//console.log(Format, Format.multiSplitItems);
			//Format.multiSplitItems.push(this.buttons[1]);

			this.sidebar = null;
			
			var citeplugin = this;


			// Add another panel after sidebar has been initialized
			$('body').bind('aloha-sidebar-initialized', function (ev, sidebars) {


				var sidebar = that.sidebar = sidebars.right.show();

				sidebar.addPanel({
					
					id		 : nsClass('sidebar-panel'),
					title	 : 'Citation',
					content	 : '',
					expanded : true,
					activeOn : '.aloha-cite-wrapper',
					
					onInit	 : function () {
						var that = this,
						    content = this.setContent(renderTemplate(
							   '<div class="{panel-label}">Link:</div>\
								<div class="{panel-field} {link-field}" style="margin: 5px;"><input type="text" /></div>\
								<div class="{panel-btns}"><button>Done</button></div>'
								
								//<div class="{panel-label}">Note:</div>\
								//<div class="{panel-field} {note-field}"><textarea></textarea></div>
							)).content;
						
						content.find('button').click(function () {
							var content = that.content;
							
							citeplugin.addCiteDetails(
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
					title	 : 'Quotes',
					content	 : '',
					expanded : true,
					activeOn : 'q,blockquote',
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
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				markup = $('<blockquote class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes}));
			
			// now focus back to the active element
			if (Aloha.activeEditable) {
				Aloha.activeEditable.obj[0].focus();
			}
			
			Aloha.Selection.changeMarkupOnSelection(markup);
			
			//this.addCiteToFooter(uid);
			
			this.sidebar.open()
				.activatePanel(nsClass('sidebar-panel'), markup);
		},
		
		addInlineQuote: function () {
			var classes = [nsClass('wrapper'), nsClass(++uid)].join(' '),
				markup = $('<q class="{classes}" data-cite-id="{uid}">'.supplant({uid:uid, classes:classes})),
				rangeObject = Aloha.Selection.rangeObject,
				foundMarkup;

			// now focus back to the active element
			if (Aloha.activeEditable) {
				Aloha.activeEditable.obj[0].focus();
			}

			// check whether the markup is found in the range (at the start of the range)
			foundMarkup = rangeObject.findMarkup(function() {
				return this.nodeName.toLowerCase() == markup.get(0).nodeName.toLowerCase();
			}, Aloha.activeEditable.obj);

			if (foundMarkup) {
				// remove the markup
				if (rangeObject.isCollapsed()) {
					// when the range is collapsed, we remove exactly the one DOM element
					domUtils.removeFromDOM(foundMarkup, rangeObject, true);
				} else {
					// the range is not collapsed, so we remove the markup from the range
					domUtils.Dom.removeMarkup(rangeObject, markup, Aloha.activeEditable.obj);
				}
			} else {
				// when the range is collapsed, extend it to a word
				if (rangeObject.isCollapsed()) {
					domUtils.extendToWord(rangeObject);
				}

				// add the markup
				domUtils.addMarkup(rangeObject, markup);
			}
			
			// select the modified range
			rangeObject.select();
			
			//this.addCiteToFooter(uid);
			
			this.sidebar.open()
				.activatePanel(nsClass('sidebar-panel'), markup);
			
			return false;
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
				var to = hex2rgb('#fdff9a');
				
				from.push(1);
				to.push(0);
				
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
		
	});
	
}

);

