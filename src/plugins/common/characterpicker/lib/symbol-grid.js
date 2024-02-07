/**
 * @typedef SymbolGridItem
 * 
 * @property {string} label The label/name of the symbol
 * @property {string} symbol The symbol itself
 * @property {Array.<string>=} keywords Addtitional keywords/strings which are used when searching/filtering
 */

define([
    'jquery',
    'ui/component'
], function (
    $,
    Component
) {
    'use strict';

    var CLASS_SELECTED = 'selected';
    var CLASS_GRID_CELL = 'symbol-grid-cell';
    var ATTR_VALUE = 'data-value';

    var SymbolGrid = Component.extend({
        type: 'symbol-grid',

        /** @type {Array.<SymbolGridItem>} Array of symbols to display */
        symbols: [],

        // Internals

        _selected: null,

        _$containerElement: null,

        init: function () {
            this._super();

            this._setupElements();

            this._renderSymbols(this.symbols);
        },

        _setupElements: function () {
            this.element = $('<div>', {
                class: 'aloha-symbol-grid'
            });
            this._$containerElement = $('<div>', {
                class: 'symbol-grid-container',
            }).appendTo(this.element);
        },
        _renderSymbols: function (symbolsToRender) {
            // Clear all previously created entries
            this._$containerElement.children().remove();

            var _this = this;
            symbolsToRender.forEach(function (symbolObj) {
                $('<button>', {
                    class: CLASS_GRID_CELL,
                    title: symbolObj.label,
                })
                    .attr(ATTR_VALUE, symbolObj.symbol)
                    .append($('<span>', {
                        class: 'symbol-grid-cell-content',
                        html: symbolObj.symbol,
                    }))
                    .on('click', function () {
                        _this.touch();
                        _this._selected = symbolObj.symbol;
                        _this._updateSelectedCell();
                        _this.triggerChangeNotification();
                    })
                    .appendTo(_this._$containerElement);
            });
            this._updateSelectedCell();
        },
        _updateSelectedCell: function () {
            this._$containerElement.find('.' + CLASS_GRID_CELL)
                .removeClass(CLASS_SELECTED);
            if (this._selected) {
                this._$containerElement.find('.' + CLASS_GRID_CELL + '[' + ATTR_VALUE + '="' + this._selected + '"]')
                    .addClass(CLASS_SELECTED);
            }
        },

        /**
         * Sets/updates the symbols of this grid.
         * @param {Array.<SymbolGridItem>} symbols Symbols to set
         */
        updateSymbols: function (symbols) {
            this.symbols = symbols;
            this.renderSymbols(this.symbols);
        },

        setValue: function (value) {
            this._selected = value;
            this._updateSelectedCell();
        },
        getValue: function () {
            return this._selected;
        }
    });

    SymbolGrid.CLASS_SELECTED = CLASS_SELECTED;
    SymbolGrid.CLASS_GRID_CELL = CLASS_GRID_CELL;
    SymbolGrid.ATTR_VALUE = ATTR_VALUE;

    return SymbolGrid;
});
