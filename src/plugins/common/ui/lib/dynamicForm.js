define([
    'jquery',
    'ui/ui',
    'ui/button',
    'ui/toggleButton',
    'ui/splitButton',
    'ui/toggleSplitButton',
    'ui/autocomplete',
    'ui/checkbox',
    'ui/input',
    'ui/selectMenu',
    'ui/colorPicker',
    'ui/iframe'
], function (
    $,
    Ui,
    Button,
    ToggleButton,
    SplitButton,
    ToggleSplitButton,
    Autocomplete,
    Checkbox,
    Input,
    SelectMenu,
    ColorPicker,
    IFrameComponent
) {
    'use strict';

    var componentCounter = 1;
    var noopFn = function () { /* Do nothing */ }

    var componentFactoryRegistry = {
        'button': createButtonFromConfig,
        'toggle-button': createToggleButtonFromConfig,
        'split-button': createSplitButtonFromConfig,
        'toggle-split-button': createToggleSplitButtonFromConfig,
        'autocomplete': createAutocompleteFromConfig,
        'checkbox': createCheckboxFromConfig,
        'input': createInputFromConfig,
        'text': createTextFromConfig,
        'select-menu': createSelectMenuFromConfig,
        'color-picker': createColorPickerFromConfig,
        'iframe': createIFrameFromConfig,
    };

    function buildDynamicForm(config, postChangeFn) {
        var $form = $('<form>', { class: 'aloha-ui aloha-dynamic-form' });
        // Don't actually submit the form
        $form.on('submit', function (event) {
            event.preventDefault();
        });

        var formReference = {
            $element: $form,
            controls: {},
            components: {},
            value: structuredClone(config.initialValue || {}),
            enabled: true,
            touched: false,
            validationErrors: null,
            controlErrors: null,
        };

        // Flag which is only set temporarily when starting the validation for the whole form.
        // Done to only run the form validation once, and not for all controls all the time.
        var runningAllChecks = false;

        function forwardPostChangeFn() {
            if (typeof postChangeFn === 'function') {
                postChangeFn();
            }
        }

        function checkForControlErrors() {
            var invalidControls = Object.entries(formReference.components).map(function (entry) {
                return [entry[0], entry[1].validationErrors];
            }).filter(function (tuple) {
                return tuple[1] != null;
            });

            if (invalidControls.length === 0) {
                formReference.controlErrors = null;
                return;
            }

            var mappedErrors = {
                controls: invalidControls.reduce(function (acc, tuple) {
                    acc[tuple[0]] = tuple[1];
                    return acc;
                }, {}),
            };

            formReference.controlErrors = mappedErrors;
        }

        var formControl = {
            setValue: function (value) {
                if (value == null) {
                    value = Object.entries(value).reduce(function (acc, entry) {
                        acc[entry[0]] = null;
                    }, {});
                } else {
                    var missingControls = Object.keys(formReference.controls).filter(function (controlName) {
                        return !value.hasOwnProperty(controlName)
                    });
                    if (missingControls.length > 0) {
                        throw new Error('Missing value for controls "' + missingControls.join('", "') + '"!');
                    }
                }

                formReference.value = structuredClone(value);

                // Update all components
                Object.entries(value).forEach(function (entry) {
                    formReference.components[entry[0]].setValue(entry[1]);
                });
            },
            enable: function () {
                formReference.enabled = true;
                $form.removeAttr('disabled');
            },
            disable: function () {
                formReference.enabled = false;
                $form.attr('disabled', 'disabled');
            },
            markAsDirty: function () {
                formReference.touched = true;
            },
            markAsPristine: function () {
                formReference.touched = false;
            },
            updateValueAndValidity: function() {
                runningAllChecks = true;
                // Run the validation on all controls, and then this validation handler again
                Object.values(formReference.controls).forEach(function (control) {
                    control.updateValueAndValidity();
                });

                checkForControlErrors();

                if (typeof config.validate === 'function') {
                    formReference.validationErrors = config.validate(structuredClone(formReference.value));
                }

                runningAllChecks = false;

                forwardPostChangeFn();
            },
            controls: formReference.controls,
        };

        formReference.control = formControl;

        Object.defineProperties(formControl, {
            value: {
                get: function () {
                    return formReference.value;
                },
                set: noopFn,
            },
            enabled: {
                get: function () {
                    return formReference.enabled;
                },
                set: noopFn,
            },
            dirty: {
                get: function () {
                    return formReference.touched;
                },
                set: noopFn,
            },
            pristine: {
                get: function () {
                    return !formReference.touched;
                },
                set: noopFn,
            },
            errors: {
                get: function () {
                    if (formReference.controlErrors) {
                        return Object.assign({}, formReference.validationErrors || {}, formReference.controlErrors);
                    }

                    return formReference.validationErrors;
                },
                set: noopFn,
            },
            valid: {
                get: function () {
                    return formReference.controlErrors == null && formReference.validationErrors == null;
                },
                set: noopFn,
            },
        });

        Object.entries(config.controls).forEach(function (data) {
            var controlName = data[0];
            var controlConfig = data[1];

            var validationHandler = function (value) {
                if (typeof controlConfig.validate === 'function') {
                    componentData.component.validationErrors = controlConfig.validate(value);
                }
                if (runningAllChecks) {
                    return;
                }
                checkForControlErrors();
                if (typeof config.validate === 'function') {
                    formReference.validationErrors = config.validate(structuredClone(formReference.value));
                }
            };
            var changeHandler = function (value) {
                if (typeof controlConfig.onChange === 'function') {
                    controlConfig.onChange(value, componentData.control);
                }
                if (typeof config.onChange === 'function') {
                    config.onChange(value, formControl);
                }
                forwardPostChangeFn();
            };
            var touchHandler = function () {
                componentData.component.touched = true;
                formReference.touched = true;
            };

            var componentData = buildDynamicComponent(
                controlConfig,
                function (value) {
                    formReference.value[controlName] = value;
                },
                validationHandler,
                changeHandler,
                touchHandler
            );

            if (componentData == null) {
                return;
            }

            var container = $('<div>', {
                class: 'dynamic-component-container',
                attr: {
                    'data-control-name': controlName,
                    'data-component-type': controlConfig.type,
                },
            });
            container.append(componentData.component.element);
            $form.append(container);

            formReference.controls[controlName] = componentData.control;
            formReference.components[controlName] = componentData.component;
        });

        // Cleanup the form value
        if (formReference.value == null) {
            formReference.value = {};
        }

        // Default the values to null
        Object.keys(formReference.controls).forEach(function (controlName) {
            if (!formReference.value.hasOwnProperty(controlName)) {
                formReference.value[controlName] = null;
            } else if (formReference.value[controlName] !== undefined) {
                formReference.components[controlName].setValue(formReference.value[controlName]);
            }
        });

        // Run the validation once initially
        formReference.control.updateValueAndValidity();

        // Create a copy of the reference with read-only properties
        var returnValue = {};
        Object.keys(formReference).forEach(function (referenceKey) {
            Object.defineProperty(returnValue, referenceKey, {
                get: function () {
                    return formReference[referenceKey];
                },
                set: noopFn
            });
        });

        $form[0]._alohaForm = returnValue;

        return returnValue;
    }

    function buildDynamicComponent(
        controlConfig,
        valueApplyFn,
        validationHandler,
        changeHandler,
        touchHandler
    ) {
        var component = createComponentFromConfig(
            controlConfig,
            function (value) {
                valueApplyFn(value);
            },
            validationHandler,
            changeHandler,
            touchHandler
        );

        if (component == null) {
            return null;
        }

        return {
            component: component,
            control: createControlFromComponent(component, validationHandler),
        }
    }

    function createControlFromComponent(component, validationHandler) {
        var control = {};

        // Readonly properties which need to be forwarded from the component
        Object.defineProperties(control, {
            value: {
                get: function () {
                    return component.getValue();
                },
                set: noopFn,
            },
            enabled: {
                get: function () {
                    return !component.disabled;
                },
                set: noopFn,
            },
            dirty: {
                get: function () {
                    return component.touched;
                },
                set: noopFn,
            },
            pristine: {
                get: function () {
                    return !component.touched;
                },
                set: noopFn,
            },
            errors: {
                get: function () {
                    return component.validationErrors;
                },
                set: noopFn,
            },
            valid: {
                get: function () {
                    return component.isValid();
                },
                set: noopFn,
            },
        });

        control.setValue = function (value) {
            component.setValue(value);
            // Run validation again
            validationHandler(value);
        };
        control.enable = function () {
            component.enable();
        };
        control.disable = function () {
            component.disable();
        };
        control.markAsDirty = function () {
            component.touch();
        };
        control.markAsPristine = function () {
            component.untouch();
        };
        control.updateValueAndValidity = function() {
            validationHandler(component.getValue());
        };

        return control;
    }

    function createButtonFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, Button, {
            icon: tmpOptions.icon,
            tooltip: tmpOptions.tooltip,
            click: tmpOptions.onClick,

            changeNotify: function () {
                if (config.options != null && typeof config.options.onClick === 'function') {
                    config.options.onClick();
                }
            },
            touchNotify: function () {
                onTouchFn();
            }
        });
        return component;
    }

    function createToggleButtonFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, ToggleButton, {
            icon: tmpOptions.icon,
            tooltip: tmpOptions.tooltip,
            click: tmpOptions.onClick,

            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            }
        });
        return component;
    }

    function createSplitButtonFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, SplitButton, {
            icon: tmpOptions.icon,
            tooltip: tmpOptions.tooltip,
            click: tmpOptions.click,
            secondaryLabel: tmpOptions.secondaryLabel,
            secondaryClick: tmpOptions.secondaryClick,

            changeNotify: function () {
                if (config.options != null && typeof config.options.onClick === 'function') {
                    config.options.onClick();
                }
            },
            touchNotify: function () {
                onTouchFn();
            }
        });
        return component;
    }

    function createToggleSplitButtonFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, ToggleSplitButton, {
            icon: tmpOptions.icon,
            tooltip: tmpOptions.tooltip,
            click: tmpOptions.click,
            secondaryLabel: tmpOptions.secondaryLabel,
            secondaryClick: tmpOptions.secondaryClick,

            changeNotify: function () {
                if (config.options != null && typeof config.options.onClick === 'function') {
                    config.options.onClick();
                }
            },
            touchNotify: function () {
                onTouchFn();
            }
        });
        return component;
    }

    function createAutocompleteFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, Autocomplete, {
            types: tmpOptions.types,
            template: tmpOptions.template,

            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
        });
        return component;
    }

    function createCheckboxFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};

        var component = Ui.adopt(name, Checkbox, {
            checked: tmpOptions.checked,
            label: tmpOptions.label,

            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
        });

        return component;
    }

    function createInputFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};

        var component = Ui.adopt(name, Input, {
            value: tmpOptions.value,
            label: tmpOptions.checked,
            inputType: tmpOptions.inputType,

            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
        });
        return component;
    }

    function createTextFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        return {
            name: name,
            textContent: '',
            disabled: false,
            touched: false,
            validationErrors: null,
            element: $('<div class="text-wrapper"></div>'),

            setValue: function (value) {
                this.textContent = value;
                this.element.text(this.textContent);
            },
            getValue: function () {
                return this.textContent;
            },
            enable: function () {
                this.disabled = false;
            },
            disable: function () {
                this.disabled = true;
            },
            touch: function () {
                this.touched = true;
            },
            untouched: function () {
                this.touched = false;
            },
            isValid: function () {
                return this.validationErrors == null;
            },
        };
    }

    function createSelectMenuFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, SelectMenu, {
            options: tmpOptions.options,
            activeOption: tmpOptions.activeOption,
            iconsOnly: tmpOptions.iconsOnly,

            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
        });

        return component;
    }

    function createColorPickerFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, ColorPicker, {
            value: tmpOptions.value,
            palette: tmpOptions.palette,
            allowOutsidePalette: tmpOptions.allowOutsidePalette,
            allowCustomInput: tmpOptions.allowCustomInput,
            allowTransparency: tmpOptions.allowTransparency,
            allowClear: tmpOptions.allowClear,

            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
        });

        return component;
    }

    function createIFrameFromConfig(
        config,
        name,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpOptions = config.options || {};
        var component = Ui.adopt(name, IFrameComponent, {
            url: tmpOptions.url,
            value: tmpOptions.value,
            options: tmpOptions.options,
        
            changeNotify: function (value) {
                applyChanges(value);
                validateFn(value);
                onChangeFn(value);
            },
            touchNotify: function () {
                onTouchFn();
            },
        });
        
        return component;
    }

    function createComponentFromConfig(
        config,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var componentName = 'modalComponent-' + componentCounter + '_' + config.type;

        var factoryFn = componentFactoryRegistry[config.type];
        if (typeof factoryFn !== 'function') {
            console.debug('Could not find a component factory for component-type "' + config.type + '"! Component with config will be ignored:', config);
            return null;
        }

        return factoryFn(
            config,
            componentName,
            applyChanges,
            validateFn,
            onChangeFn,
            onTouchFn
        );
    }

    return {
        componentFactoryRegistry: componentFactoryRegistry,
        buildDynamicComponent: buildDynamicComponent,
        buildDynamicForm: buildDynamicForm,
        createControlFromComponent: createControlFromComponent,
        createComponentFromConfig: createComponentFromConfig,

        // Default factory functions
        createButtonFromConfig: createButtonFromConfig,
        createToggleButtonFromConfig: createToggleButtonFromConfig,
        createSplitButtonFromConfig: createSplitButtonFromConfig,
        createAutocompleteFromConfig: createAutocompleteFromConfig,
        createCheckboxFromConfig: createCheckboxFromConfig,
        createInputFromConfig: createInputFromConfig,
        createTextFromConfig: createTextFromConfig,
    };
});