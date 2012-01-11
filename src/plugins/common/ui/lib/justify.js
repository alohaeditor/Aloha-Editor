define([
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/ui",
	"ui/toggleCommandButton"
],
function( jQuery, i18n, Ui ) {
	jQuery.each(
		[ "Left", "Right", "Center", "Full" ],
		function( i, command ) {
			command = "justify" + command;
			Ui.create( command, "toggleCommandButton", {
				command: command,
				label: i18n.t( "button." + command + ".label" ),
				iconOnly: true,
				// TODO: remove aloha-icon-justify when icon sprites are merged
				icon: "aloha-icon aloha-icon-justify aloha-icon-" + command
			});
		});
});
