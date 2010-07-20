/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
if (typeof GENTICS == 'undefined' || !GENTICS) {
	var GENTICS = {};
}

if (typeof GENTICS.Utils == 'undefined' || !GENTICS.Utils) {
	GENTICS.Utils = {};
}

if (typeof GENTICS.Utils.Dom == 'undefined' || !GENTICS.Utils.Dom) {
	GENTICS.Utils.Dom = {};
} 

/**
 * Splits a DOM element at the given position up until the limit object, so that it is valid HTML again afterwards.
 * @param {RangeObject} range Range object that indicates the position of the splitting.
 * 				This range will be updated, so that it represents the same range as before the split.
 * @param {jQuery} limit Limiting node(s) for the split. 
 * 				The limiting node will not be included in the split itself.
 * 				If no limiting object is set, the document body will be the limiting object.
 * @param {boolean} atEnd If set to true, the DOM will be splitted at the end of the range otherwise at the start.
 * @static
 */
GENTICS.Utils.Dom.split = function (range, limit, atEnd) {
	var splitElement = jQuery(range.startContainer);
	var splitPosition = range.startOffset;
	
	if (atEnd) {
		splitElement = jQuery(range.endContainer);
		splitPosition = range.endOffset;
	}
	
	if (limit.length < 1) {
		limit = jQuery(document.body);
	}
	
	// we may have to update the range if it is not collapsed and we are splitting at the start
	var updateRange = (!range.isCollapsed() && !atEnd);
	
	// find the path up to the highest object that will be splitted
	var path;
	var parents = splitElement.parents().get();
	parents.unshift(splitElement.get(0));
		
	jQuery.each(parents, function(index, element) {
		var isLimit = limit.filter(
				function(){
					return this == element;
				}).length;
		if (isLimit) {
			if (index > 0) {
				path = parents.slice(0, index);
			}
			return false;
		}
	});
	
	// nothing found to split -> return here
	if (! path) {
		return;
	}
	
	path = path.reverse();
	var newDom;
	var insertElement;
	
	// iterate over the path, create new dom nodes for every element and move the contents
	// right of the split to the new element 
	for(var i=0; i < path.length; i++) {
		var element = path[i];
		if (i === path.length -1) {
			// last element in the path -> we have to split it
			var secondPart;
			
			if (element.nodeType === 3) {
				// text node
				secondPart = document.createTextNode(element.data.substring(splitPosition, element.data.length));
				element.data = element.data.substring(0, splitPosition);	
				
				// update the range if necessary
				if (updateRange && range.endContainer === element) {
					range.endContainer = secondPart;
					range.endOffset -= splitPosition;
				}
			} else {
				// other nodes
				var newElement = jQuery(document.createElement(element.nodeName));
				var children = $(element).contents();
				secondPart = newElement.append(children.slice(splitPosition, children.length));
			}
			
			if (insertElement) {
				insertElement.prepend(secondPart);
			} else {
				$(element).after(secondPart);
			}
		} else {
			// create the new element of the same type and prepend it to the previously created element
			var newElement = jQuery(document.createElement(element.nodeName));
			
			if (!newDom) {
				newDom = newElement;
				insertElement = newElement;
			} else {
				insertElement.prepend(newElement);
				insertElement = newElement;
			}
			
			// move all contents right of the split to the new element
			var next;
			while (next = path[i+1].nextSibling) {
				insertElement.append(next);
			}
			
			// update the range if necessary
			if (updateRange && range.endContainer === element) {
				range.endContainer = newElement.get(0);
				var prev = path[i+1];
				var offset = 0;
				while (prev = prev.previousSibling) {
					offset++;
				}
				range.endOffset -= offset;
			}
		}
	}
	
	// append the new dom
	jQuery(path[0]).after(newDom);
};