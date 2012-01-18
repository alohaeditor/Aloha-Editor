define([
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/toggleCommandButton"
],
function( jQuery, i18n, Component, ToggleCommandButton ) {
	jQuery.each(
		[ "Left", "Right", "Center", "Full" ],
		function( i, command ) {
			command = "justify" + command;
			Component.define( command, ToggleCommandButton, {
				command: command,
				label: i18n.t( "button." + command + ".label" ),
				iconOnly: true,
				// TODO: remove aloha-icon-justify when icon sprites are merged
				icon: "aloha-icon aloha-icon-justify aloha-icon-" + command
			});
		});
});
