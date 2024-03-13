define([
    'jquery',
    'ui/component',
    'i18n!ui/nls/i18n',
    'jqueryui'
], function (
    $,
    Component,
    i18n
) {
    'use strict';

    var CLASS_WITH_TIME = 'with-time';

    var DateTimePicker = Component.extend({
        type: 'date-time-picker',

        /**
         * @type {Date=} The timestamp value of the chosen date-time. Has to be a unix-timestamp or `null`.
         */
        value: null,
        /** @type {string=} Label to display for this date-time picker. */
        label: null,
        /** @type {string} The format how the date-time should be displayed to the user. */
        format: null,
        /** @type {number=} The minimum of a date the user can select from. */
        min: null,
        /** @type {number=} The maximum of a date the user can select from. */
        max: null,
        /** @type {boolean} If it should allow the user to enter a time. */
        allowTime: false,
        /** @type {boolean} If the controls should be rendered inline instead of in a pop-out/dropdown. */
        inline: false,

        // Localization options

        /** @type {string=} Label for the hours input. */
        hoursLabel: null,
        /** @type {string=} Label for the minutes input. */
        minutesLabel: null,
        /**
         * @type {Array.<string>=} Names for the months (i.E. "January", "February", ...), starting from january.
         * Has to be a complete list.
         */
        monthNames: null,
        /**
         * @type {Array.<string>=} Short Names for the months (i.E. "Jan", "Feb", ...), starting from january.
         * Has to be a complete list.
         */
        monthShort: null,
        /**
         * @type {Array.<string>=} Names for the weekdays (i.E. "Sunday", "Monday", ...), starting from sunday.
         * Has to be a complete list.
         */
        weekdayNames: null,
        /**
         * @type {Array.<string>=} Short Names for the weekdays (i.E. "Sun", "Mon", ...), starting from sunday.
         * Has to be a complete list.
         */
        weekdayShort: null,
        /**
         * @type {Array.<string>=} Minimal Names for the weekdays (i.E. "Su", "Mo", ...), starting from sunday.
         * Has to be a complete list.
         */
        weekdayMinimal: null,
        /** @type {number} On which `index` of the `weekdayNames` the week starts. 0 = Sunday, 1 = Monday, ... */
        weekStart: 0,

        // Internals

        _$inputElement: null,
        _$inputContent: null,
        _$dropdownElement: null,
        _$pickerElement: null,
        _$hoursElement: null,
        _$minutesElement: null,

        _ignoreSpinnerChange: false,

        init: function () {
            this._super();
            var _this = this;

            this.element = $('<div>', {
                class: 'aloha-date-time-picker',
            });

            this._normalizeValue();

            this._$inputElement = $('<input>', {
                readonly: true,
                class: 'aloha-picker-input',
            }).on('click', function () {
                _this._openContentDropdown();
            });

            this._updateDisplayValue();

            if (this.inline) {
                this._createInputContent();
                this.element.append(this._$inputContent);
            } else {
                this.element.append(this._$inputElement);
            }
        },

        _normalizeValue: function () {            
            if (this.value == null) {
                return;
            }

            if (this.value instanceof Date) {
                return;
            }

            if (typeof this.value === 'number') {
                if (!Number.isFinite(this.value) || Number.isNaN(this.value)) {
                    this.value = null;
                }
                this.value = new Date(this.value);
                return;
            }

            this.value = null;
        },
        _handleSelection: function () {
            var newDate = this._$pickerElement.datepicker('getDate');
            if (newDate != null && this.value != null) {
                newDate.setHours(this.value.getHours());
                newDate.setMinutes(this.value.getMinutes());
            }
            this.value = newDate;

            this._normalizeValue();
            this._updateDisplayValue();

            // If there's no dropdown open, we can propergate this change
            if (!this._$dropdownElement) {
                this.triggerChangeNotification();
            }
        },
        _createPickerOptions: function () {
            var _this = this;

            var pickerOptions = {
                changeYear: true,
                defaultDate: this.value,
                disabled: this.disabled,
                onSelect: function () {
                    _this._handleSelection();
                },
            };

            if (this.format) {
                pickerOptions.dateFormat = this.format;
            }
            if (this.weekStart != null) {
                pickerOptions.firstDay = this.weekStart;
            }
            if (this.min != null) {
                pickerOptions.minDate = this.min;
            }
            if (this.max != null) {
                pickerOptions.maxDate = this.max;
            }
            if (Array.isArray(this.weekdayNames)) {
                pickerOptions.dayNames = this.weekdayNames;
            }
            if (Array.isArray(this.weekdayShort)) {
                pickerOptions.dayNamesShort = this.weekdayShort;
            }
            if (Array.isArray(this.weekdayMinimal)) {
                pickerOptions.dayNamesMin = this.weekdayMinimal;
            }
            if (Array.isArray(this.monthNames)) {
                pickerOptions.monthNames = this.monthNames;
            }
            if (Array.isArray(this.monthNamesShort)) {
                pickerOptions.monthNamesShort = this.monthNamesShort;
            }

            return pickerOptions;
        },
        _updatePickerWithOptions: function () {
            if (this._$pickerElement) {
                this._$pickerElement.datepicker('option', this._createPickerOptions());
                this._$pickerElement.datepicker('refresh');
            }
        },
        _getDateFormat: function () {
            if (this.format) {
                return format;
            }

            // Default values
            return this.allowTime ? 'mm/dd/yy hh:ii' : 'mm/dd/yy';
        },
        _updateDisplayValue: function () {
            if (!this._$inputElement) {
                return;
            }

            var formattedText = '';
            if (this.value != null) {
                var dateFormat = this._getDateFormat();
                var h = this.value.getHours().toString();
                var i = this.value.getMinutes().toString();
                formattedText = $.datepicker.formatDate(dateFormat, this.value)
                    .replace(/(hh|HH)/g, h.padStart(2, '0'))
                    .replace(/(h|H)/g, h)
                    .replace(/(ii|II)/g, i.padStart(2, '0'))
                    .replace(/(i|I)/g, i);
            }
            this._$inputElement.val(formattedText);
        },
        _createInputContent: function () {
            var _this = this;

            this._$inputContent = $('<div>', {
                class: 'aloha-date-time-picker-content',
            });

            if (this.allowTime) {
                this._$inputContent.addClass(CLASS_WITH_TIME);
            }

            this._$pickerElement = $('<div>', {
                class: 'aloha-datepicker-element',
            })
                .datepicker(this._createPickerOptions())
                .appendTo(this._$inputContent);

            this._$hoursElement = $('<input>', {
                id: 'aloha-date-time-hours-' + this.id,
            });
            this._$minutesElement = $('<input>', {
                id: 'aloha-date-time-minutes-' + this.id,
            });

            $('<div>', {
                class: 'aloha-time-input-container',
            })
                .appendTo(this._$inputContent)
                .append(
                    $('<label>', {
                        class: 'aloha-time-input',
                        for: 'aloha-date-time-hours-' + this.id,
                    })
                        .append(
                            $('<span>', {
                                class: 'aloha-time-label',
                                text: this.hoursLabel || i18n.t('date-time-picker.hours.label'),
                            }),
                            $('<div>', {
                                class: 'aloha-time-spinner aloha-date-time-hours',
                            }).append(this._$hoursElement)
                        ),
                    $('<label>', {
                        class: 'aloha-time-input',
                        for: 'aloha-date-time-minutes-' + this.id,
                    })
                        .append(
                            $('<span>', {
                                class: 'aloha-time-label',
                                text: this.minutesLabel || i18n.t('date-time-picker.minutes.label'),
                            }),
                            $('<div>', {
                                class: 'aloha-time-spinner aloha-date-time-minutes',
                            }).append(this._$minutesElement)
                        )
                );
            
            function initSpinner(element, max, setFn, getFn) {
                element.spinner({
                    min: 0,
                    max: max,
                    disabled: _this.disabled,
                    change: function () {
                        // Ignore the first change, because it's the one we trigger below
                        if (_this._ignoreSpinnerChange) {
                            return;
                        }

                        var currentValue = element.spinner('value');
                        // Get the new value, clampted to the bounds, because the spinner won't do it
                        // if the user enters a value manually.
                        var newValue = Math.max(0, Math.min(max, currentValue));
    
                        // Clamp it manually. Setting the value would trigger this function again.
                        if (currentValue !== newValue) {
                            var before = _this._ignoreSpinnerChange;
                            _this._ignoreSpinnerChange = true;
                            element.spinner('value', newValue);
                            _this._ignoreSpinnerChange = before;
                        }
    
                        if (_this.value == null) {
                            _this.value = new Date();
                        }
                        setFn(newValue);
                        _this._updateDisplayValue();
                    },
                })
                    // If provided in the init options, and the value is 0, then it's not getting displayed.
                    .spinner('value', getFn());
            }

            this._ignoreSpinnerChange = true;
            initSpinner(this._$hoursElement, 23, function (value) {
                _this.value.setHours(value);
            }, function () {
                return _this.value != null ? _this.value.getHours() : 0
            });

            initSpinner(this._$minutesElement, 59, function (value) {
                _this.value.setMinutes(value);
            }, function () {
                return _this.value != null ? _this.value.getMinutes() : 0
            });
            this._ignoreSpinnerChange = false;
        },
        _openContentDropdown: function () {
            // Don't open a second instance
            if (this._$dropdownElement) {
                return;
            }

            this._createInputContent();
            var _this = this;

            this._$dropdownElement = $('<div>', {
                class: 'aloha-date-time-picker-dropdown',
            })
                .append(this._$inputContent)
                .append(
                    $('<button>', {
                        class: 'aloha-button confirm-button',
                        attr: {
                            type: 'button',
                            role: 'button',
                        },
                    }).append($('<span>', {
                        class: 'aloha-button-text',
                        text: i18n.t('button.confirm.label'),
                    })).on('click', function () { 
                        _this._closeDropdown();
                    })
                )
                .appendTo(this.element);
        },
        _closeDropdown: function () {
            if (!this._$dropdownElement) {
                return;
            }

            this._$dropdownElement.remove();
            this._$inputContent.remove();
            this._$dropdownElement = null;
            this._$inputContent = null;
        },

        enable: function () {
            this._super();
            if (this._$pickerElement) {
                this._$pickerElement.datepicker('enable');
            }
            if (this._$hoursElement) {
                this._$hoursElement.spinner('enable');
            }
            if (this._$minutesElement) {
                this._$minutesElement.spinner('enable');
            }
        },
        disable: function () {
            this._super();
            if (this._$pickerElement) {
                this._$pickerElement.datepicker('disable');
            }
            if (this._$hoursElement) {
                this._$hoursElement.spinner('disable');
            }
            if (this._$minutesElement) {
                this._$minutesElement.spinner('disable');
            }
        },
        destroy: function () {
            this._closeDropdown();
            this._super();
        },

        getValue: function () {
            return this.value;
        },
        setValue: function (value) {
            this.value = value;
            this._normalizeValue();

            if (this._$pickerElement) {
                this._$pickerElement.datepicker('setDate', this.value);
            }
            this._ignoreSpinnerChange = true;
            if (this._$hoursElement) {
                this._$hoursElement.spinner('value', this.value != null ? this.value.getHours() : 0);
            }
            if (this._$minutesElement) {
                this._$minutesElement.spinner('value', this.value != null ? this.value.getMinutes() : 0);
            }
            this._ignoreSpinnerChange = false;
            this._updateDisplayValue();
        },
    });

    return DateTimePicker;
});
