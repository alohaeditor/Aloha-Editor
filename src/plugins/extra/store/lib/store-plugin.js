/* store-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
define([
	'aloha',
	'jquery',
	'aloha/plugin',
	'ui/ui',
	'ui/toggleButton',
	'ui/button',
	'ui/scopes',
	'ui/port-helper-attribute-field',
	'i18n!store/nls/i18n',
	'i18n!aloha/nls/i18n',
	'css!store/css/store.css'
], function (
	Aloha,
	jQuery,
	Plugin,
	Ui,
	ToggleButton,
	Button,
	Scopes,
	AttributeField,
	i18n,
	i18nCore
) {
	'use strict';
	var GENTICS = window.GENTICS;

	/**
	 * register the plugin with unique name
	 */
	return Plugin.create( 'store', {
		/**
		 * Configure the available languages
		 */
		languages: [ 'en', 'de' ],

		/**
		 * default button configuration
		 */
		config: ['local'],
		
		// you need to add this config to yours
		/*toolbar: {
			tabs: [
				// Actions Tab
				{
					label: "Actions",
					showOn: { scope: 'Aloha.continuoustext' },
					components: [
						["storeEditable"]
					]
				}
		]},*/

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			this.createButtons();
		    this.subscribeEvents();
		},

		/**
		 * Initialize the buttons
		 */
		createButtons: function () {
		    Scopes.createScope('storeTab', 'Aloha.continuoustext');

			this._storeButton = Ui.adopt("storeEditable", ToggleButton, {
				tooltip: i18n.t("button.store.tooltip"),
				icon: "aloha-icon aloha-icon-store",
				scope: 'storeTab',
				click: function(){
					//window.console.log('save content', Aloha.activeEditable.getContents());
					alert('*** save content *** ' + Aloha.activeEditable.getContents().trim());
				}
			});
		},

		subscribeEvents: function () {
			var me = this;

			Aloha.bind('aloha-editable-activated', function () {
				if (!Aloha.activeEditable || !Aloha.activeEditable.obj) {
					return;
				}
			});
		},

		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * Find all abbrs and remove editing objects
		 * @param obj jQuery object to make clean
		 * @return void
		 */
		makeClean: function ( obj ) {
			// nothing to do...
		},

		/**
		* toString method
		* @return string
		*/
		toString: function () {
			return 'store';
		}

	} );
	
} );
