/* pluginmanager.js is part of Aloha Editor project http://aloha-editor.org
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
// Do not add dependencies that require depend on aloha/core
define([
    'jquery',
    'aloha/console'
], function (
    $,
    Log
) {
    'use strict';
     /**
	 * The Plugin Content Handler Manager is responsible for registering PluginContentHandler with Aloha.
	 *
	 * @namespace Aloha
	 * @singleton
	 */
    var handlers = {};

    /**
     * Register the content handler for a plugin.
     *
     * @param {Plugin} plugin the plugin
     */
    function registerPluginContentHandler(plugin) {
        if (typeof plugin.getPluginContentHandler !== 'function') {
            return;
        }
        var pluginContentHandler = plugin.getPluginContentHandler();
        if (typeof pluginContentHandler !== 'object') {
            return;
        }
        Object.keys(pluginContentHandler).forEach(function (selector) {
            var i;
            var selectorHandlers = pluginContentHandler[selector];
            handlers[selector] = handlers[selector] || [];
            if (!Array.isArray(selectorHandlers)) {
                selectorHandlers = [selectorHandlers];
            }
            for (i = 0; i < selectorHandlers.length; i++) {
                if (typeof selectorHandlers[i] !== 'function') {
                    Log.warn(plugin, 'Cannot register a handler that is not a function!');
                    return;
                }
                handlers[selector].push(selectorHandlers[i]);
            }
        });
    }

    /**
     * Get all plugin contenthandler for a certain element.
     *
     * @param {jQuery.<HTMLElement>} $elem element
     * @returns {Array.<Function>} an array of plugin contenhandler functions for the current element
     */
    function getHandlerForElement($elem) {
        var result = [];
        Object.keys(handlers).forEach(function (selector) {
            if ($elem.is(selector)) {
                result = result.concat(handlers[selector]);
            }
        });
        return result;
    }

    return Object.freeze({
        registerPluginContentHandler: registerPluginContentHandler,
        /**
         * Get all plugin contenthandlers.
         *
         * @returns {Object.<string, Array.<Function>} all registered plugin contenthandlers
         */
        getPluginContentHandlers: function () {
            return handlers;
        },
        getHandlerForElement: getHandlerForElement
    });
});
