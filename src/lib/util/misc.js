/* misc.js is part of Aloha Editor project http://aloha-editor.org
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
/**
 * Contains miscellaneous utility functions that don't fit anywhere else.
 */
define([
	'jquery',
	'aloha/engine',
	'util/dom'
], function (
	jQuery,
	Engine,
	Dom
) {
	'use strict';

	/**
	 * Returns true if any regex in the given rxs array tests true
	 * against str.
	 */
	function anyRx(rxs, str) {
		var i,
		    len;
		for (i = 0, len = rxs.length; i < len; i++) {
			if (rxs[i].test(str)) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Add editing helpers, if necessary
	 *
	 * @param {jQuery} $field object where to add the editing helpers
	 */
	function addEditingHelpers($field) {
		// check whether the editable contains a non-editable block
		// element. as first or last element (not counting whitespace
		// nodes) if so, we need to add br's at the end and/or start so
		// that the user could enter text. Note that inline blocks
		// will be padded by the block plugin, so we ignore them here.
		var firstChild = Dom.getFirstVisibleChild($field[0], false, ["TABLE"]);
		var $firstChild = jQuery(firstChild);

		if (Dom.isBlockNode(firstChild)
				&& (!$firstChild.contentEditable() || firstChild.nodeName === 'TABLE')) {
			var startP = jQuery('<p class="aloha-editing-p"></p>');

			$field.prepend(startP);

			if (0 === Dom.getOffsetHeight(startP[0])) {
				startP.append(jQuery('<br class="aloha-end-br"/>'));
			}
		}

		var lastChild = Dom.getLastVisibleChild($field[0], false, ["TABLE"]);
		var $lastChild = jQuery(lastChild);

		if (Dom.isBlockNode(lastChild)
				&& (!jQuery(lastChild).contentEditable() || lastChild.nodeName === 'TABLE')) {
			var endP = jQuery('<p class="aloha-editing-p"></p>');

			$field.append(endP);
			if (0 === Dom.getOffsetHeight(endP[0])) {
				endP.append(jQuery('<br class="aloha-end-br"/>'));
			}
		}
	}

	/**
	 * Removes helper-breaks in paragraphs inserted to be able to target editables
	 * with uneditable block-elements, and either removes the paragraphs (if empty)
	 * or their editing attribute (otherwise)
	 *
	 * @param {jQuery} $field specifies the area in which to look for editing helpers
	 */
	function removeEditingHelpers($field) {
		// remove the editing br's
		$field.find('p.aloha-editing-p > br.aloha-end-br').remove();

		$field.find('p.aloha-editing-p').each(function (index, elem) {
			if (Dom.isEmpty(elem) &&
				// blocks may remain empty until the user fills them with content
					!jQuery(elem).find('.aloha-block').length) {
				jQuery(elem).remove();
			} else {
				// if the p shall remain, we remove the class aloha-editing-p
				jQuery(elem).removeClass('aloha-editing-p');
				// use the Engine to add an end br, if necessary
				Engine.ensureContainerEditable(elem);
			}
		});
	}

	/**
	 * Stops the propagation of an Event (cancel bubble) in a backward compatible way.
	 * This method tries to first call stopPropagation() on the event object and has a
	 * fallback which sets the cancelBubble property to true (either on the event
	 * itself or the or the current window.event object)
	 *
	 * @param {Event} event the event which propagation to stop
	 */
	function eventStopPropagation(event) {
		event = event || window.event;

		if (event.stopPropagation) {
			event.stopPropagation();
		} else {
			event.cancelBubble = true;
		}
	}

	/**
	 * Prevents the default action on an event. If the browser does not support the native
	 * Event.preventDefault() false is returned.
	 *
	 * @param {Event} event the event for which the default action should be canceled
	 * @returns {boolean} false if the browser does not support the Event.preventDefault() method
	 */
	function eventPreventDefault(event) {
		// check if we can call preventDefault on the event
		if (event && event.preventDefault) {
			event.preventDefault();
		} else {
			// if the event or preventDefault() does not exist we return false
			return false;
		}
	}


	return {
		anyRx: anyRx,
		addEditingHelpers: addEditingHelpers,
		removeEditingHelpers: removeEditingHelpers,
		eventStopPropagation: eventStopPropagation,
		eventPreventDefault: eventPreventDefault
	};
});
