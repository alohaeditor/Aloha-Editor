define([
    'ui/component'
], function(
    Component
) {
    var TableSizeSelect = Component.extend({
        type: 'table-size-select',

        maxColumns: 10,
        maxRows: 10,

        activeCells: [],

        /**
         * @typedef {object} TableSize
         * @property {number} columns - Amount of columns
         * @property {number} rows - Amount of rows
         */
        /** @type {null|TableSize} */
        selectedPosition: null,

        init: function() {
            this.element = $('<div>', {
                class: 'aloha aloha-ui aloha-table-size-grid',
            });

            this.updateSizesToElement();

            var _this = this;

            this.element.on('mouseleave', function() {
                _this.setActivePosition(-1, -1);
            });
        },

        updateMaxSize: function(rows, columns) {
            this.maxRows = rows;
            this.maxColumns = columns;

            this.updateSizesToElement();
        },

        updateSizesToElement: function() {
            this.element.css({
                '--aloha-grid-columns': this.maxColumns,
                '--aloha-grid-rows': this.maxRows,
            });

            // Remove all children first (if any are present)
            this.element.children().remove();
            
            // (re-)populate the grid
            this.populateGrid();
        },

        populateGrid: function() {
            var _this = this;

            function createCell(cellRow, cellCol) {
                var $cell = $('<div>', {
                    class: 'cell',
                    attr: {
                        'data-row': cellRow,
                        'data-column': cellCol,
                    },
                });
                $cell.on('click', function(event) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    _this.onPositionSelect(cellRow, cellCol);
                    return true;
                });
                $cell.on('mouseenter', function() {
                    _this.setActivePosition(cellRow, cellCol);
                });
                return $cell;
            }

            for (var currentRow = 0; currentRow < this.maxRows; currentRow++) {
                var $row = $('<div>', { class: 'grid-row' });

                for (var currentColumn = 0; currentColumn < this.maxColumns; currentColumn++) {
                    $row.append(createCell(currentRow, currentColumn));
                }

                this.element.append($row);
            }
        },

        setActivePosition: function(row, column) {
            var $allCells = this.element.find('.cell');
            
            if (row < 0 || column < 0) {
                $allCells.removeClass('active');
                this.activeCells = [];
                return;
            }

            this.activeCells = $allCells.filter(function() {
                var $cell = $(this);
                var cellRow = parseInt($cell.data('row'), 10);
                var cellCol = parseInt($cell.data('column'), 10);

                return cellRow <= row && cellCol <= column;
            });

            this.activeCells.addClass('active');
            $allCells.not(this.activeCells).removeClass('active');
        },

        onPositionSelect: function(row, column) {
            this.touch();

            this.selectedPosition = {
                rows: row + 1,
                columns: column + 1,
            };

            if (typeof this.changeNotify === 'function') {
                this.changeNotify(this.selectedPosition);
            }
        },

        setValue: function(position) {
            this.selectedPosition = position;
        },
        getValue: function() {
            return this.selectedPosition;
        },
    });

    return TableSizeSelect;
});
