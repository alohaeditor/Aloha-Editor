/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

window.TestUtils = window.TestUtils || {};

define(
		[],
		function() {
			"use strict";
			
			// load Aloha objects from require context 'aloha'
			var	
				Node = {
			    		'ELEMENT_NODE' : 1,
			    		'ATTRIBUTE_NODE': 2,
			    		'TEXT_NODE': 3,
			    		'CDATA_SECTION_NODE': 4,
			    		'ENTITY_REFERENCE_NODE': 5,
			    		'ENTITY_NODE': 6,
			    		'PROCESSING_INSTRUCTION_NODE': 7,
			    		'COMMENT_NODE': 8,
			    		'DOCUMENT_NODE': 9,
			    		'DOCUMENT_TYPE_NODE': 10,
			    		'DOCUMENT_FRAGMENT_NODE': 11,
			    		'NOTATION_NODE': 12,
			    		//The two nodes are disconnected. Order between disconnected nodes is always implementation-specific.
			    		'DOCUMENT_POSITION_DISCONNECTED': 0x01,
			    		//The second node precedes the reference node.
			    		'DOCUMENT_POSITION_PRECEDING': 0x02, 
			    		//The node follows the reference node.
			    		'DOCUMENT_POSITION_FOLLOWING': 0x04,
			    		//The node contains the reference node. A node which contains is always preceding, too.
			    		'DOCUMENT_POSITION_CONTAINS': 0x08,
			    		//The node is contained by the reference node. A node which is contained is always following, too.
			    		'DOCUMENT_POSITION_CONTAINED_BY': 0x10,
			    		//The determination of preceding versus following is implementation-specific.
			    		'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC': 0x20
			    	};

			
			
	
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

			editable.textNodes().filter(function() {
				return this.nodeType == 3 && this.nodeValue.indexOf('[') >= 0;
			}).each(function() {
				text = this.nodeValue;
				offset = text.indexOf('[');
				this.nodeValue = text.substring( 0, offset ) + text.substring( offset + 1 );
				rangeObject.startContainer = this;
				rangeObject.startOffset = offset;
			});

			editable.textNodes().filter(function() {
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
				range = new GENTICS.Utils.RangeObject(),
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
		
		addBrackets: function (range) {
			//@{
				// Handle the collapsed case specially, to avoid confusingly getting the
				// markers backwards in some cases
				if (range.startContainer.nodeType == Node.TEXT_NODE
				|| range.startContainer.nodeType == Node.COMMENT_NODE) {
					if (range.collapsed) {
						range.startContainer.insertData(range.startOffset, "[]");
					} else {
						range.startContainer.insertData(range.startOffset, "[");
					}
				} else {
					var marker = range.collapsed ? "{}" : "{";
					if (range.startOffset != range.startContainer.childNodes.length
					&& range.startContainer.childNodes[range.startOffset].nodeType == Node.TEXT_NODE) {
						range.startContainer.childNodes[range.startOffset].insertData(0, marker);
					} else if (range.startOffset != 0
					&& range.startContainer.childNodes[range.startOffset - 1].nodeType == Node.TEXT_NODE) {
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
				if (range.collapsed) {
					return;
				}
				if (range.endContainer.nodeType == Node.TEXT_NODE
				|| range.endContainer.nodeType == Node.COMMENT_NODE) {
					range.endContainer.insertData(range.endOffset, "]");
				} else {
					if (range.endOffset != range.endContainer.childNodes.length
					&& range.endContainer.childNodes[range.endOffset].nodeType == Node.TEXT_NODE) {
						range.endContainer.childNodes[range.endOffset].insertData(0, "}");
					} else if (range.endOffset != 0
					&& range.endContainer.childNodes[range.endOffset - 1].nodeType == Node.TEXT_NODE) {
						range.endContainer.childNodes[range.endOffset - 1].appendData("}");
					} else {
						range.endContainer.insertBefore(document.createTextNode("}"),
							range.endContainer.childNodes.length == range.endOffset
							? null
							: range.endContainer.childNodes[range.endOffset]);
					}
				}
			}
	});
	

	/**
	 * Create a jQuery plugin to extract the HTML of a given jQuery object
	 */
	jQuery.fn.extractHTML = function() {
		var attributes = ['class', 'id'];
		var fullResult = [];

		jQuery.each(this, function() {
			var $that = jQuery(this);
			var result = {};
			fullResult.push(result);
			result.nodeName = $that[0].nodeName;
			if ($that[0].nodeType == 3) {
				result.text = $that.text();
			} else if ($that[0].nodeType == 1) {
				jQuery.each(attributes, function(index, attr) {
					result[attr] = $that.attr(attr);
				});
				var contents = $that.contents();
				if (contents.length) {
					result.contents = contents.extractHTML();
				}
			}
		});

		return fullResult;
	};

	return TestUtils;
});
