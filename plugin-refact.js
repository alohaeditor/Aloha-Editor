/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * GENTICS.Aloha.Ribbon plugin adds a ribbon to the page, depending on Aloha
 */

GENTICS.Aloha.Ribbon = new GENTICS.Aloha.Plugin('com.GENTICS.Aloha.Ribbon');

/**
 * Aloha Ribbon
 * Setting GENTICS.Aloha.settings.ribbon to bool false before Aloha is loaded will hide the ribbon.
 * @namespace GENTICS.Aloha
 * @class Ribbon
 * @singleton
 */

/**
 * Initilization of the Ribbon
 * @hide
 */
GENTICS.Aloha.Ribbon.prototype = {
	init: function() {
		// Check if the ribbon is enabled
		if (GENTICS.Aloha.settings.ribbon === true) {
			var that = this;
			
			// flag to mark whether ribbon is visible
			this.visible = false;

			// the ribbon
			this.toolbar = new Ext.Toolbar({
				height: '25px',
				cls: 'ext-root',
				id: 'GENTICS_ribbon'
			});
	
			// left spacer to gain some space from the left screen border
			this.toolbar.add(new Ext.Toolbar.Spacer({width: '5'}));
			// icon
			this.icon = new Ext.Toolbar.Spacer();
			this.toolbar.add(this.icon);
			// fill so this everything after it is aligned right
			this.toolbar.add(new Ext.Toolbar.Fill());
			// seperator before the fade out button
			this.toolbar.add(new Ext.Toolbar.Separator());
			// fade out button
			var fadeButton = new Ext.Button({
				iconCls : 'GENTICS_fade_out',
				handler : function (button) {
					var toolbar = jQuery(that.toolbar.getEl().dom);
			
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
					this.toolbar.doLayout();
				}
			});
			this.toolbar.add(fadeButton);
			// spacer to gain some space from the right screen border
			this.toolbar.add(new Ext.Toolbar.Spacer({width: '5'}));

			this.toolbar.render(document.body, 0);
		
			jQuery('body').css('paddingTop', '30px');
			this.show();
		}
	},
	
	/**
	 * Sets the icon class for the ribbon icon
	 * @param {String} iconClass CSS class for the icon
	 */
	setIcon: function (iconClass) {
		if (typeof this.icon.cls !== 'undefined') {
			this.icon.removeClass(this.icon.cls);
		}
	
		this.icon.addClass(iconClass);
	},
	
	/**
	 * Adds a GENTICS.Aloha.ui.Button the Ribbon
	 * @param {Button} button Button to be added to the Ribbon
	 */
	addButton: function (button) {
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
	
		this.toolbar.insert(this.toolbar.items.getCount() - 3, extButton);
	},
	
	/**
	 * Adds a seperator to the Ribbon.
	 */
	addSeparator: function() {
		this.toolbar.insert(this.toolbar.items.getCount() - 3, new Ext.Toolbar.Separator());
	},
	
	/**
	 * Shows the ribbthison
	 */
	hide: function () {
		jQuery('#GENTICS_ribbon').fadeOut();
		this.visible = false;
	},
	
	/**
	 * Hides the ribbon
	 */
	show: function () {
		jQuery('#GENTICS_ribbon').fadeIn();
		this.visible = true;
	},
	
	/**
	 * Check whether the ribbon is visible right now
	 * @return true when the ribbon is visible, false when not
	 */
	isVisible: function () {
		return this.visible;
	}
};

