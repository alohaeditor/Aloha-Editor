/* paste-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 *
 * @overview:
 * The paste plugin intercepts all browser paste events that target aloha-
 * editables, and redirects the events into a hidden div.  Once pasting is done
 * into this div, its contents will be processed by registered content handlers
 * before being copied into the active editable, at the current range.
 */
define([
	'aloha/core',
	'aloha/plugin',
	'jquery',
	'aloha/command',
	'aloha/console'
], function (
	Aloha,
	Plugin,
	$,
	Commands,
	console
) {
	'use strict';

	/**
	 * Reference to global window object, for quicker lookup.
	 *
	 * @type {jQuery.<window>}
	 * @const
	 */
	var $WINDOW = $(window);

	/**
	 * Whether or not the user-agent is Internet Explorer.
	 *
	 * @type {boolean}
	 * @const
	 */
	var IS_IE = !!$.browser.msie;

	/**
	 * Matches as string consisting of a single white space character.
	 *
	 * @type {RegExp}
	 * @const
	 */
	var PROPPING_SPACE = /^(\s|%A0)$/;

	/**
	 * An invisible editable element used to intercept incoming pasted content
	 * so that it can be processed before being placed into real editables.
	 *
	 * In order to hide the editable div we use clip:rect for WebKit (Chrome,
	 * Safari) and Trident (IE), and width/height for Gecko (FF).
	 *
	 * @type {jQuery.<HTMLElement>}
	 * @const
	 */
	var $CLIPBOARD = $('<div style="position:absolute; ' +
	                   'clip:rect(0px,0px,0px,0px); ' +
	                   'width:1px; height:1px;"></div>').contentEditable(true);

	/**
	 * Stored range, use to accomplish IE hack.
	 *
	 * @type {WrappedRange}
	 */
	var ieRangeBeforePaste = null;

	/**
	 * Retrieve the editable host in which the given range is contained.
	 *
	 * @param {WrappedRange} range
	 * @return {jQuery.<HTMLElement>} The editable host element.
	 */
	function getEditableAtRange(range) {
		return Aloha.getEditableHost($(range.commonAncestorContainer));
	}

	/**
	 * Set the selection to the given range
	 *
	 * @param {WrappedRange} range
	 */
	function setSelection(range) {
		Aloha.getSelection().removeAllRanges();
		var newRange = Aloha.createRange();
		newRange.setStart(range.startContainer, range.startOffset);
		newRange.setEnd(range.endContainer, range.endOffset);
		Aloha.getSelection().addRange(newRange);
	}

	/**
	 * Returns the selection back to the user's selection that was stored
	 * during before calling redirectPaste().
	 *
	 * @param {WrappedRange} range The range to restore.
	 */
	function restoreSelection(range) {
		var editable = getEditableAtRange(range);
		if (editable) {
			editable.obj.focus();
		}
		setSelection(range);
	}

	/**
	 * Retrieves the current range.
	 *
	 * @return {WrappedRange}
	 */
	function getRange() {
		var selection = Aloha.getSelection();
		return (selection._nativeSelection._ranges.length
				? selection.getRangeAt(0)
				: null);
	}

	/**
	 * Redirects a paste event from the given range into a specified target
	 * element.
	 *
	 * This function is used to cause paste events that are targeted to
	 * editables to land instead in an invisible clipboard div that serves as a
	 * staging area for us to handle the incoming content before actually
	 * placing it into the intended editable.
	 *
	 * @param {WrappedRange} range The range at the time that the paste event
	 *                             was initiated.
	 * @param {jQuery.<HTMLElement>} $target A jQuery object containing the DOM
	 *                                       element to which the paste event
	 *                                       is to be directed to.
	 */
	function redirect(range, $target) {
		// The target element is moved to the current scroll position in order
		// to avoid jittering the viewport when the pasted content moves
		// between where the range is and target.
		$target.css({
			top: $WINDOW.scrollTop(),
			left: $WINDOW.scrollLeft() - 200 // Why 200?
		}).contents().remove();

		var from = getEditableAtRange(range);
		if (from) {
			from.obj.blur();
		}

		// Place the selection inside the target element.
		setSelection({
			startContainer: $target[0],
			endContainer: $target[0],
			startOffset: 0,
			endOffset: 0
		});
		$target.focus();
	}

	/**
	 * Detects a situation where paste is about to be done into a selection
	 * that looks like this: <p> [</p>...
	 *
	 * The nbsp inside the <p> node was placed there to make the empty
	 * paragraph visible in HTML5 conformant rendering engines, like WebKit.
	 * Without the white space, such browsers would correctly render an empty
	 * <p> as invisible.
	 *
	 * Note that we do not "prop up" otherwise empty paragraph nodes using a
	 * <br/>, as WebKit does, because IE does display empty paragraphs that are
	 * content-editable and so a <br/> results in 2 lines instead of 1 being
	 * shown inside the paragraph.
	 *
	 * If we detect this situation, the white space is removed so that after
	 * pasting a new paragraph into the paragraph, it will not be split leaving
	 * an empty paragraph on top of the pasted content.
	 *
	 * We use
	 *
	 *		"/^(\s|%A0)$/.test(escape("
	 *
	 * instead of
	 *
	 *		"/^(\s|&nbsp;)$/.test( escape("
	 *
	 * because it seems that IE transforms non-breaking spaces into atomic
	 * tokens.
	 *
	 * @param {WrappedRange} range
	 * @return {boolean} True if range starts in propping node.
	 */
	function rangeStartsAtProppedNode(range) {
		var start = range.startContainer;
		return (3 === start.nodeType
				&& 'p' === start.parentNode.nodeName.toLowerCase()
					&& 1 === start.parentNode.childNodes.length
						&& PROPPING_SPACE.test(window.escape(start.data)));
	}

	/**
	 * Gets the pasted content and inserts them into the current active
	 * editable.
	 *
	 * @param {jQuery.<HTMLElement>} $clipboard A jQuery object containing an
	 *                                          element holding the copied
	 *                                          content that will be placed at
	 *                                          the given range.
	 * @param {WrappedRange} range The range at which to place the contents
	 *                             from $clipboard.
	 *
	 * @param {function=} callback An optional callback function to call after
	 *                             pasting is completed.
	 */
	function paste($clipboard, range, callback) {
		// Insert the content into the editable at the original user selection.
		if (range) {
			restoreSelection(range);

			var content = $clipboard.html();

			// It is necessary to remove an insidious nbsp that IE inserts into
			// the content during pasting.  Leaving it would otherwise result
			// in an empty paragraph being created right before the pasted
			// content when the pasted content is a paragraph.
			if (IS_IE && /^&nbsp;/.test(content)) {
				content = content.substring(6);
			}

			if (rangeStartsAtProppedNode(range)) {
				range.startContainer.data = '';
				range.startOffset = 0;

				// In case of ... <p> []</p>
				if (range.endContainer === range.startContainer) {
					range.endOffset = 0;
				}
			}

			if (Aloha.queryCommandSupported('insertHTML')) {
				Aloha.execCommand('insertHTML', false, content);
			} else {
				console.error('Common.Paste', 'Command "insertHTML" not ' +
				                              'available. Enable the plugin ' +
				                              '"common/commands".');
			}
		}

		$clipboard.contents().remove();

		if (typeof callback === 'function') {
			callback();
		}
	}

	/**
	 * Handles the "paste" event initiating from the $CLIPBOARD element.
	 *
	 * @param {jQuery.Event} $event Event at paste.
	 * @param {WrappedRange} range The range to where to direct the contents
	 *                             of the $CLIPBOARD element.
	 * @param {function=} onInset Optional callback to be invoked after pasting
	 *                            is completed.
	 */
	function onPaste($event, range, onInsert) {
		// Manually unset the metaKey property so that the
		// smartContentChange method will not process this event if the
		// metaKey property happens to be set.
		$event.metaKey = null;
		$event.stopPropagation();

		// Allows for a small execution window to ensure that the pasted
		// content has been inserted into the paste div before we attempt to
		// retrieve it.
		window.setTimeout(function () {
			paste($CLIPBOARD, range, onInsert);
			Aloha.activeEditable.smartContentChange($event);
		}, 10);
	}

	/**
	 * Prepare each editable that is created to handle its paste events via the
	 * invisible paste div.
	 *
	 * Bind appropriate events handlers to the given editable element to be
	 * able to intercept paste events target tot it.
	 *
	 *  TODO: Move to paste command?
	 *  http://support.mozilla.com/en-US/kb/Granting%20JavaScript%20access%20to%20the%20clipboard
	 *  https://code.google.com/p/zeroclipboard/
	 *
	 * @param {jQuery.<HTMLElement>} $editable jQuery object containing an
	 *                                         editable DOM element.
	 * @param {boolean} hasClipboardAccess Whether clipboard access is possible.
	 */
	function prepare($editable, hasClipboardAccess) {
		// FIXME: This hack is currently always being used in IE, because the
		//        alternative method, which relies on clipboard access, leads
		//        to incorrect cursor positions after pasting.
		//if (IS_IE && !hasClipboardAccess) {
		if (IS_IE) {
			$editable.bind('beforepaste', function ($event) {
				ieRangeBeforePaste = getRange();
				redirect(ieRangeBeforePaste, $CLIPBOARD);
				$event.stopPropagation();
			});
		} else {
			$editable.bind('paste', function ($event) {
				var range = getRange();
				redirect(range, $CLIPBOARD);
				if (IS_IE) {
					var tmpRange = document.selection.createRange();
					tmpRange.execCommand('paste');
				}
				onPaste($event, range);
			});
		}
	}

	var plugin = Plugin.create('paste', {

		settings: {},

		init: function () {
			$('body').append($CLIPBOARD);

			var hasClipboardAccess = !this.settings.noclipboardaccess;

			Aloha.bind('aloha-editable-created', function ($event, editable) {
				prepare(editable.obj, hasClipboardAccess);
			});

			// Bind a handler to the paste event of the pasteDiv to get the
			// pasted content (but do this only once, not for every editable)
			//if (IS_IE && !hasClipboardAccess) {
			if (IS_IE) {
				$CLIPBOARD.bind('paste', function ($event) {
					onPaste($event, ieRangeBeforePaste, function () {
						ieRangeBeforePaste = null;
					});
				});
			}
		},

		/**
		 * Register the given paste handler
		 * @deprecated
		 * @param pasteHandler paste handler to be registered
		 */
		register: function (pasteHandler) {
			console.deprecated('Plugins.Paste', 'register() for pasteHandler' +
			                                    ' is deprecated.  Use the ' +
			                                    'ContentHandler Plugin ' +
			                                    'instead.');
		}
	});

	return plugin;
});
