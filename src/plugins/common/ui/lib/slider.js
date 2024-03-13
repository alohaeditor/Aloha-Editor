define([
    'jquery',
    'ui/component',
], function (
    $,
    Component
) {
    'use strict';

    var CLASS_SHOW_INDICATORS = 'with-indicators';
    var CLASS_SHOW_SPINNER = 'with-spinner';

    var Slider = Component.extend({
        type: 'slider',

        /** @type {number} The current value of the slider. */
        value: 0,

        /** @type {string|null} The label to display for this slider. */
        label: null,
        /** @type {number} The minimal value the slider/spinner should allow. */
        min: 0,
        /** @type {number} The maximal value the slider/spinner should allow. */
        max: 100,
        /** @type {number} The steps/increments the slider should increase. */
        step: 1,

        /** @type {boolean} If it should show the min/max values. */
        showIndicators: false,
        /** @type {boolean} If it should display a spinner to allow the user to enter an exact value. */
        showSpinner: false,

        /** @type {number|null} If specified, uses this step for the spinner. Otherwise uses the `step` property. */
        spinnerStep: null,
        /** @type {string|null} Number-Format for the spinner to use. */
        spinnerFormat: null,

        // Internal values

        _$label: null,
        _$minIndicator: null,
        _$maxIndicator: null,
        _$slider: null,
        _$spinner: null,

        _ignoreNextSliderChange: false,
        _ignoreNextSpinnerChange: false,

        init: function () {
            var _this = this;

            this.element = $('<div>', {
                class: 'aloha-slider',
            });

            this._$label = $('<label>', {
                class: 'aloha-slider-label',
                text: this.label,
            }).appendTo(this.element);

            var sliderBody = $('<div>', {
                class: 'slider-body',
            }).appendTo(this.element);

            var sliderMain = $('<div>', {
                class: 'slider-main',
            }).appendTo(sliderBody);

            var indicatorContainer = $('<div>', {
                class: 'indicator-container',
            }).appendTo(sliderMain);

            this._$minIndicator = $('<span>', {
                class: 'slider-indicator indicator-min',
                text: this.min.toString(),
            }).appendTo(indicatorContainer);

            this._$maxIndicator = $('<span>', {
                class: 'slider-indicator indicator-max',
                text: this.max.toString(),
            }).appendTo(indicatorContainer);

            var sliderContainer = $('<div>', {
                class: 'slider-container',
            }).appendTo(sliderMain);

            this._$slider = $('<div>', {
                class: 'slider-element',
            }).slider({
                min: this.min,
                max: this.max,
                range: 'min',
                value: this.value,

                slide: function () {
                    var value = _this._$slider.slider('value');
                    _this._updateValue(value);
                    _this._updateSpinnerValue(value);
                    _this.onPartialValueChange(value);
                    _this.triggerTouchNotification();
                },
                change: function () {
                    if (_this._ignoreNextSliderChange) {
                        _this._ignoreNextSliderChange = false;
                        return;
                    }

                    var value = _this._$slider.slider('value');
                    _this._updateValue(value);
                    _this._updateSpinnerValue(value);
                    _this.onPartialValueChange(value);
                    _this.triggerChangeNotification();
                },
            }).appendTo(sliderContainer);

            var spinnerContainer = $('<div>', {
                class: 'spinner-container',
            }).appendTo(sliderBody);

            this._$spinner = $('<input>', {
                class: 'spinner-element',
            })
                .appendTo(spinnerContainer)
                .spinner({
                    min: this.min,
                    max: this.max,
                    step: this.spinnerStep || this.step || 1,
                    numberFormat: this.spinnerFormat,
                    value: this.value,

                    icons: {
                        down: 'aloha-jqueryui-icon ui-icon-triangle-1-s',
                        up: 'aloha-jqueryui-icon ui-icon-triangle-1-n'
                    },

                    spin: function () {
                        var value = _this._$spinner.spinner('value');
                        _this._updateValue(value);
                        _this._updateSliderValue(value);
                        _this.onPartialValueChange(value);
                        _this.triggerTouchNotification();
                    },
                    change: function () {
                        if (_this._ignoreNextSpinnerChange) {
                            _this._ignoreNextSpinnerChange = false;
                            return;
                        }

                        var value = _this._$spinner.spinner('value');
                        _this._updateValue(value);
                        _this._updateSliderValue(value);
                        _this.onPartialValueChange(value);
                        _this.triggerChangeNotification();
                    },
                });
            
            this._$spinner.spinner('value', this.value);
            this._$spinner.spinner('instance').uiSpinner.addClass('aloha-spinner');

            this._updateOptions();
        },

        _updateOptions: function () {
            if (this.showIndicators) {
                this.element.addClass(CLASS_SHOW_INDICATORS);
            } else {
                this.element.removeClass(CLASS_SHOW_INDICATORS);
            }

            if (this.showSpinner) {
                this.element.addClass(CLASS_SHOW_SPINNER);
            } else {
                this.element.removeClass(CLASS_SHOW_SPINNER);
            }
        },

        _updateValue: function (value) {
            this.value = value;
        },
        _updateSliderValue: function () {
            if (this._$slider != null && this._$slider.slider('instance')) {
                this._ignoreNextSliderChange = true;
                this._$slider.slider('value', this.value);
            }
        },
        _updateSpinnerValue: function () {
            if (this._$spinner != null && this._$spinner.spinner('instance')) {
                this._ignoreNextSpinnerChange = true;
                this._$spinner.spinner('value', this.value);
            }
        },

        /**
         * Function which can be overritten to get the current value while the user is still
         * dragging the slider. Otherwise would only trigger a change (`changeNotify`), once
         * the user let's go of the slider.
         */
        onPartialValueChange: function (value) { },

        enable: function () {
            this._super();
            this._$slider.slider('enable');
            this._$spinner.spinner('enable');
        },

        disable: function () {
            this._super();
            this._$slider.slider('disable');
            this._$spinner.spinner('disable');
        },

        setValue: function (value) {
            this._updateValue(value);
            this._updateSliderValue();
            this._updateSpinnerValue();
        },
        getValue: function () {
            return this.value;
        }
    });

    return Slider;
});
