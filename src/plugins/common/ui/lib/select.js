/**
 * @typedef {object} SelectOption
 * @property {string} id - Identifier of the option
 * @property {string} label - The Label which is being displayed to the user
 * @property {string=} icon - Icon to display for this option
 * @property {boolean=} iconHollow - If the icon should be displayed "hollow"
 */

define([
    'jquery',
    'ui/component'
], function (
    $,
    Component
) {
    'use strict';

    var CLASS_SELECT_ITEM = 'select-item';
    var CLASS_ACTIVE = 'active';
    var CLASS_PLACEHOLDER = 'placeholder-text';
    var CLASS_SHOW_DROPDOWN = 'show-dropdown';
    var CLASS_SHOW_CLEAR = 'show-clear';
    var ATTR_OPTION_ID = 'data-option-id';

    var Select = Component.extend({
        type: 'select',

        /** @type {string} The label for this select. */
        label: null,

        /** 
         * @type {string|Array.<string>|null} The ID of the selected option (or an array of IDs, when `multiple` is `true`),
         *  or `null` if nothing is selected.
         */
        value: null,

        /** @type {Array.<SelectOption>} the options of this select */
        options: [],

        /** @type {boolean} If this select can select multiple values. */
        multiple: false,

        /** @type {boolean} If this select can be cleared/should show a clear button. */
        clearable: false,

        /** @type {string} A placeholder string which is displayed when no items are selected yet. */
        placeholder: '',

        // INTERNALS

        _hasIcons: false,
        _dropdownOpen: false,

        _$pickerElement: null,
        _$labelElement: null,
        _$textElement: null,
        _$clearElement: null,
        _$dropdownElement: null,
        _$listElement: null,

        init: function () {
            var _this = this;

            this.element = $('<div>', {
                class: 'aloha-select input-container',
            });

            this._$labelElement = $('<div>', {
                class: 'aloha-select-label input-label',
                text: this.label,
            }).appendTo(this.element);

            this._$pickerElement = $('<div>', {
                class: 'aloha-select-picker input-element',
            }).appendTo(this.element);
            this._$pickerElement.on('click', function() {
                _this._openDropdown();
            });
            if (this.clearable) {
                this._$pickerElement.addClass(CLASS_SHOW_CLEAR);
            }

            this._$textElement = $('<div>', {
                class: 'aloha-select-picker-label',
            }).appendTo(this._$pickerElement);

            this._$clearElement = $('<button>', {
                class: 'aloha-select-clear-button',
            }).appendTo(this._$pickerElement);
            this._$clearElement.append($('<i>', {
                class: 'clear-button-icon material-symbols-outlined',
                text: 'close',
            }));
            this._$clearElement.on('click', function() {
                _this._clearValue();
            });

            this._$dropdownElement = $('<div>', {
                class: 'aloha-select-dropdown',
            }).appendTo(this.element);
            this._$dropdownElement.on('click', function() {
                _this._closeDropdown();
            });

            this._$listElement = $('<div>', {
                class: 'aloha-select-list',
            }).appendTo(this._$dropdownElement);

            this._renderOptions();
            this._normalizeValue();
            this._markSelectedOptions();
        },

        _renderOptions: function () {
            this._$listElement.children().remove();

            var _this = this;
            this._hasIcons = false;

            (this.options || []).forEach(/** @param {SelectOption} option */ function (option) {
                _this._hasIcons = _this._hasIcons || !!option.icon;
                var $elem = _this._renderListOption(option);
                _this._$listElement.append($elem);
            });

            this._$listElement.toggleClass('has-icons', this._hasIcons);
        },

        /** @param {SelectOption} option */
        _renderListOption: function (option) {
            var $elem = $('<div>', {
                class: CLASS_SELECT_ITEM,
            });
            $elem.attr(ATTR_OPTION_ID, option.id);

            if (option.icon) {
                var hollow = option.iconHollow;
                $elem.addClass('has-icon');
                var $icon = $('<i>', {
                    class: 'select-item-icon material-symbols-outlined',
                    text: option.icon,
                });
                if (hollow) {
                    $icon.addClass('hollow');
                }
                $elem.append($icon);
            }

            $elem.append($('<span>', {
                class: 'select-item-label',
                text: option.label
            }));

            var _this = this;

            $elem.on('click', function($event) {
                $event.preventDefault();
                _this._selectOption(option);
            });

            return $elem;
        },

        _getSelectedIds: function() {        
            if (this.multiple) {
                return this.value;
            }
            return this.value == null ? [] : [this.value];
        },
        _updateSelectText: function(selected) {
            var _this = this;

            // Update the text, to display the currently selected options
            var text = selected.map(function(id) {
                var opt = _this.options.find(function(option) {
                    return option.id === id;
                });
                return opt == null ? null : opt.label;
            }).filter(function(label) {
                return label != null;
            }).join(', ');
            this._$textElement.toggleClass(CLASS_PLACEHOLDER, !text);
            this._$textElement.text(text || this.placeholder);
        },
        _markSelectedOptions: function() {
            /** @type {Array.<string>} */
            var selected = this._getSelectedIds();

            this._updateSelectText(selected);

            this._$listElement.children().each(function() {
                var id = $(this).attr(ATTR_OPTION_ID);
                $(this).toggleClass(CLASS_ACTIVE, selected.includes(id));
            });
        },

        /** @param {SelectOption} option */
        _selectOption: function(option) {
            if (!this.multiple) {
                this.value = option.id;
                this._closeDropdown();
                this._markSelectedOptions();
                this.triggerChangeNotification();
                return;
            }

            // Just to make sure
            if (!Array.isArray(this.value)) {
                this.value = [];
            }

            var idx = this.value.indexOf(option.id);
            if (idx > -1) {
                this.value.splice(idx, 1);
            } else {
                this.value = this.value.push(option.id);
            }
            this._markSelectedOptions();
            this.triggerChangeNotification();
        },

        _openDropdown: function () {
            this.touch();
            this._dropdownOpen = true;
            this.element.addClass(CLASS_SHOW_DROPDOWN);
            this._updateDropdownPosition();
        },
        _closeDropdown: function() {
            this._dropdownOpen = false;
            this.element.removeClass(CLASS_SHOW_DROPDOWN);
        },
        _updateDropdownPosition: function() {
            /** @type {DOMRect} */
            var rect = this.element[0].getBoundingClientRect();
            this._$dropdownElement[0].style.setProperty('--aloha-select-x', rect.x + 'px');
            this._$dropdownElement[0].style.setProperty('--aloha-select-y', rect.y + 'px');
            this._$dropdownElement[0].style.setProperty('--aloha-select-width', rect.width + 'px');
            this._$dropdownElement[0].style.setProperty('--aloha-select-height', rect.height + 'px');
        },

        _clearValue: function () {
            this.touch();
            this.value = this.multiple ? [] : null;
        },
        _normalizeValue: function() {
            if (this.value == null) {
                this.value = this.multiple ? [] : null;
                return;
            }

            if (this.multiple) {
                // Already an array
                if (Array.isArray(this.value)) {
                    return;
                }
                if (typeof this.value === 'string') {
                    this.value = [this.value];
                    return;
                }
                this.value = [];
                return;
            }

            if (Array.isArray(this.value)) {
                this.value = this.value[0];
            }

            this.value = typeof this.value !== 'string' ? null : this.value;
        },

        setLabel: function(label) {
            this.label = label;
            this._$labelElement.text(label);
        },
        setOptions: function(options) {
            this.options = options;
            this._renderOptions();
            this._markSelectedOptions();
        },
        setMultiple: function(multiple) {
            this.multiple = multiple;
            this._normalizeValue();
        },
        setClearable: function(clearable) {
            this.clearable = clearable;
            this._$pickerElement.toggleClass(CLASS_SHOW_CLEAR, this.clearable);
        },
        setPlaceholder: function(placeholder) {
            this.placeholder = placeholder;
            this._updateSelectText(this._getSelectedIds());
        },

        getValue: function () {
            return this.value;
        },
        setValue: function (value) {
            this.value = value;
            this._normalizeValue();
            this._markSelectedOptions();
        },
    });

    return Select;
})