define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'PubSub',
    'css!table/css/table.css'],
function(Aloha, plugin, $, Ui, Button, PubSub) {
    "use strict";

	var GENTICS = window.GENTICS;

    function prepareImage(plugin, img){
    }

    return plugin.create('image', {
        defaults: {
        },
        init: function(){
            var plugin = this;
            Aloha.bind('aloha-editable-created', function(event, editable){
                editable.obj.find('table').each(function(){
                    prepareImage(plugin, $(this));
                });
            });
            PubSub.sub('aloha.selection.context-change', function(m){
                if ($(m.range.markupEffectiveAtStart).parent('img')
                        .length > 0) {
                    // We're inside an image
                } else {
                    // We're outside an image
                }
            });
            this._createImageButton = Ui.adopt("insertImage", Button, {
                tooltip: "Insert Image",
                icon: "aloha-button aloha-image-insert",
                scope: 'Aloha.continuoustext',
                click: function(e){
                    var $img = $('<img src="/static/images/connexions.png" />');
                    var range = Aloha.Selection.getRangeObject();
                    if (range.isCollapsed()) {
                        GENTICS.Utils.Dom.insertIntoDOM($img, range, $(Aloha.activeEditable.obj));
                    }
                }
            });
        },
        _createImageButton: undefined
    });
});
