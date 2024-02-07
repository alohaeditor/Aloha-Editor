/** @typedef {import('./overlayElement').DynamicModalConfiguration} DynamicModalConfiguration */
/** @typedef {import('./overlayElement').OverlayElementControl} OverlayElementControl */

define([
    'ui/ui-plugin'
], function (
    UiPlugin
) {
    'use strict';

    // Implementation is in dynamicUi

    /**
     * Opens a modal with a dynamic form configuration.
     * @template {*} T
     * @param {DynamicFormModalConfiguration.<T>} config - The config for how to open the modal and what to do with it.
     * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
     */
    function openDynamicModal(config) {
        return UiPlugin.getActiveSurface().openDynamicModal(config);
    }

    return {
        openDynamicModal: openDynamicModal,
    };
});