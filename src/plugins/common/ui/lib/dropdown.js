/** @typedef {import('./overlayElement').DynamicDropdownConfiguration} DynamicDropdownConfiguration */
/** @typedef {import('./overlayElement').OverlayElementControl} OverlayElementControl */

/**
 * Opens a modal with a dynamic form configuration.
 * @template {*} T
 * @callback openDynamicDropdown
 * @param {string} componentName - The name of the component to where the dropdown should be opened to.
 * @param {DynamicDropdownConfiguration.<T>} config - The config for how to open the dropdown and what to display.
 * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
 */

/**
 * @typedef {object} Dropdown
 * @property {openDynamicDropdown.<T>} openDynamicDropdown
 */

define([
    'ui/ui-plugin',
], function (
    UiPlugin
) {
    'use strict';

    // Implementation is in dynamicUi

    /** @type {openDynamicDropdown} */
    function openDynamicDropdown(componentName, config) {
        return UiPlugin.getActiveSurface().openDynamicDropdown(componentName, config);
    }

    return {
        openDynamicDropdown: openDynamicDropdown,
    };
});