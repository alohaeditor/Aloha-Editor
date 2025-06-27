/** @typedef {import('./overlayElement').DynamicDropdownConfiguration} DynamicDropdownConfiguration */
/** @typedef {import('./overlayElement').DynamicModalConfiguration} DynamicModalConfiguration */
/** @typedef {import('./overlayElement').OverlayElementControl} OverlayElementControl */
/** @typedef {import('./button').Button} Button */
/**
 * @template {*} T
 * @typedef {object} ContextButtonProperties
 * @property {'context-button'} type
 * @property {DynamicDropdownConfiguration<T>|DynamicModalConfiguration|null|function():(DynamicDropdownConfiguration<T>|DynamicModalConfiguration|null)} context A static context/config for the dropdown/modal, or a function which returns the context/config dynamically when needed.
 * @property {'dropdown'|'modal'} contextType The type of the context and what the context options should be used for.
 * @property {T=} value Value of this button, which gets updated on each context resolve.
 * @property {OverlayElementControl} contextControl The control for the latest opened context overlay element.
 * @property {function(): boolean} isOpen If the Context is currently open. Shortcut to `contextControl?.isOpen?.()`
 * @property {function(): void} closeContext Force closes the context if it's available, and clears the reference to the control.
 * @property {function(T):void} contextResolve Callback/Hook when the context has been successfully resolved.
 * @property {function(*):void} contextReject Callback/Hook when the context has been aborted/closed.
 */
/**
 * @template {*} T
 * @typedef {Button & ContextButtonProperties<T>} ContextButton
 */

define([
    'jquery',
    'ui/button',
    'ui/dropdown',
    'ui/modal',
    'ui/utils'
], function (
    $,
    Button,
    Dropdown,
    Modal,
    Utils
) {
    'use strict';

    /** @type {ContextButton} */
    var ContextButton = Button.extend(/** @type {ContextButton} */({
        type: 'context-button',

        context: null,

        contextType: 'dropdown',

        value: null,

        contextControl: null,

        init: function() {
            this._super();

            this._$buttonElement.addClass('context-button');
            this._$buttonElement.append($('<i>', {
                class: 'aloha-button-icon aloha-button-secondary-icon material-symbols-outlined',
                text: 'arrow_drop_down',
            }));
        },

        _onClick: function () {
            this.touch();
            this.click();
            this._handleContextClick();
        },

        _handleContextClick: function() {
            var _this = this;
            var controlPromise;

            var contextData;
            if (typeof this.context === 'function') {
                contextData = this.context();
            } else {
                contextData = this.context;
            }

            // Ignore if no data has been provided
            if (contextData == null) {
                return;
            }

            if (this.contextType === 'dropdown') {
                controlPromise = Dropdown.openDynamicDropdown(this.name, contextData);
            } else if (this.contextType === 'modal') {
                controlPromise = Modal.openDynamicModal(contextData);
            } else {
                throw new Error('Unsupported contextType "' + this.contextType + '" set!');
            }

            controlPromise
                .then(function (control) {
                    _this.contextControl = control;
                    return control.value;
                })
                .then(function (contextValue) {
                    this.value = contextValue;
                    if (typeof _this.changeNotify === 'function') {
                        _this.changeNotify(contextValue);
                    }
                    _this.contextResolve(contextValue);
                    _this.contextControl = null;
                })
                .catch(function (error) {
                    _this.contextReject(error);
                    _this.contextControl = null;

                    // This is a "notification" error which can be safely dismissed.
                    if (Utils.isUserCloseError(error)) {
                        return;
                    }

                    console.error('Error while opening dynamic overlay for context button', _this, error);
                });
        },

        isOpen: function() {
            return this.contextControl != null && this.contextControl.isOpen();
        },
        closeContext: function() {
            if (this.contextControl == null) {
                return;
            }
            this.contextControl.close();
            this.contextControl = null;
        },

        setValue: function (value) {
            this.value = value;
        },
        getValue: function () {
            return this.value;
        },

        // Override me for notifications
        contextResolve: function(value) {},
        contextReject: function(err) {},
    }));

    return ContextButton;
});