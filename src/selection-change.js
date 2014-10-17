/**
 * selection-change.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 * @namespace selection-change
 */
define([
	'functions',
	'arrays',
	'boundaries',
	'browsers',
	'events'
], function (
	Fn,
	Arrays,
	Boundaries,
	Browsers,
	Events
) {
	'use strict';

	/**
	 * Sometimes Firefox (tested with version 25.0) changes the selection
	 * only immediatly after a mouseup (both when the listener was
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
	 * Because Firefox sets the new selection immediately after the
	 * event handler returns we can use nextTick() instead of a
	 * timeout. This could lead to the handler passed to
	 * watchSelection() being called even after calling the freeing
	 * function returned by watchSelection().
	 *
	 * NB: keeping around events in a timeout in IE9 causes strange
	 * behaviour: the mouseup events are somehow played back again after
	 * they happened.
	 */
	function maybeNextTick(event, watchSelection) {
		var type = event.type;
		// Because the only browser where can confirm the problem is
		// Firefox, and doing it anyway may cause problems on IE.
		if (Browsers.mozilla && 'mouseup' === type) {
			Events.nextTick(Fn.partial(watchSelection, event));
		}
	}

	/**
	 * Creates a handler that can be used to listen to selection change
	 * events, and which will call the given handler function when the
	 * selection changes.
	 *
	 * See watchSelection().
	 *
	 * @param getBoundaries {function(void):Array.<Boundary>}
	 *        A function that returns the current selection.
	 * @param boundaries {Array.<Boundary>}
	 *        The current selection.
	 * @param fn {function(Array.<Boundary>, Event):void}
	 *        A handler function that will be called with the changed
	 *        selection, and the event that caused the selection change.
	 * @memberOf selection-change
	 */
	function handler(getBoundaries, boundaries, fn) {
		function watchSelection(event) {
			var newBoundaries = getBoundaries();
			if (newBoundaries && !Arrays.equal(boundaries, newBoundaries, Boundaries.equals)) {
				boundaries = newBoundaries;
				fn(newBoundaries, event);
			} else {
				maybeNextTick(event, watchSelection);
			}
		}
		return watchSelection;
	}

	/**
	 * Adds a handler function to events that may cause a
	 * selection-change.
	 *
	 * Our strategy
	 *
	 * Use the selectionchange event (see below) when available (Chrome,
	 * IE) and additionally hook into keyup, keypress, mouseup, touchend
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
	 * @param watchSelection {function(!Event):void}
	 *        A handler function like the one returned from handler().
	 * @param mousemove {boolean}
	 *        Even with all the events above hooked, we only get
	 *        up-to-date selection change updates when the user presses
	 *        the mouse and drags the selection in Chrome and IE, but
	 *        not in Firefox (and probably others). This case can be
	 *        covered by handling the mousemove event. We don't do it by
	 *        default because handling the mousemove event could have
	 *        different implications from handling up/down/press events.
	 * @return {void}
	 * @memberOf selection-change
	 */
	function addHandler(doc, watchSelection, mousemove) {
		// Chrome, IE (except IE text input)
		Events.add(doc, 'selectionchange', watchSelection, true);
		// IE and others
		Events.add(doc, 'keyup', watchSelection, true);
		// Others
		Events.add(doc, 'mouseup', watchSelection, true);
		Events.add(doc, 'touchend', watchSelection, true);
		Events.add(doc, 'keypress', watchSelection, true);
		// Because we know Chrome and IE behave acceptably we only do it
		// for Firefox and others.
		if (!Browsers.webkit && !Browsers.msie && mousemove) {
			Events.add(doc, 'mousemove', watchSelection, true);
		}
	}

	/**
	 * Removes a handler add with addHandler().
	 *
	 * All arguments including mousemove must be the same as when the
	 * handler was added.
	 *
	 * Expect the handler to be called even after it was removed.
	 * @memberOf selection-change
	 */
	function removeHandler(doc, watchSelection, mousemove) {
		Events.remove(doc, 'selectionchange', watchSelection, true);
		Events.remove(doc, 'keyup', watchSelection, true);
		Events.remove(doc, 'mouseup', watchSelection, true);
		Events.remove(doc, 'touchend', watchSelection, true);
		Events.remove(doc, 'keypress', watchSelection, true);
		if (!Browsers.webkit && !Browsers.msie && mousemove) {
			Events.remove(doc, 'mousemove', watchSelection, true);
		}
	}

	return {
		handler       : handler,
		addHandler    : addHandler,
		removeHandler : removeHandler
	};
});
