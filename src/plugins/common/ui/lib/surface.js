/** @typedef {import('./overlayElement').DynamicDropdownConfiguration} DynamicDropdownConfiguration */
/** @typedef {import('./overlayElement').DynamicModalConfiguration} DynamicModalConfiguration */
/** @typedef {import('./overlayElement').ConfirmDialogConfiguration} ConfirmDialogConfiguration */
/** @typedef {import('./overlayElement').AlertDialogConfiguration} AlertDialogConfiguration */
/** @typedef {import('./overlayElement').VoidFunction} VoidFunction */

define([
	'aloha/core',
	'jquery',
	'util/class',
	'ui/container'
], function (
	Aloha,
	$,
	Class,
	Container
) {
	'use strict';

	/**
	 * The Surface class and manager.
	 *
	 * @class
	 * @base
	 */
	var Surface = Class.extend({
		enabled: false,

		_constructor: function (context) {
			context.surfaces.push(this);
		},

		/**
		 * Function to adopt/register a component to a specific slot.
		 * Rendering of the component should be done when the slot for it is available.
		 * @param {string} slot The slot that sohuld be registered for the component.
		 * @param {*} component The component that should be registered.
		 * @abstract
		 */
		adoptInto: function (slot, component) {
			throw Error('Implement this function!');
		},
		/**
		 * Clears a previously adopted slot.
		 * @param {string} slot The slot that should be cleared.
		 * @abstract
		 */
		unadopt: function(slot) {
			throw Error('Implement this function!');
		},

		enable: function() {
			this.enabled = true;
		},
		disable: function() {
			this.enabled = false
		},

		/**
		 * Show the Surface and it's content
		 * @abstract
		 */
		show: function() {
			throw Error('Implement this function!');
		},
		/**
		 * Hide the Surface and it's content
		 * @abstract
		 */
		hide: function() {
			throw Error('Implement this function!');
		},

		/**
		 * Opens a modal with a dynamic form configuration.
		 * @template {*} T
		 * @param {string} componentName - The name of the component/slot to where the dropdown should be opened to.
		 * @param {DynamicDropdownConfiguration.<T>} config - The config for how to open the dropdown and what to display.
		 * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
		 */
		openDynamicDropdown: function(componentName, config) {
			throw Error("Implement this function!");
		},
		/**
		 * Opens a modal with a dynamic form configuration.
		 * @template {*} T
		 * @param {DynamicFormModalConfiguration.<T>} config - The config for how to open the modal and what to do with it.
		 * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
		 */
		openDynamicModal: function(config) {
			throw Error("Implement this function!");
		},
		/**
		 * Opens a dialog for the user to confirm/dismiss an action.
		 * @param {ConfirmDialogConfiguration} config The configuration for the dialog.
		 * @returns {VoidFunction} A function to call to close the dialog.
		 */
		openConfirmDialog: function(config) {
			throw Error("Implement this function!");
		},
		/**
		 * Opens an alert dialog/notification for the user.
		 * @param {AlertDialogConfiguration} config The configuration for the dialog.
		 * @returns {VoidFunction} A function to call to close the dialog.
		 */
		openAlertDialog: function(config) {
			throw Error("Implement this function!");
		},

		/**
		 * Check for whether or not this surface is active--that is, whether is
		 * is visible and the user can interact with it.
		 *
		 * @eturn {boolean} True if this surface is visible.
		 */
		isActive: function () {
			return true;
		}
	});

	// Static fields for the Surface class.

	$.extend(Surface, {

		/**
		 * The range of the current selection.
		 * 
		 * Interacting with a surface removes focus from the editable, so the
		 * surface is responsible for keeping track of the range that should be
		 * modified by the components.
		 * 
		 * @static
		 * @type {Aloha.Selection}
		 */
		range: null,

		/**
		 * Shows all surfaces for a given context.
		 *
		 * @param {!Object} context.
		 */
		show: function (context) {
			$.each(context.surfaces, function (i, surface) {
				surface.show();
			});
		},

		/**
		 * Hides all surfaces for a given context.
		 *
		 * @param {!Object} context
		 */
		hide: function (context) {
			$.each(context.surfaces, function (i, surface) {
				surface.hide();
			});
		},

		/**
		 * Track editable and range when interacting with a surface.
		 *
		 * @param {jQuery<HTMLElement>} element A component or surface for
		 *                                      which we wish to keep track of
		 *                                      the current selection range
		 *                                      when the user interacts with
		 *                                      it.
		 */
		trackRange: function (element) {
			element.on('mousedown', function (e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = true;
				Surface.suppressHide = true;

				if (Aloha.activeEditable) {
					var selection = Aloha.getSelection();
					Surface.range = (0 < selection.getRangeCount()) ?
						selection.getRangeAt(0) : null;
				}
			});
			
			element.on('mouseup', function (e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = false;
				Surface.suppressHide = false;
			});
		}
	});

	return Surface;
});
