/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


// Closure
(function(window, undefined) {
	var
		$ = jQuery = window.alohaQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

// Ensure Namespace
GENTICS.Aloha.ui = GENTICS.Aloha.ui || {};

/**
 * Constructor for an Aloha button.
 * @namespace GENTICS.Aloha.ui
 * @class Button
 * @param {Object} properties Properties of the button:
 * - label: Label that is displayed on the button.
 * - onclick: Callback function of the button when activated.
 * - menu: Array of GENTICS.Aloha.ui.Button elements that are displayed as drop-down menu.
 * - iconClass: Icon displayed on the button.
 * - icon: URL to an icon that is displayed on the button.
 * - toggle: Boolean that indicates if the button is a toggle button.
 */
GENTICS.Aloha.ui.Button = function(properties) {
	this.init(properties);
};

/**
 * id counter, for generation of unique id's for the buttons
 * @hide
 */
GENTICS.Aloha.ui.Button.idCounter = 0;

GENTICS.Aloha.ui.Button.prototype = {

	/**
	 * Init method for an Aloha button.
	 * This method is necessary due to JS specific initalization.
	 * @namespace GENTICS.Aloha.ui
	 * @class Button
	 * @param {Object} properties Properties of the button:
	 * - label: Label that is displayed on the button.
	 * - onclick: Callback function of the button when activated.
	 * - menu: Array of GENTICS.Aloha.ui.Button elements that are displayed as drop-down menu.
	 * - iconClass: Icon displayed on the button.
	 * - icon: URL to an icon that is displayed on the button.
	 * - toggle: Boolean that indicates if the button is a toggle button.
	 */
	init: function(properties) {
		/**
		 * Label that is displayed on the button
		 * @hide
		 */
		this.label;

		/**
		 * CSS class for an icon on the button
		 * @hide
		 */
		this.iconClass;

		/**
		 * URL to an icon to display on the button
		 * @hide
		 */
		this.icon;

		/**
		 * Callback function when the button is activated.
		 * The "this" variable refers to the button inside the callback function.
		 * @hide
		 */
		this.onclick;

		/**
		 * Array of buttons that are displayed in a drop down menu.
		 * If a menu is provided and no onclick callback then clicking the button also opens the menu
		 * @hide
		 */
		this.menu;

		/**
		 * Indicates if the button is a toggle button
		 * @hide
		 */
		this.toggle;

		/**
		 * Property that indicates if the button is in pressed state
		 * @hide
		 */
		this.pressed = false;

		/**
		 * Property that indicates whether the button is currently visible
		 * @hide
		 */
		this.visible = true;

		/**
		 * Property that indicates whether the button is currently enabled
		 * @hide
		 */
		this.enabled = true;

		/**
		 * Tooltip text
		 * @hide
		 */
		this.tooltip;

		/**
		 * holds the ext object of the button
		 * @hide
		 */
		this.extButton;

		/**
		 * holds the listeners of the button
		 * @hide
		 */
		this.listenerQueue = [];

		GENTICS.Utils.applyProperties(this, properties);

		/**
		 * Unique Id of the button
		 * @hide
		 */
		this.id = this.generateId();
	},

	/**
	 * Generate a unique id for the button
	 * @return unique id
	 * @hide
	 */
	generateId: function () {
		GENTICS.Aloha.ui.Button.idCounter = GENTICS.Aloha.ui.Button.idCounter + 1;
		return 'GENTICS_Aloha_ui_Button_' + GENTICS.Aloha.ui.Button.idCounter;
	},

	/**
	 * Set the 'pressed' state of the button if it is a toggle button
	 * @param {bool} pressed true when the button shall be 'pressed', false if not
	 */
	setPressed: function(pressed) {
		if (this.toggle) {
			this.pressed = pressed;
			if (typeof this.extButton == 'object' && this.extButton.pressed != pressed) {
				this.extButton.toggle(this.pressed);
			}
		}
	},

	/**
	 * Indicates if the button is currently in "pressed" state.
	 * This is only relevant if the button is a toggle button.
	 * If the button is no toggle button this function always returns false.
	 * @return {bool} True if the button is pressed, false otherwise.
	 */
	isPressed: function() {
		if (this.toggle) {
			return this.pressed;
		}
		return false;
	},

	/**
	 * Show the button. When this button is added to the FloatingMenu, it is
	 * necessary to call GENTICS.Aloha.FloatingMenu.doLayout() after the visibility
	 * of the button is changed
	 */
	show: function() {
		this.visible = true;
	},

	/**
	 * Hide the button. When this button is added to the FloatingMenu, it is
	 * necessary to call GENTICS.Aloha.FloatingMenu.doLayout() after the visibility
	 * of the button is changed
	 */
	hide: function() {
		this.visible = false;
	},

	/**
	 * Check whether the button is visible or not
	 * @return true when the button is visible, false if not
	 */
	isVisible: function() {
		return this.visible;
	},

	/**
	 * Enable the button - make it clickable
	 */
	enable: function() {
		this.enabled = true;
		if (typeof this.extButton === 'object') {
			this.extButton.enable();
		}
	},

	/**
	 * Disable the button
	 */
	disable: function() {
		this.enabled = false;
		if (typeof this.extButton === 'object') {
			this.extButton.disable();
		}
	},

	/**
	 * Check whether the button is currently enabled
	 * @return true when the button is enabled, false if it is disabled
	 */
	isEnabled: function() {
		return this.enabled;
	},

	/**
	 * Get the Ext menu from this button
	 * @return Ext menu
	 * @hide
	 */
	getExtMenu: function() {
		if (typeof this.menu === 'object') {
			// build the drop down menu
			var menu = new Ext.menu.Menu();
			for (var i = 0; i < this.menu.length; ++i) {
				var entry = this.menu[i];
				menu.addItem(new Ext.menu.Item(entry.getExtMenuConfigProperties()));
			}
		}
		return menu;
	},

	/**
	 * Get the config properties for this button as menu entry
	 * @return config properties for this button as menu entry
	 * @hide
	 */
	getExtMenuConfigProperties: function() {
		var that = this,
			submenu = this.getExtMenu();

		return {
			text: this.label,
			icon: this.icon,
			iconCls: this.iconClass,
			handler: function () {
				if (typeof that.onclick == 'function') {
					that.onclick();
				}
			},
			menu: submenu
		};
	},

	/**
	 * Return an object containing the config properties to generate this button
	 * @return config properties
	 * @hide
	 */
	getExtConfigProperties: function() {
		var that = this,
			menu = this.getExtMenu(),

		// configuration for the button
			buttonConfig = {
			text : this.label,
			enableToggle: this.toggle,
			pressed : this.pressed,
			icon: this.icon,
			iconCls: this.iconClass,
			scale : this.scale||this.size,
			width : this.width||undefined,
			rowspan : this.rowspan || ((this.size == 'large' || this.size == 'medium') ? 2 : 1),
			menu : menu,
			handler : function(element, event) {
				if (typeof that.onclick === 'function') {
					that.onclick.apply(that, [element, event]);
				}
				that.pressed = !that.pressed;
			},
			xtype : (menu && typeof this.onclick == 'function') ? 'splitbutton' : 'button',
			tooltipType : 'qtip',
			tooltip : this.tooltip,
			id : this.id,
		    arrowAlign: this.arrowAlign || (this.size == 'large' || this.size == 'small' ? 'right' : 'bottom')
		};

		return buttonConfig;
	}
};

/**
 * extJS GENTICS Multi Split Button
 *
 * Display a Word-like formatting selection button
 * Selection images are typically 52*42 in size
 *
 * Example configuration
 * xtype : 'genticsmultisplitbutton',
 * items : [{
 *   'name'  : 'normal', // the buttons name, used to identify it
 *   'title' : 'Basic Text', // the buttons title, which will be displayed
 *	 'icon'  : 'img/icon.jpg', // source for the icon
 *	 'click' : function() { alert('normal'); } // callback if the button is clicked
 *   'wide'  : false // wether it's a wide button, which would be dispalyed at the bottom
 * }]
 *
 * you might want to check out the tutorial at
 * http://www.extjs.com/learn/Tutorial:Creating_new_UI_controls
 * @hide
 */
Ext.ux.GENTICSMultiSplitButton = Ext.extend(Ext.Component, {
	/**
	 * add a css class to the wrapper-div autogenerated by extjs
	 * @hide
	 */
	autoEl: {
    	cls: 'GENTICS_multisplit-wrapper'
	},

	/**
	 * will contain a reference to the ul dom object
	 * @hide
	 */
	ulObj: null,

	/**
	 * holds a reference to the expand button
	 * @hide
	 */
	panelButton: null,

	/**
	 * hold a reference to the wrapper div
	 * @hide
	 */
	wrapper: null,

	/**
	 * true if the panel is expanded
	 * @hide
	 */
	panelOpened: false,

	/**
	 * render the multisplit button
	 * @return void
	 * @hide
	 */
	onRender: function() {
    	Ext.ux.GENTICSMultiSplitButton.superclass.onRender.apply(this, arguments);
		// create a reference to this elements dom object
    	this.wrapper = jQuery(this.el.dom);

    	var item,
    		html = '<ul class="GENTICS_multisplit">';

		// add a new button to the list for each configured item
		for (var i=0; i<this.items.length; i++) {
			item = this.items[i];
			if (typeof item.visible == 'undefined') {
				item.visible = true;
			}
			// wide buttons will always be rendered at the bottom of the list
			if (item.wide) {
				continue;
			}
        	html += '<li>' +
        		'<button xmlns:ext="http://www.extjs.com/" class="' + item.iconClass + '" ext:qtip="' + item.tooltip + '" gtxmultisplititem="' + i + '">&#160;</button>' +
        		'</li>';
        }

        // now add the wide buttons at the bottom of the list
		for (var i=0; i<this.items.length; i++) {
			item = this.items[i];
			// now only wide buttons will be rendered
			if (!item.wide) {
				continue;
			}

        	html += '<li>' +
    		'<button xmlns:ext="http://www.extjs.com/" class="GENTICS_multisplit-wide ' + item.iconClass + '" ext:qtip="' + item.tooltip + '" gtxmultisplititem="' + i + '">' +
    			item.text + '</button>' +
    			'</li>';

        }

        html += '</ul>';

		var that = this;

		// register on move event, which occurs when the panel was dragged
    	// this should be done within the constructor, but ist not possible there
    	// since the extTabPanel will not be initialized at this moment
    	GENTICS.Aloha.FloatingMenu.extTabPanel.on('move', function () {
    		that.closePanel();
    	});
    	GENTICS.Aloha.FloatingMenu.extTabPanel.on('tabchange', function () {
    		that.closePanel();
    	});

		// add onclick event handler
		this.ulObj = jQuery(this.el.createChild(html).dom)
		.click(function (event) {
			that.onClick(event);
		});

		// add the expand button
		this.panelButton = jQuery(
			this.el.createChild('<button class="GENTICS_multisplit_toggle GENTICS_multisplit_toggle_open">&#160;</button>').dom
		)
		.click(function () {
			that.togglePanel();
		});
    },

	/**
	 * callback if a button has been clicked
	 * @param event jquery event object
	 * @return void
	 * @hide
	 */
    onClick: function(event) {
		// check if the element has a gtxmultisplititem attribute assigned
		if (!event.target.attributes.gtxmultisplititem) {
			return;
		}
		var el = jQuery(event.target);

		// collapse the panel
		this.closePanel();

		// wide buttons cannot become the active element
		if (!el.hasClass('GENTICS_multisplit-wide')) {
			this.setActiveDOMElement(el);
		}

		// invoke the items function
		this.items[event.target.attributes.gtxmultisplititem.value].click();
    },

	/**
	 * set the active item specified by its name
	 * @param name the name of the item to be marked as active
	 * @return void
	 * @hide
	 */
	setActiveItem: function(name) {
		// collapse the panel
		this.closePanel();

		// do nothing if item already set to be active
		if (this.activeItem == name) {
			return;
		}

		for (var i=0; i < this.items.length; i++) {
			if (this.items[i].name == name) {
				// found the item
				var button = jQuery(this.ulObj).find('[gtxmultisplititem='+i+']');
				this.setActiveDOMElement(button);
				this.activeItem = name;
				return;
			}
        }
		this.activeItem = null;
		this.setActiveDOMElement(null);
    },

	/**
	 * mark an item as active
	 * @param el jquery obj for item to be marked as active
	 * @return void
	 * @hide
	 */
	setActiveDOMElement: function(el) {
		// when the component (or one of its owners) is currently hidden, we need to set the active item later
    	var ct = this;
    	while (typeof ct !== 'undefined') {
    		if (ct.hidden) {
    			this.activeDOMElement = el;
    			return;
    		}
    		ct = ct.ownerCt;
    	}

		jQuery(this.ulObj).find('.GENTICS_multisplit-activeitem').removeClass('GENTICS_multisplit-activeitem');
		if(el) {
			el.parent().addClass('GENTICS_multisplit-activeitem');
		}

		if (el == null || el.parent().is(':hidden')) {
			return;
		}

		// reposition multisplit contents to the active item
		if (el && this.ulObj) {
			this.ulObj.css('margin-top', 0);
			var top = el.position().top;
			this.ulObj.css({
				'margin-top': - top + 6,
				'height': 46 + top - 6
			});
		}

		this.activeDOMElement = undefined;
    },

	/**
	 * toggle the panel display from closed to expanded or vice versa
	 * @return void
	 * @hide
	 */
	togglePanel: function() {
		if (this.panelOpened) {
			this.closePanel();
		} else {
			this.openPanel();
		}
    },

    /**
     * expand the button panel
     * @return void
     * @hide
     */
    openPanel: function() {
		if (this.panelOpened) {
			return;
		}

		var o = this.wrapper.offset();

    	// detach the ul element and reattach it onto the body
		this.ulObj
		.appendTo(jQuery('body'))
		.addClass('GENTICS_multisplit-expanded')
		.mousedown(function (e) {
			e.stopPropagation();
		})

		// relocate the ul
		.css({
			'top': o.top - 1,
			'left': o.left - 1
		})

		// display expand animation
		.animate({
			height: this.ulObj.attr('scrollHeight')
		});

		// TODO change to css
		this.panelButton
			.removeClass('GENTICS_multisplit_toggle_open')
			.addClass('GENTICS_multisplit_toggle_close');
		this.panelOpened = true;
    },

    /**
     * collapses the panel
     * @return void
     * @hide
     */
    closePanel: function() {
		if (!this.panelOpened) {
			return;
		}

		this.ulObj
			.removeClass('GENTICS_multisplit-expanded')
			.appendTo(this.wrapper);

		// TODO change to css
		this.panelButton
			.addClass('GENTICS_multisplit_toggle_open')
			.removeClass('GENTICS_multisplit_toggle_close');
		this.panelOpened = false;
	},

	/**
	 * hides a multisplit item
	 * @return void
	 * @hide
	 */
	hideItem: function(name) {
		for (var i = 0; i<this.items.length; i++) {
			if (this.items[i].name == name) {
				this.items[i].visible = false;
				// hide the corresponding dom object
				jQuery('#' + this.id + ' [gtxmultisplititem=' + i + ']').parent().hide();
				return;
			}
		}
	},

	/**
	 * shows an item
	 * @return void
	 * @hide
	 */
	showItem: function(name) {
		for (var i = 0; i<this.items.length; i++) {
			if (this.items[i].name == name) {
				this.items[i].visible = true;
				// hide the corresponding dom object
				jQuery('#' + this.id + ' [gtxmultisplititem=' + i + ']').parent().show();
				return;
			}
		}
	}
});
Ext.reg('genticsmultisplitbutton', Ext.ux.GENTICSMultiSplitButton);

/**
 * Aloha MultiSplit Button
 * @namespace GENTICS.Aloha.ui
 * @class MultiSplitButton
 * @param {Object} properties properties object for the new multisplit button
 * 		however you just have to fill out the items property of this object
 * 		items : [{
 *   		'name'  : 'normal', // the buttons name, used to identify it
 *   		'tooltip' : 'Basic Text', // the buttons tooltip, which will be displayed on hover
 *   		'text'	: 'Basic Text', // text to display on wide buttons
 *	 		'icon'  : 'img/icon.jpg', // source for the icon
 *	 		'click' : function() { alert('normal'); } // callback if the button is clicked
 *   		'wide'  : false // whether it's a wide button, which would be dispalyed at the bottom
 * 		}]
 */
GENTICS.Aloha.ui.MultiSplitButton = function(properties) {
	/**
	 * Items in the Multisplit Button
	 * @hide
	 */
	this.items;

	GENTICS.Utils.applyProperties(this, properties);

	/**
	 * unique id for all buttons
	 * @hide
	 */
	this.id = this.generateId();
};

/**
 * id counter, for generation of unique id's for the buttons
 * @hide
 */
GENTICS.Aloha.ui.MultiSplitButton.idCounter = 0;

GENTICS.Aloha.ui.MultiSplitButton.prototype = {
	/**
	 * Generate a unique id for the button
	 * @return unique id
	 * @hide
	 */
	generateId: function () {
		GENTICS.Aloha.ui.MultiSplitButton.idCounter = GENTICS.Aloha.ui.MultiSplitButton.idCounter + 1;
		return 'GENTICS_Aloha_ui_MultiSplitButton_' + GENTICS.Aloha.ui.MultiSplitButton.idCounter;
	},

	/**
	 * Return an object containing the config properties to generate this button
	 * @return config properties
	 * @hide
	 */
	getExtConfigProperties: function() {
		return {
			'xtype' : 'genticsmultisplitbutton',
			'items' : this.items,
			'id' : this.id
		};
	},

	/**
	 * Set the active item of the multisplitbutton
	 * @param {String} name	name of the item to be set active
	 */
	setActiveItem: function(name) {
		if (typeof name !== 'undefined') {
			this.extButton.setActiveItem(name);
		}
	},

	/**
	 * check whether the multisplit button is visible
	 * @return boolean true if visible
	 */
	isVisible: function() {
		// if all items are hidden, disable this item
		for (var i=0; i<this.items.length; i++) {
			// if just one item is visible that's enough
			if (this.items[i].visible) {
				return true;
			}
		}
		return false;
	},

	/**
	 * shows an item of the multisplit button
	 * @param {String} name the item's name
	 */
	showItem: function(name) {
		this.extButton.showItem(name);
	},

	/**
	 * hides an item of the multisplit button
	 * @param {String} name the item's name
	 */
	hideItem: function(name) {
		this.extButton.hideItem(name);
	}
};
})(window);
