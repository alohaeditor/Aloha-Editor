define([
    'jquery',
    'ui/component',
    'ui/icons'
], function (
    $,
    Component,
    Icons
) {
    'use strict';

    // Class/Attribute constants
    var CLASS_ICONS_ONLY = 'icons-only';
    var CLASS_MULTISTEP_ACTIVE = 'multistep-active';
    var CLASS_OPTION_ACTIVE = 'active';
    var ATTR_OPTION_ID = 'data-id';
    var ATTR_ACTIVE_OPTION = 'data-active-id';

    /**
     * @typedef {object} MultiStepOptionContext
     * @property {string=} label - Label for the header. If left empty, will use the options label.
     * @property {string} type - Type of the component to render.
     * @property {object.<string,*>=} options - Options for the component.
     * @property {*=} initialValue - The value of the component.
     * @property {string=} confirmLabel - The label for the confirm button.
     */

    /**
     * @typedef {object} SelectMenuOption
     * @property {string} label - The Label which is being displayed to the user
     * @property {string=} icon - Icon to display for this option
     * @property {string} id - Identifier of the option
     * @property {boolean=} newTab - If it should display the new-tab icon for this option
     * @property {boolean=} isMultiStep - If this option is a multi-step option
     * @property {MultiStepOptionContext=} multiStepContext - Context for the multi step
     */

    var SelectMenu = Component.extend({

        /** @type {Array.<SelectMenuOption>} The available options of this menu. */
        options: [],

        /** @type {string=} ID of the option which should be highlighted/marked differently. */
        activeOption: null,

        /** @type {boolean} If it should only display the icons/hide the option labels. */
        iconsOnly: false,

        // Internals

        /**
         * @type {string=} ID of a multi-step option which is currently active.
         * Used to determine if it should display the multi-step component.
         */
        activeMultistepOption: null,

        multistepControl: null,
        multistepComponent: null,

        optionsContainerElement: null,
        multistepContainerElement: null,

        init: function () {
            this.element = $('<div>', {
                class: 'aloha-select-menu',
            });
            this.updateElementClasses();
            this.optionsContainerElement = $('<div>', {
                class: 'select-menu-options-container',
            }).appendTo(this.element);
            this.multistepContainerElement = $('<div>', {
                class: 'select-menu-multistep-container',
            }).appendTo(this.element);

            this.renderOptions();
        },

        renderOptions: function () {
            // Clear all previously option elements from the DOM
            this.optionsContainerElement.children().remove();

            var _this = this;

            this.options.forEach(function (option) {
                var optionClasses = ['select-menu-option'];

                if (option.newTab) {
                    optionClasses.push('new-tab');
                } else if (option.isMultiStep) {
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

                var hasIcon = false;
                if (option.icon) {
                    var $iconElem = Icons.createIconElement(option.icon);
                    if ($iconElem) {
                        $optionElem.append(
                            $('<div>', {
                                class: 'select-menu-icon-wrapper',
                            }).append($iconElem)
                        );
                        hasIcon = true;
                    }
                }

                if (!hasIcon) {
                    $optionElem.addClass('no-icon');
                }

                $optionElem.append($('<div>', {
                    class: 'select-menu-option-label',
                    text: option.label || '',
                }));

                $optionElem.on('click', function () {
                    _this.handleOptionClick(option);
                });

                _this.optionsContainerElement.append($optionElem);
            });
        },

        setOptions: function (options) {
            this.options = options;

            // Check if the active options are still included.
            // If not, reset the active state of them.
            if (this.activeOption || this.activeMultistepOption) {
                var containsActive = false;
                var containsMulti = false;

                for (var i = 0; i < this.options.length; i++) {
                    containsActive |= this.options[i].id === this.activeOption;
                    containsMulti |= this.options[i].id === this.activeMultistepOption;

                    // If both have been found, we can stop early
                    if (containsActive && containsMulti) {
                        break;
                    }
                }

                if (!containsActive) {
                    this.activeOption = null;
                }
                if (!containsMulti) {
                    this.activeMultistepOption = null;
                }
                this.updateElementClasses();
            }

            this.renderOptions();
        },

        updateElementClasses: function () {
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

            if (this.activeMultistepOption) {
                this.element.addClass(CLASS_MULTISTEP_ACTIVE);
            } else {
                this.element.removeClass(CLASS_MULTISTEP_ACTIVE);
            }
        },

        setIconsOnly: function (iconsOnly) {
            this.iconsOnly = iconsOnly;
            this.updateElementClasses();
        },

        handleOptionClick: function (option) {
            if (this.disabled) {
                return;
            }

            this.touch();
            this.activeOption = option.id;
            this.updateActiveOption();

            if (option.isMultiStep) {
                this.handleMultistepActivation(option);
            } else {
                this.activeMultistepOption = null;
                this.triggerChangeNotification();
            }
            this.updateElementClasses();
        },

        handleMultistepActivation: function (option) {
            this.activeMultistepOption = option.id;
            // TODO: create the dynamic component in the container
        },

        updateActiveOption: function () {
            var currentlyActive = this.optionsContainerElement.find('.select-menu-option.' + CLASS_OPTION_ACTIVE);
            currentlyActive.removeClass(CLASS_OPTION_ACTIVE);

            if (this.activeOption) {
                var toBeActive = this.optionsContainerElement.find('.select-menu-option[' + ATTR_OPTION_ID + '="' + this.activeOption + '"]');
                toBeActive.addClass(CLASS_OPTION_ACTIVE);
            }

            this.updateElementClasses();
        },

        setValue: function (active) {
            if (active == null) {
                this.activeOption = null;
                this.updateActiveOption();
                return;
            }

            var id = typeof active === 'string' ? active : active.id;
            var foundOption = this.options.find(function (option) {
                return option.id === id;
            });

            // Only allow the option to be active if the option is actually present
            if (foundOption != null) {
                this.activeOption = foundOption.id;
                this.updateActiveOption();

                if (foundOption.isMultiStep) {
                    this.handleMultistepActivation(foundOption);
                }

                return;
            }

            this.activeOption = null;
            this.updateActiveOption();
        },
        getValue: function () {
            return this.activeOption;
        },
    });

    return SelectMenu;
});
