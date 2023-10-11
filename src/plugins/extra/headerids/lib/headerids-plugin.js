/* headerids-plugin.js is part of the Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * License http://aloha-editor.org/license.php 
 */
define([
	'aloha',
	'jquery',
	'PubSub',
	'aloha/plugin',
	'util/html',
	'i18n!headerids/nls/i18n'
], function (
	Aloha,
	jQuery,
	PubSub,
	Plugin,
	html,
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
    }
    
    // Creates string with this component's namepsace prefixed the each classname
    function nsClass () {
        var strBldr = [], prx = ns;
        $.each(arguments, function () { strBldr.push(this == '' ? prx : prx + '-' + this); });
        return jQuery.trim(strBldr.join(' '));
    }

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
	function getHeadingElements($editable) {
		return (
			$editable.find('h1,h2,h3,h4,h5,h6')
			        .not('.aloha-customized,.aloha-editable,.aloha-block')
		);
	}
	
	/**
	 * Check in the entire document if has a element with the same ID, and try 
	 * to get an unique ID
	 * 
	 * @param {String} proposedID ID to check, uses this as base and concatenate
	 *                 a dangling with a number
	 * 
	 * @return {String}
	 */
	function checkDuplicatedID(proposedID){
		var baseID = proposedID, i = 1;
		
		while($('#' + proposedID).length > 0){
			proposedID = baseID + '_' + ( ++i ).toString();
		}
		
		return proposedID;
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
			var plugin = this;
			function setHeadingIds(message) {
				plugin.check(message.editable.obj);
			}
			PubSub.sub('aloha.editable.created', setHeadingIds);
			PubSub.sub('aloha.editable.activated', setHeadingIds);
			PubSub.sub('aloha.editable.deactivated', setHeadingIds);
			Aloha.bind('aloha-plugins-loaded', function () {
				plugin.initSidebar(Aloha.Sidebar.right);
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
		 * version of the element's content text string, only if the heading has
		 * not a ID already set.
		 *
		 * @TODO: Rename to setHeadingId()
		 *
		 * @TODO: Make this function a local closure function rather than a
		 *        plugin method.
		 *
		 * @param {HTMLHeadingElement} heading One of the six HTML heading
		 *                                     elements.
		 * @returns {String} ID attribute of the Heading element
		 */
		processH: function (heading) {
			var headingId = heading.id;
			if (!headingId) {
				// We prefix the Id with "heading_" to not run accross
				// problems with the Id starting with a number which
				// would be disallowedÜ in HTML.
				var $heading = $(heading);
				headingId = "heading_" + this.sanitize($heading.text());

				headingId = checkDuplicatedID(headingId);

				$heading.attr('id', headingId);
			}
			return headingId;
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
		sanitize: function(str) {
			var sanitizeCharacters = Aloha.settings.sanitizeCharacters || {};
			var strSanitized = str;
			
			for (var key in sanitizeCharacters) {
				if (sanitizeCharacters.hasOwnProperty(key)) {
					strSanitized = strSanitized.replace(key, sanitizeCharacters[key]);
				}
			}
			
			return html.trimWhitespaceCharacters(strSanitized)
			           .replace(/[^a-z0-9]/gi, '_');
		},

		//ns = headerids
		initSidebar: function(sidebar) {
			var thisPlugin = this;
			thisPlugin.sidebar = sidebar;
			sidebar.addPanel({
				id: nsClass('sidebar-panel'),
				title: i18n.t('internal_hyperlink'),
				content: '',
				expanded: true,
				activeOn: 'h1, h2, h3, h4, h5, h6',

				onInit: function () {
					var thisSidebarPanel = this,
					    content = this.setContent('<label class="' + nsClass('label') + '" for="' + nsClass('input') + '">' + i18n.t('headerids.label.target') + '</label><input id="' + nsClass('input') + '" class="' + nsClass('input') + '" type="text" name="value"/> <button class="' + nsClass('reset-button') + '">' + i18n.t('headerids.button.reset') + '</button><button class="' + nsClass('set-button') + '">' + i18n.t('headerids.button.set') + '</button>').content;

					content.find(nsSel('set-button')).click(function () {
						var content = thisSidebarPanel.content;
						var $input = jQuery(nsSel('input'));
						var name = thisPlugin.sanitize($input.val());
						
						$input.val(name);
						jQuery(thisSidebarPanel.effective)
							.attr('id', name)
							.addClass('aloha-customized');
					});

					content.find(nsSel('reset-button')).click(function () {
						var content = thisSidebarPanel.content;
						thisPlugin.processH(thisSidebarPanel.effective);
						jQuery(thisSidebarPanel.effective)
							.removeClass('aloha-customized');
						thisSidebarPanel.content.find(nsSel('input')).val(thisSidebarPanel.effective.attr('id'));
					});
				},

				onActivate: function (effective) {
					this.effective = effective;
					this.content.find(nsSel('input')).val(thisPlugin.processH(effective[0]));
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
