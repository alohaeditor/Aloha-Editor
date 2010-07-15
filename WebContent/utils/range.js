/**
 * This software or sourcecode is provided as is without any expressed
 * or implied warranties and may not be copied, otherwise distributed
 * (especially forwarded to third parties), reproduced and combined with
 * other code without our express prior written consent. The software or
 * source code and the concepts it is based upon are to be kept confidential
 * towards third parties. The software or sourcecode may be used solely
 * for the purpose of evaluating and testing purposes for a time of one
 * month from the first submission of the software or source code. In case
 * no arrangements about further use can be reached, the software or 
 * sourcecode has to be deleted.
 * 
 * Copyright(C) 2010 Gentics Software GmbH
 */
if (typeof GENTICS == 'undefined' || !GENTICS) {
	var GENTICS = {};
}

if (typeof GENTICS.Utils == 'undefined' || !GENTICS) {
	GENTICS.Utils = {};
}

/**
 * Represents a selection range in the browser that 
 * has some advanced features like selecting the range.
 * @param param if boolean true is passed, the range will be deducted from the current browser selection.
 * If another rangeObject is passed, it will be cloned.
 * If nothing is passed, the rangeObject will be empty.
 * @return RangeObject
 * @api
 */
GENTICS.Utils.RangeObject = function(param) {
	 /**
	 * DOM object of the start container of the selection.
	 * This is always has to be a DOM text node.
	 */
	this.startContainer;
	
	/**
	 * Offset of the selection in the start container
	 */
	this.startOffset;
	
	/**
	 * DOM object of the end container of the selection.
	 * This is always has to be a DOM text node.
	 */
	this.endContainer;
	
	/**
	 * Offset of the selection in the end container
	 */
	this.endOffset;

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
 * Output some log
 * TODO: move this to GENTICS.Aloha.Log
 * @param message log message to output
 * @param obj optional JS object to output
 * @return void
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
 * @return true if collapsed, false otherwise
 * @api
 */
GENTICS.Utils.RangeObject.prototype.isCollapsed = function() {
	return (!this.endContainer || (this.startContainer === this.endContainer && this.startOffset === this.endOffset));
};

/**
 * Method to (re-)calculate the common ancestor container and to get it
 * @return dom object
 * @api
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
 * Get the parent elements of the startcontainer. Note: when the startcontainer
 * is no text element, but a node, the node itself is returned as first element.
 * @return parent elements of the startcontainer as jQuery objects
 */
GENTICS.Utils.RangeObject.prototype.getStartContainerParents = function() {
	if (!this.startContainer) {
		return false;
	}

	// for text nodes, get the parents
	if (this.startContainer.nodeType == 3) {
		return jQuery(this.startContainer).parents();
	} else {
		var parents = jQuery(this.startContainer).parents();
		for (var i = parents.length; i > 0; --i) {
			parents[i] = parents[i - 1];
		}
		parents[0] = this.startContainer;
		return parents;
	}
};

/**
 * Get the parent elements of the endcontainer. Note: when the endcontainer is
 * no text element, but a node, the node itself is returned as first element.
 * @return parent elements of the endcontainer as jQuery objects
 */
GENTICS.Utils.RangeObject.prototype.getEndContainerParents = function() {
	if (!this.endContainer) {
		return false;
	}

	// for text nodes, get the parents
	if (this.endContainer.nodeType == 3) {
		return jQuery(this.endContainer).parents();
	} else {
		var parents = jQuery(this.endContainer).parents();
		for (var i = parents.length; i > 0; --i) {
			parents[i] = parents[i - 1];
		}
		parents[0] = this.endContainer;
		return parents;
	}
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
 * 
 * @return void
 * @api
 */
GENTICS.Utils.RangeObject.prototype.select = document.createRange === undefined ? function() { // first the IE version of this method
	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		GENTICS.Aloha.Log.debug(this, 'Set selection to current range (IE version)');
	}
	// when the startcontainer is a textnode, which is followed by a blocklevel node (p, h1, ...), we need to add a <br> in between
	if (this.startContainer.nodeType == 3
			&& GENTICS.Utils.NodeInfo.isBlockLevelElement(this.startContainer.nextSibling)) {
		jQuery(this.startContainer).after('<br/>');
		// we eventually also need to update the offset of the end container
		if (this.endContainer === this.startContainer.parentNode
				&& GENTICS.Utils.NodeInfo.getIndexInParent(this.startContainer) < this.endOffset) {
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
	var range = document.createRange();
	
	// set start and endContainer
	range.setStart(this.startContainer,this.startOffset);	
	range.setEnd(this.endContainer, this.endOffset);
	
	// update the selection
	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
};

/**
 * Starting at the given position, search for the next element to the left and count the number of characters are in between
 * @param container container of the startpoint
 * @param offset offset of the startpoint in the container
 * @return object with 'element' (null if no element found) and 'characters'
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
 * TODO: is this method needed here? or should it contain the same code as GENTICS.Aloha.Selection.prototype.RangeObject.prototype.update?
 * @return void
 */
GENTICS.Utils.RangeObject.prototype.update = function(event) {
	GENTICS.Utils.RangeObject.prototype.log('==========');
	GENTICS.Utils.RangeObject.prototype.log('now updating rangeObject');
	this.initializeFromUserSelection(event);
	this.updateCommonAncestorContainer();
}

/**
 * Initialize the current range object from the user selection of the browser.
 * @param event which calls the method
 * @return void
 */
GENTICS.Utils.RangeObject.prototype.initializeFromUserSelection = function(event) {
	// definition of the needed helper function to find textNode
	var findLowestChild = function(container, offset, startOrEnd) {
		
		// if container is undefined, return false (happens, when the offset is after the last 
		// childNode, which happens, when the whole thing is selected. will be corrected later
		if (typeof container === 'undefined') {
			GENTICS.Utils.RangeObject.prototype.log('returning false due to an undefined container (full selection)');
			return false;
		}
		
		GENTICS.Utils.RangeObject.prototype.log((startOrEnd?'end':'start') + 'Container: ' + container.nodeName + ' (' + container.data + '), offset: ' + offset);
		// we are looking for the lowest element without children. if this is a type 1 node, it will be corrected later
		if (container.childNodes.length === 0) {
			GENTICS.Utils.RangeObject.prototype.log('returning childless node; type: ' + container.nodeType);
			return container;
		}
				
		// get childNodes
		if (container.childNodes.length > 0 && offset <= container.childNodes.length) {
			return findLowestChild(container.childNodes[offset], 0, startOrEnd); // this could possibly be wrong. maybe the 2nd parameter (offset) should depend on the 3rd parameter (startOrEnd)
		}
	};

	/******************** HERE IT STARTS *******************************/
	
	// get Browser selection via IERange standardized window.getSelection()
	var selection = window.getSelection();
	if (!selection) {
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
 */
GENTICS.Utils.RangeObject.prototype.correctRange = function() {
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
				var adjacentTextNode = GENTICS.Utils.NodeInfo.searchAdjacentTextNode(this.startContainer, this.startOffset, true);
				if (adjacentTextNode) {
					this.startContainer = this.endContainer = adjacentTextNode;
					this.startOffset = this.endOffset = adjacentTextNode.data.length;
					return;
				}
				// search for the next text node to the right
				adjacentTextNode = GENTICS.Utils.NodeInfo.searchAdjacentTextNode(this.startContainer, this.startOffset, false);
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
			var adjacentTextNode = GENTICS.Utils.NodeInfo.searchAdjacentTextNode(this.startContainer.parentNode, GENTICS.Utils.NodeInfo.getIndexInParent(this.startContainer), true);
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
			var adjacentTextNode = GENTICS.Utils.NodeInfo
					.searchAdjacentTextNode(this.startContainer.parentNode, GENTICS.Utils.NodeInfo
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
