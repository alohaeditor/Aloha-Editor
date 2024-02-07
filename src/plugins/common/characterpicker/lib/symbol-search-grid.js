/** @typedef {import('./symbol-grid').SymbolGridItem} SymbolGridItem */

/**
 * @typedef {object} NormalizedSymbolGridItem
 * @property {string} symbol The symbol of the item
 * @property {Array.<string>} items The `label` and `keywords` combined in one array
 */

define([
    'characterpicker/symbol-grid',
    'i18n!characterpicker/nls/i18n'
], function(
    SymbolGrid,
    i18n
) {
    'use strict';

    var CLASS_CELL_HIDDEN = 'cell-hidden';

    var SymbolSearchGrid = SymbolGrid.extend({
        type: 'symbol-search-grid',

        /** @type {string=} Label for the search input. */
        searchLabel: null,

        // Internal

        /** @type {Array.<NormalizedSymbolGridItem>} Copy of `symbols`, but with normalized `items` property */
        _normalizedSymbols: [],
        /**
         * @type {Array.<string>} Array of symbols which match the search-text and are therefore visible to the user.
         */
        _filteredSymbols: [],
        _searchText: '',
        _$searchInput: null,

        init: function() {
            this._super();

            this._updateNormalizedSymbols();
            this._updateFilteredSymbols();
            this._updateCellVisibility();
        },

        _setupElements: function () {
            this._super();

            var _this = this;
            var id = 'symbol_search_grid_input_' + this.id;
            var searchLabel = this.searchLabel || i18n.t('input.search-symbol.label');

            this._$searchInput = $('<input>', {
                type: 'text',
                class: 'input-element',
                id: id,
                attr: {
					autocapitalize: 'off',
					autocomplete: 'off',
				}
            }).on('input', function () {
                _this._searchText = _this._$searchInput.val();
                _this._updateFilteredSymbols();
                _this._updateCellVisibility();
            });

            this.element.prepend(
                $('<div>', { class: 'input-container' })
                    .append(
                        $('<label>', {
                            class: 'input-label',
                            text: searchLabel,
                            for: id,
                        }),
                        this._$searchInput
                    )
            );
        },

        /**
         * Sets/updates the symbols of this grid.
         * @param {Array.<SymbolGridItem>} symbols Symbols to set
         * @override
         */
        updateSymbols: function (symbols) {
            this._super(symbols);
            this._updateNormalizedSymbols();
            this._updateFilteredSymbols();
            this._updateCellVisibility();
        },

        _updateNormalizedSymbols: function() {
            this._normalizedSymbols = (this.symbols || []).map(function(obj) {
                var label = (obj.label || '').toLocaleLowerCase();
                var keywords = (obj.keywords || []).map(function(keyword) {
                    return (keyword || '').toLocaleLowerCase();
                });
                return {
                    symbol: obj.symbol,
                    items: [label || ''].concat(keywords || []),
                };
            });
        },

        _updateFilteredSymbols: function () {
            var searchWord = this._searchText.toLocaleLowerCase();
            var tmp;

            if (!searchWord) {
                tmp = this._normalizedSymbols;
            } else {
                tmp = this._normalizedSymbols.filter(function(obj) {
                    return obj.items.some(function(entry) {
                        return entry.includes(searchWord);
                    });
                });
            }

            this._filteredSymbols = tmp.map(function(obj) {
                return obj.symbol;
            });
        },

        _updateCellVisibility: function () {
            var _this = this;
            this._$containerElement.find('.' + SymbolGrid.CLASS_GRID_CELL).each(function() {
                var val = $(this).attr(SymbolGrid.ATTR_VALUE);
                if (_this._filteredSymbols.includes(val)) {
                    $(this).removeClass(CLASS_CELL_HIDDEN);
                } else {
                    $(this).addClass(CLASS_CELL_HIDDEN);
                }
            });
        }
    });

    return SymbolSearchGrid;
});
