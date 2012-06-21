define([
	"jquery",
	"ui/component"
],
function($, Component) {

	function makeDialogDiv(props) {
		var textOrHtml = {};
		if (props.text) {
			textOrHtml['text'] = props.text;
		}
		if (props.html) {
			textOrHtml['html'] = props.html;
		}
		return $("<div>", textOrHtml);
	}

	function wrapDialogButtons(buttons) {
		// Buttons automatically close the dialog for convenience
		for (title in buttons) {
			if (buttons.hasOwnProperty(title)) {
				buttons[title] = (function(orgCallback){
					return function(){
						orgCallback.apply(this);
						// The immediate removal from the dom may interfere with animation
						$(this).dialog('close').remove();
					};
				})(buttons[title]);
			}
		}
		return buttons;
	}

	function makeDialogProps(props, defaultTitle){
		// All root elements of widgets added to the page by aloha should have the class 'aloha'.
		// aloha-dialog is used for a hack to prevent a click in the
		// dialog from bluggin the editable search for aloha-dialog in
		// the aloha core for more information.
		var cls = 'aloha aloha-dialog';
		if (props.cls) {
			cls += ' ' + props.cls;
		}
		return {
			'resizable': false,
			'modal': true,
			'title': props.title || defaultTitle,
			'dialogClass': cls
		};
	}

	return {
		/**
		 * Shows a confirm dialog.
		 *
		 * A confirm dialog has a confirm icon and style and yes and no buttons.
		 *
		 * @param props is an object with the following properties (all optional):
		 *   title - the title of the dialog
		 *    text - either the text inside the dialog
		 *    html - or the html inside the dialog
		 *     yes - makes a "Yes" button in the dialog
		 *      no - makes a "No" button in the dialog
		 *     cls - the root element of the dialog will receive this class
         * buttons - an object where the properties are button titles and the values are callbacks
		 *    Button callbacks will receive the dialog element as context.
		 *    Pressing any buttons in the dialog will automatically close the dialog.
		 */
		'confirm': function(props) {
			var buttons = props.buttons || {};
			buttons['Yes'] = buttons['Yes'] || props.yes || $.noop;
			buttons['No'] = buttons['No'] || props.no || $.noop;
			makeDialogDiv(props).dialog(
				$.extend(makeDialogProps(props, "Confirm"), {
					'buttons': wrapDialogButtons(buttons)
				})
			);
		},
		/**
		 * Shows an alert dialog.
		 *
		 * An alert dialog has an alert icon and style and a dismiss button.
		 *
		 * @param props is an object with the following properties (all optional)
		 *  title - the title of the dialog
		 *   text - either the text inside the dialog
		 *   html - or the html inside the dialog
		 *    cls - the root element of the dialog will receive this class
		 */
		'alert': function(props) {
			makeDialogDiv(props).dialog(
				$.extend(makeDialogProps(props, "Alert"), {
					'buttons': wrapDialogButtons({
						'Dismiss': function(){
							$(this).dialog('close').remove();
						}
					})
				})
			);
		}
	};
});
