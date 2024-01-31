define([
    'jquery',
    'ui/component'
], function (
    $,
    Component
) {
    'use strict';

    var counter = 0;

    var Checkbox = Component.extend({
        type: 'checkbox',

        /** If the checkbox is currently checked */
        checked: false,

        /** Label/Text for this checkbox */
        label: '',

        checkboxElement: null,

        init: function () {
            this._super();

            var id = 'aloha_checkbox_' + counter;
            counter++;

            var _this = this;

            this.checkboxElement = $('<input>', {
                type: 'checkbox',
                class: 'checkbox-element',
                id: id,
            }).on('change', function (event) {
                _this.handleCheckboxChange(event);
            });

            if (this.checked) {
                this.checkboxElement.prop('checked', 'checked');
            }

            this.element = $('<div>', {
                class: 'checkbox-container',
            }).append(
                $('<label>', {
                    class: 'checkbox-label',
                    for: id,
                }).append([
                    this.checkboxElement,
                    $('<span>', {
                        class: 'checkbox-label-content',
                        text: this.label,
                    })
                ])
            );
        },

        handleCheckboxChange: function (event) {
            this.touch();
            this.checked = event.target.value;
            this.triggerChangeNotification();
        },

        setValue: function (value) {
            this.checked = !!value;

            if (this.checked) {
                this.checkboxElement.prop('checked', 'checked');
            } else {
                this.checkboxElement.removeProp('checked');
            }
        },
        getValue: function () {
            return this.checked;
        },

        enable: function () {
            this._super();
            this.checkboxElement.removeAttr('disabled');
        },

        disable: function () {
            this._super();
            this.checkboxElement.attr('disabled', 'disabled');
        }
    });

    return Checkbox;
});
