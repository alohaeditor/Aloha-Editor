/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

define(
['aloha/core', 'aloha/jquery', 'aloha/commands', 'aloha/selection', 'util/dom'],
function(Aloha, jQuery, Commands, Selection, Dom) {
	"use strict";

	// Exported commands
	Commands['inserthtml'] = {
		action: function(value, range) {
			var 
				$editable = jQuery(Dom.getEditingHostOf(range.startContainer)),
				cac = range.commonAncestorContainer,
				i,
				domNodes = [];
			
			/**
			 * Paste the given object into the current selection.
			 * If inserting fails (because the object is not allowed to be inserted), unwrap the contents and try with that.
			 * @param object object to be pasted
			 */
			function pasteElement(object) {
				var $object = jQuery(object),
					contents;

				// try to insert the element into the DOM with limit the editable host
				// this fails when an element is not allowed to be inserted
				if (!Dom.insertIntoDOM($object, range, $editable, false)) {
					
					// if that is not possible, we unwrap the content and insert every child element
					 contents = $object.contents();

					// when a block level element was unwrapped, we at least insert a break
					if (Dom.isBlockLevelElement(object) || Dom.isListElement(object)) {
						pasteElement(jQuery('<br/>').get(0));
					}

					// and now all children (starting from the back)
					for ( i = contents.length - 1; i >= 0; --i) {
						pasteElement(contents[i]);
					}
				}
			};
			
			// allowed values are string or jQuery objects
			// add value to a container div
			if ( typeof value === 'string' ){
				value = jQuery( '<div>' + value + '</div>' );
			} else if ( value instanceof jQuery ) {
				value = jQuery( '<div>' ).append(value);
			} else {
				throw "INVALID_VALUE_ERR";
				return;
			}

			// get contents of container div
			domNodes = value.contents();
			
			// check if range starts an ends in same editable host
			if ( !(Dom.inSameEditingHost(range.startContainer, range.endContainer)) ) {
				throw "INVALID_RANGE_ERR";
				return;
			}
			
			// delete currently selected contents
			Dom.removeRange(range);
			
			for ( i = domNodes.length - 1; i >= 0; --i) {
				// insert the elements
				pasteElement(domNodes[i]);
			}

			// Call collapse() on the context object's Selection,
			// with last child's parent as the first argument and one plus its index as the second.
			if (domNodes.length > 0) {
				Dom.setCursorAfter(domNodes.get(domNodes.length - 1));
			} else {
				// if nothing was pasted, just reselect the old range
				range.select();
			}

			Selection.updateSelection();
			var selectedRange = Selection.getRangeObject();
	        Dom.doCleanup({merge:true, removeempty: true}, selectedRange, cac);
	        selectedRange.select();

		}
	};

});