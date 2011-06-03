/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */

(function(window, undefined) {
	"use strict";

	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;
	
	Aloha.Link = new (Aloha.Plugin.extend({
		_constructor: function(){
			this._super('link');
		},
		/**
		 * Configure the available languages
		 */
		languages: ['en', 'de', 'fr', 'ru', 'pl'],
		/**
		 * Default configuration allows links everywhere
		 */
		config: ['a'],
		/**
		 * all links that match the targetregex will get set the target
		 * e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
		 */
		targetregex: '',
		/**
		  * this target is set when either targetregex matches or not set
		  * e.g. _blank opens all links in new window
		  */
		target: '',
		/**
		 * all links that match the cssclassregex will get set the css class
		 * e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
		 */
		cssclassregex: '',
		/**
		  * this target is set when either cssclassregex matches or not set
		  */
		cssclass: '',
		/**
		 * the defined object types to be used for this instance
		 */
		objectTypeFilter: [],
		/**
		 * handle change on href change
		 * called function( obj, href, item );
		 */
		onHrefChange: null,
	
		/**
		 * Initialize the plugin
		 */
		init: function () {
			if ( typeof Aloha.Link.settings.targetregex !== 'undefined')
				Aloha.Link.targetregex = Aloha.Link.settings.targetregex;
			if ( typeof Aloha.Link.settings.target !== 'undefined')
				Aloha.Link.target = Aloha.Link.settings.target;
			if ( typeof Aloha.Link.settings.cssclassregex !== 'undefined')
				Aloha.Link.cssclassregex = Aloha.Link.settings.cssclassregex;
			if ( typeof Aloha.Link.settings.cssclass !== 'undefined')
				Aloha.Link.cssclass = Aloha.Link.settings.cssclass;
			if ( typeof Aloha.Link.settings.objectTypeFilter !== 'undefined')
				Aloha.Link.objectTypeFilter = Aloha.Link.settings.objectTypeFilter;
			if ( typeof Aloha.Link.settings.onHrefChange !== 'undefined')
				Aloha.Link.onHrefChange = Aloha.Link.settings.onHrefChange;
	
			this.createButtons();
			this.subscribeEvents();
			this.bindInteractions();
	
		},
		/**
		 * Subscribe for events
		 */
		subscribeEvents: function () {
	
			var that = this;
	
			// add the event handler for selection change
			Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
				var config, foundMarkup;

				if (Aloha.activeEditable) {
					// show/hide the button according to the configuration
					config = that.getEditableConfig(Aloha.activeEditable.obj);
					if ( jQuery.inArray('a', config) != -1) {
						that.formatLinkButton.show();
						that.insertLinkButton.show();
					} else {
						that.formatLinkButton.hide();
						that.insertLinkButton.hide();
						// leave if a is not allowed
						return;
					}
	
					foundMarkup = that.findLinkMarkup( rangeObject );
					if ( foundMarkup ) {
						// link found
						that.insertLinkButton.hide();
						that.formatLinkButton.setPressed(true);
						Aloha.FloatingMenu.setScope(that.getUID('link'));
						that.hrefField.setTargetObject(foundMarkup, 'href');
					} else {
						// no link found
						that.formatLinkButton.setPressed(false);
						that.hrefField.setTargetObject(null);
					}
	
					// TODO this should not be necessary here!
					Aloha.FloatingMenu.doLayout();
				}
	
			});
	
		},
		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
			var that = this;
	
			// format Link Button
			// this button behaves like a formatting button like (bold, italics, etc)
			this.formatLinkButton = new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-a',
				'size' : 'small',
				'onclick' : function () { that.formatLink(); },
				'tooltip' : this.i18n('button.addlink.tooltip'),
				'toggle' : true
			});
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.formatLinkButton,
				Aloha.i18n(Aloha, 'floatingmenu.tab.format'),
				1
			);
	
			// insert Link
			// always inserts a new link
			this.insertLinkButton = new Aloha.ui.Button({
				'iconClass' : 'aloha-button aloha-button-a',
				'size' : 'small',
				'onclick' : function () { that.insertLink( false ); },
				'tooltip' : this.i18n('button.addlink.tooltip'),
				'toggle' : false
			});
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.insertLinkButton,
				Aloha.i18n(Aloha, 'floatingmenu.tab.insert'),
				1
			);
	
			// add the new scope for links
			Aloha.FloatingMenu.createScope(this.getUID('link'), 'Aloha.empty'); //'Aloha.continuoustext');
			/*
			this.browser = new Aloha.ui.Browser();
			this.browser.setObjectTypeFilter(Aloha.Link.objectTypeFilter);
			this.browser.onSelect = function( item ) {
				// set href Value
				that.hrefField.setItem( item );
				// call hrefChange
				that.hrefChange();
			};
			// Repository is broken, disabling feature for now
			this.repositoryButton = new Aloha.ui.Button({
				'iconClass' : 'aloha-button-big aloha-button-tree',
				'size' : 'large',
				'onclick' : function () {
					that.browser.show();
				},
				'tooltip' : this.i18n('button.addlink.tooltip'),
				'toggle' : false
			});  
	
			// COMMENT IN AND TEST THE BROWSER
			Aloha.FloatingMenu.addButton(
				this.getUID('link'),
				this.repositoryButton,
				this.i18n('floatingmenu.tab.link'),
				1
			); // */
	
			this.hrefField = new Aloha.ui.AttributeField({
				'width':320,
				'valueField': 'url'
			});
			this.hrefField.setTemplate('<span><b>{name}</b><br/>{url}</span>');
			this.hrefField.setObjectTypeFilter(Aloha.Link.objectTypeFilter);
			// add the input field for links
			Aloha.FloatingMenu.addButton(
				this.getUID('link'),
				this.hrefField,
				this.i18n('floatingmenu.tab.link'),
				1
			);
	
			this.removeLinkButton = new Aloha.ui.Button({
				// TODO use another icon here
				'iconClass' : 'aloha-button aloha-button-a-remove',
				'size' : 'small',
				'onclick' : function () { that.removeLink(); },
				'tooltip' : this.i18n('button.removelink.tooltip')
			});
			// add a button for removing the currently set link
			Aloha.FloatingMenu.addButton(
				this.getUID('link'),
				this.removeLinkButton,
				this.i18n('floatingmenu.tab.link'),
				1
			);
	
		},
		/**
		 * Parse a all editables for links and bind an onclick event
		 * Add the link short cut to all edtiables
		 */
		bindInteractions: function () {
			var that = this;
	
			// update link object when src changes
			this.hrefField.addListener('keyup', function(obj, event) {
				// TODO this event is never fired. Why?
				// if the user presses ESC we do a rough check if he has entered a link or searched for something
				if (event.keyCode == 27) {
					var curval = that.hrefField.getQueryValue();
					if (
						curval[0] === '/' || // local link
						curval.match(/^.*\.([a-z]){2,4}$/i) || // local file with extension
						curval[0] === '#' || // inner document link
						curval.match(/^htt.*/i)  // external link
					) {
						// could be a link better leave it as it is
					} else {
						// the user searched for something and aborted restore original value
	//					that.hrefField.setValue(that.hrefField.getValue());
					}
				}
				that.hrefChange();
			});
	
			// on blur check if href is empty. If so remove the a tag
			this.hrefField.addListener('blur', function(obj, event) {
				if ( !this.getValue() ) {
					that.removeLink();
				}
			});
	
			// add to all editables the Link shortcut
			$.each(Aloha.editables, function(key, editable){
	
				// CTRL+L
				editable.obj.keydown(function (e) {
					if ( e.metaKey && e.which == 76 ) {
						if ( that.findLinkMarkup() ) {
							Aloha.FloatingMenu.userActivatedTab = that.i18n('floatingmenu.tab.link');
	
							// TODO this should not be necessary here!
							Aloha.FloatingMenu.doLayout();
	
							that.hrefField.focus();
	
						} else {
							that.insertLink();
						}
						// prevent from further handling
						// on a MAC Safari cursor would jump to location bar. Use ESC then META+L
						return false;
					}
				});
	
				editable.obj.find('a').each(function( i ) {
	
					// show pointer on mouse over
					jQuery(this).mouseenter( function(e) {
						Aloha.Log.debug(Aloha.Link, 'mouse over link.');
						that.mouseOverLink = this;
						that.updateMousePointer();
					});
	
					// in any case on leave show text cursor
					jQuery(this).mouseleave( function(e) {
						Aloha.Log.debug(Aloha.Link, 'mouse left link.');
						that.mouseOverLink = null;
						that.updateMousePointer();
					});
	
	
					// follow link on ctrl or meta + click
					jQuery(this).click( function(e) {
						if (e.metaKey) {
	
							// blur current editable. user is wating for the link to load
							Aloha.activeEditable.blur();
	
							// hack to guarantee a browser history entry
							setTimeout( function() {
								  location.href = e.target;
							},0);
	
							// stop propagation
							e.stopPropagation();
							return false;
						}
					});
	
				});
			});
	
			jQuery(document)
				.keydown(function (e) {
					Aloha.Log.debug(Aloha.Link, 'Meta key down.');
					that.metaKey = e.metaKey;
					that.updateMousePointer();
				}).keyup(function (e) {
					Aloha.Log.debug(Aloha.Link, 'Meta key up.');
					that.metaKey = e.metaKey;
					that.updateMousePointer();
				});
	
		},
		/**
		 * Updates the mouse pointer
		 */
		updateMousePointer: function () {
	
			if ( this.metaKey && this.mouseOverLink ) {
				Aloha.Log.debug(Aloha.Link, 'set pointer');
				jQuery(this.mouseOverLink).removeClass('aloha-link-text');
				jQuery(this.mouseOverLink).addClass('aloha-link-pointer');
			} else {
				jQuery(this.mouseOverLink).removeClass('aloha-link-pointer');
				jQuery(this.mouseOverLink).addClass('aloha-link-text');
			}
		},
		/**
		 * Check whether inside a link tag
		 * @param {GENTICS.Utils.RangeObject} range range where to insert the object (at start or end)
		 * @return markup
		 * @hide
		 */
		findLinkMarkup: function ( range ) {
	
			if ( typeof range == 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}
			if ( Aloha.activeEditable ) {
				return range.findMarkup(function() {
					return this.nodeName.toLowerCase() == 'a';
				}, Aloha.activeEditable.obj);
			} else {
				return null;
			}
		},
		/**
		 * Format the current selection or if collapsed the current word as link.
		 * If inside a link tag the link is removed.
		 */
		formatLink: function () {
	
			var range = Aloha.Selection.getRangeObject();
	
			if (Aloha.activeEditable) {
				if ( this.findLinkMarkup( range ) ) {
					this.removeLink();
				} else {
					this.insertLink();
				}
			}
		},
		/**
		 * Insert a new link at the current selection. When the selection is collapsed,
		 * the link will have a default link text, otherwise the selected text will be
		 * the link text.
		 */
		insertLink: function ( extendToWord ) {
			var range, linkText, newLink;

			// do not insert a link in a link
			if ( this.findLinkMarkup( range ) ) {
				return;
			}
	
			// activate floating menu tab
			Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.link');
	
			// current selection or cursor position
			range = Aloha.Selection.getRangeObject();
	
			// if selection is collapsed then extend to the word.
			if (range.isCollapsed() && extendToWord !== false) {
				GENTICS.Utils.Dom.extendToWord(range);
			}
			if ( range.isCollapsed() ) {
				// insert a link with text here
				linkText = this.i18n('newlink.defaulttext');
				newLink = jQuery('<a href="">' + linkText + '</a>');
				GENTICS.Utils.Dom.insertIntoDOM(newLink, range, jQuery(Aloha.activeEditable.obj));
				range.startContainer = range.endContainer = newLink.contents().get(0);
				range.startOffset = 0;
				range.endOffset = linkText.length;
			} else {
				newLink = jQuery('<a href=""></a>');
				GENTICS.Utils.Dom.addMarkup(range, newLink, false);
			}
			range.select();
			this.hrefField.focus();
			this.hrefChange();
		},
		/**
		 * Remove an a tag.
		 */
		removeLink: function () {
	
			var	range = Aloha.Selection.getRangeObject(),
				foundMarkup = this.findLinkMarkup();
			if ( foundMarkup ) {
				// remove the link
				GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
				// set focus back to editable
				Aloha.activeEditable.obj[0].focus();
				// select the (possibly modified) range
				range.select();
			}
		},
		/**
		 * Updates the link object depending on the src field
		 */
		hrefChange: function () {
			// For now hard coded attribute handling with regex.
			// Avoid creating the target attribute, if it's unnecessary, so
			// that XSS scanners (AntiSamy) don't complain.
			if (this.target !== '') {
				this.hrefField.setAttribute('target', this.target, this.targetregex, this.hrefField.getQueryValue());
			}
			this.hrefField.setAttribute('class', this.cssclass, this.cssclassregex, this.hrefField.getQueryValue());
			if ( typeof this.onHrefChange === 'function' ) {
				this.onHrefChange.call(this, this.hrefField.getTargetObject(),  this.hrefField.getQueryValue(), this.hrefField.getItem() );
			}
		},
		
		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all links and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function (obj) {
			// find all link tags
			obj.find('a').each(function() {
				jQuery(this).removeClass('aloha-link-pointer');
				jQuery(this).removeClass('aloha-link-text');
			});
		}
	}))();
})(window);