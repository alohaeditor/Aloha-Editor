function createWysiwhatImagePicker() {
    var $dialog = Aloha.jQuery('<div></div')
            .html('<p>Insert a URL</p><form><fieldset><label>URL: </label><input type="text" id="url" class="text ui-widget-content ui-corner-all"/></fieldset></form>')
            .dialog({
                autoOpen: false,
                title: 'WYSIWHAT Image Picker',
                buttons : {
                    "Ok" : function() {
                        Aloha.jQuery(this).dialog("close");
                        var img = Aloha.jQuery("<img />").attr("src", Aloha.jQuery(this).find("#url").val());
                        AlohaInsertIntoDom(img);
                    },
                    "Cancel" : Aloha.jQuery.extend(function() {
                        Aloha.jQuery(this).dialog("close");
                    }, {
                        classes : 'dismiss'
                    })
                }                
            });

    $dialog.dialog('open');
    // prevent the default action, e.g., following a link
    return false;
}