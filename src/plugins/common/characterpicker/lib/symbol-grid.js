define([
    'jquery',
    'ui/component'
], function (
    $,
    Component
) {
    'use strict';

    var CLASS_SELECTED = 'selected';

    var SymbolGrid = Component.extend({

        /** @type {Array.<*>} Array of symbols to display */
        symbols: [],

        // Internals

        selected: null,

        containerElement: null,

        init: function () {
            this.element = $('<div>', {
                class: 'aloha-symbol-grid'
            });
            this.containerElement = $('<div>', {
                class: 'symbol-grid-container',
            }).appendTo(this.element);

            this.renderSymbols();
        },

        renderSymbols: function () {
            // Clear all previously created entries
            this.containerElement.children().remove();

            var _this = this;
            this.symbols.forEach(function (symbol) {
                var $cell = $('<button>', {
                    class: 'symbol-grid-cell',
                }).append($('<span>', {
                    class: 'symbol-grid-cell-content',
                    html: symbol,
                })).on('click', function () {
                    _this.touch();
                    $cell.addClass(CLASS_SELECTED);
                    _this.selected = symbol;
                    _this.triggerChangeNotification();
                }).appendTo(_this.containerElement);
            });
        },

        setValue: function(value) {
            this.selected = value;
        },
        getValue: function() {
            return this.selected;
        }
    });

    return SymbolGrid;
});
