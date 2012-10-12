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

			Aloha.bind('aloha-editable-activated', function(event, data) {
				new Bubbler(that._createDisplayer.bind(that), jQuery(data.editable.obj), 'a');
			});

			Aloha.bind('aloha-editable-deactivated', function(event, data) {
				// TODO: Deactivate the delegated events
			});

			var insideLinkScope = false;

			Aloha.bind('aloha-selection-changed', function(event, rangeObject){
				var enteredLinkScope = false;
				if (Aloha.activeEditable) {
					enteredLinkScope = selectionChangeHandler(that, rangeObject);
					// Trigger bubble changes when the selection changes
					// from being in a link to being out of a link
					// No need to trigger if moving within a link
					if (insideLinkScope !== enteredLinkScope) {
						var link = rangeObject.getCommonAncestorContainer();
						if (enteredLinkScope) {
							jQuery(link).trigger('open.bubble');
						} else {
							jQuery(Aloha.activeEditable.obj).find('a').trigger('close.bubble');
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
