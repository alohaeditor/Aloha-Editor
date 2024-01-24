define([
    'ui/ui-plugin',
], function (
    UiPlugin
) {
    'use strict';

    // Note: Typings are in overlayElement

    // Implementation is in dynamicUi

    /**
     * Opens a modal with a dynamic form configuration.
     * @template {*} T
     * @param {string} componentName - The name of the component to where the dropdown should be opened to.
     * @param {DynamicDropdownConfiguration.<T>} config - The config for how to open the dropdown and what to display.
     * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
     */
    function openDynamicDropdown(componentName, config) {
        return UiPlugin.getActiveSurface().openDynamicDropdown(componentName, config);
    }

    return {
        openDynamicDropdown: openDynamicDropdown,
    };
});