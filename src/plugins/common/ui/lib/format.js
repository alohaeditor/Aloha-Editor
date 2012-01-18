define([
	"aloha/jquery",
	"i18n!ui/nls/i18n",
	"ui/component",
	"ui/toggleCommandButton"
],
function( jQuery, i18n, Component, ToggleCommandButton ) {
	// The second part of the bold plugin is the bold component.
	// The bold component is a [toggleCommandButton](toggleCommandButton.html) that ties into the bold command.
	// The button will automatically update its state whenever the selection changes
	// and it will apply or remove the bold styling when the button is clicked.
	// This functionality comes from the toggleButton which knows how to hook into
	// the associated command.
	jQuery.each(
		[ "bold", "italic", "strikethrough", "subscript", "superscript", "underline" ],
		function( i, command ) {
			Component.define( command, ToggleCommandButton, {
				command: command,
				label: i18n.t( "button." + command + ".label" ),
				iconOnly: true,
				icon: "aloha-icon aloha-icon-" + command
			});
		});
});
