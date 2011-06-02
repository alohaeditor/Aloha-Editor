/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * GENTICS.Aloha.Ribbon plugin adds a ribbon to the page, depending on Aloha
 */

GENTICS.Aloha.Ribbon = new GENTICS.Aloha.Plugin('ribbon');

/**
 * Aloha Ribbon
 * Setting GENTICS.Aloha.settings.ribbon to bool false before Aloha is loaded will hide the ribbon.
 * Documentation is at : http://aloha-editor.com/wiki/index.php/Plugins/Ribbon
 * @namespace GENTICS.Aloha
 * @class Ribbon
 * @singleton
 */

/**
 * Initilization of the Ribbon
 * @hide
 */
GENTICS.Aloha.Ribbon.init = function() {
	// Check if the ribbon is enabled
	if (typeof GENTICS.Aloha.Ribbon.settings.enable == 'undefined' || GENTICS.Aloha.Ribbon.settings.enable === true) {
		// flag to mark whether ribbon is visible
		GENTICS.Aloha.Ribbon.visible = false;

		// the ribbon
		GENTICS.Aloha.Ribbon.toolbar = new Ext.Toolbar({
			height: '25px',
			cls: 'ext-root',
			id: 'GENTICS_ribbon'
		});

		// left spacer to gain some space from the left screen border
		GENTICS.Aloha.Ribbon.toolbar.add(new Ext.Toolbar.Spacer({width: '5'}));
		// icon
		GENTICS.Aloha.Ribbon.icon = new Ext.Toolbar.Spacer();
		GENTICS.Aloha.Ribbon.toolbar.add(GENTICS.Aloha.Ribbon.icon);
		// fill so GENTICS.Aloha.Ribbon everything after it is aligned right
		GENTICS.Aloha.Ribbon.toolbar.add(new Ext.Toolbar.Fill());
		// seperator before the fade out button
		GENTICS.Aloha.Ribbon.toolbar.add(new Ext.Toolbar.Separator());
		// fade out button
		var fadeButton = new Ext.Button({
			iconCls : 'GENTICS_fade_out',
			handler : function (button) {
				var toolbar = jQuery(GENTICS.Aloha.Ribbon.toolbar.getEl().dom);

				if (button.iconCls == 'GENTICS_fade_out') {
					toolbar.animate({
						left: '-100%',
						marginLeft: '34px'
					});
					jQuery('body').animate({
						paddingTop: 0
					});
					button.setIconClass('GENTICS_fade_in');
				} else {
					toolbar.animate({
						left: 0,
						marginLeft: 0
					});
					jQuery('body').animate({
						paddingTop: '30px'
					});
					button.setIconClass('GENTICS_fade_out');
				}
				GENTICS.Aloha.Ribbon.toolbar.doLayout();
			}
		});
		GENTICS.Aloha.Ribbon.toolbar.add(fadeButton);
		// spacer to gain some space from the right screen border
		GENTICS.Aloha.Ribbon.toolbar.add(new Ext.Toolbar.Spacer({width: '5'}));

		GENTICS.Aloha.Ribbon.toolbar.render(document.body, 0);

		jQuery('body').css('paddingTop', '30px');
		GENTICS.Aloha.Ribbon.show();
	}
};

/**
 * Sets the icon class for the ribbon icon
 * @param {String} iconClass CSS class for the icon
 */
GENTICS.Aloha.Ribbon.setIcon = function (iconClass) {
	if (typeof GENTICS.Aloha.Ribbon.icon.cls !== 'undefined') {
		GENTICS.Aloha.Ribbon.icon.removeClass(GENTICS.Aloha.Ribbon.icon.cls);
	}

	GENTICS.Aloha.Ribbon.icon.addClass(iconClass);
};

/**
 * Adds a GENTICS.Aloha.ui.Button the Ribbon
 * @param {Button} button Button to be added to the Ribbon
 */
GENTICS.Aloha.Ribbon.addButton = function (button) {

	if (typeof button.menu === 'object') {
		// build the drop down menu
		var menu = new Ext.menu.Menu();
		jQuery.each(button.menu, function(index, entry) {
			menu.addItem(new Ext.menu.Item({
				text: entry.label,
				icon: entry.icon,
				iconCls: entry.iconClass,
				handler: function() {
					entry.onclick.apply(entry);
				}
			}));
		});
	}

	// configuration for the button
	var buttonConfig = {
		text : button.label,
		enableToggle: button.toggle,
		icon: button.icon,
		pressed : button.pressed,
		iconCls: button.iconClass,
		menu : menu,
		handler : function() {
			if (typeof button.onclick === 'function') {
				button.onclick.apply(button);
			}
			button.pressed = !button.pressed;
		}
	}

	var extButton;

	// Build a split button if we have a menu and a handler
	if (menu && typeof button.onclick == 'function') {
		// build the split button for the menu
		extButton = new Ext.SplitButton(buttonConfig);
	} else {
		// build a normal button
		extButton = new Ext.Button(buttonConfig);
	}

	GENTICS.Aloha.Ribbon.toolbar.insert(GENTICS.Aloha.Ribbon.toolbar.items.getCount() - 3, extButton);
};

/**
 * Adds a seperator to the Ribbon.
 */
GENTICS.Aloha.Ribbon.addSeparator = function() {
	GENTICS.Aloha.Ribbon.toolbar.insert(GENTICS.Aloha.Ribbon.toolbar.items.getCount() - 3, new Ext.Toolbar.Separator());
};

/**
 * Shows the ribbGENTICS.Aloha.Ribbonon
 */
GENTICS.Aloha.Ribbon.hide = function () {
	jQuery('#GENTICS_ribbon').fadeOut();
	GENTICS.Aloha.Ribbon.visible = false;
};

/**
 * Hides the ribbon
 */
GENTICS.Aloha.Ribbon.show = function () {
	jQuery('#GENTICS_ribbon').fadeIn();
	GENTICS.Aloha.Ribbon.visible = true;
};

/**
 * Check whether the ribbon is visible right now
 * @return true when the ribbon is visible, false when not
 */
GENTICS.Aloha.Ribbon.isVisible = function () {
	return GENTICS.Aloha.Ribbon.visible;
};

