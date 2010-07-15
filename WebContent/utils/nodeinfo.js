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

GENTICS.Utils.NodeInfo = function () {};

/**
 * List of nodenames of blocklevel elements
 * TODO: finish this list
 */
GENTICS.Utils.NodeInfo.prototype.blockLevelElements = {
  'p' : true,
  'h1' : true,
  'h2' : true,
  'h3' : true,
  'h4' : true,
  'h5' : true,
  'h6' : true,
  'blockquote' : true,
  'div' : true,
  'pre' : true
};

/**
 * List of nodenames of list elements
 */
GENTICS.Utils.NodeInfo.prototype.listElements = {
	'li' : true,
	'ol' : true,
	'ul' : true
};

/**
 * Get the index of the given node within its parent node
 * @node node to check
 * @return index in the parent node or false if no node given or node has no parent
 */
GENTICS.Utils.NodeInfo.prototype.getIndexInParent = function (node) {
	if (!node) {
		return false;
	}
	var index = 0;
	var check = node.previousSibling;
	while(check) {
		index++;
		check = check.previousSibling;
	};

	return index;
};

/**
 * Check whether the given node is a blocklevel element
 * TODO: make this more intelligent
 * @node node to check
 * @return true if yes, false if not (or null)
 */
GENTICS.Utils.NodeInfo.prototype.isBlockLevelElement = function (node) {
	if (!node) {
		return false;
	}
	if (node.nodeType == 1 && this.blockLevelElements[node.nodeName.toLowerCase()]) {
		return true;
	} else {
		return false;
	}
};

/**
 * Check whether the given node is a linebreak element
 * @node node to check
 * @return true for linebreak elements, false for everything else
 */
GENTICS.Utils.NodeInfo.prototype.isLineBreakElement = function (node) {
	if (!node) {
		return false;
	}
	return node.nodeType == 1 && node.nodeName.toLowerCase() == 'br';
};

/**
 * Check whether the given node is a list element
 * @node node to check
 * @return true for list elements (li, ul, ol), false for everything else
 */
GENTICS.Utils.NodeInfo.prototype.isListElement = function (node) {
	if (!node) {
		return false;
	}
	return node.nodeType == 1 && this.listElements[node.nodeName.toLowerCase()];
};

/**
 * This method checks, whether the passed dom object is a dom object, that would be split in cases of pressing enter
 * @param el dom object to check
 * @return true for split objects, false for other
 */
GENTICS.Utils.NodeInfo.prototype.isSplitObject = function(el) {
	if (el.nodeType === 1){
		switch(el.nodeName.toLowerCase()) {
		case 'p':
		case 'h1':
		case 'h2':
		case 'h3':
		case 'h4':
		case 'h5':
		case 'h6':
		case 'li':
			return true;
		}
	}
	return false;
};

/**
 * Starting with the given position (between nodes), search in the given direction to an adjacent notempty text node
 * @param parent parent node containing the position
 * @param index index of the position within the parent node
 * @param searchleft true when search direction is 'left' (default), false for 'right'
 * @param stopat define at which types of element we shall stop, may contain the following properties
 * - blocklevel (default: true)
 * - list (default: true)
 * - linebreak (default: true)
 * @return the found text node or false if none found
 */
GENTICS.Utils.NodeInfo.prototype.searchAdjacentTextNode = function (parent, index, searchleft, stopat) {
	if (!parent || parent.nodeType != 1 || index < 0 || index > parent.childNodes.length) {
		return false;
	}

	if (typeof stopat == 'undefined') {
		stopat = {'blocklevel' : true, 'list' : true, 'linebreak' : true};
	}

	if (stopat.blocklevel == 'undefined') {
		stopal.blocklevel = true;
	}
	if (stopat.list == 'undefined') {
		stopal.list = true;
	}
	if (stopat.linebreak == 'undefined') {
		stopal.linebreak = true;
	}

	if (typeof searchleft == 'undefined') {
		searchleft = true;
	}

	var nextNode = undefined;
	var currentParent = parent;

	// start at the node left/right of the given position
	if (searchleft && index > 0) {
		nextNode = parent.childNodes[index - 1];
	}
	if (!searchleft && index < parent.childNodes.length) {
		nextNode = parent.childNodes[index];
	}

	while (true) {
		if (!nextNode) {
			// no next node found, check whether the parent is a blocklevel element
			if (stopat.blocklevel && this.isBlockLevelElement(currentParent)) {
				// do not leave block level elements
				return false;
			} else if (stopat.list && this.isListElement(currentParent)) {
				// do not leave list elements
				return false;
			} else {
				// continue with the parent
				nextNode = searchleft ? currentParent.previousSibling : currentParent.nextSibling;
				currentParent = currentParent.parentNode;
			}
		} else if (nextNode.nodeType == 3 && jQuery.trim(nextNode.data).length > 0) {
			// we are lucky and found a notempty text node
			return nextNode;
		} else if (stopat.blocklevel && this.isBlockLevelElement(nextNode)) {
			// we found a blocklevel element, stop here
			return false;
		} else if (stopat.linebreak && this.isLineBreakElement(nextNode)) {
			// we found a linebreak, stop here
			return false;
		} else if (stopat.list && this.isListElement(nextNode)) {
			// we found a linebreak, stop here
			return false;
		} else if (nextNode.nodeType == 3) {
			// we found an empty text node, so step to the next
			nextNode = searchleft ? nextNode.previousSibling : nextNode.nextSibling;
		} else {
			// we found a non-blocklevel element, step into
			currentParent = nextNode;
			nextNode = searchleft ? nextNode.lastChild : nextNode.firstChild;
		}
	};
};

GENTICS.Utils.NodeInfo = new GENTICS.Utils.NodeInfo();
