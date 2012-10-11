/* link-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
/* Aloha Link Plugin
 * -----------------
 * This plugin provides an interface to allow the user to insert, edit and
 * remove links within an active editable.
 * It presents its user interface in the Toolbar, in a Sidebar panel.
 * Clicking on any links inside the editable activates the this plugin's
 * floating menu scope.
 */
define( [
	'aloha',
	'aloha/plugin',
	'jquery',
	'ui/port-helper-attribute-field',
	'ui/ui',
	'ui/scopes',
	'ui/surface',
	'ui/button',
	'ui/toggleButton',
	'../../bubble/lib/bubble-plugin',
	'i18n!link/nls/i18n',
	'i18n!aloha/nls/i18n',
	'aloha/console',
	'link/../extra/linklist'
], function (
	Aloha,
	Plugin,
	jQuery,
	AttributeField,
	Ui,
	Scopes,
	Surface,
	Button,
	ToggleButton,
	Bubbler,
	i18n,
	i18nCore,
	console
) {
	'use strict';
	
	var GENTICS = window.GENTICS,
	    pluginNamespace = 'aloha-link',
	    oldValue = '',
	    newValue;
	
	return Plugin.create( 'link', {

		/**
		 * Initialize the plugin
		 */
		init: function () {
			this.subscribeEvents();
			
		},

		
		/**
		 * Subscribe for events
		 */
		subscribeEvents: function () {
			var that = this,
			    isEnabled = {};

			Aloha.bind('aloha-editable-created', function(event, editable) {
				new Bubbler(that._createDisplayer.bind(that), jQuery(editable.obj), 'a');
			});

			// add the event handler for creation of editables
/*
			Aloha.bind('aloha-editable-created', function (event, editable) {
				var config = that.getEditableConfig(editable.obj),
				    enabled = (jQuery.inArray('a', config) !== -1);

				editable.obj.find('a').each(function() {
					that.addLinkEventHandlers(this);
				});
			});
*/
			var insideLinkScope = false;

			Aloha.bind('aloha-selection-changed', function(event, rangeObject){
				var enteredLinkScope = false;
				if (Aloha.activeEditable) {
					enteredLinkScope = selectionChangeHandler(that, rangeObject);
					// Only foreground the tab containing the href field
					// the first time the user enters the link scope to
					// avoid intefering with the user's manual tab
					// selection.
					if (insideLinkScope !== enteredLinkScope) {
						var link = rangeObject.getCommonAncestorContainer();
						if (enteredLinkScope) {
							jQuery(link).trigger('open');
						} else {
							jQuery(Aloha.activeEditable.obj).trigger('close');
						}
						
					}
				}
				insideLinkScope = enteredLinkScope;
			});
		},
		
		/**
		 * Add event handlers to the given link object
		 * @param link object
		 */
		addLinkEventHandlers: function ( link ) {
			new Bubbler(this._createDisplayer.bind(this), jQuery(link));
		},

		_createDisplayer: function($el, $bubble) {
			var that = this;
			var href = $el.attr('href');
			var a = jQuery('<a target="_blank" rel="noreferrer"></a>').appendTo($bubble);
			a.attr('href', href);
			a.append(href); // Put the URL in the body
			$bubble.append(' - ');
			var change = jQuery('<a href="javascript:void">Change</a>');
			change.appendTo($bubble).on('mousedown', function() {
				var dialog = that.showModalDialog($el);
				dialog.addClass('aloha');
				dialog.on('dialogclose', function() {
					a.attr('href', $el.attr('href'));
					a.contents().remove();
					a.append($el.attr('href'));
				});
			});
			
		},


		/**
		 * Check whether inside a link tag
		 * @param {GENTICS.Utils.RangeObject} range range where to insert the
		 *			object (at start or end)
		 * @return markup
		 * @hide
		 */
		findLinkMarkup: function ( range ) {
			if ( typeof range == 'undefined' ) {
				range = Aloha.Selection.getRangeObject();
			}
			if ( Aloha.activeEditable ) {
				return range.findMarkup( function () {
					return this.nodeName.toLowerCase() == 'a';
				}, Aloha.activeEditable.obj );
			} else {
				return null;
			}
		},

		/**
		 * Format the current selection or if collapsed the current word as
		 * link. If inside a link tag the link is removed.
		 */
		formatLink: function () {
			if ( Aloha.activeEditable ) {
				if ( this.findLinkMarkup( Aloha.Selection.getRangeObject() ) ) {
					this.removeLink();
				} else {
					this.insertLink();
				}
			}
		},

    /**
     * Pops up a dialog that either creates a new link or changes 
     * an existing one. callback is passed 1 non-null argument
     * If the dialog is cancelled.
     */
    showModalDialog: function ( $a ) {
      var root = Aloha.activeEditable.obj;
      var dialog = jQuery('<div class="link-chooser">');
      var select = jQuery('<select class="link-list" size="5"></select>');
      select.appendTo(dialog);
      
      var appendOption = function(id, contentsToClone) {
        var clone = contentsToClone[0].cloneNode(true);
        var contents = jQuery(clone).contents();
        
        var option = jQuery('<option></option>');
        option.attr('value', '#' + id);
        option.append(contents);
        option.appendTo(select);
      }      

      // Append all the headings and then all the figure/table captions
			var orgElements = root.find('h1,h2,h3,h4,h5,h6');
			var figuresAndTables = root.find('figure,table');
			
			// HACK: Slap id's on the headings if they don't have any
			orgElements.filter(':not([id])').each(function() {
			  jQuery(this).attr('id', GENTICS.Utils.guid());
			});

			orgElements.each(function() {
			  var item = jQuery(this);
			  var id = item.attr('id');
			  appendOption(id, item);
			});
			figuresAndTables.each(function() {
			  var item = jQuery(this);
			  var id = item.attr('id');
			  var caption = item.find('caption,figcaption');
			  appendOption(id, caption);
			});
			
			// Try to select if the link already matches one of the options
			select.val($a.attr('href'));
			
			var cancelled = null;
			var onOk = function() {
				// Validate and save the href if something is selected.
				if(select.val()) {
					$a.attr('href',  select.val());
					jQuery(this).dialog('close');
				}
			};
			
			var onCancel = function() {
				jQuery(this).dialog('close');
			};
			
			var onClose = function() {
			};

      dialog.dialog({
        modal: true,
        buttons: {
					'OK': onOk,
					'Cancel': onCancel
        },
      });
      return dialog;
    },
    
		/**
		 * Insert a new link at the current selection. When the selection is
		 * collapsed, the link will have a default link text, otherwise the
		 * selected text will be the link text.
		 */
		insertLink: function ( extendToWord ) {
			var that = this,
			    range = Aloha.Selection.getRangeObject(),
			    linkText,
			    newLink;
			
			// There are occasions where we do not get a valid range, in such
			// cases we should not try and add a link
			if ( !( range.startContainer && range.endContainer ) ) {
				return;
			}
			
			// do not nest a link inside a link
			var isLink = this.findLinkMarkup( range );
			if (isLink) {
				this.showModalDialog(jQuery(isLink));
				return;
			}
			
			// if selection is collapsed then extend to the word.
			if ( range.isCollapsed() && extendToWord !== false ) {
				GENTICS.Utils.Dom.extendToWord( range );
			}

      if ( range.isCollapsed() ) {
        // insert a link with text here
        linkText = i18n.t( 'newlink.defaulttext' );
        newLink = jQuery( '<a href="' + that.hrefValue + '" class="aloha-new-link">' + linkText + '</a>' );
        GENTICS.Utils.Dom.insertIntoDOM( newLink, range, jQuery( Aloha.activeEditable.obj ) );
        range.startContainer = range.endContainer = newLink.contents().get( 0 );
        range.startOffset = 0;
        range.endOffset = linkText.length;
      } else {
        newLink = jQuery( '<a href="' + that.hrefValue + '" class="aloha-new-link"></a>' );
        GENTICS.Utils.Dom.addMarkup( range, newLink, false );
      }

      newLink = Aloha.activeEditable.obj.find( 'a.aloha-new-link' );
      newLink.each( function ( i ) {
        that.addLinkEventHandlers( this );
        jQuery(this).removeClass( 'aloha-new-link' );
      } );


      var callback = function() {
        range.select();
  
        // focus has to become before prefilling the attribute, otherwise
        // Chrome and Firefox will not focus the element correctly.
        that.hrefField.focus();
              
        // prefill and select the new href
        // We need this guard because sometimes the element has not yet been initialized
        if ( that.hrefField.hasInputElem() ) {
          jQuery( that.hrefField.getInputElem() ).attr( 'value', that.hrefValue ).select();
        }
        
        that.hrefChange();
      }; // callback

			this.showModalDialog(newLink);
		},

		/**
		 * Remove an a tag and clear the current item from the hrefField
		 */
		removeLink: function ( terminateLinkScope ) {
			var	range = Aloha.Selection.getRangeObject(),
			    foundMarkup = this.findLinkMarkup();
			
			// clear the current item from the href field
			this.hrefField.setItem(null);
			if ( foundMarkup ) {
				// remove the link
				GENTICS.Utils.Dom.removeFromDOM( foundMarkup, range, true );

				range.startContainer = range.endContainer;
				range.startOffset = range.endOffset;

				// select the (possibly modified) range
				range.select();
				
				if ( typeof terminateLinkScope == 'undefined' ||
						terminateLinkScope === true ) {
					Scopes.setScope('Aloha.continuoustext');
				}
			}
		},

		/**
		 * Updates the link object depending on the src field
		 */
		hrefChange: function () {
			var that = this;

			// For now hard coded attribute handling with regex.
			// Avoid creating the target attribute, if it's unnecessary, so
			// that XSS scanners (AntiSamy) don't complain.
			if ( this.target != '' ) {
				this.hrefField.setAttribute(
					'target',
					this.target,
					this.targetregex,
					this.hrefField.getValue()
				);
			}
			
			this.hrefField.setAttribute(
				'class',
				this.cssclass,
				this.cssclassregex,
				this.hrefField.getValue()
			);
			
			Aloha.trigger( 'aloha-link-href-change', {
				 obj: that.hrefField.getTargetObject(),
				 href: that.hrefField.getValue(),
				 item: that.hrefField.getItem()
			} );
			
			if ( typeof this.onHrefChange == 'function' ) {
				this.onHrefChange.call(
					this,
					this.hrefField.getTargetObject(),
					this.hrefField.getValue(),
					this.hrefField.getItem()
				);
			}
		},
		
		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all links and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function ( obj ) {
			// find all link tags
			obj.find( 'a' ).each( function () {
				jQuery( this )
					.removeClass( 'aloha-link-pointer' )
					.removeClass( 'aloha-link-text' );
			} );
		}
	} );

	function selectionChangeHandler(that, rangeObject) {
		var foundMarkup,
		    enteredLinkScope = false;

		// Check if we need to ignore this selection changed event for
		// now and check whether the selection was placed within a
		// editable area.
		if (   !that.ignoreNextSelectionChangedEvent
			&& Aloha.Selection.isSelectionEditable()
			&& Aloha.activeEditable != null ) {
			
			foundMarkup = that.findLinkMarkup(rangeObject);
			
			if (foundMarkup) {
				Aloha.trigger('aloha-link-selected');
				enteredLinkScope = true;
			} else {
				Aloha.trigger('aloha-link-unselected');
			}
		} else {
			that.toggleLinkScope(false);
		}
		
		that.ignoreNextSelectionChangedEvent = false;
		return enteredLinkScope;
	}
} );
