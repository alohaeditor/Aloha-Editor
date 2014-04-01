/* align-table-utils.js is part of Aloha Editor project http://aloha-editor.org
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
	'util/arrays',
	'util/dom',
	'jquery'
], function(
	Arrays,
	DomLegacy,
	jQuery
) {
	'use strict';

	/**
	 * Gets cells selected in the table.
	 *
	 * @param {Element} tableElement
	 * @return {Array}
	 */
	function getCellsInSelection(tableElement) {
		return Arrays.coerce(jQuery(tableElement).find('.aloha-cell-selected'));
	}

	/**
	 * Checks if `tableElement` has any cells selected.
	 * @param {Element} tableElement
	 * @return {boolean}
	 */
	function hasCellSelection(tableElement) {
		return jQuery(tableElement).find('.aloha-cell-selected').length !== 0;
	}

	/**
	 * Checks if node is an editing host, ignoring table cells editing host.
	 * @param {Node} node
	 * @returns {boolean}
	 */
	function isEditingHostIgnoreEditableTableCells(node) {
		return DomLegacy.isEditingHost(node)
			&& (node.className.match("aloha-table-cell-editable") == null);
	}

	/**
	 * Gets the cell node which contains `node` if exists. Otherwise null.
	 * @param {Node} node
	 * @return {node|null}
	 */
	function getParentCellElement(node) {
		while (node && !isEditingHostIgnoreEditableTableCells(node)) {
			if (node.nodeName === 'TD' || node.nodeName === 'TH') {
				return node;
			}
			node = node.parentNode;
		}

		return null;
	}

	/**
	 * Gets the parent Table if exists. Otherwise null.
	 * @param {Node} node
	 * @return {node|null}
	 */
	function getTable(node) {
		while (node) {
			if (node.nodeName === 'TABLE') {
				return node;
			}
			node = node.parentNode;
		}

		return null;
	}

	/**
	 * Checks if `node` is inside a table.
	 * @param {Node} node
	 * @return {boolean}
	 */
	function isInsideTable (node) {
		return getParentCellElement(node) != null;
	}

	/**
	 * Get selected cells inside a Table.
	 * @param {Node} node
	 * @param {Array.<Element> elements
	 * @returns {Array.<Element>}
	 */
	function getSelectedTableCells(node, elements) {
		var cellElement = getParentCellElement(node);
		var table;

		table = getTable(cellElement);

		if (hasCellSelection(table)) {
			return getCellsInSelection(table);
		}

		if (Arrays.isEmpty(elements)) {
			// If there is nothing selected, we add the cell.
			return [cellElement];
		}

		return elements;
	}

	return {
		isInsideTable: isInsideTable,
		getSelectedTableCells: getSelectedTableCells
	};
});
