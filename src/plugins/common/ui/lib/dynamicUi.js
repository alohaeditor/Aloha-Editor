/** @typedef {import('./overlayElement').DynamicDropdownConfiguration} DynamicDropdownConfiguration */
/** @typedef {import('./overlayElement').DynamicModalConfiguration} DynamicModalConfiguration */
/** @typedef {import('./overlayElement').OverlayElementControl} OverlayElementControl */

define([
    'jquery',
    'aloha',
    'ui/dynamicForm',
    'ui/overlayElement',
    'i18n!ui/nls/i18n'
], function (
    $,
    Aloha,
    DynamicForm,
    OverlayElement,
    i18n
) {

    var Ui;

    function makeDialogDiv(props) {
        var textOrHtml = {};
        if (props.text) {
            textOrHtml.text = props.text;
        }
        if (props.html) {
            textOrHtml.html = props.html;
        }
        return $('<div>', textOrHtml);
    }

    /**
     * Wraps the callback function so to destory the dialog when the callback is
     * invoked.
     *
     * @param {function} callback
     * @return {function} Wrapped callback.
     */
    function callbackAndDestroy(callback) {
        return function () {
            callback.apply(this);
            $(this).dialog('destroy').remove();
        };
    }

    function wrapDialogButtons(buttons) {
        // Buttons automatically close the dialog for convenience
        var title;
        for (title in buttons) {
            if (buttons.hasOwnProperty(title)) {
                buttons[title] = callbackAndDestroy(buttons[title]);
            }
        }
        return buttons;
    }

    function makeDialogProps(props, defaultTitle) {
        // All root elements of widgets added to the page by aloha should have the class 'aloha'.
        // All ui elements should have the class aloha-ui.
        // aloha-dialog is used for a hack to prevent a click in the
        // dialog from bluggin the editable search for aloha-dialog in
        // the aloha core for more information.
        var cls = 'aloha aloha-dialog aloha-ui';
        if (props.cls) {
            cls += ' ' + props.cls;
        }
        return {
            'resizable': false,
            'modal': true,
            'title': props.title || defaultTitle,
            'dialogClass': cls,
            'zIndex': 10200
        };
    }

    /**
     * Shows a confirm dialog.
     *
     * A confirm dialog has a confirm icon and style and yes and no buttons.
     *
     * @param props is an object with the following properties (all optional):
     *          title - the title of the dialog
     *           text - either the text inside the dialog
     *           html - or the html inside the dialog
     *            yes - makes a "Yes" button in the dialog and invokes the given callback if it is pressed.
     *             no - makes a "No" button in the dialog and invokes the given callback if it is pressed.
     *         answer - makes a "Yes" and "No" button in the dialog and pressing either will invoke the
     *                  callback with the answer as a boolean argument. Does not interfere with yes and
     *                  no properties.
     *            cls - the root element of the dialog will receive this class
     *        buttons - an object where the properties are button titles and the values are callbacks
     *        Button callbacks will receive the dialog element as context.
     *        Pressing any buttons in the dialog will automatically close the dialog.
     * @return
     *        A function that can be called to close the dialog.
     */
    function openConfirmDialog(props) {
        var buttons = props.buttons || {};

        var yesLabel = i18n.t('button.yes.label');
        var noLabel = i18n.t('button.no.label');

        // block adds backwards compatibility to still be able to use
        // 'buttons.Yes/No' for setting functionality of basic buttons
        if (buttons.Yes !== null && yesLabel !== 'Yes') {
            buttons[yesLabel] = buttons.Yes;
            delete buttons.Yes;
        }
        if (buttons.No !== null && noLabel !== 'No') {
            buttons[noLabel] = buttons.No;
            delete buttons.No;
        }

        buttons[yesLabel] = buttons[yesLabel] || props.yes || $.noop;
        buttons[noLabel] = buttons[noLabel] || props.no || $.noop;

        if (props.answer) {
            var yes = buttons[yesLabel];
            var no = buttons[noLabel];
            buttons[yesLabel] = function () {
                yes();
                props.answer(true);
            };
            buttons[noLabel] = function () {
                no();
                props.answer(false);
            };
        }
        var dialog = makeDialogDiv(props).dialog(
            $.extend(makeDialogProps(props, 'Confirm'), {
                'buttons': wrapDialogButtons(buttons)
            })
        );
        return function () {
            dialog.dialog('destroy').remove();
        };
    }

    /**
     * Shows an alert dialog.
     *
     * An alert dialog has an alert icon and style and a dismiss button.
     *
     * @param props is an object with the following properties (all optional)
     *        title - the title of the dialog
     *        text - either the text inside the dialog
     *        html - or the html inside the dialog
     *        cls - the root element of the dialog will receive this class
     * @return
     *        A function that can be called to close the dialog.
     */
    function openAlertDialog(props) {
        var propsExtended = {};
        propsExtended[i18n.t('button.dismiss.label')] = $.noop;
        var dialog = makeDialogDiv(props).dialog(
            $.extend(makeDialogProps(props, 'Alert'), {
                'buttons': wrapDialogButtons(propsExtended)
            })
        );
        return function () {
            dialog.dialog('destroy').remove();
        };
    }

    /**
     * Opens a modal with a dynamic form configuration.
     * @template {*} T
     * @param {string} componentName - The name of the component to where the dropdown should be opened to.
     * @param {DynamicDropdownConfiguration.<T>} config - The config for how to open the dropdown and what to display.
     * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
     */
    function openDynamicDropdown(componentName, config) {
        if (Ui == null) {
            Ui = Aloha.require('ui/ui');
        }

        var targetComponent = Ui.getAdoptedComponent(componentName);
        if (targetComponent == null) {
            return Promise.reject(new Error('Could not find target component "' + componentName + '"!'));
        }

        var changeNotify = function () { }
        var dropdownData = createDynamicDropdown(config, function () {
            changeNotify();
        });

        if (dropdownData == null) {
            return Promise.reject(new Error('Could not create component from config!'));
        }

        var $dropdown = dropdownData.$dropdown;
        var component = dropdownData.component;
        var control = dropdownData.control;

        var $dropdownOverlay = $('<div>', { class: 'aloha aloha-dropdown-overlay' });
        $dropdownOverlay.appendTo(document.body);
        $dropdown.appendTo(document.body);

        var targetRect = $(targetComponent.element)[0].getBoundingClientRect();
        $dropdown.css({
            top: Math.ceil(targetRect.top) + Math.ceil(targetRect.height),
            left: Math.ceil(targetRect.left),
        });

        var open = true;
        var reject = function () { }

        function closeDropdown() {
            component.destroy();
            $dropdownOverlay.remove();
            $dropdown.remove();
            open = false;
        }

        var dropdownValue = new Promise(function (resolve, valReject) {
            reject = valReject;

            if (config.closeOnOverlayClick === undefined || !!config.closeOnOverlayClick) {
                $dropdownOverlay.on('click', function () {
                    closeDropdown();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.OVERLAY_CLICK));
                });
            }

            if (!!config.closeOnEscape) {
                $(window.document).on('keydown', function (event) {
                    if (event.key === 'Escape') {
                        closeDropdown();
                        reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.ESCAPE));
                    }
                });
            }

            function resolveIfValid() {
                if (component.validationErrors == null) {
                    var value = component.getValue();
                    closeDropdown();
                    resolve(value);
                }
            }

            if (!!config.resolveWithConfirmButton) {
                dropdownData.confirmButton.on('click', function () {
                    resolveIfValid();
                });
            } else {
                changeNotify = function () {
                    resolveIfValid();
                };
            }
        });

        return Promise.resolve({
            close: function () {
                if (open) {
                    closeDropdown();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.API));
                }
            },
            open: function () {
                return open;
            },
            value: dropdownValue,
        });
    }

    function createDynamicDropdown(config, changeNotify) {
        var $dropdown = $('<div>', { class: 'aloha aloha-ui aloha-dropdown ui-widget' });
        var $dropdownContainer = $('<div>', { class: 'dropdown-content-container' });
        var $dropdownContent = $('<div>', { class: 'dropdown-content' });
        var $confirmButton = $('<button>', {
            class: 'dropdown-confirm-button',
            text: i18n.t('button.confirm.label'),
        }).hide();

        function applyValueHandler(value) {
            // Noop, as the value is already set in the component
        }

        function validationHandler(value) {
            if (typeof config.validate === 'function') {
                component.validationErrors = config.validate(value);
            }

            if (component.validationErrors == null) {
                $dropdownContent.addClass('valid').removeClass('invalid');
                $confirmButton.removeAttr('disabled');
            } else {
                $dropdownContent.addClass('invalid').removeClass('valid');
                $confirmButton.attr('disabled', 'disabled');
            }
        }

        function changeHandler(value) {
            if (typeof config.onChange === 'function') {
                config.onChange(value, control);
            }
            changeNotify();
        }

        function touchHandler() {
            component.touched = true;
        }

        var component = DynamicForm.createComponentFromConfig(
            Object.assign({}, config, { renderContext: 'dropdown' }),
            applyValueHandler,
            validationHandler,
            changeHandler,
            touchHandler
        );

        if (!component) {
            return null;
        }

        if (config.initialValue !== undefined) {
            component.setValue(config.initialValue);
        }
        var control = DynamicForm.createControlFromComponent(component, validationHandler);
        validationHandler(component.getValue());

        $dropdown.append($dropdownContainer);
        $dropdownContainer.append($dropdownContent, $confirmButton);
        $dropdownContent.append(component.element);

        if (!!config.resolveWithConfirmButton) {
            $confirmButton.show();
        }

        $dropdown[0]._alohaDropdown = {
            component: component,
            control: control,
        };

        return {
            $dropdown: $dropdown,
            component: component,
            control: control,
            confirmButton: $confirmButton
        };
    }

    /**
     * Opens a modal with a dynamic form configuration.
     * @template {*} T
     * @param {DynamicFormModalConfiguration.<T>} config - The config for how to open the modal and what to do with it.
     * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
     */
    function openDynamicModal(config) {
        var $modalOverlay = $('<div>', { class: 'aloha aloha-modal-overlay ui-widget' });

        var $modal = $('<div>', {
            class: 'aloha aloha-ui aloha-modal ui-widget',
            modal: true,
        });

        // Build the header
        var $modalHeader = $('<div>', {
            class: 'modal-header',
            html: '<div class="header-title">' + config.title + '</div>'
        });

        // Build the body
        var $modalBody = $('<div>', { class: 'modal-body' });
        var $modalBodyContainer = $('<div>', { class: 'modal-body-container' });

        // Build the footer
        var $modalFooter = $('<div>', { class: 'modal-footer' });
        var $cancelButton = $('<button>', {
            class: 'footer-button cancel-button',
            text: i18n.t('button.cancel.label'),
        });
        var $confirmButton = $('<button>', {
            class: 'footer-button confirm-button',
            text: i18n.t('button.confirm.label'),
        });
        $modalFooter.append($cancelButton, $confirmButton);

        var generatedForm;

        function updateFormDOMValidity() {
            if (!generatedForm) {
                return;
            }

            if (!generatedForm.control.valid) {
                $confirmButton.attr('disabled', 'disabled');
                generatedForm.$element
                    .addClass('form-invalid')
                    .removeClass('form-valid');
            } else {
                $confirmButton.removeAttr('disabled');
                generatedForm.$element
                    .addClass('form-valid')
                    .removeClass('form-invalid');
            }
        }

        // Build the form and append it correctly
        generatedForm = DynamicForm.buildDynamicForm(config, updateFormDOMValidity);
        $modalBodyContainer.append(generatedForm.$element);
        $modalBody.append($modalBodyContainer);

        // Append all modal parts to the modal
        $modal.append($modalHeader);
        $modal.append($modalBody);
        $modal.append($modalFooter);

        // prevent scrolling while modal is open
        $(document.body).css('overflow', 'none');
        $modalOverlay.appendTo(document.body);
        $modal.appendTo(document.body);

        var open = true;
        var reject = function () { }

        function closeModal() {
            Object.values(generatedForm.components).forEach(function (comp) {
                comp.destroy();
            });
            $modalOverlay.remove();
            $modal.remove();
            $(document.body).css('overflow', '');
            open = false;
        }

        var modalValue = new Promise(function (resolve, valReject) {
            reject = valReject;

            $cancelButton.on('click', function () {
                closeModal();
                reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.CANCEL));
            });

            $confirmButton.on('click', function () {
                closeModal();
                resolve(generatedForm.value);
            });

            if (!!config.closeOnOverlayClick) {
                $modalOverlay.on('click', function () {
                    closeModal();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.OVERLAY_CLICK));
                });
            }

            if (!!config.closeOnEscape) {
                $(window.document).on('keydown', function (event) {
                    if (event.key === 'Escape') {
                        closeModal();
                        reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.ESCAPE));
                    }
                });
            }
        });

        return Promise.resolve({
            close: function () {
                if (open) {
                    closeModal();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.API));
                }
            },
            isOpen: function () {
                return open;
            },
            value: modalValue,
        });
    }

    return {
        openDynamicDropdown: openDynamicDropdown,
        openDynamicModal: openDynamicModal,
        openAlertDialog: openAlertDialog,
        openConfirmDialog: openConfirmDialog,
    };
});
