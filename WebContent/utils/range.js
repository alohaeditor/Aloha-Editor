/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

if (typeof GENTICS == 'undefined' || !GENTICS) {
	var GENTICS = {};
}

if (typeof GENTICS.Utils == 'undefined' || !GENTICS) {
	GENTICS.Utils = {};
}

/**
 * @namespace GENTICS.Utils
 * @class RangeObject
 * Represents a selection range in the browser that 
 * has some advanced features like selecting the range.
 * @param {object} param if boolean true is passed, the range will be deducted from the current browser selection.
 * If another rangeObject is passed, it will be cloned.
 * If nothing is passed, the rangeObject will be empty.
 * @constructor
 */
GENTICS.Utils.RangeObject = function(param) {
	/**
	 * DOM object of the start container of the selection.
	 * This is always has to be a DOM text node.
	 * @property startContainer
	 * @type {DOMObject}
	 */
	this.startContainer;
	
	/**
	 * Offset of the selection in the start container
	 * @property startOffset
	 * @type {Integer}
	 */
	this.startOffset;
	
	/**
	 * DOM object of the end container of the selection.
	 * This is always has to be a DOM text node.
	 * @property endContainer
	 * @type {DOMObject}
	 */
	this.endContainer;
	
	/**
	 * Offset of the selection in the end container
	 * @property endOffset
	 * @type {Integer}
	 */
	this.endOffset;

	/**
	 * Parents of the start container up to different limit objects
	 */
	this.startParents = [];

	/**
	 * Parents of the end container up to different limit objects
	 */
	this.endParents = [];

	/**
	 * @hide
	 * RangeTree cache for different root objects
	 */
	this.rangeTree = [];

	// Take the values from the passed object
	if (typeof param === 'object') {
		if (param.startContainer !== undefined) {
			this.startContainer = param.startContainer;
		}
		if (param.startOffset !== undefined) {
			this.startOffset = param.startOffset;
		}
		if (param.endContainer !== undefined) {
			this.endContainer = param.endContainer;
		}
		if (param.endOffset !== undefined) {
			this.endOffset = param.endOffset;
		}		
	} else if (param === true) {
		this.initializeFromUserSelection();
	}
};

/**
 * Delete all contents selected by the current range
 */
GENTICS.Utils.RangeObject.prototype.deleteContents = function () {
	// split range at the beginning and start, so deletion is easier

	// the split process will leave the tree in a state, where it
	// will only contain fully selected or unselected nodes.
	// there may be some nodes that are partially selected which can
	// be ignored safely, as they are only remains of the original
	// cursor position before the split without an actual selected
	// content. threat them as if they were not selected.
	var cac = jQuery(this.getCommonAncestorContainer());
	GENTICS.Utils.Dom.split(this, cac, false);
	GENTICS.Utils.Dom.split(this, cac, true);
	this.clearCaches();
	
	// iterate over range tree to perform deletion
	var rt = this.getRangeTree();
	for (var i = 0; i < rt.length; i++) {
		if (rt[i].type === 'full') {
			// delete only fully selected nodes
			jQuery(rt[i].domobj).remove();
		}
	}
	
	// special handling if all contents of the cac have been deleted
	// this case can be detected, if the cac contains just a single br,
	// or no children at all. if this occurs the range will be collapsed
	this.clearCaches();
	rt = this.getRangeTree();
	children = cac.children();
	if (children.length === 0 || (children.length === 1 && children.get(0).nodeName === 'BR')) {
		this.commonAncestorContainer = this.startContainer = this.endContainer = cac.get(0);
		this.startOffset = 0;
		this.endOffset = 0;
	}
};

/**
 * Output some log
 * TODO: move this to GENTICS.Aloha.Log
 * @param message log message to output
 * @param obj optional JS object to output
 * @return void
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.log = function(message, obj) {
	if (GENTICS && GENTICS.Aloha && GENTICS.Aloha.Log) {
		GENTICS.Aloha.Log.debug(this, message);
		return false;
	}
	if (console) {		
		console.log(message);
		if (obj) {
			console.log(obj);
		}
	}
};

/**
 * Method to test if a range object is collapsed. 
 * A range is considered collapsed if either no endContainer exists or the endContainer/Offset equal startContainer/Offset
 * @return {boolean} true if collapsed, false otherwise
 * @method
 */
GENTICS.Utils.RangeObject.prototype.isCollapsed = function() {
	return (!this.endContainer || (this.startContainer === this.endContainer && this.startOffset === this.endOffset));
};

/**
 * Method to (re-)calculate the common ancestor container and to get it.
 * The common ancestor container is the DOM Object which encloses the
 * whole range and is nearest to the start and end container objects.
 * @return {DOMObject} get the common ancestor container
 * @method
 */
GENTICS.Utils.RangeObject.prototype.getCommonAncestorContainer = function() {
	if (this.commonAncestorContainer) {
		// sometimes it's cached (or was set)
		return this.commonAncestorContainer;
	}
	
	// if it's not cached, calculate and then cache it
	this.updateCommonAncestorContainer();
	
	// now return it anyway
	return this.commonAncestorContainer;
};

/**
 * Get the parent elements of the startContainer/endContainer up to the given limit. When the startContainer/endContainer
 * is no text element, but a node, the node itself is returned as first element.
 * @param {jQuery} limit limit object (default: body)
 * @param {boolean} fromStart true to fetch the parents from the startContainer, false for the endContainer
 * @return {jQuery} parent elements of the startContainer/endContainer as jQuery objects
 * @method
 */
GENTICS.Utils.RangeObject.prototype.getContainerParents = function (limit, fromEnd) {
	var container = fromEnd ? this.endContainer : this.startContainer;
	var parentStore = fromEnd ? this.endParents : this.startParents;

	if (!container) {
		return false;
	}

	if (typeof limit == 'undefined' || !limit) {
		limit = jQuery('body');
	}

	if (!parentStore[limit.get(0)]) {
		var parents;

		// for text nodes, get the parents
		if (container.nodeType == 3) {
			parents = jQuery(container).parents();
		} else {
			parents = jQuery(container).parents();
			for (var i = parents.length; i > 0; --i) {
				parents[i] = parents[i - 1];
			}
			parents[0] = container;
		}

		// now slice this array
		var limitIndex = parents.index(limit);

		if (limitIndex >= 0) {
			parents = parents.slice(0, limitIndex);
		}

		// store it (might be used again)
		parentStore[limit.get(0)] = parents;
	}

	return parentStore[limit.get(0)];
};

/**
 * Get the parent elements of the startContainer up to the given limit. When the startContainer
 * is no text element, but a node, the node itself is returned as first element.
 * @param {jQuery} limit limit object (default: body)
 * @return {jQuery} parent elements of the startContainer as jQuery objects
 * @method
 */
GENTICS.Utils.RangeObject.prototype.getStartContainerParents = function(limit) {
	return this.getContainerParents(limit, false);
};

/**
 * Get the parent elements of the endContainer up to the given limit. When the endContainer is
 * no text element, but a node, the node itself is returned as first element.
 * @param {jQuery} limit limit object (default: body)
 * @return {jQuery} parent elements of the endContainer as jQuery objects
 * @method
 */
GENTICS.Utils.RangeObject.prototype.getEndContainerParents = function(limit) {
	return this.getContainerParents(limit, true);
};

/**
 * TODO: the commonAncestorContainer is not calculated correctly, if either the start or 
 * the endContainer would be the cac itself (e.g. when the startContainer is a textNode 
 * and the endContainer is the startContainer's parent <p>). in this case the cac will be set
 * to the parent div
 * Method to update a range object internally
 * @param commonAncestorContainer (DOM Object); optional Parameter; if set, the parameter 
 * will be used instead of the automatically calculated CAC
 * @return void
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.updateCommonAncestorContainer = function(commonAncestorContainer) {
	// this will be needed either right now for finding the CAC or later for the crossing index
	var parentsStartContainer = this.getStartContainerParents();
	var parentsEndContainer = this.getEndContainerParents();

	// if no parameter was passed, calculate it
	if (!commonAncestorContainer) {
		// find the crossing between startContainer and endContainer parents (=commonAncestorContainer)
		if (!(parentsStartContainer.length > 0 && parentsEndContainer.length > 0)) {
			GENTICS.Utils.RangeObject.prototype.log('could not find commonAncestorContainer');
			return false;
		}
		
		for (var i = 0; i < parentsStartContainer.length; i++) {
			if (parentsEndContainer.index( parentsStartContainer[ i ] ) != -1) {
				this.commonAncestorContainer = parentsStartContainer[ i ];
				break;
			}
		}
	} else {
		this.commonAncestorContainer = commonAncestorContainer;
	}

	// if everything went well, return true :-)
	GENTICS.Utils.RangeObject.prototype.log(commonAncestorContainer? 'commonAncestorContainer was set successfully' : 'commonAncestorContainer was calculated successfully');
	return true;
};

/**
 * Helper function for selection in IE. Creates a collapsed text range at the given position
 * @param container container
 * @param offset offset
 * @return collapsed text range at that position
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.getCollapsedIERange = function(container, offset) {
	// create a text range
	var ieRange = document.body.createTextRange();

	// search to the left for the next element
	var left = this.searchElementToLeft(container, offset);
	if (left.element) {
		// found an element, set the start to the end of that element
		var tmpRange = document.body.createTextRange();
		tmpRange.moveToElementText(left.element);
		ieRange.setEndPoint('StartToEnd', tmpRange);

		// and correct the start
		if (left.characters != 0) {
			ieRange.moveStart('character', left.characters);
		} else {
			// this is a hack, when we are at the start of a text node, move the range anyway
			ieRange.moveStart('character', 1);
			ieRange.moveStart('character', -1);
		}
	} else {
		// found nothing to the left, so search right
		var right = this.searchElementToRight(container, offset);
		if (false && right.element) {
			// found an element, set the start to the start of that element
			var tmpRange = document.body.createTextRange();
			tmpRange.moveToElementText(right.element);
			ieRange.setEndPoint('StartToStart', tmpRange);

			// and correct the start
			if (right.characters != 0) {
				ieRange.moveStart('character', -right.characters);
			} else {
				ieRange.moveStart('character', -1);
				ieRange.moveStart('character', 1);
			}
		} else {
			// also found no element to the right, use the container itself
			var parent = container.nodeType == 3 ? container.parentNode : container;
			var tmpRange = document.body.createTextRange();
			tmpRange.moveToElementText(parent);
			ieRange.setEndPoint('StartToStart', tmpRange);

			// and correct the start
			if (left.characters != 0) {
				ieRange.moveStart('character', left.characters);
			}
		}
	}
	ieRange.collapse();

	return ieRange;
};

/**
 * Sets the visible selection in the Browser based on the range object.
 * If the selection is collapsed, this will result in a blinking cursor, 
 * otherwise in a text selection.
 * @method
 */
GENTICS.Utils.RangeObject.prototype.select = document.createRange === undefined && false ? function() { // first the IE version of this method
	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		GENTICS.Aloha.Log.debug(this, 'Set selection to current range (IE version)');
	}
	// when the startcontainer is a textnode, which is followed by a blocklevel node (p, h1, ...), we need to add a <br> in between
	if (this.startContainer.nodeType == 3
			&& GENTICS.Utils.Dom.isBlockLevelElement(this.startContainer.nextSibling)) {
		jQuery(this.startContainer).after('<br/>');
		// we eventually also need to update the offset of the end container
		if (this.endContainer === this.startContainer.parentNode
				&& GENTICS.Utils.Dom.getIndexInParent(this.startContainer) < this.endOffset) {
			this.endOffset++;
		}
	}

	// create a text range
	var ieRange = document.body.createTextRange();

	// get the start as collapsed range
	var startRange = this.getCollapsedIERange(this.startContainer, this.startOffset);
	ieRange.setEndPoint('StartToStart', startRange);

	if (this.isCollapsed()) {
		// collapse the range
		ieRange.collapse();
	} else {
		// get the end as collapsed range
		var endRange = this.getCollapsedIERange(this.endContainer, this.endOffset);
		ieRange.setEndPoint('EndToStart', endRange);
	}

	// select our range now
	ieRange.select();
} : function() { // now for the rest of the world
	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		GENTICS.Aloha.Log.debug(this, 'Set selection to current range (non IE version)');
	}

	// create a range
	var range = rangy.createRange();
	
	// set start and endContainer
	range.setStart(this.startContainer,this.startOffset);	
	range.setEnd(this.endContainer, this.endOffset);
	
	// update the selection
	var sel = rangy.getSelection();
	sel.setSingleRange(range);
};

/**
 * Starting at the given position, search for the next element to the left and count the number of characters are in between
 * @param container container of the startpoint
 * @param offset offset of the startpoint in the container
 * @return object with 'element' (null if no element found) and 'characters'
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.searchElementToLeft = function (container, offset) {
	var checkElement = undefined;
	var characters = 0;

	if (container.nodeType == 3) {
		// start is in a text node
		characters = offset;
		// begin check at the element to the left (if any)
		checkElement = container.previousSibling;
	} else {
		// start is between nodes, begin check at the element to the left (if any)
		if (offset > 0) {
			checkElement = container.childNodes[offset - 1];
		}
	}

	// move to the right until we find an element
	while (checkElement && checkElement.nodeType == 3) {
		characters += checkElement.data.length;
		checkElement = checkElement.previousSibling;
	}

	return {'element' : checkElement, 'characters' : characters};
};

/**
 * Starting at the given position, search for the next element to the right and count the number of characters that are in between
 * @param container container of the startpoint
 * @param offset offset of the startpoint in the container
 * @return object with 'element' (null if no element found) and 'characters'
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.searchElementToRight = function (container, offset) {
	var checkElement = undefined;
	var characters = 0;

	if (container.nodeType == 3) {
		// start is in a text node
		characters = container.data.length - offset;

		// begin check at the element to the right (if any)
		checkElement = container.nextSibling;
	} else {
		// start is between nodes, begin check at the element to the right (if any)
		if (offset < container.childNodes.length) {
			checkElement = container.childNodes[offset];
		}
	}

	// move to the right until we find an element
	while (checkElement && checkElement.nodeType == 3) {
		characters += checkElement.data.length;
		checkElement = checkElement.nextSibling;
	}

	return {'element' : checkElement, 'characters' : characters};
};

/**
 * Method which updates the rangeObject including all extending properties like commonAncestorContainer etc...
 * TODO: is this method needed here? or should it contain the same code as GENTICS.Aloha.Selection.prototype.SelectionRange.prototype.update?
 * @return void
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.update = function(event) {
	GENTICS.Utils.RangeObject.prototype.log('==========');
	GENTICS.Utils.RangeObject.prototype.log('now updating rangeObject');
	this.initializeFromUserSelection(event);
	this.updateCommonAncestorContainer();
};

/**
 * Initialize the current range object from the user selection of the browser.
 * @param event which calls the method
 * @return void
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.initializeFromUserSelection = function(event) {
	// get Browser selection via IERange standardized window.getSelection()
	var selection = rangy.getSelection();
	if (!selection) {
		return false;
	}
	
	// check if a ragne exists
	if ( selection.rangeCount == 0 ) {
		return false;
	}

	// getBrowserRange
	var browserRange = selection.getRangeAt(0);
	if (!browserRange) {
		return false;
	}

	// initially set the range to what the browser tells us
	this.startContainer = browserRange.startContainer;
	this.endContainer = browserRange.endContainer;
	this.startOffset = browserRange.startOffset;
	this.endOffset = browserRange.endOffset;

	// now try to correct the range
	this.correctRange();
	return;
};

/**
 * Correct the current range. The general goal of the algorithm is to have start
 * and end of the range in text nodes if possible and the end of the range never
 * at the beginning of an element or text node. Details of the algorithm can be
 * found in the code comments
 * @method
 */
GENTICS.Utils.RangeObject.prototype.correctRange = function() {
	this.clearCaches();
	if (this.isCollapsed()) {
		// collapsed ranges are treated specially

		// first check if the range is not in a text node
		if (this.startContainer.nodeType == 1) {
			if (this.startOffset > 0 && this.startContainer.childNodes[this.startOffset - 1].nodeType == 3) {
				// when the range is between nodes (container is an element
				// node) and there is a text node to the left -> move into this text
				// node (at the end)
				this.startContainer = this.startContainer.childNodes[this.startOffset - 1];
				this.startOffset = this.startContainer.data.length;
				this.endContainer = this.startContainer;
				this.endOffset = this.startOffset;
				return;
			}

			if (this.startOffset > 0 && this.startContainer.childNodes[this.startOffset - 1].nodeType == 1) {
				// search for the next text node to the left
				var adjacentTextNode = GENTICS.Utils.Dom.searchAdjacentTextNode(this.startContainer, this.startOffset, true);
				if (adjacentTextNode) {
					this.startContainer = this.endContainer = adjacentTextNode;
					this.startOffset = this.endOffset = adjacentTextNode.data.length;
					return;
				}
				// search for the next text node to the right
				adjacentTextNode = GENTICS.Utils.Dom.searchAdjacentTextNode(this.startContainer, this.startOffset, false);
				if (adjacentTextNode) {
					this.startContainer = this.endContainer = adjacentTextNode;
					this.startOffset = this.endOffset = 0;
					return;
				}
			}

			if (this.startOffset < this.startContainer.childNodes.length && this.startContainer.childNodes[this.startOffset].nodeType == 3) {
				// when the range is between nodes and there is a text node
				// to the right -> move into this text node (at the start)
				this.startContainer = this.startContainer.childNodes[this.startOffset];
				this.startOffset = 0;
				this.endContainer = this.startContainer;
				this.endOffset = 0;
				return;
			}
		}

		// when the selection is in a text node at the start, look for an adjacent text node and if one found, move into that at the end
		if (this.startContainer.nodeType == 3 && this.startOffset == 0) {
			var adjacentTextNode = GENTICS.Utils.Dom.searchAdjacentTextNode(this.startContainer.parentNode, GENTICS.Utils.Dom.getIndexInParent(this.startContainer), true);
			if (adjacentTextNode) {
				this.startContainer = this.endContainer = adjacentTextNode;
				this.startOffset = this.endOffset = adjacentTextNode.data.length;
			}
		}
	} else {
		// expanded range found

		// correct the start, but only if between nodes
		if (this.startContainer.nodeType == 1) {
			// if there is a text node to the right, move into this
			if (this.startOffset < this.startContainer.childNodes.length && this.startContainer.childNodes[this.startOffset].nodeType == 3) {
				this.startContainer = this.startContainer.childNodes[this.startOffset];
				this.startOffset = 0;
			} else if (this.startOffset < this.startContainer.childNodes.length && this.startContainer.childNodes[this.startOffset].nodeType == 1) {
				// there is an element node to the right, so recursively check all first child nodes until we find a text node
				var textNode = false;
				var checkedElement = this.startContainer.childNodes[this.startOffset];
				while (textNode === false && checkedElement.childNodes && checkedElement.childNodes.length > 0) {
					// go to the first child of the checked element
					checkedElement = checkedElement.childNodes[0];
					// when this element is a text node, we are done
					if (checkedElement.nodeType == 3) {
						textNode = checkedElement;
					}
				}

				// found a text node, so move into it
				if (textNode !== false) {
					this.startContainer = textNode;
					this.startOffset = 0;
				}
			}
		}

		// check whether the start is inside a text node at the end
		if (this.startContainer.nodeType == 3 && this.startOffset == this.startContainer.data.length) {
			// check whether there is an adjacent text node to the right and if
			// yes, move into it
			var adjacentTextNode = GENTICS.Utils.Dom
					.searchAdjacentTextNode(this.startContainer.parentNode, GENTICS.Utils.Dom
							.getIndexInParent(this.startContainer) + 1, false);
			if (adjacentTextNode) {
				this.startContainer = adjacentTextNode;
				this.startOffset = 0;
			}
		}

		// now correct the end
		if (this.endContainer.nodeType == 3 && this.endOffset == 0) {
			// we are in a text node at the start
			if (this.endContainer.previousSibling && this.endContainer.previousSibling.nodeType == 3) {
				// found a text node to the left -> move into it (at the end)
				this.endContainer = this.endContainer.previousSibling;
				this.endOffset = this.endContainer.data.length;
			} else if (this.endContainer.previousSibling && this.endContainer.previousSibling.nodeType == 1 && this.endContainer.parentNode) {
				// found an element node to the left -> move in between
				var parentNode = this.endContainer.parentNode;
				for (var offset = 0; offset < parentNode.childNodes.length; ++offset) {
					if (parentNode.childNodes[offset] == this.endContainer) {
						this.endOffset = offset;
						break;
					}
				}
				this.endContainer = parentNode;
			}
		}

		if (this.endContainer.nodeType == 1 && this.endOffset == 0) {
			// we are in an element node at the start, possibly move to the previous sibling at the end
			if (this.endContainer.previousSibling) {
				if (this.endContainer.previousSibling.nodeType == 3) {
					// previous sibling is a text node, move end into here (at the end)
					this.endContainer = this.endContainer.previousSibling;
					this.endOffset = this.endContainer.data.length;
				} else if (this.endContainer.previousSibling.nodeType == 1
						&& this.endContainer.previousSibling.childNodes
						&& this.endContainer.previousSibling.childNodes.length > 0) {
					// previous sibling is another element node with children,
					// move end into here (at the end)
					this.endContainer = this.endContainer.previousSibling;
					this.endOffset = this.endContainer.childNodes.length;
				}
			}
		}

		// correct the end, but only if between nodes
		if (this.endContainer.nodeType == 1) {
			// if there is a text node to the left, move into this
			if (this.endOffset > 0 && this.endContainer.childNodes[this.endOffset - 1].nodeType == 3) {
				this.endContainer = this.endContainer.childNodes[this.endOffset - 1];
				this.endOffset = this.endContainer.data.length;
			} else if (this.endOffset > 0 && this.endContainer.childNodes[this.endOffset - 1].nodeType == 1) {
				// there is an element node to the left, so recursively check all last child nodes until we find a text node
				var textNode = false;
				var checkedElement = this.endContainer.childNodes[this.endOffset - 1];
				while (textNode === false && checkedElement.childNodes && checkedElement.childNodes.length > 0) {
					// go to the last child of the checked element
					checkedElement = checkedElement.childNodes[checkedElement.childNodes.length - 1];
					// when this element is a text node, we are done
					if (checkedElement.nodeType == 3) {
						textNode = checkedElement;
					}
				}

				// found a text node, so move into it
				if (textNode !== false) {
					this.endContainer = textNode;
					this.endOffset = this.endContainer.data.length;
				}
			}
		}
	}
};

/**
 * Clear the caches for this range. This method must be called when the range itself (start-/endContainer or start-/endOffset) is modified.
 * @method
 */
GENTICS.Utils.RangeObject.prototype.clearCaches = function () {
	this.rangeTree = [];
	this.startParents = [];
	this.endParents = [];
	this.commonAncestorContainer = undefined;
};

/**
 * Get the range tree of this range.
 * The range tree will be cached for every root object. When the range itself is modified, the cache should be cleared by calling GENTICS.Utils.RangeObject.clearCaches
 * @param {DOMObject} root root object of the range tree, if non given, the common ancestor container of the start and end containers will be used
 * @return {RangeTree} array of RangeTree object for the given root object
 * @method
 */
GENTICS.Utils.RangeObject.prototype.getRangeTree = function (root) {
	if (typeof root == 'undefined') {
		root = this.getCommonAncestorContainer();
	}

	if (this.rangeTree[root]) {
		// sometimes it's cached
		return this.rangeTree[root];
	}

	this.inselection = false;
	this.rangeTree[root] = this.recursiveGetRangeTree(root);

	return this.rangeTree[root];
};

/**
 * Recursive inner function for generating the range tree.
 * @param currentObject current DOM object for which the range tree shall be generated
 * @return array of Tree objects for the children of the current DOM object
 * @hide
 */
GENTICS.Utils.RangeObject.prototype.recursiveGetRangeTree = function (currentObject) {
	// get all direct children of the given object
	var jQueryCurrentObject = jQuery(currentObject);
	var childCount = 0;
	var that = this;
	var currentElements = new Array();

	jQueryCurrentObject.contents().each(function(index) {
		var type = 'none';
		var startOffset = false;
		var endOffset = false;
		var collapsedFound = false;

		// check for collapsed selections between nodes
		if (that.isCollapsed() && currentObject === that.startContainer && that.startOffset == index) {
			// insert an extra rangetree object for the collapsed range here
			currentElements[childCount] = new GENTICS.Utils.RangeTree();
			currentElements[childCount].type = 'collapsed';
			currentElements[childCount].domobj = undefined;
			that.inselection = false;
			collapsedFound = true;
			childCount++;
		}

		if (!that.inselection && !collapsedFound) {
			// the start of the selection was not yet found, so look for it now
			// check whether the start of the selection is found here

			// check is dependent on the node type
			switch(this.nodeType) {
			case 3: // text node
				if (this === that.startContainer) {
					// the selection starts here
					that.inselection = true;

					// when the startoffset is > 0, the selection type is only partial
					type = that.startOffset > 0 ? 'partial' : 'full';
					startOffset = that.startOffset;
					endOffset = this.length;
				}
				break;
			case 1: // element node
				if (this === that.startContainer && that.startOffset == 0) {
					// the selection starts here
					that.inselection = true;
					type = 'full';
				}
				if (currentObject === that.startContainer && that.startOffset == index) {
					// the selection starts here
					that.inselection = true;
					type = 'full';
				}
				break;
			}
		}

		if (that.inselection && !collapsedFound) {
			if (type == 'none') {
				type = 'full';
			}
			// we already found the start of the selection, so look for the end of the selection now
			// check whether the end of the selection is found here

			switch(this.nodeType) {
			case 3: // text node
				if (this === that.endContainer) {
					// the selection ends here
					that.inselection = false;

					// check for partial selection here
					if (that.endOffset < this.length) {
						type = 'partial';
					}
					if (startOffset === false) {
						startOffset = 0;
					}
					endOffset = that.endOffset;
				}
				break;
			case 1: // element node
				if (this === that.endContainer && that.endOffset == 0) {
					that.inselection = false;
				}
				break;
			}
			if (currentObject === that.endContainer && that.endOffset <= index) {
				that.inselection = false;
				type = 'none';
			}
		}

		// create the current selection tree entry
		currentElements[childCount] = new GENTICS.Utils.RangeTree();
		currentElements[childCount].domobj = this;
		currentElements[childCount].type = type;
		if (type == 'partial') {
			currentElements[childCount].startOffset = startOffset;
			currentElements[childCount].endOffset = endOffset;
		}

		// now do the recursion step into the current object
		currentElements[childCount].children = that.recursiveGetRangeTree(this);

		// check whether a selection was found within the children
		if (currentElements[childCount].children.length > 0) {
			var noneFound = false;
			var partialFound = false;
			var fullFound = false;
			for (var i = 0; i < currentElements[childCount].children.length; ++i) {
				switch(currentElements[childCount].children[i].type) {
				case 'none':
					noneFound = true;
					break;
				case 'full':
					fullFound = true;
					break;
				case 'partial':
					partialFound = true;
					break;
				}
			}

			if (partialFound || (fullFound && noneFound)) {
				// found at least one 'partial' DOM object in the children, or both 'full' and 'none', so this element is also 'partial' contained
				currentElements[childCount].type = 'partial';
			} else if (fullFound && !partialFound && !noneFound) {
				// only found 'full' contained children, so this element is also 'full' contained
				currentElements[childCount].type = 'full';
			}
		}

		childCount++;
	});

	// extra check for collapsed selections at the end of the current element
	if (this.isCollapsed()
			&& currentObject === this.startContainer
			&& this.startOffset == currentObject.childNodes.length) {
		currentElements[childCount] = new GENTICS.Utils.RangeTree();
		currentElements[childCount].type = 'collapsed';
		currentElements[childCount].domobj = undefined;
	}

	return currentElements;
};

/**
 * Find certain the first occurrence of some markup within the parents of either the start or the end of this range.
 * The markup can be identified by means of a given comparator function. The function will be passed every parent (up to the eventually given limit object, which itself is not considered) to the comparator function as this.
 * When the comparator function returns boolean true, the markup found and finally returned from this function as dom object.<br/>
 * Example for finding an anchor tag at the start of the range up to the active editable object:<br/>
 * <pre>
 * range.findMarkup(
 *   function() {
 *     return this.nodeName.toLowerCase() == 'a';
 *   },
 *   jQuery(GENTICS.Aloha.activeEditable.obj)
 * );
 * </pre>
 * @param {function} comparator comparator function to find certain markup
 * @param {jQuery} limit limit objects for limit the parents taken into consideration
 * @param {boolean} atEnd true for searching at the end of the range, false for the start (default: false)
 * @return {DOMObject} the found dom object or false if nothing found.
 * @method
 */
GENTICS.Utils.RangeObject.prototype.findMarkup = function (comparator, limit, atEnd) {
	var parents = this.getContainerParents(limit, atEnd);
	var returnValue = false;
	jQuery.each(parents, function (index, domObj) {
		if (comparator.apply(domObj)) {
			returnValue = domObj;
			return false;
		}
	});

	return returnValue;
};

/**
 * Get the text enclosed by this range
 * @return {String} the text of the range
 * @method
 */
GENTICS.Utils.RangeObject.prototype.getText = function() {
	if (this.isCollapsed()) {
		return '';
	} else {
		return this.recursiveGetText(this.getRangeTree());
	}
};

GENTICS.Utils.RangeObject.prototype.recursiveGetText = function (tree) {
	if (!tree) {
		return '';
	} else {
		var that = this;
		var text = '';
		jQuery.each(tree, function() {
			if (this.type == 'full') {
				// fully selected element/text node
				text += jQuery(this.domobj).text();
			} else if (this.type == 'partial' && this.domobj.nodeType == 3) {
				// partially selected text node
				text += jQuery(this.domobj).text().substring(this.startOffset, this.endOffset);
			} else if (this.type == 'partial' && this.domobj.nodeType == 1 && this.children) {
				// partially selected element node
				text += that.recursiveGetText(this.children);
			}
		});
		return text;
	}
};

/**
 * @namespace GENTICS.Utils
 * @class RangeTree
 * Class definition of a RangeTree, which gives a tree view of the DOM objects included in this range
 * Structure:
 * <pre>
 * +
 * |-domobj: <reference to the DOM Object> (NOT jQuery)
 * |-type: defines if this node is marked by user [none|partial|full|collapsed]
 * |-children: recursive structure like this
 * </pre>
 */
GENTICS.Utils.RangeTree = function() {
	/**
	 * DOMObject, if the type is one of [none|partial|full], undefined if the type is [collapsed]
	 * @property domobj
	 * @type {DOMObject}
	 */
	this.domobj = new Object();

	/**
	 * type of the participation of the dom object in the range. Is one of:
	 * <pre>
	 * - none the DOMObject is outside of the range
	 * - partial the DOMObject partially in the range
	 * - full the DOMObject is completely in the range
	 * - collapsed the current RangeTree element marks the position of a collapsed range between DOM nodes
	 * </pre>
	 * @property type
	 * @type {String}
	 */
	this.type;

	/**
	 * Array of RangeTree objects which reflect the status of the child elements of the current DOMObject
	 * @property children
	 * @type {Array}
	 */
	this.children = new Array();
};
