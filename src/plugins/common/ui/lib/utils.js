/* utils.js is part of Aloha Editor project http://aloha-editor.org
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
define(['jquery', 'jqueryui'], function ($) {
	'use strict';

	/**
	 * Wraps an element such that a label is displayed alongside it.
	 *
	 * Contrary to tooltips, a label is always visible and takes up
	 * place in the toolbar.
	 *
	 * The label will wrap the given element to make an implicit
	 * association between label and element (click on the label will
	 * give focus to a wrapped input element for example).
	 *
	 * @param {string} labelText
	 *       The already internationalized text the label should contain.
	 * @param {!jQuery} element
	 *       Any element to wrap.
	 * @return {!jQuery}
	 *       A new label element that wraps the given element.
	 */
	function wrapWithLabel(labelText, element) {
		return $('<label>', {'class': 'aloha-ui-label'})
			.append($('<span>', {'class': 'aloha-ui-label-text', 'text': labelText}))
			.append(element);
	}

	function makeButton(button, props, hasMenu) {
		button.button({
			label: makeButtonLabel(props),
			text: !!(props.text || props.html),
			icons: {
				primary: props.icon || (props.iconUrl && 'aloha-ui-inline-icon-container') || null,
				secondary: (hasMenu && 'aloha-jqueryui-icon ui-icon-triangle-1-s') || null
			}
		});
		if (props.iconUrl) {
			button.button('widget')
				.children('.ui-button-icon-primary')
				.append(makeButtonIconFromUrl(props.iconUrl));
		}
		return button;
	}

	function makeButtonLabel(props) {
		// TODO text should be escaped
		return props.html || props.text || props.tooltip;
	}

	function makeButtonLabelWithIcon(props) {
		var label = makeButtonLabel(props);
		if (props.iconUrl) {
			label = makeButtonIconFromUrl(props.iconUrl) + label;
		}
		return label;
	}

	function makeButtonIconFromUrl(iconUrl) {
		return '<img class="aloha-ui-inline-icon" src="' + iconUrl + '">';
	}

	function makeButtonElement(attr) {
		// Set type to button to avoid problems with IE which
		// considers buttons to be of type submit by default. One
		// problem that occurd was that hitting enter inside a
		// text-input caused a click event in the button right next
		// to it.
		return $('<button>', attr).attr('type', 'button');
	}

	return {
		wrapWithLabel: wrapWithLabel,
		makeButton: makeButton,
		makeButtonElement: makeButtonElement,
		makeButtonLabel: makeButtonLabel,
		makeButtonLabelWithIcon: makeButtonLabelWithIcon,
		makeButtonIconFromUrl: makeButtonIconFromUrl
	};
});
