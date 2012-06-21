/*

** IMPORTANT NOTE **

This file was taken from the menubar branch of the jquery-ui repository
because the menu and menubar plugins of the jquery-ui version
(jquery-ui-1.9m6) distributed with aloha have a bug.

The bug was that clicking a nested menu item (a second-degree menu item
so to speak) didn't cause the select callback to be invoked and the
expanded menu didn't close completely after the click.

Additionally, the jquery.ui.uniqueid plugin was created to add
functionality that is in the latest jquery-ui core but isn't in the
jquery-ui version distributed with Aloha.

*/
define(["jquery"], function(jQuery){

	var uuid = 0,
        runiqueId = /^ui-id-\d+$/;

    jQuery.fn.uniqueId = function() {
        return this.each(function() {
            if ( !this.id ) {
                this.id = "ui-id-" + (++uuid);
            }
        });
    };

    jQuery.fn.removeUniqueId = function() {
        return this.each(function() {
            if ( runiqueId.test( this.id ) ) {
                $( this ).removeAttr( "id" );
            }
        });
    };
});
