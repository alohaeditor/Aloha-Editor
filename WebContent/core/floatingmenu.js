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
/**
 * Aloha's Floating Menu
 * @namespace GENTICS.Aloha
 * @class FloatingMenu
 * @singleton
 */
GENTICS.Aloha.FloatingMenu = {};

/**
 * Define the default scopes
 * @property
 * @type Object
 */
GENTICS.Aloha.FloatingMenu.scopes = {
	'GENTICS.Aloha.empty' : {
		'name' : 'GENTICS.Aloha.empty',
		'extendedScopes' : [],
		'buttons' : []
	},
	'GENTICS.Aloha.global' : {
		'name' : 'GENTICS.Aloha.global',
		'extendedScopes' : ['GENTICS.Aloha.empty'],
		'buttons' : []
	},
	'GENTICS.Aloha.continuoustext' : {
		'name' : 'GENTICS.Aloha.continuoustext',
		'extendedScopes' : ['GENTICS.Aloha.global'],
		'buttons' : []
	}
};

/**
 * Array of tabs within the floatingmenu
 * @hide
 */
GENTICS.Aloha.FloatingMenu.tabs = new Array();

/**
 * 'Map' of tabs (for easy access)
 * @hide
 */
GENTICS.Aloha.FloatingMenu.tabMap = {};

/**
 * Flag to mark whether the floatingmenu is initialized
 * @hide
 */
GENTICS.Aloha.FloatingMenu.initialized = false;

/**
 * Array containing all buttons
 * @hide
 */
GENTICS.Aloha.FloatingMenu.allButtons = new Array();

/**
 * top part of the floatingmenu position
 * @hide
 */
GENTICS.Aloha.FloatingMenu.top = 100;

/**
 * left part of the floatingmenu position
 * @hide
 */
GENTICS.Aloha.FloatingMenu.left = 100;

/**
 * store pinned status - true, if the FloatingMenu is pinned
 * @property
 * @type boolean
 */
GENTICS.Aloha.FloatingMenu.pinned = false;

/**
 * just a reference to the jQuery(window) object, which is used quite often
 */
GENTICS.Aloha.FloatingMenu.window = jQuery(window);

/**
 * Initialize the floatingmenu
 * @hide
 */
GENTICS.Aloha.FloatingMenu.init = function() {
	this.currentScope = 'GENTICS.Aloha.global';
	var that = this;
	this.window.unload(function () {
		// store fm position if the panel is pinned to be able to restore it next time
		if (that.pinned) {
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.pinned', 'true');
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.top', that.obj.offset().top);
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.left', that.obj.offset().left);
			if (GENTICS.Aloha.Log.isInfoEnabled()) {
				GENTICS.Aloha.Log.info(this, 'stored FloatingMenu pinned position {' + that.obj.offset().left 
						+ ', ' + that.obj.offset().top + '}');
			}
		} else {
			// delete old cookies
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.pinned', null);
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.top', null);
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.left', null);
		}
		if (that.userActivatedTab) {
			jQuery.cookie('GENTICS.Aloha.FloatingMenu.activeTab', that.userActivatedTab);
		}
	}).resize(function () {
		var target = that.calcFloatTarget(GENTICS.Aloha.Selection.getRangeObject());
		if (target) {
			that.floatTo(target);
		}
	});
	this.generateComponent();	
	this.initialized = true;
};

/**
 * jQuery reference to the extjs tabpanel
 * @hide
 */
GENTICS.Aloha.FloatingMenu.obj = null;

/**
 * jQuery reference to the shadow obj
 * @hide
 */
GENTICS.Aloha.FloatingMenu.shadow = null;

/**
 * jQuery reference to the panels body wrap div
 * @hide
 */
GENTICS.Aloha.FloatingMenu.panelBody = null;

/**
 * Generate the rendered component for the floatingmenu
 * @hide
 */
GENTICS.Aloha.FloatingMenu.generateComponent = function () {
	var that = this;

	// Initialize and configure the tooltips
	Ext.QuickTips.init();
	Ext.apply(Ext.QuickTips.getQuickTip(), {
		minWidth : 10
	});
	
	if (this.extTabPanel) {
		// TODO dispose of the ext component
	}

	// generate the tabpanel object
	this.extTabPanel = new Ext.TabPanel({
		activeTab: 0,
		width: 400, // 336px this fits the multisplit button and 6 small buttons placed in 3 cols
		plain: false,
		draggable: {
			insertProxy: false,
			onDrag : function(e) {
				var pel = this.proxy.getEl();
				this.x = pel.getLeft(true);
				this.y = pel.getTop(true);
				GENTICS.Aloha.FloatingMenu.shadow.hide();
			},
			endDrag : function(e) {
				if (GENTICS.Aloha.FloatingMenu.pinned) {
					var top = this.y - jQuery(document).scrollTop();
				} else {
					var top = this.y;
				}
				that.left = this.x;
				that.top = top;
				this.panel.setPosition(this.x, top);
				GENTICS.Aloha.FloatingMenu.refreshShadow();
				GENTICS.Aloha.FloatingMenu.shadow.show();
			}
		},
		floating: true,
		defaults: {
			autoScroll: true 
		},
		layoutOnTabChange : true,
		shadow: false,
		cls: 'GENTICS_floatingmenu ext-root',
		listeners : {
			'tabchange' : {
				'fn' : function(tabPanel, tab) {
					if (tab.title != that.autoActivatedTab) {
						if (GENTICS.Aloha.Log.isDebugEnabled()) {
							GENTICS.Aloha.Log.debug(that, 'User selected tab ' + tab.title);
						}
						// remember the last user-selected tab
						that.userActivatedTab = tab.title;
					} else {
						if (GENTICS.Aloha.Log.isDebugEnabled()) {
							GENTICS.Aloha.Log.debug(that, 'Tab ' + tab.title + ' was activated automatically');
						}
					}
					that.autoActivatedTab = undefined;

					// ok, this is kind of a hack: when the tab changes, we check all buttons for multisplitbuttons (which have the method setActiveDOMElement).
					// if a DOM Element is queued to be set active, we try to do this now.
					// the reason for this is that the active DOM element can only be set when the multisplit button is currently visible.
					jQuery.each(that.allButtons, function(index, buttonInfo) {
						if (typeof buttonInfo.button != 'undefined'
							&& typeof buttonInfo.button.extButton != 'undefined'
							&& typeof buttonInfo.button.extButton.setActiveDOMElement == 'function') {
							if (typeof buttonInfo.button.extButton.activeDOMElement != 'undefined') {
								buttonInfo.button.extButton.setActiveDOMElement(buttonInfo.button.extButton.activeDOMElement);
							}
						}
					});
					
					// adapt the shadow
					GENTICS.Aloha.FloatingMenu.shadow.show();
					GENTICS.Aloha.FloatingMenu.refreshShadow();
				}
			}
		},
		enableTabScroll : true
	});

	// add the tabs
	jQuery.each(this.tabs, function(index, tab) {
		// let each tab generate its ext component and add them to the panel
		that.extTabPanel.add(tab.getExtComponent());
	});
	
	// add the dropshadow
	jQuery('body').append('<div id="GENTICS_floatingmenu_shadow" class="GENTICS_shadow">&#160;</div>');
	this.shadow = jQuery('#GENTICS_floatingmenu_shadow');
	
	// add an empty pin tab item, store reference
	var pinTab = this.extTabPanel.add({
		title : '&#160;'
	});

	// finally render the panel to the body
	this.extTabPanel.render(document.body);

	// finish the pin element after the FM has rendered (before there are noe html contents to be manipulated
	jQuery(pinTab.tabEl)
		.addClass('GENTICS_floatingmenu_pin')
		.html('&#160;')
		.mousedown(function (e) {
			that.togglePin();
			e.stopPropagation();
		});
	
	// a reference to the panels body needed for shadow size & position
	this.panelBody = jQuery('.GENTICS_floatingmenu .x-tab-panel-bwrap');
	
	// do the visibility
	this.doLayout();

	// bind jQuery reference to extjs obj
	// this has to be done AFTER the tab panel has been rendered
	this.obj = jQuery(this.extTabPanel.getEl().dom);
	
	if (jQuery.cookie('GENTICS.Aloha.FloatingMenu.pinned') == 'true') {
		this.togglePin();
		
		this.top = parseInt(jQuery.cookie('GENTICS.Aloha.FloatingMenu.top'));
		this.left = parseInt(jQuery.cookie('GENTICS.Aloha.FloatingMenu.left'));
		
		// do some positioning fixes
		if (this.top < 30) {
			this.top = 30;
		}
		if (this.left < 0) {
			this.left = 0;
		}
		
		if (GENTICS.Aloha.Log.isInfoEnabled()) {
			GENTICS.Aloha.Log.info(this, 'restored FloatingMenu pinned position {' + this.left + ', ' + this.top + '}');
		}
		
		this.refreshShadow();
	}

	// set the user activated tab stored in a cookie
	if (jQuery.cookie('GENTICS.Aloha.FloatingMenu.activeTab')) {
		this.userActivatedTab = jQuery.cookie('GENTICS.Aloha.FloatingMenu.activeTab');
	}

	// for now, position the panel somewhere
	this.extTabPanel.setPosition(this.left, this.top);
	
	// disable event bubbling for mousedown, because we don't want to recognize
	// a click into the floatingmenu to be a click into nowhere (which would
	// deactivate the editables)
	this.obj.mousedown(function (e) {
		e.stopPropagation();
	});
	
	// listen to selectionChanged event
	GENTICS.Aloha.EventRegistry.subscribe(
			GENTICS.Aloha,
			'selectionChanged',
			function(event, rangeObject) {
				if (!that.pinned) {
					var pos = that.calcFloatTarget(rangeObject);
					if (pos) {
						that.floatTo(pos);
					}
				}
	});
};

/**
 * reposition & resize the shadow
 * the shadow must not be repositioned outside this method!
 * position calculation is based on this.top and this.left coordinates
 * @method
 */
GENTICS.Aloha.FloatingMenu.refreshShadow = function () {
	if (!this.panelBody) {
		return;
	}
	GENTICS.Aloha.FloatingMenu.shadow.css('top', this.top + 24); // 24px top offset to reflect tab bar height
	GENTICS.Aloha.FloatingMenu.shadow.css('left', this.left);
	GENTICS.Aloha.FloatingMenu.shadow.width(this.panelBody.width());
	GENTICS.Aloha.FloatingMenu.shadow.height(this.panelBody.height());
};

/**
 * toggles the pinned status of the floating menu
 * @method
 */
GENTICS.Aloha.FloatingMenu.togglePin = function() {
	var el = jQuery('.GENTICS_floatingmenu_pin');
	if (this.pinned) {
		el.removeClass('GENTICS_floatingmenu_pinned');
		this.top = this.obj.offset().top;
		
		this.obj.css('top', this.top);
		this.obj.css('position', 'absolute');

		this.shadow.css('position', 'absolute');
		this.refreshShadow();
		
		this.pinned = false;
	} else {
		el.addClass('GENTICS_floatingmenu_pinned');
		this.top = this.obj.offset().top - this.window.scrollTop();
		
		// update position as preparation for fixed position 
		this.obj.css('top', this.top);
		// fix the floating menu in place
		this.obj.css('position', 'fixed');
		
		// do the same for the shadow
		this.shadow.css('position', 'fixed');
		this.refreshShadow();
		
		this.pinned = true;
	}
};

/**
 * Create a new scopes
 * @method
 * @param {String} scope name of the new scope (should be namespaced for uniqueness)
 * @param {String} extendedScopes Array of scopes this scope extends. Can also be a single String if
 *            only one scope is extended, or omitted if the scope should extend
 *            the empty scope
 */
GENTICS.Aloha.FloatingMenu.createScope = function(scope, extendedScopes) {
	if (typeof extendedScopes == 'undefined') {
		extendedScopes = ['GENTICS.Aloha.empty'];
	} else if (typeof extendedScopes == 'string') {
		extendedScopes = [extendedScopes];
	}

	// TODO check whether the extended scopes already exist

	var scopeObject = this.scopes[scope];
	if (scopeObject) {
		// TODO what if the scope already exists?
	} else {
		// generate the new scope
		this.scopes[scope] = {'name' : scope, 'extendedScopes' : extendedScopes, 'buttons' : []};
	}
};

/**
 * Adds a button to the floatingmenu
 * @method
 * @param {String} scope the scope for the button, should be generated before (either by core or the plugin)
 * @param {Button} button instance of GENTICS.Aloha.ui.button to add at the floatingmenu
 * @param {String} tab label of the tab to which the button is added
 * @param {int} group index of the button group in the tab, lowest index is left
 */
GENTICS.Aloha.FloatingMenu.addButton = function(scope, button, tab, group) {
	// check whether the scope exists
	var scopeObject = this.scopes[scope];
	if (typeof scopeObject == 'undefined') {
		// TODO log an error and exit
	}

	// generate a buttonInfo object
	var buttonInfo = {'button' : button, 'scopeVisible' : false};

	// add the button to the list of all buttons
	this.allButtons.push(buttonInfo);

	// add the button to the scope
	scopeObject.buttons.push(buttonInfo);

	// get the tab object
	var tabObject = this.tabMap[tab];
	if (typeof tabObject == 'undefined') {
		// the tab object does not yet exist, so create a new tab and add it to the list
		tabObject = new GENTICS.Aloha.FloatingMenu.Tab(tab);
		this.tabs.push(tabObject);
		this.tabMap[tab] = tabObject;
	}

	// get the group
	var groupObject = tabObject.getGroup(group);

	// now add the button to the group
	groupObject.addButton(buttonInfo);

	// finally, when the floatingmenu is already initialized, we need to create the ext component now
	if (this.initialized) {
		this.generateComponent();
	}
};

/**
 * Recalculate the visibility of tabs, groups and buttons (depending on scope and button hiding)
 * @hide
 */
GENTICS.Aloha.FloatingMenu.doLayout = function () {
	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		GENTICS.Aloha.Log.debug(this, 'doLayout called for FloatingMenu, scope is ' + this.currentScope);
	}
	var that = this;
	var firstVisibleTab = false;
	var activeExtTab = this.extTabPanel.getActiveTab();
	var activeTab = false;
	var floatingMenuVisible = false;
	var showUserActivatedTab = false;

	// let the tabs layout themselves
	jQuery.each(this.tabs, function(index, tab) {
		// remember the active tab
		if (tab.extPanel == activeExtTab) {
			activeTab = tab;
		}

		// remember whether the tab is currently visible
		var tabVisible = tab.visible;

		// let each tab generate its ext component and add them to the panel
		if (tab.doLayout()) {
			// found a visible tab, so the floatingmenu needs to be visible as well
			floatingMenuVisible = true;

			// make sure the tabstrip is visible
			if (!tabVisible) {
				if (GENTICS.Aloha.Log.isDebugEnabled()) {
					GENTICS.Aloha.Log.debug(that, 'showing tab strip for tab ' + tab.label);
				}
				that.extTabPanel.unhideTabStripItem(tab.extPanel);
			}

			// remember the first visible tab
			if (firstVisibleTab == false) {
				// this is the first visible tab (in case we need to switch to it)
				firstVisibleTab = tab;
			}

			// check whether this visible tab is the last user activated tab and currently not active
			if (that.userActivatedTab == tab.extPanel.title && tab.extPanel != activeExtTab) {
				showUserActivatedTab = tab;
			}
		} else {
			// make sure the tabstrip is hidden
			if (tabVisible) {
				if (GENTICS.Aloha.Log.isDebugEnabled()) {
					GENTICS.Aloha.Log.debug(that, 'hiding tab strip for tab ' + tab.label);
				}
				that.extTabPanel.hideTabStripItem(tab.extPanel);
			}
		}
	});

	// check whether the last tab which was selected by the user is visible and not the active tab
	if (showUserActivatedTab) {
		if (GENTICS.Aloha.Log.isDebugEnabled()) {
			GENTICS.Aloha.Log.debug(this, 'Setting active tab to ' + showUserActivatedTab.label);
		}
		this.extTabPanel.setActiveTab(showUserActivatedTab.extPanel);
	} else if (typeof activeTab == 'object' && typeof firstVisibleTab == 'object') {
		// now check the currently visible tab, whether it is visible and enabled
		if (!activeTab.visible) {
			if (GENTICS.Aloha.Log.isDebugEnabled()) {
				GENTICS.Aloha.Log.debug(this, 'Setting active tab to ' + firstVisibleTab.label);
			}
			this.autoActivatedTab = firstVisibleTab.extPanel.title;
			this.extTabPanel.setActiveTab(firstVisibleTab.extPanel);
		}
	}

	// set visibility of floatingmenu
	if (floatingMenuVisible && this.extTabPanel.hidden) {
		// set the remembered position
		this.extTabPanel.show();
		this.refreshShadow();
		this.shadow.show();
		this.extTabPanel.setPosition(this.left, this.top);
	} else if (!floatingMenuVisible && !this.extTabPanel.hidden) {
		// remember the current position
		var pos = this.extTabPanel.getPosition(true);
		// restore previous position if the fm was pinned
		this.left = pos[0] < 0 ? 100 : pos[0];
		this.top = pos[1] < 0 ? 100 : pos[1];
		this.extTabPanel.hide();
		this.shadow.hide();
	}

	// let the Ext object render itself again
	this.extTabPanel.doLayout();
};

/**
 * Set the current scope
 * @method
 * @param {String} scope name of the new current scope
 */
GENTICS.Aloha.FloatingMenu.setScope = function(scope) {
	// get the scope object
	var scopeObject = this.scopes[scope];

	if (typeof scopeObject == 'undefined') {
		// TODO log an error
	} else if (this.currentScope != scope) {
		this.currentScope = scope;

		// first hide all buttons
		jQuery.each(this.allButtons, function(index, buttonInfo) {
			buttonInfo.scopeVisible = false;
		});

		// now set the buttons in the given scope to be visible
		this.setButtonScopeVisibility(scopeObject);

		// finally refresh the layout
		this.doLayout();
	}
};

/**
 * Set the scope visibility of the buttons for the given scope. This method will call itself for the motherscopes of the given scope.
 * @param scopeObject scope object
 * @hide
 */
GENTICS.Aloha.FloatingMenu.setButtonScopeVisibility = function(scopeObject) {
	var that = this;

	// set all buttons in the given scope to be visible
	jQuery.each(scopeObject.buttons, function(index, buttonInfo) {
		buttonInfo.scopeVisible = true;
	});

	// now do the recursion for the motherscopes
	jQuery.each(scopeObject.extendedScopes, function(index, scopeName) {
		var motherScopeObject = that.scopes[scopeName];
		if (typeof motherScopeObject == 'object') {
			that.setButtonScopeVisibility(motherScopeObject);
		}
	});
};

/**
 * returns the next possible float target dom obj
 * the floating menu should only float to h1-h6, p, div, td and pre elements
 * if the current object is not valid, it's parentNode will be considered, until
 * the limit object is hit
 * @param obj the dom object to start from (commonly this would be the commonAncestorContainer)
 * @param limitObj the object that limits the range (this would be the editable)
 * @return dom object which qualifies as a float target
 * @hide
 */
GENTICS.Aloha.FloatingMenu.nextFloatTargetObj = function (obj, limitObj) {
	// if we've hit the limit object we don't care for it's type
	if (!obj || obj == limitObj) {
		return obj;
	}

	// fm will only float to h1-h6, p, div, td
	switch (obj.nodeName.toLowerCase()) {
		case "h1":
		case "h2":
		case "h3":
		case "h4":
		case "h5":
		case "h6":
		case "p":
		case "div":
		case "td":
		case "pre":
		case "ul":
		case "ol":
			return obj;
			break;
		default:
			return this.nextFloatTargetObj(obj.parentNode, limitObj);
			break;
	}
};

/**
 * calculates the float target coordinates for a range
 * @param range the fm should float to
 * @return object containing x and y coordinates, like { x : 20, y : 43 }
 * @hide
 */
GENTICS.Aloha.FloatingMenu.calcFloatTarget = function(range) {
	if (!GENTICS.Aloha.activeEditable) {
		return false;
	}
	
	// check if the designated editable is disabled
	for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {
		if (GENTICS.Aloha.editables[i].obj.get(0) == range.limitObject &&
				GENTICS.Aloha.editables[i].isDisabled()) {
			return false;
		}
	}
	
	var targetObj = jQuery(this.nextFloatTargetObj(range.getCommonAncestorContainer(), range.limitObject));
	var scrollTop = GENTICS.Utils.Position.Scroll.top;

	var y = targetObj.offset().top - this.obj.height() - 50; // 50px offset above the current obj to have some space above

	// if the floating menu would be placed higher than the top of the screen... 
	var ribbonOffset = 0;
	if ( GENTICS.Aloha.Ribbon && 
			GENTICS.Aloha.settings.ribbon === true) {
		ribbonOffset = 30; // 30px = 26px ribbon height + some breathing room
	}
	if ( y < (scrollTop + ribbonOffset)) { 
		y = targetObj.offset().top + targetObj.height() + ribbonOffset;
	}
	
	// if the floating menu would float off the bottom of the screen
	// we don't want it to move, so we'll return false
	if (y > this.window.height() + this.window.scrollTop()) {
		return false;
	}
	
	return {
		x : GENTICS.Aloha.activeEditable.obj.offset().left,
		y : y 
	};
};

/**
 * float the fm to the desired position
 * the floating menu won't float if it is pinned
 * @method
 * @param {Object} object coordinate object which has a x and y property
 */
GENTICS.Aloha.FloatingMenu.floatTo = function(position) {
	// no floating if the panel is pinned
	if (this.pinned) {
		return;
	}
	
	var that = this;

	// move to the new position
	if (!this.floatedTo || this.floatedTo.x != position.x || this.floatedTo.y != position.y) {
		this.obj.animate({
			top:  position.y,
			left: position.x
		}, { 
			queue : false,
			step : function (step, props) {
				// update position reference
				if (props.prop == 'top') {
					that.top = props.now;
				} else if (props.prop == 'left') {
					that.left = props.now;
				}
				that.refreshShadow();
			}
		});

		// remember the position we floated to
		this.floatedTo = position;
	}
};

/**
 * Constructor for a floatingmenu tab
 * @namespace GENTICS.Aloha.FloatingMenu
 * @class Tab
 * @constructor
 * @param {String} label label of the tab
 */
GENTICS.Aloha.FloatingMenu.Tab = function(label) {
	this.label = label;
	this.groups = new Array();
	this.groupMap = {};
	this.visible = true;
};

/**
 * Get the group with given index. If it does not yet exist, create a new one
 * @method
 * @param {int} group group index of the group to get
 * @return group object
 */
GENTICS.Aloha.FloatingMenu.Tab.prototype.getGroup = function(group) {
	var groupObject = this.groupMap[group];
	if (typeof groupObject == 'undefined') {
		groupObject = new GENTICS.Aloha.FloatingMenu.Group();
		this.groupMap[group] = groupObject;
		this.groups.push(groupObject);
		// TODO resort the groups
	}

	return groupObject;
};

/**
 * Get the EXT component representing the tab
 * @return EXT component (EXT.Panel)
 * @hide
 */
GENTICS.Aloha.FloatingMenu.Tab.prototype.getExtComponent = function () {
	var that = this;

	if (typeof this.extPanel == 'undefined') {
		// generate the panel here
		this.extPanel = new Ext.Panel({
			'tbar' : [],
			'title' : this.label,
			'style': 'margin-top:0px',
			'bodyStyle': 'display:none',
			'autoScroll': true
		});

		// add the groups
		jQuery.each(this.groups, function(index, group) {
			// let each group generate its ext component and add them to the panel
			that.extPanel.getTopToolbar().add(group.getExtComponent());
		});
	}

	return this.extPanel;
};

/**
 * Recalculate the visibility of all groups within the tab
 * @hide
 */
GENTICS.Aloha.FloatingMenu.Tab.prototype.doLayout = function() {
	var that = this;

	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		GENTICS.Aloha.Log.debug(this, 'doLayout called for tab ' + this.label);
	}
	this.visible = false;

	// check all groups in this tab
	jQuery.each(this.groups, function(index, group) {
		that.visible |= group.doLayout();
	});

	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		GENTICS.Aloha.Log.debug(this, 'tab ' + this.label + (this.visible ? ' is ' : ' is not ') + 'visible now');
	}

	return this.visible;
};

/**
 * Constructor for a floatingmenu group
 * @namespace GENTICS.Aloha.FloatingMenu
 * @class Group
 * @constructor
 */
GENTICS.Aloha.FloatingMenu.Group = function() {
	this.buttons = new Array();
};

/**
 * Add a button to this group
 * @param {Button} buttonInfo to add to the group
 */
GENTICS.Aloha.FloatingMenu.Group.prototype.addButton = function(buttonInfo) {
	this.buttons.push(buttonInfo);
};

/**
 * Get the EXT component representing the group (Ext.ButtonGroup)
 * @return the Ext.ButtonGroup
 * @hide
 */
GENTICS.Aloha.FloatingMenu.Group.prototype.getExtComponent = function () {
	var that = this;

	if (typeof this.extButtonGroup == 'undefined') {
		var items = new Array();
		var buttonCount = 0;

		// add all buttons
		jQuery.each(this.buttons, function(index, button) {
			// let each button generate its ext component and add them to the group
			items.push(button.button.getExtConfigProperties());

			// count the number of buttons (large buttons count as 2)
			buttonCount += button.button.size == 'small' ? 1 : 2;
		});
		
		this.extButtonGroup = new Ext.ButtonGroup({
			'columns' : Math.ceil(buttonCount / 2),
			'items': items
		});

		// now find the Ext.Buttons and set to the GENTICS buttons
		jQuery.each(this.buttons, function(index, buttonInfo) {
			buttonInfo.button.extButton = that.extButtonGroup.findById(buttonInfo.button.id);
			// the following code is a work arround because ExtJS initializes later.
			// The ui wrapper store the information and here we use it... ugly.
			// if there are any listeners added before initializing the extButtons
			if ( buttonInfo.button.listenerQueue && buttonInfo.button.listenerQueue.length > 0 ) {
				while ( l = buttonInfo.button.listenerQueue.shift() ) {
					buttonInfo.button.extButton.addListener(l.eventName, l.handler, l.scope, l.options);
				}
			}
			if (buttonInfo.button.extButton.setObjectTypeFilter) {
				if (buttonInfo.button.objectTypeFilter) {
					buttonInfo.button.extButton.noQuery = false;
				}
				if ( buttonInfo.button.objectTypeFilter == 'all' ) {
					buttonInfo.button.objectTypeFilter = null;
				}
				buttonInfo.button.extButton.setObjectTypeFilter(buttonInfo.button.objectTypeFilter);
				if ( buttonInfo.button.displayField) {
					buttonInfo.button.extButton.displayField = buttonInfo.button.displayField;
				}
				if ( buttonInfo.button.tpl ) {
					buttonInfo.button.extButton.tpl = buttonInfo.button.tpl;
				}
			}
		});
	}

	return this.extButtonGroup;
};

/**
 * Recalculate the visibility of the buttons and the group
 * @hide
 */
GENTICS.Aloha.FloatingMenu.Group.prototype.doLayout = function () {
	var groupVisible = false;
	var that = this;

	jQuery.each(this.buttons, function(index, button) {
		var extButton = that.extButtonGroup.findById(button.button.id);
		var buttonVisible = button.button.isVisible() && button.scopeVisible;

		if (buttonVisible && extButton.hidden) {
			extButton.show();
		} else if (!buttonVisible && !extButton.hidden) {
			extButton.hide();
		}

		groupVisible |= buttonVisible;
	});

	if (groupVisible && this.extButtonGroup.hidden) {
		this.extButtonGroup.show();
	} else if (!groupVisible && !this.extButtonGroup.hidden) {
		this.extButtonGroup.hide();
	}

	return groupVisible;
};