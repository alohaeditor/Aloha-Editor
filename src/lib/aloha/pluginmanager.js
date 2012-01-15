/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright © 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

define(
[ 'aloha/jquery', 'util/class' ],
function( jQuery, Class ) {
	"use strict";
	
	/**
	 * The Plugin Manager controls the lifecycle of all Aloha Plugins.
	 *
	 * @namespace Aloha
	 * @class PluginManager
	 * @singleton
	 */
	return new (Class.extend({
		plugins: {},

		/**
		 * Initialize all registered plugins
		 * @return void
		 * @hide
		 */
		init: function(next, userPlugins) {

			var
				me = this,
				globalSettings = ( Aloha && Aloha.settings ) ? Aloha.settings.plugins||{}: {},
				i,
				plugin,
				pluginName;

			// Global to local settings
			for ( pluginName in globalSettings ) {
				
				if ( globalSettings.hasOwnProperty( pluginName ) ) {
					
					plugin = this.plugins[pluginName] || false;
					
					if ( plugin ) {
						plugin.settings = globalSettings[ pluginName ] || {};
					}
				}
			}

			// Default: All loaded plugins are enabled
			if ( !userPlugins.length ) {
				
				for ( pluginName in this.plugins ) {
					
					if ( this.plugins.hasOwnProperty( pluginName ) ) {
						userPlugins.push( pluginName );
					}
				}
			}
			
			// Enable Plugins specified by User
			for ( i=0; i < userPlugins.length; ++i ) {
				
				pluginName = userPlugins[ i ];
				plugin = this.plugins[ pluginName ]||false;
				
				if ( plugin ) {
					
					plugin.settings = plugin.settings || {};
					
					if ( typeof plugin.settings.enabled === 'undefined' ) {
						plugin.settings.enabled = true;
					}
					
					if ( plugin.settings.enabled ) {
						if ( plugin.checkDependencies() ) {
							plugin.init();
						}
					}
				}
			}
			
			next();
		},

		/**
		 * Register a plugin
		 * @param {Plugin} plugin plugin to register
		 */
		register: function( plugin ) {
			
			if ( !plugin.name ) {
				throw new Error( 'Plugin does not have an name.' );
			}
			
			if ( this.plugins[ plugin.name ]) {
				throw new Error( 'Already registered the plugin "' + plugin.name  + '"!' );
			}
			
			this.plugins[ plugin.name ] = plugin;
		},

		/**
		 * Expose a nice name for the Plugin Manager
		 * @hide
		 */
		toString: function() {
			return 'pluginmanager';
		}
	}))();
});
