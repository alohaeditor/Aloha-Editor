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
	var overrideRange = null;

	function rangeObjectFromRange(range) {
		return new RangeObject(range);
	}

	function clear() {
		overrideRange = null;
		overrides = null;
	}

	function keyPressHandler(event) {
		if (!overrides) {
			return;
		}
		if (event.altKey || event.ctrlKey || !event.which) {
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
	}

	function set(command, range, formatFn) {
		if (!enabled) {
			return;
		}
		overrideRange = range;
		overrides = overrides || {};
		overrides[command] = formatFn;
	}

	function setWithRangeObject(command, rangeObject, formatFn) {
		if (!enabled) {
			return;
		}
		set(command, Dom.rangeFromRangeObject(rangeObject), function (command, range) {
			var rangeObject = rangeObjectFromRange(range);
			formatFn(command, rangeObject);
			Dom.setRangeFromRef(range, rangeObject);
		});
		// Because without doing rangeObject.select(), the
		// next insertText command (see editable.js) will
		// not be reached and instead the browsers default
		// insert behaviour will be applied (which doesn't
		// know anything about state overrides). I don't
		// know the exact reasons why; probably some
		// stopPropagation somewhere by some plugin.
		rangeObject.select();
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
	Aloha.bind('aloha-selection-changed', function (event, range) {
		if (overrideRange && !Dom.areRangesEq(overrideRange, range)) {
			clear();
			// Because the UI may reflect the any potentially state
			// overrides that are now no longer in effect, we must
			// redraw the UI according to the current selection.
			PubSub.pub('aloha.selection.context-change', {
				range: range,
				event: event
			});
		}
	});

	return {
		enabled: enabledAccessor,
		keyPressHandler: keyPressHandler,
		setWithRangeObject: setWithRangeObject,
		set: set,
		clear: clear
	};
});
