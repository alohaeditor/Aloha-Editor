/* headerids-plugin.js is part of Aloha Editor project http://aloha-editor.org
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
	'i18n!headerids/nls/i18n'
], function (
	Aloha,
	jQuery,
	Plugin,
	i18n
) {
	'use strict';

	var $ = jQuery;

	// namespace prefix for this plugin
    var ns = 'aloha-headerids';
    
    
    // ------------------------------------------------------------------------
    // Local (helper) functions
    // ------------------------------------------------------------------------
    
    // Creates a selector string with this component's namepsace prefixed the each classname
    function nsSel () {
        var strBldr = [], prx = ns;
        $.each(arguments, function () { strBldr.push('.' + (this == '' ? prx : prx + '-' + this)); });
        return jQuery.trim(strBldr.join(' '));
    };
    
    // Creates string with this component's namepsace prefixed the each classname
    function nsClass () {
        var strBldr = [], prx = ns;
        $.each(arguments, function () { strBldr.push(this == '' ? prx : prx + '-' + this); });
        return jQuery.trim(strBldr.join(' '));
    };

	/**
	 * Returns a jQuery collection of all heading elements in the given editable
	 * which are safe to have their ids automatically set.
	 *
	 * Do not include heading elements which are annotated with the class
	 * "aloha-customized" because these have had their ids manually set.
	 *
	 * Do not include heading elements which are Aloha editables or blocks because
	 * implementations often use the ids of these elements to track them in the
	 * DOM.
	 *
	 * @param {jQuery.<HTMLElement>} $editable
	 * @return {jQuery.<HTMLHeadingElement>} A jQuery container with a
	 *                                       collection of zero or more heading
	 *                                       elements.
	 */
	function getHeadingElements($element) {
		return (
			$element.find('h1,h2,h3,h4,h5,h6')
			        .not('.aloha-customized,.aloha-editable,.aloha-block')
		);
	}

	return Plugin.create('headerids', {
		_constructor: function(){
			this._super('headerids');
		},
		
		config: ['true'],
				
		/**
		 * Initialize the plugin
		 */
		init: function () {
			var that = this;

			// mark active Editable with a css class
			Aloha.bind("aloha-editable-activated", function(jEvent, params) {
				that.check(params.editable.obj);
			});
			Aloha.bind("aloha-editable-deactivated", function(jEvent, params) {
				that.check(params.editable.obj);
			});
			Aloha.bind('aloha-plugins-loaded', function (ev) {
				that.initSidebar(Aloha.Sidebar.right);
			});
		},

		/**
		 * Automatically sets the id attribute of heading elements in the given
		 * editable element wherever it is safe to do so.
		 *
		 * @TODO: This function should be removed from being a plugin method and
		 *        made a local closure function.
		 *
		 * @TODO: Rename to setHeadingIds()
		 *
		 * @param {jQuery.<HTMLElement>} $editable
		 */
		check: function($editable) {
			var plugin = this;
			if($.inArray('true', plugin.getEditableConfig($editable)) > -1) {
				getHeadingElements($editable).each(function (i, heading) {
					plugin.processH(heading);
				});
			}
		},

		/**
		 * Automatically sets the id of the given heading element to a sanitized
		 * version of the element's content text string.
		 *
		 * @TODO: Rename to setHeadingId()
		 *
		 * @TODO: Make this function a local closure function rather than a
		 *        plugin method.
		 *
		 * @param {HTMLHeadingElement} heading One of the six HTML heading
		 *                                     elements.
		 */
		processH: function (heading) {
			var $heading = $(heading);
			$heading.attr('id', this.sanitize($heading.text()));
		},

		/**
		 * Tranforms the given string into a ideal HTMLElement id attribute
		 * string by replacing non-alphanumeric characters with an underscore.
		 *
		 * @TODO: This method should be removed from being a plugin method and
		 *        made into a local closure function.
		 *
		 * @TODO: The regular expression should be defined once (as a constant)
		 *        outside of the scope of this function.
		 *
		 * @param {String} str
		 * @return {String} Santized copy of `str`.
		 */
		sanitize: function (str) {
			return str.replace(/[^a-z0-9]+/gi, '_');
		},

		//ns = headerids
		initSidebar: function(sidebar) {
			var pl = this;
			pl.sidebar = sidebar;
			sidebar.addPanel({
                    
                    id         : nsClass('sidebar-panel'),
                    title     : i18n.t('internal_hyperlink'),
                    content     : '',
                    expanded : true,
                    activeOn : 'h1, h2, h3, h4, h5, h6',
                    
                    onInit     : function () {
                        var that = this,
                            content = this.setContent('<label class="'+nsClass('label')+'" for="'+nsClass('input')+'">'+i18n.t('headerids.label.target')+'</label><input id="'+nsClass('input')+'" class="'+nsClass('input')+'" type="text" name="value"/> <button class="'+nsClass('reset-button')+'">'+i18n.t('headerids.button.reset')+'</button><button class="'+nsClass('set-button')+'">'+i18n.t('headerids.button.set')+'</button>').content;
                        
                        content.find(nsSel('set-button')).click(function () {
                            var content = that.content;
							jQuery(that.effective).attr('id',jQuery(nsSel('input')).val());
							jQuery(that.effective).addClass('aloha-customized');
                        });
						
						content.find(nsSel('reset-button')).click(function () {
                            var content = that.content;
                            pl.processH(that.effective);
							jQuery(that.effective).removeClass('aloha-customized');
							that.content.find(nsSel('input')).val(that.effective.attr('id'));
                        });
                    },
                    
                    onActivate: function (effective) {
						var that = this;
						that.effective = effective;
						that.content.find(nsSel('input')).val(effective.attr('id'));
                    }
                    
                });
			sidebar.show();
		},
		
		/**
		 * Make the given jQuery object (representing an editable) clean for saving
		 * If the headerids plugin is active it checks the current editable and 
		 * generates ids for headers.
		 * 
		 * @param {jQuery} obj jQuery object to make clean
		 */
		makeClean: function (obj) {
			this.check(obj);
		}
		
	});
});
