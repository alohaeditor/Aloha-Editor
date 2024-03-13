/**
 * @template {*} T
 * @typedef {object} OverlayElementControl
 * 
 * @property {VoidFunction} close - Closes the overlay element if it isn't closed yet.
 * @property {function} isOpen - Returns if the overlay element is still open.
 * @property {Promise.<T>} value - A Promise of the value returned by rhe overlay element.
 */

/**
 * @template {*} T
 * @typedef {object} OverlayElementSettings
 * 
 * @property {T=} initialValue - Value of the form/component and what it's starting value is.
 * @property {boolean=} closeOnEscape - If the overlay eleemnt should close when the escape key is being pressed.
 * @property {boolean=} closeOnOverlayClick - If the overlay element should close when the user clicks outside of it.
 */

/**
 * @typedef {function} VoidFunction
 * 
 * @returns {void} - Nothing
 */

/**
 * @template {*} T
 * @typedef {function} SetterFunction
 * 
 * @param {T} value - The value to set
 * 
 * @returns {void} - Nothing
 */

/**
 * @template {*} T
 * @typedef {object} ExposedControl
 * 
 * @property {T} value - Readonly. The current value of the control.
 * @property {boolean} enabled - Readonly. If the control is currently enabled.
 * @property {boolean} dirty - Readonly. If the control has been touched by the user.
 * @property {boolean} pristine - Readonly. If the control has not yet been touched by the user.
 * @property {boolean} valid - Readonly. If the control is valid.
 * @property {SetterFunction.<T>} setValue - Setter for the value.
 * @property {VoidFunction} enable - Enables this control.
 * @property {VoidFunction} disable - Disables this control.
 * @property {VoidFunction} markAsDirty - Marks this control as touched by the user.
 * @property {VoidFunction} markAsPristine - Marks this control as untouched by the user.
 */

/**
 * @template {*} T
 * @typedef {callback} ValidationCallback
 * 
 * @param {T} value - Value of the control (component or form).
 * 
 * @returns {(null|object.<string.*>)} A validation result, where `null` indicates it's valid, otherwise an object with
 *      error entries (i.E. `{ required: true, regexp: '^\w+$' }`).
 */

/**
 * @template {*} T
 * @typedef {callback} ChangeCallback
 * 
 * @param {T} value - The value of the control (component or form).
 * @param {ExposedControl.<T>} control - The control for the form or component.
 * 
 * @returns {void}
 */

/**
 * @template {*} T
 * @typedef {object} DynamicControlConfiguration
 * 
 * @property {string} type - The type of the component which is supposed to handle the value.
 * @property {object.<string, *>=} options - Options for the component. Is component dependend.
 * @property {ValidationCallback.<T>=} validate - A validation function for the control.
 * @property {ChangeCallback.<T>=} onChange - A callback which gets called whenever the value changes.
 */

/**
 * @template {*} T
 * @typedef {object} DynamicFormModalConfigurationProperties
 *
 * @property {string} title - Title of the Modal.
 * @property {object.<string, DynamicControlConfiguration} controls - Control configuration to generate the form with.
 * @property {ValidationCallback.<T>=} validate - A validation function for the entire form.
 * @property {ChangeCallback.<T>=} onChange - A callback which gets called whenever the value changes.
 */

/**
 * @template {*} T
 * @typedef {OverlayElementSettings.<T> & DynamicFormModalConfigurationProperties.<T>} DynamicFormModalConfiguration
 */

/**
 * @typedef {object} DynamicDropdownConfigurationProperties
 * 
 * @property {boolean=} resolveWithConfirmButton - If the dropdown should render a confirm button
 *      and only resolve, when the confirm button has been clicked.
 *      This changes the behaviour from resolving as soon as a valid value has been selected.
 */

/**
 * @template {*} T
 * @typedef {OverlayElementSettings.<T> & DynamicControlConfiguration.<T> & DynamicDropdownConfigurationProperties} DynamicDropdownConfiguration
 */

/**
 * @typedef {object} BaseDialogConfiguration
 * @property {string} title Title of the Dialog
 * @property {string} text Text/Description of the dialog for the user.
 */

/**
 * @typedef {object} ConfirmDialogConfigurationProps
 * 
 * @property {VoidFunction} yes The function to call, when the user acceps the dialog.
 * @property {VoidFunction} no The function to call, when the user denies the dialog.
 * @property {SetterFunction.<boolean>} answer Function which is called when the user acceps or denies the dialog.
 */

/**
 * @typedef {BaseDialogConfiguration & ConfirmDialogConfigurationProps} ConfirmDialogConfiguration
 */

/**
 * @typedef {BaseDialogConfiguration} AlertDialogConfiguration
 */

define([], function () {
    'use strict';

    /**
     * Pseudo Enum for the various reasons a overlay element can be closed for.
     */
    var ClosingReason = {
        /** Closed by user by using the ESC key */
        ESCAPE: 'escape',
        /** Closed by user by clicking on the overlay */
        OVERLAY_CLICK: 'overlay-click',
        /** Closed by the user by canceling it (usually a cancel button) */
        CANCEL: 'cancel',
        /** Closed programatically via the API */
        API: 'api',
        /** Closed due to unforseen error */
        ERROR: 'error',
    }

    Object.freeze(ClosingReason);

    function OverlayCloseError(reasonOrError, message) {
        var instance;

        if (reasonOrError instanceof Error) {
            instance = reasonOrError;
            instance.reason = ClosingReason.ERROR;
            if (!message) {
                message = getDefaultErrorMessage(instance.reason);
            }
        } else {
            instance = Error(message);
            instance.reason = reasonOrError;
            if (!instance.message) {
                instance.message = getDefaultErrorMessage(instance.reason);
            }
        }

        Object.setPrototypeOf(instance, Object.getPrototypeOf(this));

        return instance;
    }

    function getDefaultErrorMessage(reason) {
        switch (reason) {
            case ClosingReason.ESCAPE:
                return 'Closed by user via ESC key';
            case ClosingReason.CANCEL:
                return 'Closed by user cancel';
            case ClosingReason.API:
                return 'Closed programmatically via API';
            case ClosingReason.OVERLAY_CLICK:
                return 'Closed by user by clicking the overlay';
            case ClosingReason.ERROR:
                return 'Closed due to unforseen error';
            default:
                return 'Unknown error/reason';
        }
    }

    OverlayCloseError.prototype = Object.create(Error.prototype, {
        constructor: {
            value: Error,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
    if (Object.setPrototypeOf) {
        Object.setPrototypeOf(OverlayCloseError, Error);
    } else {
        OverlayCloseError.__proto__ = Error;
    }

    return {
        OverlayCloseError: OverlayCloseError,
        ClosingReason: ClosingReason,
    };
});