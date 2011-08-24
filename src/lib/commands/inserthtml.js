/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha/core', 'aloha/jquery', 'aloha/commands'],
function(Aloha, jQuery, Commands) {
	"use strict";

	// Exported commands
	Commands['inserthtml'] = {
		action: function(value, range) {
			var 
				i,
				domNodes = [];
			
			/**
			 * Paste the given object into the current selection.
			 * If inserting fails (because the object is not allowed to be inserted), unwrap the contents and try with that.
			 * @param object object to be pasted
			 */
			function pasteElement(object, $editable) {
				var jqObject = jQuery(object),
					contents;

				// try to insert the element into the DOM
				if (!GENTICS.Utils.Dom.insertIntoDOM(jqObject, range, $editable, false)) {
					// if that is not possible, we unwrap the content and insert every child element
					 contents = jqObject.contents();

					// when a block level element was unwrapped, we at least insert a break
					if (GENTICS.Utils.Dom.isBlockLevelElement(object) || GENTICS.Utils.Dom.isListElement(object)) {
						pasteElement(jQuery('<br/>').get(0), $editable);
					}

					// and now all children (starting from the back)
					for ( i = contents.length - 1; i >= 0; --i) {
						pasteElement(contents[i], $editable);
					}
				}
			};
			
			// allowed values are string or jQuery objects
			// add value to a container div
			if ( typeof value === 'string' ){
				value = jQuery( '<div>' + value + '</div>' );
			} else if ( value instanceof jQuery ) {
				value = jQuery( '<div>' ).appendTo(value);
			} else {
				throw "INVALID_VALUE_ERR";
				return;
			}

			// get contents of container div
			domNodes = value.contents();
			
			// check if range starts an ends in same editable host
			if ( !(GENTICS.Utils.Dom.inSameEditingHost(range.startContainer, range.endContainer)) ) {
				throw "INVALID_RANGE_ERR";
				return;
			}
			
			// delete currently selected contents
			if (range.deleteContents) {
				range.deleteContents();
			}
			
			for ( i = domNodes.length - 1; i >= 0; --i) {
				// insert the elements
				pasteElement(domNodes[i], jQuery(GENTICS.Utils.Dom.getEditingHostOf(range.startContainer)));
			}
			
			// Call collapse() on the context object's Selection,
			// with last child's parent as the first argument and one plus its index as the second.
			if (domNodes.length > 0) {
				GENTICS.Utils.Dom.setCursorAfter(domNodes.get(domNodes.length - 1));
			} else {
				// if nothing was pasted, just reselect the old range
				range.select();
			}
			
			window.Aloha.Selection.updateSelection()
			var selectedRange = window.Aloha.Selection.getRangeObject();
	        GENTICS.Utils.Dom.doCleanup({merge:true}, selectedRange, range.commonAncestorContainer);

		}
	};

});