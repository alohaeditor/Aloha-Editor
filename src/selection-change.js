/* selection-change.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'browsers',
	'events',
	'functions',
	'ranges',
	'stable-range'
], function SelectionChange(
	Browsers,
	Events,
	Fn,
	Ranges,
	StableRange
) {
	'use strict';

	/**
	 * Whether either the given ranges are not equal or, if one is null, the
	 * other isn't.
	 */
	function isSelectionChange(oldRange, newRange) {
		return (newRange
		        ? (!oldRange || !Ranges.isEqual(oldRange, newRange))
		        : !!oldRange);
	}

	/**
	 * Sometimes Firefox (tested with version 25.0) changes the selection
	 * only immediately after a mouseup (both when the listener was
	 * registered with useCapture true and false). This seems to happen only
	 * in rare cases. One way to reproduce it is to have an editable like
	 * this (just a plain editable without Aloha):
	 *
	 * <div contenteditable="true">
	 *  xxxxxxxxxxxxxx<br/>
	 *  xxxxxxxxxxxxxxx<br type="_moz"/>
	 * </div>
	 *
	 * where the second line is written by just holding down the x key, and
	 * releasing it, and typing an individual x at the end of the line, and
	 * setting the selection with a mouse press after and before the last
	 * character. I think it has to do with the last character being an
	 * individual text node.
	 *
	 * The same goes for the keypress event (in both IE and Firefox and
	 * possibly others), except with the keypress event the selection
	 * seems to be never up to date, so we would always have to do
	 * it. Handling keypresses is useful to get a selection update when
	 * the user auto-repeats text-input by holding down a key. It's not
	 * a big deal however if on each keypress event the user gets the
	 * selection change caused by a previous keypress event, because the
	 * keyup event when the user releases the key will ensure a correct
	 * notification at the end of an auto-repeat sequence.
	 *
	 * Because both IE and Firefox sets the new range immediately after the
	 * event handler returns we can use nextTick() instead of a
	 * timeout. This could lead to the handler passed to watchSelection()
	 * being called even after calling the freeing function returned by
	 * watchSelection().
	 *
	 * NB: keeping around events in a timeout in IE9 causes strange
	 * behaviour: the mouseup events are somehow played back again after
	 * they happened.
	 */
	function maybeNextTick(event, maybeSelectionChange) {
		var type = event.type;
		if (Browsers.browser.mozilla && 'mouseup' === type) {
			Events.nextTick(Fn.partial(maybeSelectionChange, event));
		}
	}

	/**
	 * Creates a handler that can be used to listen to selection change
	 * events, and which will call the given handler function when the
	 * selection changes.
	 *
	 * See watchSelection().
	 */
	function watchSelectionHandler(doc, getRange, range, fn) {
		if (range) {
			range = StableRange(range);
		}

		function maybeSelectionChange(event) {
			var newRange = getRange();
			if (isSelectionChange(range, newRange)) {
				range = newRange;
				if (range) {
					range = StableRange(range);
				}
				fn(newRange, event);
			} else {
				maybeNextTick(event, maybeSelectionChange);
			}
		}

		return maybeSelectionChange;
	}

	/**
	 * Watches the selection and calls the given handler function when it
	 * changes.
	 *
	 * The given handler function will not be called immediately even if the
	 * given range is not null. Only on the next change.
	 *
	 * Our strategy
	 *
	 * Use the selectionchange (see below) when available (Chrome, IE)
	 * and additionally hook into keyup, keypress, mouseup, touchend
	 * events (other browsers). We need keyup events even in IE to
	 * detect selection changes caused by text input. Keypress events
	 * are necessary to capture selection changes when the user is
	 * auto-repeating text-input by holding down a key, except in Chrome
	 * it's not necessary because there the selectionchange event fires
	 * on text-input (See maybeNextTick() for more information regarding
	 * auto-repeating text-input). Hooking into all events on all
	 * browsers does no harm. Touchend is probably necessary for mobile
	 * support other than webkit, although I only tested it on webkit,
	 * where it is not necessary due to selectionchange support.
	 *
	 * For programmatic selection changes we recommend programmatically
	 * firing the selectionchange event on the document element (IE7 needs
	 * the document element, but for IE9+, Chrome and Firefox triggering it
	 * on an element works too).
	 *
	 * We set useCapture to true, so that a stopPropagation call in the
	 * bubbling phase will not starve our handlers. In IE < 9 someone may
	 * still do it since useCapture is not supported.
	 *
	 * Behaviour of the 'selectionchange' event:
	 * * will be fired on every selection change, including when the user
	 *   selects something by pressing and holding the mouse button and
	 *   dragging the selection,
	 * * will not be fired when the user enters text e.g. in a content
	 *   editable in IE9 and IE10,
	 * * will be fired when the selection is set programatically in Chrome,
	 *   but not in IE9 and IE10,
	 * * works in IE as far back as IE7 and Chrome but doesn't work in Firefox or Opera.
	 * * can be feature detected with ('onselectionchange' in document).
	 *
	 * @param doc {!Document}
	 *        The document object.
	 * @param getRange {function(void):Range}
	 *        A function that returns the current range, if there is one, or
	 *        null otherwise.
	 * @param range {Range}
	 *        The current range, if there is one, or null otherwise.
	 * @param fn {function(Range, Event):void}
	 *        A handler function that will be called with the changed range,
	 *        or null if there is no selection (but there was previously),
	 *        and the event that caused the selection change.
	 * @param mousemove
	 *        Even with all the events above hooked, we only get
	 *        up-to-date selection change updates when the user presses
	 *        the mouse and draggs the selection in Chrome and IE, but
	 *        not in Firefox (and probably others). This case can be
	 *        covered by handling the mousemove event. We don't do it by
	 *        default because handling the mousemove event could have
	 *        different implications from handling up/down/press events.
	 * @return {function(void):void}
	 *        A function that can be used to free any memory associated with
	 *        the watcher. Expect the handler to be called even after being
	 *        unregistered.
	 */
	function watchSelection(doc, getRange, range, fn, mousemove) {
		var maybeSelectionChange = watchSelectionHandler(doc, getRange, range, fn);
		// Chrome, IE (except IE text input)
		Events.add(doc, 'selectionchange', maybeSelectionChange, true);
		// IE and others
		Events.add(doc, 'keyup', maybeSelectionChange, true);
		// Others
		Events.add(doc, 'mouseup', maybeSelectionChange, true);
		Events.add(doc, 'touchend', maybeSelectionChange, true);
		Events.add(doc, 'keypress', maybeSelectionChange, true);
		// Because we know Chrome and IE behave acceptably we only do it
		// for Firefox and others.
		if (!Browsers.browser.webkit && !Browsers.browser.msie && mousemove) {
			Events.add(doc, 'mousemove', maybeSelectionChange, true);
		}
		return function () {
			Events.remove(doc, 'selectionchange', maybeSelectionChange, true);
			Events.remove(doc, 'keyup', maybeSelectionChange, true);
			Events.remove(doc, 'mouseup', maybeSelectionChange, true);
			Events.remove(doc, 'touchend', maybeSelectionChange, true);
			Events.remove(doc, 'keypress', maybeSelectionChange, true);
			if (!Browsers.browser.webkit && !Browsers.browser.msie && mousemove) {
				Events.remove(doc, 'mousemove', maybeSelectionChange, true);
			}
		};
	}

	var exports = {
		watchSelectionHandler: watchSelectionHandler,
		watchSelection: watchSelection
	};

	exports['watchSelectionHandler'] = exports.watchSelectionHandler;
	exports['watchSelection'] = exports.watchSelection;

	return exports;
});
