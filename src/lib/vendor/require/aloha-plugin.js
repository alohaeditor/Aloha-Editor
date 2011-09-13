/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright � 2010-2011 Gentics Software GmbH, aloha@gentics.com
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

(function () {
	
	define({
	    load: function (name, require, load, config) {
			var tmp = name.split('/'),
				bundleName = tmp[0],
				pluginName = tmp[1],
				bundlePath = '',
				paths = {},
				oldpaths = undefined,
				nonLibPaths = ['nls', 'css', 'vendor', 'res'], i;

			// Background: We do not use CommonJS packages for our Plugins
			// as this breaks the loading order when these modules have
			// other dependencies.
			// We "emulate" the commonjs modules with the path mapping.
			/* require(
			 *  { paths: {
			 *      'format': 'plugins/common/format/lib',
			 *      'format/nls': 'plugins/common/format/nls',
			 *      ... for every nonLibPath ...
			 *    }
			 *  },
			 *  ['format/format-plugin'],
			 *  load <-- when everything is loaded, we continue
			 */

			// make sure, the config exists and has paths
            config = config || {};
            config.paths = config.paths || {};

			if (Aloha.settings.basePath) {
				bundlePath = Aloha.settings.basePath;
			}

			if (Aloha.settings.bundles && Aloha.settings.bundles[bundleName]) {
				bundlePath += Aloha.settings.bundles[bundleName];
			} else {
				bundlePath += '../plugins/' + bundleName;
			}

			config.paths[pluginName] = bundlePath + '/' + pluginName + '/lib';

			// As the "nls" path lies NOT inside /lib/, but is a sibling to /lib/, we need
			// to register it explicitely. The same goes for the "css" folder.
			for ( i = 0; i < nonLibPaths; i++) {
				config.paths[pluginName + '/' + nonLibPaths[i]] = bundlePath + '/' + pluginName + '/' + nonLibPaths[i];
			}

			// now require the plugin
		    require(
		    	[pluginName + '/' + pluginName + '-plugin'],
		    	function (value) {
		    		load(value);
		    	}
		    );
		}
	});	
}());
