define([
    'ui/button',
    'ui/dropdown',
    'ui/modal',
    'ui/overlayElement'
], function (
    Button,
    Dropdown,
    Modal,
    OverlayElement
) {
    'use strict';

    var ContextButton = Button.extend({
        type: 'context-button',

        /**
         * @type {(DynamicDropdownConfiguration|DynamicModalConfiguration|function.<DynamicDropdownConfiguration|DynamicModalConfiguration>)}
         * A static context/config for the dropdown/modal, or a function which returns the context/config dynamically when needed.
         */
        context: null,

        /**
         * @type {string} The type of the context and what the context options should be used for.
         *      Allowed values: 'dropdown', 'modal'
         */
        contextType: 'dropdown',

        /**
         * Value of this button, which gets updated on each context resolve.
         * @type {*}
         */
        value: null,

        /**
         * The control for the latest opened context overlay element.
         * @type {OverlayElementControl}
         */
        contextControl: null,

        init: function() {
            this._super();

            this.element.addClass('context-button');
            this.element.append('<span class="ui-button-icon-secondary ui-icon aloha-jqueryui-icon ui-icon-triangle-1-s"></span>');
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
                    if (
                        error instanceof OverlayElement.OverlayCloseError
                        && error.reason !== OverlayElement.ClosingReason.ERROR
                    ) {
                        // This is a "notification" error which can be safely dismissed.
                        _this.contextControl = null;
                        return;
                    }

                    console.error('Error while opening dynamic dropdown for context button', this, error);
                    _this.contextControl = null;
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
    });

    return ContextButton;
});