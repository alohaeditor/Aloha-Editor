define([
    'jquery',
    'ui/component',
    'ui/slider',
    'ui/utils',
    'i18n!ui/nls/i18n'
], function (
    $,
    Component,
    Slider,
    Utils,
    i18n
) {
    'use strict';

    var CLASS_COLOR_PICKER_ITEM = 'color-picker-item';
    var CLASS_PALETTE_ITEM = 'color-palette-item';
    var CLASS_ACTIVE = 'active';
    var CLASS_SHOW_CLEAR = 'with-clear';
    var CLASS_SHOW_CUSTOM_COLORS = 'with-custom-colors';
    var CLASS_SHOW_TRANSPARENCY = 'with-transparency';

    var ATTR_COLOR_VALUE = 'data-value';

    var DEFAULT_COLOR = [0, 0, 0, 255];

    var REGEXP_HEX_VALUE = /^#?([0-9a-f]{3,4}|[0-9a-f]{6,8})$/g;

    function colorIsActive(active, current) {
        if (!Array.isArray(active) || !Array.isArray(current)) {
            return false;
        }
        return Utils.colorIsSame(active, current);
    }

    var ColorPicker = Component.extend({
        type: 'color-picker',

        /** @type {Array.<number>|string|null} The color value. */
        value: null,

        /** @type {Array.<number|string>} String array with all available/valid colors to choose from. */
        palette: [],

        /** @type {boolean} If it should allow values which aren't specified in the palette. */
        allowOutsidePalette: false,

        /**
         * @type {boolean} If the user should be able to enter the color value themself.
         * Requires `allowOutsidePalette` to be `true` as well.
         */
        allowCustomInput: false,

        /** @type {boolean} If the user can change the transparency of the colors.
         * Requires `allowCustomInput` to be `true` as well.
         */
        allowTransparency: false,

        /** @type {boolean} If it should be possible to select an empty/clear value (`null`). */
        allowClear: true,

        // Internal values

        normalizedValue: null,
        normalizedPalette: [],

        _$colorGrid: null,
        _$clearInput: null,
        _$preview: null,
        _$hexColorInput: null,
        _rgbaInputs: [],
        _ignoreColorInputs: false,

        init: function () {
            this._super();

            this._normalizeColors();
            var _this = this;

            this.element = $('<div>', {
                class: 'aloha-color-picker',
            });

            this._$colorGrid = $('<div>', {
                class: 'aloha-color-picker-grid',
            }).appendTo(this.element);

            this._$clearInput = $('<button>', {
                class: [CLASS_COLOR_PICKER_ITEM, 'clear-value'].join(' '),
                title: i18n.t('color-picker.clearButton.label'),
            })
                .on('click', function () {
                    _this.triggerTouchNotification();
                    _this.handleColorSelect(null);
                })
                .appendTo(this._$colorGrid);

            var customContainer = $('<div>', {
                class: 'color-picker-custom',
            }).appendTo(this.element);

            var rgbaInputContainer = $('<div>', {
                class: 'custom-color-input-container',
            }).appendTo(customContainer);

            var previewContainer = $('<div>', {
                class: 'custom-color-preview-container',
            }).appendTo(customContainer);

            this._$preview = $('<div>', {
                class: 'custom-color-preview',
            }).appendTo(previewContainer);

            // Sliders trigger a partial change initially, which we don't want
            this._ignoreColorInputs = true;

            function createColorInput(name, index) {
                var sliderComponent = new (Slider.extend({
                    min: 0,
                    max: 255,
                    value: _this.normalizedValue ? _this.normalizedValue[index] : DEFAULT_COLOR[index],
                    showIndicators: false,
                    showSpinner: false,

                    onPartialValueChange: function (value) {
                        if (_this._ignoreColorInputs) {
                            return;
                        }

                        if (_this.normalizedValue == null) {
                            _this.normalizedValue = DEFAULT_COLOR.slice();
                        }
                        _this.normalizedValue[index] = value;
                        _this.value = _this.normalizedValue.slice();
                        _this._updatePreviewColor();
                        _this._updateHexInput();
                        _this._updateActiveSelection();
                    },
                }))();

                sliderComponent.element.addClass('custom-color color-' + name).appendTo(rgbaInputContainer);

                return sliderComponent;
            }

            this._rgbaInputs.push(createColorInput('red', 0));
            this._rgbaInputs.push(createColorInput('green', 1));
            this._rgbaInputs.push(createColorInput('blue', 2));
            this._rgbaInputs.push(createColorInput('transparency', 3));

            this._$hexColorInput = $('<input>', {
                class: 'custom-color-input',
            })
                .bind('input', function () {
                    _this.triggerTouchNotification();
                    _this.handleHexInputChange();
                })
                .on('blur', function () {
                    _this._updateHexInput();
                })
                .appendTo(rgbaInputContainer);

            $('<button>', {
                class: 'custom-color-confirm',
                text: i18n.t('button.confirm.label'),
            })
                .on('click', function() {
                    _this.triggerChangeNotification();
                })
                .appendTo(previewContainer);

            this._updateOptions();
            this._populatePalette();
            this._updateHexInput();
            this._updateRGBAInputValues();
            this._updatePreviewColor();
            this._updateActiveSelection();

            setTimeout(function() {
                _this._ignoreColorInputs = false;
            });
        },

        _normalizeColors: function () {
            this.normalizedPalette = (this.palette || []).map(function (value) {
                return Utils.colorToRGBA(value);
            }).filter(function (value) {
                return value != null;
            });
            this.normalizedValue = this.value ? Utils.colorToRGBA(this.value) : null;

            // If the value cannot be from outside the specified palette, we have to clean it up.
            if (this.normalizedValue != null && !this.allowOutsidePalette && !this._isInPalette(this.normalizedValue)) {
                this.normalizedValue = null;
            }
        },

        handleColorSelect: function (color) {
            // Skip if this component is disabled or the color is invalid for whatever reason.
            if (this.disabled || (!this.allowOutsidePalette && (color != null && !this._isInPalette(color)))) {
                return false;
            }

            this.value = color != null ? color.slice() : color;
            this.normalizedValue = color != null ? color.slice() : null;
            this._updateRGBAInputValues();
            this._updatePreviewColor();
            this._updateActiveSelection();
            this.triggerChangeNotification();
        },

        handleHexInputChange: function () {
            if (this._$hexColorInput == null) {
                return;
            }

            var value = this._$hexColorInput.val() || '';

            if (!REGEXP_HEX_VALUE.test(value)) {
                return;   
            }

            // In case no '#' was put in front, as it's optional
            if (!value[0] === '#') {
                value = '#' + value;
            }

            this.value = Utils.colorToRGBA(value);

            // If we don't allow the user to change the transparency, then set it to full transparency
            if (!this.allowTransparency) {
                this.value[3] = 255;
            }

            this.normalizedValue = this.value != null ? this.value.slice() : null;
            this._updateRGBAInputValues();
            this._updatePreviewColor();
            this._updateActiveSelection();
        },

        _updateRGBAInputValues: function () {
            var colorToUpdate = this.normalizedValue || DEFAULT_COLOR;
            var _this = this;

            colorToUpdate.forEach(function (color, index) {
                _this._rgbaInputs[index].setValue(color);
            });
        },

        _updateHexInput: function () {
            if (this._$hexColorInput == null) {
                return;
            }

            var hex = Utils.colorToHex(this.normalizedValue);
            if (hex && !this.allowTransparency) {
                hex = hex.substring(0, 7);
            }
            this._$hexColorInput.val(hex || '');
        },

        _updatePreviewColor: function () {
            this._$preview.css('background-color', Utils.colorToHex(this.normalizedValue) || 'transparent');
        },

        _updateActiveSelection: function () {
            this._$colorGrid.find('.' + CLASS_PALETTE_ITEM).removeClass(CLASS_ACTIVE);

            var hex = Utils.colorToHex(this.normalizedValue);
            if (hex != null) {
                this._$colorGrid.find('[' + ATTR_COLOR_VALUE + '="' + hex + '"]').addClass(CLASS_ACTIVE);
            }
        },

        _isInPalette: function (color) {
            return this.normalizedPalette.some(function (paletteColor) {
                return Utils.colorIsSame(color, paletteColor);
            });
        },

        _updateOptions: function () {
            if (!this.allowClear) {
                this.element.removeClass(CLASS_SHOW_CLEAR);
            } else {
                this.element.addClass(CLASS_SHOW_CLEAR);
            }

            if (!this.allowOutsidePalette || !this.allowCustomInput) {
                this.element.removeClass(CLASS_SHOW_CUSTOM_COLORS);
            } else {
                this.element.addClass(CLASS_SHOW_CUSTOM_COLORS);
            }

            if (!this.allowOutsidePalette || !this.allowCustomInput || !this.allowTransparency) {
                this.element.removeClass(CLASS_SHOW_TRANSPARENCY);
            } else {
                this.element.addClass(CLASS_SHOW_TRANSPARENCY);
            }
        },

        setPalette: function(palette) {
            this.palette = palette;
            this._normalizeColors();
            this._populatePalette();
        },
        setAllowOutsidePalette: function (allow) {
            this.allowOutsidePalette = allow;
            this._updateOptions();
        },
        setAllowCustomInput: function (allow) {
            this.allowCustomInput = allow;
            this._updateOptions();
        },
        setAllowClear: function (allow) {
            this.allowClear = allow;
            this._updateOptions();
        },
        setAllowTransparency: function (allow) {
            this.allowTransparency = allow;
            this._updateOptions();
        },

        _populatePalette: function () {
            var _this = this;

            // Remove all previous color palette items
            this._$colorGrid.find('.' + CLASS_PALETTE_ITEM).remove();
            this.normalizedPalette.forEach(function (color) {
                var cls = [CLASS_COLOR_PICKER_ITEM, CLASS_PALETTE_ITEM];
                if (colorIsActive(_this.normalizedValue, color)) {
                    cls.push(CLASS_ACTIVE);
                }

                var hex = Utils.colorToHex(color);
                var attr = {};
                attr[ATTR_COLOR_VALUE] = hex;

                var $elem = $('<button>', {
                    class: cls.join(' '),
                    attr: attr,
                }).on('click', function () {
                    _this.triggerTouchNotification();
                    _this.handleColorSelect(color);
                });
                $elem.css('--aloha-color-palette-item', hex);

                _this._$colorGrid.append($elem);
            });
        },

        setValue: function (value) {
            this.value = value;
            this._normalizeColors();
            this._updateActiveSelection();
        },
        getValue: function () {
            return this.normalizedValue;
        },
    });

    return ColorPicker;
});
