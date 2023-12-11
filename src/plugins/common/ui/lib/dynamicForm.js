define([
    'jquery',
    'ui/ui',
    'ui/arena',
    'ui/button',
    'ui/toggleButton',
    'ui/accordionMenuButton',
    'ui/menuButton',
    'ui/autocomplete',
    'ui/input',
    'ui/port-helper-attribute-field',
    'ui/port-helper-multi-split'
], function (
    $,
    Ui,
    Arena,
    Button,
    ToggleButton,
    AccordionMenuButton,
    MenuButton,
    Autocomplete,
    Input,
    AttributeField,
    MultiSplitButton
) {
    'use strict';

    var arenaCounter = 1;
    var componentCounter = 1;
    var noopFn = function () { /* Do nothing */ }

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
            var container = $('<div>');
            container.addClass('dynamic-component-container');
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

        // Create a copy of the reference with read-only properties
        var returnValue = {};
        Object.keys(formReference).forEach(function(referenceKey) {
            Object.defineProperty(returnValue, referenceKey, {
                get: function() {
                    return formReference[referenceKey];
                },
                set: noopFn
            });
        });

        $form._alohaForm = returnValue;

        return returnValue;
    }

    function buildDynamicComponent(
        controlConfig,
        valueApplyFn,
        validationHandler,
        changeHandler,
        touchHandler
    ) {
        var control = {};
        var component = null;

        component = createComponentFromConfig(
            controlConfig,
            function (value) {
                valueApplyFn(value);
            },
            validationHandler,
            changeHandler,
            touchHandler
        );

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
        },
            control.markAsPristine = function () {
                component.untouch();
            };

        return {
            component: component,
            control: control,
        }
    }

    function createComponentFromConfig(
        config,
        applyChanges,
        validateFn,
        onChangeFn,
        onTouchFn
    ) {
        var tmpArena = Ui.adopt('modalArena-' + arenaCounter + '_' + config.type, Arena);
        arenaCounter++;
        var componentName = 'modalComponent-' + componentCounter + '_' + config.type;

        switch (config.type) {
            case 'button': {
                var component = Ui.adopt(componentName, Button, {
                    changeNotify: function () {
                        if (config.options != null && typeof config.options.onClick === 'function') {
                            config.options.onClick();
                        }
                    },
                    touchNotify: function () {
                        onTouchFn();
                    }
                });
                tmpArena.adopt(component);
                return component;
            }

            case 'toggle-button': {
                var component = Ui.adopt(componentName, ToggleButton, {
                    changeNotify: function (value) {
                        applyChanges(value);
                        if (config.options != null && typeof config.options.onClick === 'function') {
                            config.options.onClick(value);
                        }
                        validateFn(value);
                        onChangeFn(value);
                    },
                    touchNotify: function () {
                        onTouchFn();
                    }
                });
                tmpArena.adopt(component);
                return component;
            }

            case 'accordion-menu-button': {
                var tmpOptions = config.options || {};
                var component = Ui.adopt(componentName, AccordionMenuButton, {
                    menu: tmpOptions.menu,
                    tooltip: tmpOptions.tooltip,
                    text: tmpOptions.text,
                    html: tmpOptions.html,
                    iconUrl: tmpOptions.iconUrl,

                    changeNotify: function (value) {
                        applyChanges(value);
                    },
                    touchNotify: function () {
                        onTouchFn();
                    },
                });
                return component;
            }

            case 'menu-button': {
                var tmpOptions = config.options || {};
                var component = Ui.adopt(componentName, MenuButton, {
                    click: tmpOptions.onClick,
                    menu: tmpOptions.menu,
                    text: tmpOptions.text,
                    html: tmpOptions.html,
                    iconUrl: tmpOptions.iconUrl,
                    siblingContainer: tmpOptions.siblingContainer,

                    changeNotify: function (value) {
                        applyChanges(value);
                    },
                    touchNotify: function () {
                        onTouchFn();
                    },
                });
                return component;
            }

            case 'autocomplete': {
                var tmpOptions = config.options || {};
                var component = Ui.adopt(componentName, Autocomplete, {
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

            case 'input': {
                var component = Ui.adopt(componentName, Input, {
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

            case 'attribute-field': {
                var tmpOptions = config.options || {};
                var component = new AttributeField({
                    name: componentName,
                    label: tmpOptions.label,
                    targetObject: tmpOptions.targetObject,
                    labelClass: tmpOptions.labelClss,
                    valueField: tmpOptions.valueField,
                    displayField: tmpOptions.displayField,
                    objectTypeFilter: tmpOptions.objectTypeFilter,
                    placeholder: tmpOptions.placeholder,
                    noTargetHighlight: tmpOptions.noTargetHighlight,
                    targetHighlightClass: tmpOptions.targetHighlightClass,
                    cls: tmpOptions.cls,
                    element: tmpOptions.element,
                    width: tmpOptions.width,
                    scope: tmpOptions.scope,
                    open: tmpOptions.open,
                    modifyValue: tmpOptions.modifyValue,

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

            case 'multi-split': {
                var tmpOptions = config.options || {};
                var component = new MultiSplitButton({
                    name: componentName,
                    scope: tmpOptions.scope,
                    items: tmpOptions.items,

                    changeNotify: function (value) {
                        applyChanges(value);
                    },
                    touchNotify: function () {
                        onTouchFn();
                    },
                });
                return component;
            }

            case 'text':
                return {
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
    }

    return {
        buildDynamicComponent: buildDynamicComponent,
        buildDynamicForm: buildDynamicForm,
        createComponentFromConfig: createComponentFromConfig,
    };
});