/* styleattributecontenthandler.js is part of Aloha Editor project http://aloha-editor.org
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
    'jquery',
    'aloha',
    'aloha/contenthandlermanager'
], function($, Aloha, ContentHandlerManager) {
    var config = null,
        defaults = {
            supportedStyles: {
                'text-align': true
            }
        };

    Aloha.settings.contentHandler = Aloha.settings.contentHandler || {};
    Aloha.settings.contentHandler.handler = Aloha.settings.contentHandler.handler || {};
    Aloha.settings.contentHandler.handler.styleattribute =  Aloha.settings.contentHandler.handler.styleattribute || {};


    var init = function() {
        if (!config) {
            config = $.extend(true, {}, defaults, Aloha.settings.contentHandler.handler.styleattribute.allowable);
        }
    };

    var cleanStyles = function(cfg, $el) {
        var style, styleItem, styleItemSplit, styleItems, styles, _i, _len;

        style = $el.attr('style');

        if (style) {
            styleItems = '';
            styles = style.split(';');

            for (_i = 0, _len = styles.length; _i < _len; _i++) {
                styleItem = styles[_i];
                styleItem = styleItem.trim();
                styleItemSplit = styleItem.split(':');

                if (styleItemSplit.length !== 2) continue;

                if (cfg.supportedStyles[styleItemSplit[0].trim()]) {
                    styleItems += "" + styleItem + ";";
                }
            }

            $el.removeAttr('style');
            if (styleItems) {
                $el.attr('style', "" + styleItems);
            }
        }
    };

    var cleanStyleAttribute = function($content) {
        $content.children().each(function() {
            var $child = $(this);
            cleanStyleAttribute($child);
            cleanStyles(config, $child);
        });
    };

    var StyleAttributeContentHandler = ContentHandlerManager.createHandler({
        handleContent: function(content)  {
            init();

            $content = $('<div/>').append(content);
            cleanStyleAttribute($content);
            return $content.html();
        }
    });

    return StyleAttributeContentHandler;
});