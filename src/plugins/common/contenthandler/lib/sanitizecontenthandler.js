/* sanitizecontenthandler.js is part of Aloha Editor project http://aloha-editor.org
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
	'aloha/core',
	'jquery',
	'aloha/contenthandlermanager',
	'aloha/plugin',
	'aloha/console',
	'vendor/sanitize'
], function(Aloha, jQuery, ContentHandlerManager, Plugin, console) {
    "use strict";

    var sanitize;

    // predefined set of sanitize options if no dynamic or custom config is used
    if( !Aloha.defaults.sanitize ) {
        Aloha.defaults.sanitize = {}
    }

    // very restricted sanitize config
    Aloha.defaults.sanitize.restricted = {
        elements: [ 'b', 'em', 'i', 'strong', 'u', 'del', 'p', 'span', 'div', 'br' ]
    }

    // sanitize  config allowing a bit more (no tables)
    Aloha.defaults.sanitize.basic = {
        elements: [
          'a', 'abbr', 'b', 'blockquote', 'br', 'cite', 'code', 'dd', 'del', 'dl', 'dt', 'em',
          'i', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong', 'sub',
          'sup', 'u', 'ul' ],

        attributes: {
          'a' : ['href'],
          'blockquote' : ['cite'],
          'q' : ['cite'],
          'abbr': ['title']
        },

        //add_attributes: {
          //  'a': {'rel': 'nofollow'}
        //},

        protocols: {
          'a' : {'href': ['ftp', 'http', 'https', 'mailto', '__relative__']},
          'blockquote' : {'cite': ['http', 'https', '__relative__']},
          'q' : {'cite': ['http', 'https', '__relative__']}
        }
    }

    // relaxed sanitize config allows also tables
    Aloha.defaults.sanitize.relaxed = {
        elements: [
          'a', 'abbr', 'b', 'blockquote', 'br', 'caption', 'cite', 'code', 'col',
          'colgroup', 'dd', 'del', 'dl', 'dt', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'i', 'img', 'li', 'ol', 'p', 'pre', 'q', 'small', 'strike', 'strong',
          'sub', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'u',
          'ul', 'span', 'hr', 'object', 'div'
        ],

        attributes: {
          'a': ['href', 'title', 'id', 'class', 'target', 'data-gentics-aloha-repository', 'data-gentics-aloha-object-id'],
          'div': ['id','class','style'],
          'abbr': ['title'],
          'blockquote': ['cite'],
          'br': ['class'],
          'col': ['span', 'width'],
          'colgroup': ['span', 'width'],
          'img': ['align', 'alt', 'height', 'src', 'title', 'width', 'class', 'data-caption', 'data-align', 'data-width', 'data-original-image'],
          'ol': ['start', 'type'],
          'p': ['class', 'style', 'id'],
          'q': ['cite'],
          'table': ['summary', 'width'],
                      // For IE7 it matters the uppercase 'S' in rowSpan, colSpan
          'td': ['abbr', 'axis', 'colSpan', 'rowSpan', 'colspan', 'rowspan', 'width'],
          'th': ['abbr', 'axis', 'colSpan', 'rowSpan', 'colspan', 'rowspan', 'scope', 'width'],
          'ul': ['type'],
          'span': ['class','style','lang','xml:lang','role']
        },

        protocols: {
          'a': {'href': ['ftp', 'http', 'https', 'mailto', '__relative__']},
          'blockquote': {'cite': ['http', 'https', '__relative__']},
          'img': {'src' : ['http', 'https', '__relative__']},
          'q': {'cite': ['http', 'https', '__relative__']}
        }
    }

    var sanitizers = (function() {
        var idOrClassRegExp = /^[\.#]/;
        var defaultKey = '_default_';
        var map = {};
        // Filter to stop cleaning elements with contentEditable "false", added to all configs
        var filters = [function(elem) {
            return elem.contentEditable != "false";
        }];

        var normalizeTagName = function(editableSelector) {
            var isIdOrClass = function(selector) {
                return idOrClassRegExp.test(selector);
            };
            return isIdOrClass(editableSelector) ? editableSelector : editableSelector.toLowerCase();
        };

        var initDefault = function() {
            var config = Aloha.defaults.sanitize.relaxed;

            if (Aloha.settings.contentHandler) {
                if (Aloha.settings.contentHandler.allows) {
                    config = Aloha.settings.contentHandler.allows;
                } else if (Aloha.settings.contentHandler.sanitize && Aloha.defaults.sanitize[Aloha.settings.contentHandler.sanitize]) {
                    config = Aloha.defaults.sanitize[Aloha.settings.contentHandler.sanitize];
                }
            }

            config.filters = filters;

            map[defaultKey] = new Sanitize(config, jQuery);
        };

        var initEditableSpecific = function() {
            if (Aloha.settings.contentHandler &&
                Aloha.settings.contentHandler.handler &&
                Aloha.settings.contentHandler.handler.sanitize) {
                var config, editableSelector;
                for (editableSelector in Aloha.settings.contentHandler.handler.sanitize) {
                    if (Aloha.settings.contentHandler.handler.sanitize.hasOwnProperty(editableSelector)) {
                        config = Aloha.settings.contentHandler.handler.sanitize[editableSelector];
                        config.filters = filters;
                        editableSelector = normalizeTagName(editableSelector);
                        editableSelector = /^[\.#]/.test(editableSelector) ? editableSelector : editableSelector.toLowerCase();
                        map[editableSelector] = new Sanitize(config, jQuery);
                    }
                }
            }
        };

        return {
            init: function() {
                if (!jQuery.isEmptyObject(map)) { return; }

                initDefault();
                initEditableSpecific();
            },

            instanceForEditable: function() {
                var editableSelector = defaultKey;
                if (Aloha.activeEditable) {
                    var selector = null;

                    var containerId = '#' + Aloha.activeEditable.getId();
                    if (map[containerId]) {
                        selector = containerId;
                    }

                    if (!selector) {
                        var containerClasses = Aloha.activeEditable.obj.attr('class').split(' ');
                        for (var i=0; i < containerClasses.length; i++) {
                            if (map['.' + containerClasses[i]]) {
                                selector = containerClasses[i];
                                break;
                            }
                        }
                    }

                    if (!selector) {
                        var containerTag = Aloha.activeEditable.obj.prop('tagName').toLowerCase();
                        if (map[containerTag]) {
                            selector = containerTag;
                        }
                    }

                    if (selector) {
                        editableSelector = selector;
                    }
                }

                return map[editableSelector];
            }
        };
    })();

	  var SanitizeContentHandler = ContentHandlerManager.createHandler({
        /**
         * Handle the content from eg. paste action and sanitize the html
         * @param content
         */
        handleContent: function(content, options, editable) {
            if (!editable) {
                return content;
            }

            sanitizers.init();

            if ( typeof content === 'string' ){
                content = jQuery( '<div>' + content + '</div>' ).get(0);
            } else if ( content instanceof jQuery ) {
                content = jQuery( '<div>' ).append(content).get(0);
            }

            return jQuery('<div>').append(sanitizers.instanceForEditable().clean_node(content)).html();
        }
    });

	  return SanitizeContentHandler;
});