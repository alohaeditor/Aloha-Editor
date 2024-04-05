define([
    'jquery',
    'ui/component'
], function(
    $,
    Component
) {
    'use strict';

    var Text = Component.extend({
        type: 'text',

        content: '',

        _$elem: null,

        init: function() {
            this._$elem  = $('<div>', {
                class: 'text-content',
                text: this.content,
            });

            this.element = $('<div>', {
                class: 'text-content-container',
            }).append(this._$elem);
        },

        setContent: function(content) {
            this.content = content;
        },

        getValue: function() {
            return this.content;
        },
        setValue: function(value) {
            this.content = value;
        }
    });

    return Text;
});