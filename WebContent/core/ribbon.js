/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Aloha Ribbon
 * <p>Setting GENTICS.Aloha.settings.ribbon to bool false before Aloha is loaded will hide the ribbon.</p>  
 * @namespace GENTICS.Aloha
 * @class Ribbon
 * @singleton
 */
GENTICS.Aloha.Ribbon = function() {
	
	var that = this;

	// flag to mark whether ribbon is visible
	this.visible = false;

	// the ribbon
	this.toolbar = new Ext.Toolbar({
		height: 30,
		cls: 'GENTICS_ribbon ext-root'
	});
	
	// left spacer to gain some space from the left screen border
	this.toolbar.add(new Ext.Toolbar.Spacer({width: '5'}));
	// icon
	this.icon = new Ext.Toolbar.Spacer();
	this.toolbar.add(this.icon);
	// fill so that everything after it is aligned right
	this.toolbar.add(new Ext.Toolbar.Fill());
	// seperator before the fade out button
	this.toolbar.add(new Ext.Toolbar.Separator());
	// fade out button
	var fadeButton = new Ext.Button({
		iconCls : 'GENTICS_fade_out',
		handler : function (button) {
			var toolbar = jQuery(that.toolbar.getEl().dom);
			
			if (button.iconCls == 'GENTICS_fade_out') {
				toolbar.css('marginLeft', '34px');
				toolbar.animate({
					left: '-100%'
				});
				jQuery('body').animate({
					paddingTop: 0
				});
				button.setIconClass('GENTICS_fade_in');
			} else {
				toolbar.css('marginLeft', '0px');
				toolbar.animate({
					left: '0%'
				});
				jQuery('body').animate({
					paddingTop: 30
				});
				button.setIconClass('GENTICS_fade_out');
			}
			that.toolbar.doLayout();
		}
	});
	this.toolbar.add(fadeButton);
	// spacer to gain some space from the right screen border
	this.toolbar.add(new Ext.Toolbar.Spacer({width: '5'}));
};

/**
 * Sets the icon class for the ribbon icon
 * @param {String} iconClass CSS class for the icon
 */
GENTICS.Aloha.Ribbon.prototype.setIcon = function (iconClass) {
	if (typeof this.icon.cls != 'undefined') {
		this.icon.removeClass(this.icon.cls);
	}
	
	this.icon.addClass(iconClass);
};

/**
 * Adds a GENTICS.Aloha.ui.Button the Ribbon
 * @param {Button} button Button to be added to the Ribbon
 */
GENTICS.Aloha.Ribbon.prototype.addButton = function (button) {
	
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
};

/**
 * Adds a seperator to the Ribbon.
 */
GENTICS.Aloha.Ribbon.prototype.addSeparator = function() {
	this.toolbar.insert(this.toolbar.items.getCount() - 3, new Ext.Toolbar.Separator());
}

/**
 * Initilization of the Ribbon
 * @hide
 */
GENTICS.Aloha.Ribbon.prototype.init = function() {
	
	this.toolbar.render(document.body, 0);
	
	if (GENTICS.Aloha.settings.ribbon === true) {
		
		jQuery('body').css('paddingTop', '30px !important');
		this.show();
	}
};

/**
 * Shows the ribbon
 */
GENTICS.Aloha.Ribbon.prototype.hide = function () {
	jQuery('.GENTICS_ribbon').fadeOut();
	this.visible = false;
};

/**
 * Hides the ribbon
 */
GENTICS.Aloha.Ribbon.prototype.show = function () {
	jQuery('.GENTICS_ribbon').fadeIn();
	this.visible = true;
};

/**
 * Check whether the ribbon is visible right now
 * @return true when the ribbon is visible, false when not
 */
GENTICS.Aloha.Ribbon.prototype.isVisible = function () {
	return this.visible;
};

GENTICS.Aloha.Ribbon = new GENTICS.Aloha.Ribbon();