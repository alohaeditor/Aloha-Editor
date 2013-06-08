/* browser-fixes.js is part of Aloha Editor project http://aloha-editor.org
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
define(['util/html', 'util/dom2'], function (Html, Dom) {
	'use strict';

	function fixBoundaryPoint(container, offset, range, set) {
		// Because Chrome doesn't like it if a boundary point is at the
		// outside of an editable. The effect would be, if such a range
		// were added to the selection, that the selection would be
		// collapsed to the end of the range.
		if (Html.isEditingHost(Dom.nodeAtOffset(container, offset))) {
			set.call(range, Dom.nodeAtOffset(container, offset), 0);
		}
	}

	function fixRange(range) {
		fixBoundaryPoint(range.startContainer, range.startOffset, range, range.setStart);
		fixBoundaryPoint(range.endContainer, range.endOffset, range, range.setEnd);
	}

	return {
		fixRange: fixRange
	};
});
