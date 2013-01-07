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
 * The paste plugin intercepts all browser paste events that target aloha
 * editables, and redirects the events into a hidden div.  Once pasting is done
 * into this div, its contents will be processed by registered content handlers
 * before being copied into the active editable, at the current range.
 */
define([
	'jquery',
	'aloha/core',
	'aloha/plugin',
	'aloha/command',
	'contenthandler/contenthandler-utils',
	'aloha/console',
	'aloha/copypaste'
], function (
	$,
	Aloha,
	Plugin,
	Commands,
	ContentHandlerUtils,
	Console,
	CopyPaste
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
	 * '%A0' is used instead of '&nbsp;' because it seems that IE transforms
	 * non-breaking spaces into atomic tokens.
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
	 * Set the selection to the given range and focus on the editable inwhich
	 * the selection is in (if any).
	 *
	 * This function is used to restore the selection to what it was before
	 * calling redirectPaste() at the offset of the pasting process.
	 *
	 * @param {WrappedRange} range The range to restore.
	 */
	function restoreSelection(range) {
		var editable = CopyPaste.getEditableAt(range);
		if (editable) {
			editable.obj.focus();
		}
		CopyPaste.setSelectionAt(range);
	}

	/**
	 * Redirects a paste event from the given range into a specified target
	 * element.
	 *
	 * This function is used to cause paste events that are targeting to
	 * editables to instead land in an invisible clipboard div that serves as a
	 * staging area to handle the incoming content before actually placing it
	 * into the intended editable.
	 *
	 * @param {WrappedRange} range The range at the time that the paste event
	 *                             was initiated.
	 * @param {jQuery.<HTMLElement>} $target A jQuery object containing the DOM
	 *                                       element to which the paste event
	 *                                       is to be directed to.
	 */
	function redirect(range, $target) {
		// Because moving the target element to the current scroll position
		// avoids jittering the viewport when the pasted content moves between
		// where the range is and target.
		$target.css({
			top: $WINDOW.scrollTop(),
			left: $WINDOW.scrollLeft() - 200 // Why 200?
		}).contents().remove();

		var from = CopyPaste.getEditableAt(range);
		if (from) {
			from.obj.blur();
		}

		// Because the selection should end up inside the target element.
		CopyPaste.setSelectionAt({
			startContainer: $target[0],
			endContainer: $target[0],
			startOffset: 0,
			endOffset: 0
		});
		$target.focus();
	}

	/**
	 * Detects a situation where paste is about to be done into a selection
	 * beginning inside markup that looks exactly like this:
	 *
	 * '<p> </p>'
	 *
	 * or roughly like this:
	 *
	 * '<p><br/></p>'
	 *
	 * Both markups denote a "propped" paragraph.  A propped paragraph is one
	 * which contains content that has been placed in it for the sole purpose
	 * of forcing the layout engine to render the node visibly.  HTML5 standard
	 * conformance requires that empty block elements like <p> be rendered
	 * invisibly, and comformant browsers like WebKit would place <br> nodes
	 * inside content-editable paragraphs so that they can be visible for
	 * editing.
	 *
	 * IE is _not_ standard comformant however, because it renders empty <p>
	 * with a line-height of 1.  Adding a <br> elements inside it results in
	 * the <p> appearing with 2 lines.
	 *
	 * If we detect this situation, the white space is removed so that after
	 * pasting a new paragraph into the paragraph, it will not be split leaving
	 * an empty paragraph on top of the pasted content.  Therefore when working
	 * in IE, a space is placed inside an empty paragraph rather than a <br>.
	 * Hence markup like '<p> </p>'.
	 *
	 * @param {WrappedRange} range
	 * @return {boolean} True if range starts in propping node.
	 */
	function rangeStartsAtProppedParagraph(range) {
		var start = range.startContainer;
		if (1 === start.nodeType) {
			return ('p' === start.nodeName.toLowerCase() &&
					ContentHandlerUtils.isProppedParagraph(start.outerHTML));
		}
		return (3 === start.nodeType &&
				'p' === start.parentNode.nodeName.toLowerCase() &&
					1 === start.parentNode.childNodes.length &&
						PROPPING_SPACE.test(window.escape(start.data)));
	}

	/**
	 * Prepare the nodes around where pasted content is to land.
	 * 
	 * @param {WrappedRange} range
	 */
	function prepRangeForPaste(range) {
		if (rangeStartsAtProppedParagraph(range)) {
			if (3 === range.startContainer.nodeType) {
				range.startContainer.data = '';
			} else {
				range.startContainer.innerHTML = ' ';
			}
			range.startOffset = 0;

			// Because of situations like <p>[ ]</p> or <p>[<br/>]</p>
			if (range.endContainer === range.startContainer) {
				range.endOffset = 0;
			}
		}
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
		if (range) {
			var content = $clipboard.html();

			// Because IE inserts an insidious nbsp into the content during
			// pasting that needs to be removed.  Leaving it would otherwise
			// result in an empty paragraph being created right before the
			// pasted content when the pasted content is a paragraph.
			if (IS_IE && /^&nbsp;/.test(content)) {
				content = content.substring(6);
			}

			restoreSelection(range);
			prepRangeForPaste(range);

			if (Aloha.queryCommandSupported('insertHTML')) {
				Aloha.execCommand('insertHTML', false, content);
			} else {
				Console.error('Common.Paste', 'Command "insertHTML" not ' +
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
		// Because we do not want the smartContentChange method to process this
		// event if the metaKey property had been set.
		$event.metaKey = null;
		$event.stopPropagation();

		// Because yeiling here allows for a small execution window to ensure
		// that the pasted content has been inserted into the paste div before
		// we attempt to retrieve it.
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
		// FIXME: Because the alternative method, which relies on clipboard
		//        access, leads to incorrect cursor positions after pasting.
		// if (IS_IE && !hasClipboardAccess) {
		if (IS_IE) {
			$editable.bind('beforepaste', function ($event) {
				ieRangeBeforePaste = CopyPaste.getRange();
				redirect(ieRangeBeforePaste, $CLIPBOARD);
				$event.stopPropagation();
			});
		} else {
			$editable.bind('paste', function ($event) {
				var range = CopyPaste.getRange();
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
			// if (IS_IE && !hasClipboardAccess) {
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
			Console.deprecated('Plugins.Paste', 'register() for pasteHandler' +
			                                    ' is deprecated.  Use the ' +
			                                    'ContentHandler Plugin ' +
			                                    'instead.');
		}
	});

	return plugin;
});
