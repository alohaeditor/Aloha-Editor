define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button' ],
function(Aloha, plugin, jQuery, Ui, Button ) {
    "use strict";

	var GENTICS = window.GENTICS;
    return plugin.create('undobutton', {
        defaults: {
        },
        dependencies: ['undo'],
        init: function(){
            var that = this;
            Aloha.require(['undo/undo-plugin'], function(UndoPlugin) {
                that._undoButton = Ui.adopt("undo", Button, {
                    tooltip: "Undo",
                    icon: "aloha-icon aloha-icon-undo",
                    scope: 'Aloha.continuoustext',
                    click: function(e){
                        UndoPlugin.undo();
                    }
                });
                that._redoButton = Ui.adopt("redo", Button, {
                    tooltip: "Redo",
                    icon: "aloha-icon aloha-icon-redo",
                    scope: 'Aloha.continuoustext',
                    click: function(e){
                        UndoPlugin.redo();
                    }
                });
            });
        }
    });

});
