define([
    'jquery',
    'ui/component'
], function(
    $,
    Component
) {
    'use strict';

    var SymbolGrid = Component.extend({
        init: function() {
            this._super();
            this.type = 'symbol-grid';
        }
    });

    return SymbolGrid;
});
