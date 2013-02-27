define(
['aloha', 'aloha/plugin', 'jquery', 'ui/ui', 'ui/button', 'PubSub' ],
function(Aloha, plugin, jQuery, Ui, Button, PubSub ) {
    "use strict";

	var GENTICS = window.GENTICS;
    return plugin.create('genericbutton', {
        defaultSettings: {
        },
        init: function(){
            this.settings = jQuery.extend(true, this.defaultSettings,
                this.settings);
            if(this.settings.buttons !== undefined){
                for(var i in this.settings.buttons){
                    var button = this.settings.buttons[i];
                    var ob = Ui.adopt(button.id, Button, {
                        tooltip: button.title,
                        icon: button.icon || null,
                        class: 'button-' + button.id,
                        scope: button.scope || 'Aloha.continuoustext',
                        click: function(){
                            PubSub.pub(button.event, button);
                        }
                    });
                    this._buttons[button.id] = ob;
                }
            }
        },
        getButtons: function(){
            return this._buttons;
        },
        _buttons: {}
    });

});
