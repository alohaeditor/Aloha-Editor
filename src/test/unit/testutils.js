/* testutils.js is part of Aloha Editor project http://aloha-editor.org
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
window.TestUtils = window.TestUtils || {};

define(['../../lib/aloha/ecma5shims'], function($_) {
	'use strict';

	/**
	 * TestUtils class
	 */
	TestUtils = jQuery.extend(true, TestUtils, {
		/**
		 * Create a collapsed range in the given container at the given offset
		 * @param container container DOM element
		 * @param offset offset in the container
		 * @return the GENTICS.Utils.RangeObject
		 */
		createCollapsedRange : function(container, offset) {
			var range = new GENTICS.Utils.RangeObject({
				startContainer : container,
				startOffset : offset,
				endContainer : container,
				endOffset : offset
			});
			range.correctRange();
			return range;
		},

		/**
		 * Set the cursor at the given position in the editable
		 * @param editable editable jQuery object
		 * @param container container DOM element
		 * @param offset offset in the container
		 * @return the GENTICS.Utils.RangeObject
		 */
        setCursor : function(editable, container, offset) {
			var range = this.createCollapsedRange(container, offset);
			editable.focus();
			range.select();
			Aloha.Selection.updateSelection();
			return range;
		},

		/**
		 * Helper function for generating ranges. The range will be stored as selection in Aloha.
		 * @param startContainer node where the selection starts
		 * @param startOffset within the startContainer
		 * @param endContainer node where the selection ends
		 * @param endOffset within endContainer
		 * @return range
		 */
		generateRange : function(startContainer, startOffset, endContainer, endOffset) {
			var rangeObject = new Aloha.Selection.SelectionRange();
			Aloha.Selection.rangeObject = rangeObject;

			// start and end container have to be text nodes
			rangeObject.startContainer = startContainer;
			rangeObject.endContainer = endContainer;
			rangeObject.startOffset = startOffset;
			rangeObject.endOffset = endOffset;

			rangeObject.update();
			return rangeObject;
		},

		/**
		 * Simulate pressing enter in the given editable
		 * @param editable jQuery object
		 * @param shiftKey true when the shift-key shall be pressed, false if not
		 */
		pressEnter : function(editable, shiftKey) {
			if (shiftKey) {
				editable.simulate('keydown', {keyCode: 13, shiftKey : true});
				editable.simulate('keyup', {keyCode: 13, shiftKey : true});
			} else {
				editable.simulate('keydown', {keyCode: 13});
				editable.simulate('keyup', {keyCode: 13});
			}

			// finally we need to update the aloha selection (which is normally done automatically)
			Aloha.Selection.updateSelection();
		},

		/**
		 * Simulate pressing backspace in the given editable
		 * @param editable jQuery object
		 */
		pressBackspace : function(editable) {
			editable.simulate('keydown', {keyCode: 8});
			editable.simulate('keyup', {keyCode: 8});
		},

		/**
		 * Apply the given markup to the given range. This will either
		 * add or remove the markup (depending on whether the markup is
		 * currently active at the start of the range)
		 * @param editable editable as jQuery object
		 * @param rangeObject range object
		 * @param markup as jQuery object
		 * @param nesting true when nesting of the markup is allowed, false if not
		 */
		applyMarkup : function (editable, rangeObject, markup, nesting) {
			var markupIsApplied = false;
			rangeObject.clearCaches();
			rangeObject.updateMarkupEffectiveAtStart();

			for (var i = 0; i < rangeObject.markupEffectiveAtStart.length; i++) {
				var effectiveMarkup = rangeObject.markupEffectiveAtStart[ i ];
				if (Aloha.Selection.standardTextLevelSemanticsComparator(effectiveMarkup, markup)) {
					markupIsApplied = true;
				}
			}

			if (markupIsApplied) {
				GENTICS.Utils.Dom.removeMarkup(rangeObject, markup, editable);
			} else {
				GENTICS.Utils.Dom.addMarkup(rangeObject, markup, nesting);
			}
			rangeObject.correctRange();
			rangeObject.select();
			rangeObject.clearCaches();
			rangeObject.updateMarkupEffectiveAtStart();
		},

		/**
		 * Remove the given markup from the given range.
		 * @param editable editable as jQuery object
		 * @param rangeObject range object
		 * @param markup as jQuery object
		 */
		removeMarkup : function (editable, rangeObject, markup) {
			GENTICS.Utils.Dom.removeMarkup(rangeObject, markup, editable);
			rangeObject.correctRange();
			rangeObject.select();
			rangeObject.clearCaches();
			rangeObject.updateMarkupEffectiveAtStart();
		},

		/**
		 * Transform the selection marker into a range and remove the marker.
		 * @param editable editable, which should contain selection markers []
		 * @return range
		 */
		rangeFromMarker : function (editable) {
			var 
				text,
				offset,
				rangeObject = new Aloha.Selection.SelectionRange();

			$_( editable.textNodes() ).filter(function() {
				return this.nodeType == 3 && this.nodeValue.indexOf('[') >= 0;
			}).each(function() {
				text = this.nodeValue;
				offset = text.indexOf('[');
				this.nodeValue = text.substring( 0, offset ) + text.substring( offset + 1 );
				rangeObject.startContainer = this;
				rangeObject.startOffset = offset;
			});

			$_( editable.textNodes() ).filter(function() {
				return this.nodeType == 3 && this.nodeValue.indexOf(']') >= 0;
			}).each(function() {
				text = this.nodeValue;
				offset = text.indexOf(']');
				this.nodeValue = text.substring( 0, offset ) + text.substring( offset + 1 );
				rangeObject.endContainer = this;
				rangeObject.endOffset = offset;
			});

			return rangeObject;
		},
		/**
		 * Transform the selection into a selection marker.
		 * @void
		 */
		markerFromSelection : function () {
			var 
				range = new Aloha.RangeObject(),
				insertMarker = 	function (node,offset,marker) {
					var
						text;
					if (node.nodeType == 3) {
						text = node.nodeValue;
						range.endContainer.nodeValue = text.substring(0,offset)+marker+text.substring(offset);
					} else {
						// insert text node before endNode
						jQuery(node).contents()[offset].append(']');
					}
				};
			
			range.initializeFromUserSelection();
			
			insertMarker(range.endContainer, range.endOffset, ']');
			insertMarker(range.startContainer, range.startOffset, '[');
		},
		
		/**
		 * Parses selection markers in the innerHTML of the given element and 
		 * creates a range object whose start and end determined from these
		 * selection markers.
		 *
		 * @param {editable} - DOM Node element containing two selection
		 *					   markers. Exactly one of these two markers should
		 *					   be a start marker string (ie: "[", "{", or
		 *					   "data-start"), and one should be an end marker
		 *					   string (ie: "]", "}", "data-end").
		 *					   
		 * @param {Object: range} Range object
		 */
		addRange: function ( editable ) {
			function nextNode(node) {
				if (node.hasChildNodes()) {
					return node.firstChild;
				}
				return nextNodeDescendants(node);
			};
			
			function nextNodeDescendants(node) {
				while (node && !node.nextSibling) {
					node = node.parentNode;
				}
				if (!node) {
					return null;
				}
				return node.nextSibling;
			};
			
			function getNodeIndex(node) {
				var ret = 0;
				while (node.previousSibling) {
					ret++;
					node = node.previousSibling;
				}
				return ret;
			};
			
			var html = editable.html();
			// A variety of checks to avoid simple errors.  Not foolproof, of course.
			var re = /\{|\[|data-start/g;
			var markers = [];
			var marker;
			while (marker = re.exec(html)) {
				markers.push(marker);
			}
			if (markers.length != 1) {
				throw "Need exactly one start marker ([ or { or data-start), found " + markers.length;
			}

			var re = /\}|\]|data-end/g;
			var markers = [];
			var marker;
			while (marker = re.exec(html)) {
				markers.push(marker);
			}
			if (markers.length != 1) {
				throw "Need exactly one end marker (] or } or data-end), found " + markers.length;
			}

			var node = editable[0];

			var startNode, startOffset, endNode, endOffset;

			// For braces that don't lie inside text nodes, we can't just set
			// innerHTML, because that might disturb the DOM.  For instance, if the
			// brace is right before a <tr>, it could get moved outside the table
			// entirely, which messes everything up pretty badly.  So we instead
			// allow using data attributes: data-start and data-end on the start and
			// end nodes, with a numeric value indicating the offset.  This format
			// doesn't allow the parent div to be a start or end node, but in that case
			// you can always use the curly braces.
      // Lakshan: changed from querySelector to use jQuery selecotrs since former
      // doesn't work on IE7
			if (jQuery(node).find("[data-start]")[0]) {
				startNode = jQuery( node ).find("[data-start]")[0];
				startOffset = startNode.getAttribute("data-start");
				startNode.removeAttribute("data-start");
			}
			if (jQuery( node ).find("[data-end]")[0]) {
				endNode = jQuery( node ).find("[data-end]")[0];
				endOffset = endNode.getAttribute("data-end");
				endNode.removeAttribute("data-end");
			}

			var cur = node;
			while (true) {
				if (!cur || (cur != node && !($_.compareDocumentPosition(cur, node) & $_.Node.DOCUMENT_POSITION_CONTAINS))) {
					break;
				}

				if (cur.nodeType != $_.Node.TEXT_NODE) {
					cur = nextNode(cur);
					continue;
				}

				var data = cur.data.replace(/[\]\}]/g, "");
				var startIdx = data.indexOf("[");

				data = cur.data.replace(/[\[\{]/g, "");
				var endIdx = data.indexOf("]");

				cur.data = cur.data.replace(/[\[\]]/g, "");

				if (startIdx != -1) {
					startNode = cur;
					startOffset = startIdx;
				}

				if (endIdx != -1) {
					endNode = cur;
					endOffset = endIdx;
				}

				// These are only legal as the first or last
				data = cur.data.replace(/\}/g, "");
				var elStartIdx = data.indexOf("{");

				data = cur.data.replace(/\{/g, "");
				var elEndIdx = data.indexOf("}");

				if (elStartIdx == 0) {
					startNode = cur.parentNode;
					startOffset = getNodeIndex(cur);
				} else if (elStartIdx != -1) {
					startNode = cur.parentNode;
					startOffset = getNodeIndex(cur) + 1;
				}
				if (elEndIdx == 0) {
					endNode = cur.parentNode;
					endOffset = getNodeIndex(cur);
				} else if (elEndIdx != -1) {
					endNode = cur.parentNode;
					endOffset = getNodeIndex(cur) + 1;
				}
				
				cur.data = cur.data.replace(/[{}]/g, "");
				if (!cur.data.length) {
					if (cur == startNode || cur == endNode) {
						throw "You put a square bracket where there was no text node . . .";
					}
					var oldCur = cur;
					cur = nextNode(cur);
					oldCur.parentNode.removeChild(oldCur);
				} else {
					cur = nextNode(cur);
				}
			}
			
			var range = Aloha.createRange();
			range.setStart( startNode, startOffset );
			range.setEnd( endNode, endOffset );
			
			return range;
		},
		
		addBrackets: function (range) {
			var marker;
			// Handle the collapsed case specially, to avoid confusingly getting the
			// markers backwards in some cases
			if (range.endContainer.nodeType == $_.Node.TEXT_NODE
				|| range.endContainer.nodeType == $_.Node.COMMENT_NODE) {
					if (range.collapsed) {
						marker = '[]'
					} else {
						marker = ']'
					}
					range.endContainer.insertData(range.endOffset, marker);
				} else {
					if (range.collapsed) {
						marker = '{}'
					} else {
						marker = '}'
					}
					if (range.endOffset != range.endContainer.childNodes.length
					&& range.endContainer.childNodes[range.endOffset].nodeType == $_.Node.TEXT_NODE) {
						range.endContainer.childNodes[range.endOffset].insertData(0, marker);
					} else if (range.endOffset != 0
					&& range.endContainer.childNodes[range.endOffset - 1].nodeType == $_.Node.TEXT_NODE) {
						range.endContainer.childNodes[range.endOffset - 1].appendData( marker );
					} else {
						range.endContainer.insertBefore(document.createTextNode( marker ),
							range.endContainer.childNodes.length == range.endOffset
							? null
							: range.endContainer.childNodes[range.endOffset]);
					}
				}
				if (range.collapsed) {
					return;
				}
				if (range.startContainer.nodeType == $_.Node.TEXT_NODE
				|| range.startContainer.nodeType == $_.Node.COMMENT_NODE) {
					range.startContainer.insertData(range.startOffset, "[");
				} else {
					marker = '{';
					if (range.startOffset != range.startContainer.childNodes.length
					&& range.startContainer.childNodes[range.startOffset].nodeType == $_.Node.TEXT_NODE) {
						range.startContainer.childNodes[range.startOffset].insertData(0, marker);
					} else if (range.startOffset != 0
					&& range.startContainer.childNodes[range.startOffset - 1].nodeType == $_.Node.TEXT_NODE) {
						range.startContainer.childNodes[range.startOffset - 1].appendData(marker);
					} else {
						// Seems to serialize as I'd want even for tables . . . IE doesn't
						// allow undefined to be passed as the second argument (it throws
						// an exception), so we have to explicitly check the number of
						// children and pass null.
						range.startContainer.insertBefore(document.createTextNode(marker),
							range.startContainer.childNodes.length == range.startOffset
							? null
							: range.startContainer.childNodes[range.startOffset]);
					}
				}
			},

		/**
		 * Return an array containing all possible permutations of the elements in the given array
		 * 
		 * @param {array} array array of elements
		 * @param {array} fix array of elements that need to be contained in all returned arrays
		 * @return {array} array containing arrays of all possible permutations
		 */
		permutations: function (array, fix) {
			// iterate over the entries
			var i, entry, newArray, subArrays, subI, permsArray = [];
			for (i in array) {
				if (array.hasOwnProperty(i)) {
					entry = array[i];
					if (Aloha.jQuery.isArray(fix) && Aloha.jQuery.inArray(entry, fix) >= 0) {
						continue;
					}
					newArray = Aloha.jQuery.extend([], fix);
					newArray.push(entry);
					permsArray.push(newArray);
					subArrays = this.permutations(array, newArray);
					for (subI in subArrays) {
						if (subArrays.hasOwnProperty(subI)) {
							permsArray.push(subArrays[subI]);
						}
					}
				}
			}

			return permsArray;
		}
	});
	

	/**
	 * Create a jQuery plugin to extract the HTML of a given jQuery object
	 */
	jQuery.fn.extractHTML = function( attributes ) {
		attributes = typeof attributes === 'undefined' ? ['class', 'id'] : attributes;
		var fullResult = [];
		if ( typeof attr !== 'undefined' ) {
			attributes.push(attr);
		}
		
		jQuery.each(this, function() {
			var that = jQuery(this);
			var result = {};
			result.nodeName = that[0].nodeName.toLowerCase();
			fullResult.push(result);
			if (that[0].nodeType == 3) {
				result.text = that.text();
			} else if (that[0].nodeType == 1) {
				jQuery.each(attributes, function(index, attr) {
					result[attr] = that.attr(attr);
				});
				var contents = that.contents();
				if (contents.length) {
					result.contents = contents.extractHTML(attributes);
				}
			}
		});

		return fullResult;
	};

	return TestUtils;
});
