/* state-override.js is part of Aloha Editor project http://aloha-editor.org
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
 */
define([
	'aloha/core',
	'jquery',
	'aloha/command',
	'util/dom2',
	'util/maps',
	'util/range',
	'PubSub'
], function (
	Aloha,
	jQuery,
	Command,
	Dom,
	Maps,
	RangeObject,
	PubSub
) {
	'use strict';

	// Because we want to provide an easy way to disable the state-override feature.
	var enabled = Aloha.settings.stateOverride !== false;
	var overrides = null;
	var overridesForLinebreak = null;
	var overrideRange = null;

	function rangeObjectFromRange(range) {
		return new RangeObject(range);
	}

	function clearOverrides() {
		overrides = null;
		if (!overridesForLinebreak) {
			overrideRange = null;
		}
	}

	function clearOverridesForLinebreak() {
		overridesForLinebreak = null;
		if (!overrides) {
			overrideRange = null;
		}
	}

	function clearAll() {
		clearOverrides();
		clearOverridesForLinebreak();
	}

	function isLinebreakEvent(event) {
		return 13 === event.which;
	}

	function keyPressHandler(event) {
		if (!overrides) {
			return;
		}
		if (event.altKey || event.ctrlKey || !event.which || isLinebreakEvent(event)) {
			return;
		}
		var selection = Aloha.getSelection();
		if (!selection.getRangeCount()) {
			return;
		}
		var text = String.fromCharCode(event.which);
		var range = selection.getRangeAt(0);
		Dom.insertSelectText(text, range);
		Maps.forEach(overrides, function (formatFn, command) {
			formatFn(command, range);
		});
		Dom.collapseToEnd(range);
		selection.removeAllRanges();
		selection.addRange(range);
		// Because we handled the character insert ourselves via
		// insertText we must not let the browser's default action
		// insert the character a second time.
		event.preventDefault();
		clearOverrides();
	}

	function setWithMap(overrideMap, clear, command, range, formatFn) {
		if (!enabled) {
			return overrideMap;
		}
		if (overrideRange && !Dom.areRangesEq(overrideRange, range)) {
			clear();
		}
		overrideRange = range;
		overrideMap = overrideMap || {};
		overrideMap[command] = formatFn;
		return overrideMap;
	}

	function set(command, range, formatFn) {
		overrides = setWithMap(overrides, clearOverrides, command, range, formatFn);
	}

	function setForLinebreak(command, range, formatFn) {
		overridesForLinebreak = setWithMap(overridesForLinebreak, clearOverridesForLinebreak, command, range, formatFn);
	}

	function setWithFnAndRangeObject(setFn, command, rangeObject, formatFn) {
		if (!enabled) {
			return;
		}
		setFn(command, Dom.rangeFromRangeObject(rangeObject), function (command, range) {
			var rangeObject = rangeObjectFromRange(range);
			formatFn(command, rangeObject);
			Dom.setRangeFromRef(range, rangeObject);
		});
	}

	function setWithRangeObject(command, rangeObject, formatFn) {
		if (!enabled) {
			return;
		}
		setWithFnAndRangeObject(set, command, rangeObject, formatFn);
		setWithFnAndRangeObject(setForLinebreak, command, rangeObject, formatFn);
		// Because without doing rangeObject.select(), the
		// next insertText command (see editable.js) will
		// not be reached and instead the browsers default
		// insert behaviour will be applied (which doesn't
		// know anything about state overrides). I don't
		// know the exact reasons why; probably some
		// stopPropagation somewhere by some plugin.
		rangeObject.select();
	}

	function setForLinebreakWithRangeObject(command, rangeObject, formatFn) {
		setWithFnAndRangeObject(setForLinebreak, command, rangeObject, formatFn);
	}

	function enabledAccessor(trueFalse) {
		if (null != trueFalse) {
			enabled = trueFalse;
		}
		return enabled;
	}

	// https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#state-override
	// "Whenever the number of ranges in the selection changes to
	// something different, and whenever a boundary point of the range
	// at a given index in the selection changes to something different,
	// the state override and value override must be unset for every
	// command."
	Aloha.bind('aloha-selection-changed', function (event, range, causeEvent) {
		if (overrideRange && !Dom.areRangesEq(overrideRange, range)) {
			clearOverrides();
			if (causeEvent && isLinebreakEvent(causeEvent)) {
				overrideRange = range;
				overrides = overridesForLinebreak;
				overridesForLinebreak = null;
			}
			// Because the UI may reflect state overrides that are now
			// no longer in effect, we must redraw the UI according to
			// the current selection.
			PubSub.pub('aloha.selection.context-change', {
				range: range,
				event: event
			});
		}
	});

	PubSub.sub('aloha.selection.context-change', function (message) {
		if (message.event && overrideRange && !isLinebreakEvent(message.event)) {
			clearOverridesForLinebreak();
		}
	});

	return {
		enabled: enabledAccessor,
		keyPressHandler: keyPressHandler,
		set: set,
		setWithRangeObject: setWithRangeObject,
		setForLinebreak: setForLinebreak,
		setForLinebreakWithRangeObject: setForLinebreakWithRangeObject,
		clear: clearAll
	};
});
