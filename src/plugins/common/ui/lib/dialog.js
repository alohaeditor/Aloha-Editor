define([
	'jquery',
	'ui/component',
	'i18n!ui/nls/i18n'
], function (
	$,
	Component,
	i18n
) {
	'use strict';

	function makeDialogDiv(props) {
		var textOrHtml = {};
		if (props.text) {
			textOrHtml.text = props.text;
		}
		if (props.html) {
			textOrHtml.html = props.html;
		}
		return $('<div>', textOrHtml);
	}

	/**
	 * Wraps the callback function so to destory the dialog when the callback is
	 * invoked.
	 *
	 * @param {function} callback
	 * @return {function} Wrapped callback.
	 */
	function callbackAndDestroy(callback) {
		return function () {
			callback.apply(this);
			$(this).dialog('destroy').remove();
		};
	}

	function wrapDialogButtons(buttons) {
		// Buttons automatically close the dialog for convenience
		var title;
		for (title in buttons) {
			if (buttons.hasOwnProperty(title)) {
				buttons[title] = callbackAndDestroy(buttons[title]);
			}
		}
		return buttons;
	}

	function makeDialogProps(props, defaultTitle) {
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
			'dialogClass': cls,
			'zIndex': 10200
		};
	}

	return {
		/**
		 * Shows a confirm dialog.
		 *
		 * A confirm dialog has a confirm icon and style and yes and no buttons.
		 *
		 * @param props is an object with the following properties (all optional):
		 *          title - the title of the dialog
		 *           text - either the text inside the dialog
		 *           html - or the html inside the dialog
		 *            yes - makes a "Yes" button in the dialog and invokes the given callback if it is pressed.
		 *             no - makes a "No" button in the dialog and invokes the given callback if it is pressed.
		 *         answer - makes a "Yes" and "No" button in the dialog and pressing either will invoke the
		 *                  callback with the answer as a boolean argument. Does not interfere with yes and
		 *                  no properties.
		 *            cls - the root element of the dialog will receive this class
		 *        buttons - an object where the properties are button titles and the values are callbacks
		 *        Button callbacks will receive the dialog element as context.
		 *        Pressing any buttons in the dialog will automatically close the dialog.
		 * @return
		 *        A function that can be called to close the dialog.
		 */
		'confirm': function (props) {
			var buttons = props.buttons || {};

			var yesLabel = i18n.t('button.yes.label');
			var noLabel = i18n.t('button.no.label');

			// block adds backwards compatibility to still be able to use
			// 'buttons.Yes/No' for setting functionality of basic buttons
			if (buttons.Yes !== null && yesLabel !== 'Yes') {
				buttons[yesLabel] = buttons.Yes;
				delete buttons.Yes;
			}
			if (buttons.No !== null && noLabel !== 'No') {
				buttons[noLabel] = buttons.No;
				delete buttons.No;
			}

			buttons[yesLabel] = buttons[yesLabel] || props.yes || $.noop;
			buttons[noLabel]  = buttons[noLabel]  || props.no  || $.noop;

			if (props.answer) {
				var yes = buttons[yesLabel];
				var no  = buttons[noLabel];
				buttons[yesLabel] = function () {
					yes();
					props.answer(true);
				};
				buttons[noLabel] = function () {
					no();
					props.answer(false);
				};
			}
			var dialog = makeDialogDiv(props).dialog(
				$.extend(makeDialogProps(props, 'Confirm'), {
					'buttons': wrapDialogButtons(buttons)
				})
			);
			return function () {
				dialog.dialog('destroy').remove();
			};
		},

		/**
		 * Shows an alert dialog.
		 *
		 * An alert dialog has an alert icon and style and a dismiss button.
		 *
		 * @param props is an object with the following properties (all optional)
		 *        title - the title of the dialog
		 *        text - either the text inside the dialog
		 *        html - or the html inside the dialog
		 *        cls - the root element of the dialog will receive this class
		 * @return
		 *        A function that can be called to close the dialog.
		 */
		'alert': function (props) {
			var propsExtended = {};
			propsExtended[i18n.t('button.dismiss.label')] = $.noop;
			var dialog = makeDialogDiv(props).dialog(
				$.extend(makeDialogProps(props, 'Alert'), {
					'buttons': wrapDialogButtons(propsExtended)
				})
			);
			return function () {
				dialog.dialog('destroy').remove();
			};
		},

		/**
		 * Shows a stripped down modal dialog that can be customized.
		 *
		 * @param {object} props Properties with which to customize the
		 *                       modal.  All properties of
		 *                       api.jqueryui.com/dialog apply, in addition to
		 *                       the following optional properties:
		 *                       html - HTML contents to be placed inside the
		 *                              modal.
		 *                        cls - Custom class to be given to the modal's
		 *                              root element.
		 * @return {jQuery.<HTMLElement>} jQuery object containing the dialog
		 *                                DOM element.
		 */
		'modal': function (props) {
			var $dialog = makeDialogDiv(props).dialog(
				$.extend(makeDialogProps(props, ''), props)
			);
			$dialog.parent().find('.ui-dialog-titlebar').remove();
			return $dialog;
		},

		/**
		 * Shows a progress dialog.
		 *
		 * A progress dialog shows a progressbar and a message to
		 * indicate that some process is in progress.
		 *
		 * @param props is an object with the following properties (all optional)
		 *        title - the title of the dialog
		 *         text - either the text inside the dialog
		 *         html - or the html inside the dialog
		 *          cls - the root element of the dialog will receive this class
		 *        value - the intial value of the progressbar from 0 to 100
		 * @return
		 *        A function that can be called to update the progress bar with a value from 0 to 100.
		 *        If null or undefined is passed, the dialog will be closed.
		 */
		'progress': function (props) {
			var progressbar = $("<div>").progressbar({
				// TODO if no initial value is specific, show a full but an animated progress bar instead
				value: null != props.value ? props.value : 100
			});
			var dialog = makeDialogDiv(props).dialog(
				$.extend(makeDialogProps(props, 'Progress'), {
					open: function () {
						$(this).append(progressbar);
					}
				})
			);
			return function (value) {
				if (null != value) {
					progressbar.progressbar({ value: value });
				} else {
					dialog.dialog('destroy').remove();
				}
			};
		}
	};
});
