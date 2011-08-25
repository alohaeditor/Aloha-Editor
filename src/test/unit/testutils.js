/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

window.TestUtils = window.TestUtils || {};

define(
		['aloha/jquery'],
		function(jQuery, undefined) {
			"use strict";
			
			var	$ = jQuery;
	
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
			var foundStart = false, foundEnd = false;
			var rangeObject = new Aloha.Selection.SelectionRange();
			var markerRange = new Aloha.Selection.SelectionRange();

			editable.contents().filter(function() {
				return this.nodeType == 3 && this.nodeValue.indexOf('[') >= 0;
			}).each(function() {
				markerRange.startContainer = markerRange.endContainer = this;
				markerRange.startOffset = this.nodeValue.indexOf('[');
				markerRange.endOffset = markerRange.startOffset + 1;
				foundStart = true;
			});

			if (!foundStart) {
				return;
			}

			GENTICS.Utils.Dom.removeRange(markerRange);
			rangeObject.startContainer = markerRange.startContainer;
			rangeObject.startOffset = markerRange.startOffset;

			editable.contents().filter(function() {
				return this.nodeType == 3 && this.nodeValue.indexOf(']') >= 0;
			}).each(function() {
				markerRange.startContainer = markerRange.endContainer = this;
				markerRange.startOffset = this.nodeValue.indexOf(']');
				markerRange.endOffset = markerRange.startOffset + 1;
				foundEnd = true;
			});

			if (!foundEnd) {
				return;
			}

			GENTICS.Utils.Dom.removeRange(markerRange);
			rangeObject.endContainer = markerRange.endContainer;
			rangeObject.endOffset = markerRange.endOffset;

			return rangeObject;
		},
		/**
		 * Transform the selection into a selection marker.
		 * @void
		 */
		markerFromSelection : function () {
			var 
				range = Aloha.Selection.getRangeObject(),
				insertMarker = 	function (node,offset,marker) {
					var
						text;
					if (node.nodeType == 3) {
						text = node.nodeValue;
						range.endContainer.nodeValue = text.substring(0,offset)+marker+text.substring(offset);
					} else {
						// insert text node before endNode
						//jQuery(node).contents()[offset]).appendTo(']');
					}
				};
			
			insertMarker(range.endContainer, range.endOffset, ']');
			insertMarker(range.startContainer, range.startOffset, '[');
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
