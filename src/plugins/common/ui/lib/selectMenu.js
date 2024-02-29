/** @typedef {import('./overlayElement').DynamicControlConfiguration} DynamicControlConfiguration */

/**
 * @typedef {object} BaseSelectMenuOption
 * @property {string} id - Identifier of the option
 * @property {string} label - The Label which is being displayed to the user
 * @property {string=} icon - Icon to display for this option
 * @property {boolean=} iconHollow - If the icon should be displayed "hollow"
 * @property {boolean=} isMultiStep - If this option is a multi-step option
 */

/**
 * @template {*} T
 * @typedef {object} MultiStepOptionProperties
 * @property {true} isMultiStep - If this option is a multi-step option
 * @property {MultiStepOptionContext<T>} multiStepContext - Context for the multi step
 */

/**
 * @template {*} T
 * @typedef {BaseSelectMenuOption & MultiStepOptionProperties<T>} MultiStepOption
 */

/**
 * @template {*} T
 * @typedef {object} MultiStepOptionContextProperties
 * @property {string=} label - Label for the header. If left empty, will use the options label.
 * @property {T=} initialValue - The value of the component.
 * @property {boolean=} requiresConfirm - If it should not resolve unless a manual user confirmation is done.
 * @property {string=} confirmLabel - The label for the confirm button.
 */

/**
 * @template {*} T
 * @typedef {MultiStepOptionContextProperties<T> & DynamicControlConfiguration<T>} MultiStepOptionContext
 */

/**
 * @template {*=} T
 * @typedef {BaseSelectMenuOption | MultiStepOption<T>} SelectMenuOption
 */

define([
    'jquery',
    'aloha',
    'ui/component',
    'i18n!ui/nls/i18n'
], function (
    $,
    Aloha,
    Component,
    i18n
) {
    'use strict';

    // Class/Attribute constants
    var CLASS_ICONS_ONLY = 'icons-only';
    var CLASS_MULTISTEP_ACTIVE = 'multistep-active';
    var CLASS_OPTION_ACTIVE = 'active';
    var CLASS_HEADER_CONFIRM = 'with-confirm';
    var ATTR_OPTION_ID = 'data-id';
    var ATTR_ACTIVE_OPTION = 'data-active-id';

    /**
     * DynamicForm which is imported on `init`,
     * because this component is required by the dynamic form and would create a cyclic dependency.
     */
    var DynamicForm;

    var SelectMenu = Component.extend({
        type: 'select-menu',

        /** @type {Array.<SelectMenuOption>} The available options of this menu. */
        options: [],

        /** @type {string=} ID of the option which should be highlighted/marked differently. */
        activeOption: null,

        /** @type {boolean} If it should only display the icons/hide the option labels. */
        iconsOnly: false,

        // Internals

        _optionsContainerElement$: null,

        /**
         * @type {string=} ID of a multi-step option which is currently active.
         * Used to determine if it should display the multi-step component.
         */
        _activeMultistepOption: null,

        _multistepControl: null,
        _multistepComponent: null,

        _multistepContainerElement$: null,
        _multistepHeaderElement$: null,
        _mutlistepTitleElement$: null,
        _multistepConfirmButtonElement$: null,
        _multistepConfirmButtonLabelElement$: null,
        _multistepContentElement$: null,

        init: function () {
            this._super();

            if (!DynamicForm) {
                DynamicForm = Aloha.require('ui/dynamicForm');
            }

            var _this = this;

            this.element = $('<div>', {
                class: 'aloha-select-menu',
            });
            this._updateElementClasses();
            this._optionsContainerElement$ = $('<div>', {
                class: 'select-menu-options-container',
            }).appendTo(this.element);
            this._multistepContainerElement$ = $('<div>', {
                class: 'select-menu-multistep-container',
            }).appendTo(this.element);

            this._multistepHeaderElement$ = $('<div>', {
                class: 'select-menu-multistep-header',
            }).appendTo(this._multistepContainerElement$);

            this._multistepHeaderElement$.append(
                $('<button>', {
                    class: 'select-menu-multistep-backbtn',
                }).on('click', function() {
                    _this._cleanUpMultiStep();
                    _this._activeMultistepOption = null;
                    _this.element.removeClass(CLASS_MULTISTEP_ACTIVE);
                }).append(
                    $('<i>', {
                        class: 'material-symbols-outlined',
                        text: 'arrow_back',
                    }),
                    $('<span>', {
                        text: i18n.t('button.back.label'),
                    })
                )
            );

            this._mutlistepTitleElement$ = $('<div>', {
                class: 'select-menu-multistep-title',
            }).appendTo(this._multistepHeaderElement$);

            this._multistepConfirmButtonLabelElement$ = $('<span>', {
                text: i18n.t('button.confirm.label')
            });
            this._multistepConfirmButtonElement$ = $('<button>', {
                class: 'select-menu-multistep-confirmbtn',
            }).on('click', function() {
                _this._handleConfirm();
            }).append(
                $('<i>', {
                    class: 'material-symbols-outlined',
                    text: 'done'
                }),
                this._multistepConfirmButtonLabelElement$
            ).appendTo(this._multistepHeaderElement$);

            this._multistepContentElement$ = $('<div>', {
                class: 'select-menu-multistep-content',
            }).appendTo(this._multistepContainerElement$);

            this._renderOptions();
        },

        _renderOptions: function () {
            // Clear all previously option elements from the DOM
            this._optionsContainerElement$.children().remove();

            var _this = this;

            this.options.forEach(function (option) {
                var optionClasses = ['select-menu-option'];

                if (option.isMultiStep) {
                    optionClasses.push('multi-step');
                } else {
                    optionClasses.push('simple-option');
                }

                if (_this.activeOption && _this.activeOption === option.id) {
                    optionClasses.push(CLASS_OPTION_ACTIVE);
                }

                var attributes = {};
                attributes[ATTR_OPTION_ID] = option.id;

                var $optionElem = $('<button>', {
                    class: optionClasses.join(' '),
                    title: option.label || '',
                    attr: attributes,
                });

                if (option.icon) {
                    var $iconElem = $('<i>', {
                        class: 'select-menu-icon material-symbols-outlined',
                        text: option.icon,
                    });
                    if (option.iconHollow) {
                        $iconElem.addClass('hollow');
                    }
                    $optionElem.append(
                        $('<div>', {
                            class: 'select-menu-icon-wrapper',
                        }).append($iconElem)
                    );
                } else {
                    $optionElem.addClass('no-icon');
                }

                $optionElem.append($('<div>', {
                    class: 'select-menu-option-label',
                    text: option.label || '',
                }));

                if (option.isMultiStep) {
                    $optionElem.append($('<div>', {
                        class: 'select-menu-icon-wrapper select-menu-multi-step-icon-wrapper',
                    }).append(
                        $('<i>', {
                            class: 'select-menu-icon material-symbols-outlined',
                            text: 'chevron_right'
                        })
                    ));
                }

                $optionElem.on('click', function () {
                    _this._handleOptionClick(option);
                });

                _this._optionsContainerElement$.append($optionElem);
            });
        },

        setOptions: function (options) {
            this.options = options;

            // Check if the active options are still included.
            // If not, reset the active state of them.
            if (this.activeOption || this._activeMultistepOption) {
                var containsActive = false;
                var containsMulti = false;

                for (var i = 0; i < this.options.length; i++) {
                    containsActive |= this.options[i].id === this.activeOption;
                    containsMulti |= this.options[i].id === this._activeMultistepOption;

                    // If both have been found, we can stop early
                    if (containsActive && containsMulti) {
                        break;
                    }
                }

                if (!containsActive) {
                    this.activeOption = null;
                }
                if (!containsMulti) {
                    this._activeMultistepOption = null;
                }
                this._updateElementClasses();
            }

            this._renderOptions();
        },

        onSelect: function(event) {},

        _updateElementClasses: function () {
            if (this.iconsOnly) {
                this.element.addClass(CLASS_ICONS_ONLY);
            } else {
                this.element.removeClass(CLASS_ICONS_ONLY);
            }

            if (this.activeOption) {
                this.element.attr(ATTR_ACTIVE_OPTION, this.activeOption);
            } else {
                this.element.removeAttr(ATTR_ACTIVE_OPTION);
            }

            if (this._activeMultistepOption) {
                this.element.addClass(CLASS_MULTISTEP_ACTIVE);
            } else {
                this.element.removeClass(CLASS_MULTISTEP_ACTIVE);
            }
        },

        /**
         * @param {SelectMenuOption<*>} option 
         */
        _handleOptionClick: function (option) {
            if (this.disabled) {
                return;
            }

            this.touch();
            this.activeOption = option.id;
            this._updateActiveOption();

            if (option.isMultiStep) {
                this._handleMultistepActivation(option);
            } else {
                this._cleanUpMultiStep();
                this._activeMultistepOption = null;
                this.onSelect({ id: option.id });
                this.triggerChangeNotification();
            }
            this._updateElementClasses();
        },

        /**
         * @param {MultiStepOption<*>} option 
         */
        _handleMultistepActivation: function (option) {
            this._cleanUpMultiStep();

            this._activeMultistepOption = option.id;
            this._multistepConfirmButtonLabelElement$.text(option.multiStepContext.confirmLabel || i18n.t('button.confirm.label'));
            if (option.multiStepContext.requiresConfirm) {
                this._multistepHeaderElement$.addClass(CLASS_HEADER_CONFIRM);
            } else {
                this._multistepHeaderElement$.removeClass(CLASS_HEADER_CONFIRM);
            }
            var _this = this;

            var ref = DynamicForm.buildDynamicComponent(
                option.multiStepContext,
                function(value) {
                    // Apply value, noop
                },
                function(value) {
                    if (typeof option.multiStepContext.validate === 'function') {
                        ref.component.validationErrors = option.multiStepContext.validate(value);
                    } else {
                        ref.component.validationErrors = null;
                    }
                },
                function(value) {
                    _this._multistepConfirmButtonElement$.prop('disabled', !ref.control.valid);

                    if (typeof option.multiStepContext.onChange === 'function') {
                        option.multiStepContext.onChange(value);
                    }

                    if (option.multiStepContext.requiresConfirm) {
                        return;
                    }

                    _this.onSelect({ id: option.id, value: value });
                    _this.triggerChangeNotification();
                },
                function() {
                    ref.component.touched = true;
                    // Touch
                }
            );

            if (!ref) {
                return;
            }

            this._mutlistepTitleElement$.text(option.multiStepContext.label);
            this._multistepControl = ref.control;
            this._multistepComponent = ref.component;
            this._multistepControl.setValue(option.multiStepContext.initialValue);
            this._multistepControl.updateValueAndValidity();
            this._multistepConfirmButtonElement$.prop('disabled', !ref.control.valid);

            this._multistepContentElement$.append(ref.component.element);
        },

        _cleanUpMultiStep: function() {
            if (this._multistepComponent) {
                this._multistepComponent.destroy();
                this._multistepComponent = null;
            }
            this._multistepControl = null;
            this._multistepContentElement$.children().remove();
        },

        _handleConfirm: function() {
            if (!this._multistepControl.valid) {
                return;
            }
            this.onSelect({ id: this._activeMultistepOption.id, value: this._multistepControl.value });
            this.triggerChangeNotification();
        },

        _updateActiveOption: function () {
            var currentlyActive = this._optionsContainerElement$.find('.select-menu-option.' + CLASS_OPTION_ACTIVE);
            currentlyActive.removeClass(CLASS_OPTION_ACTIVE);

            if (this.activeOption) {
                var toBeActive = this._optionsContainerElement$.find('.select-menu-option[' + ATTR_OPTION_ID + '="' + this.activeOption + '"]');
                toBeActive.addClass(CLASS_OPTION_ACTIVE);
            }

            this._updateElementClasses();
        },

        setIconsOnly: function (iconsOnly) {
            this.iconsOnly = iconsOnly;
            this._updateElementClasses();
        },

        setValue: function (optionIdOrValue) {
            if (optionIdOrValue == null) {
                this.activeOption = null;
                this._updateActiveOption();
                return;
            }

            var id = typeof optionIdOrValue === 'string' ? optionIdOrValue : optionIdOrValue.id;
            var foundOption = this.options.find(function (option) {
                return option.id === id;
            });

            // Only allow the option to be active if the option is actually present
            if (foundOption != null) {
                this.activeOption = foundOption.id;
                this._updateActiveOption();

                if (foundOption.isMultiStep) {
                    this._handleMultistepActivation(foundOption);
                }

                return;
            }

            this.activeOption = null;
            this._updateActiveOption();
        },
        getValue: function () {
            if (this._activeMultistepOption) {
                var out = { id: this._activeMultistepOption };
                if (this._multistepControl) {
                    out.value = this._multistepControl.value;
                }
                return out;
            }
            return { id: this.activeOption };
        },

        destroy: function() {
            this._cleanUpMultiStep();
            this._super();
        },
    });

    return SelectMenu;
});
