/** @typedef {import('./overlayElement').DynamicDropdownConfiguration} DynamicDropdownConfiguration */
/** @typedef {import('./overlayElement').DynamicModalConfiguration} DynamicModalConfiguration */
/** @typedef {import('./overlayElement').OverlayElementControl} OverlayElementControl */

define([
    'jquery',
    'aloha',
    'ui/dynamicForm',
    'ui/overlayElement',
    'i18n!ui/nls/i18n'
], function(
    $,
    Aloha,
    DynamicForm,
    OverlayElement,
    i18n
) {

    var Ui;

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

        var changeNotify = function() { }
        var dropdownData = createDynamicDropdown(config, function() {
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
        var reject = function() {}

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
                dropdownData.confirmButton.on('click', function() {
                    resolveIfValid();
                });
            } else {
                changeNotify = function() {
                    resolveIfValid();
                };
            }
        });

        return Promise.resolve({
            close: function() {
                if (open) {
                    closeDropdown();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.API));
                }
            },
            open: function() {
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
            config,
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
        var reject = function() {}

        function closeModal() {
            Object.values(generatedForm.components).forEach(function(comp) {
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
            close: function() {
                if (open) {
                    closeModal();
                    reject(new OverlayElement.OverlayCloseError(OverlayElement.ClosingReason.API));
                }
            },
            isOpen: function() {
                return open;
            },
            value: modalValue,
        });
    }

    return {
        openDynamicDropdown: openDynamicDropdown,
        openDynamicModal: openDynamicModal,
    };
});
