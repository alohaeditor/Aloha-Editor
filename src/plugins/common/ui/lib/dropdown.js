define([
    'jquery',
    'ui/ui',
    'ui/dynamicForm',
    'ui/overlayElement',
    'i18n!ui/nls/i18n',
], function (
    $,
    Ui,
    DynamicForm,
    OverlayElement,
    i18n
) {
    'use strict';

    // Note: Typings are in overlayElement

    /**
     * Opens a modal with a dynamic form configuration.
     * @template {*} T
     * @param {string} componentName - The name of the component to where the dropdown should be opened to.
     * @param {DynamicDropdownConfiguration.<T>} config - The config for how to open the dropdown and what to display.
     * @returns {Promise.<OverlayElementControl.<T>>} - A Promise for a overlay element control.
     */
    function openDynamicDropdown(componentName, config) {
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
                confirmButton.on('click', function() {
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
            control: control
        };
    }

    return {
        openDynamicDropdown: openDynamicDropdown,
    };
});