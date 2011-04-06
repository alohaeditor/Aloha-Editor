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

/**
 * @namespace GENTICS.Utils
 * @class Dom provides methods to get information about the DOM and to manipulate it
 * @singleton
 */
GENTICS.Utils.Dom = Class.extend({

	/**
	 * Tags which can safely be merged
	 * @hide
	 */
	mergeableTags: ['a', 'b', 'code', 'del', 'em', 'i', 'ins', 'strong', 'sub', 'sup', '#text'],

	/**
	 * Tags which do not mark word boundaries
	 * @hide
	 */
	nonWordBoundaryTags: ['a', 'b', 'code', 'del', 'em', 'i', 'ins', 'span', 'strong', 'sub', 'sup', '#text'],

	/**
	 * Tags which are considered 'nonempty', even if they have no children (or not data)
	 * TODO: finish this list
	 * @hide
	 */
	nonEmptyTags: ['br'],

	/**
	 * Tags which make up Flow Content or Phrasing Content, according to the HTML 5 specification,
	 * @see http://dev.w3.org/html5/spec/Overview.html#flow-content
	 * @see http://dev.w3.org/html5/spec/Overview.html#phrasing-content
	 * @hide
	 */
	tags: {
		'flow' : [ 'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
				'b', 'bdo', 'blockquote', 'br', 'button', 'canvas', 'cite', 'code',
				'command', 'datalist', 'del', 'details', 'dfn', 'div', 'dl', 'em',
				'embed', 'fieldset', 'figure', 'footer', 'form', 'h1', 'h2', 'h3',
				'h4', 'h5', 'h6', 'header', 'hgroup', 'hr', 'i', 'iframe', 'img',
				'input', 'ins', 'kbd', 'keygen', 'label', 'map', 'mark', 'math',
				'menu', 'meter', 'nav', 'noscript', 'object', 'ol', 'output', 'p',
				'pre', 'progress', 'q', 'ruby', 'samp', 'script', 'section',
				'select', 'small', 'span', 'strong', 'style', 'sub', 'sup', 'svg',
				'table', 'textarea', 'time', 'ul', 'var', 'video', 'wbr', '#text' ],
		'phrasing' : [ 'a', 'abbr', 'area', 'audio', 'b', 'bdo', 'br', 'button',
				'canvas', 'cite', 'code', 'command', 'datalist', 'del', 'dfn',
				'em', 'embed', 'i', 'iframe', 'img', 'input', 'ins', 'kbd',
				'keygen', 'label', 'map', 'mark', 'math', 'meter', 'noscript',
				'object', 'output', 'progress', 'q', 'ruby', 'samp', 'script',
				'select', 'small', 'span', 'strong', 'sub', 'sup', 'svg',
				'textarea', 'time', 'var', 'video', 'wbr', '#text' ]
	},

	/**
	 * Possible children of tags, according to the HTML 5
	 * specification.
	 * See http://dev.w3.org/html5/spec/Overview.html#elements-1
	 * Moved to http://www.whatwg.org/specs/web-apps/current-work/#elements-1
	 * @hide
	 */
	children: {
		'a' : 'phrasing', // transparent
		'abbr' : 'phrasing',
		'address' : 'flow',
		'area' : 'empty',
		'article' : 'flow',
		'aside' : 'flow',
		'audio' : 'source', // transparent
		'b' : 'phrasing',
		'base' : 'empty',
		'bdo' : 'phrasing',
		'blockquote' : 'flow',
		'body' : 'flow',
		'br' : 'empty',
		'button' : 'phrasing',
		'canvas' : 'phrasing', // transparent
		'caption' : 'flow',
		'cite' : 'phrasing',
		'code' : 'phrasing',
		'col' : 'empty',
		'colgroup' : 'col',
		'command' : 'empty',
		'datalist' : ['phrasing', 'option'],
		'dd' : 'flow',
		'del' : 'phrasing',
		'div' : 'flow',
		'details' : ['summary', 'flow'],
		'dfn' : 'flow',
		'dl' : ['dt','dd'],
		'dt' : 'phrasing', // varies
		'em' : 'phrasing',
		'embed' : 'empty',
		'fieldset' : ['legend', 'flow'],
		'figcaption': 'flow',
		'figure' :  ['figcaption', 'flow'],
		'footer' : 'flow',
		'form' : 'flow',
		'h1' : 'phrasing',
		'h2' : 'phrasing',
		'h3' : 'phrasing',
		'h4' : 'phrasing',
		'h5' : 'phrasing',
		'h6' : 'phrasing',
		//head
		'header' : 'flow',
		'hgroup' : ['h1','h2','h3','h4','h5','h6'],
		'hr' : 'empty',
		//html :)
		'i' : 'phrasing',
		'iframe' : '#text',
		'img' : 'empty',
		'input' : 'empty',
		'ins' : 'phrasing', // transparent
		'kbd' : 'phrasing',
		'keygen' : 'empty',
		'label' : 'phrasing',
		'legend' : 'phrasing',
		'li' : 'flow',
		'link' : 'empty',
		'map' : 'area', // transparent
		'mark' : 'phrasing',
		'menu' : ['li', 'flow'],
		'meta' : 'empty',
		'meter' : 'phrasing',
		'nav' : 'flow',
		'noscript' : 'phrasing', // varies
		'object' : 'param', // transparent
		'ol' : 'li',
		'optgroup' : 'option',
		'option' : '#text',
		'output' : 'phrasing',
		'p' : 'phrasing',
		'param' : 'empty',
		'pre' : 'phrasing',
		'progress' : 'phrasing',
		'q' : 'phrasing',
		'rp' : 'phrasing',
		'rt' : 'phrasing',
		'ruby' : ['phrasing', 'rt', 'rp'],
		's' : 'phrasing',
		'samp' : 'pharsing',
		'script' : '#script', //script
		'section' : 'flow',
		'select' : ['option', 'optgroup'],
		'small' : 'phrasing',
		'source' : 'empty',
		'span' : 'phrasing',
		'strong' : 'phrasing',
		'style' : 'phrasing', // varies
		'sub' : 'phrasing',
		'summary' : 'phrasing',
		'sup' : 'phrasing',
		'table' : ['caption', 'colgroup', 'thead', 'tbody', 'tfoot', 'tr'],
		'tbody' : 'tr',
		'td' : 'flow',
		'textarea' : '#text',
		'tfoot' : 'tr',
		'th' : 'phrasing',
		'thead' : 'tr',
		'time' : 'phrasing',
		'title' : '#text',
		'tr' : ['th', 'td'],
		'track' : 'empty',
		'ul' : 'li',
		'var' : 'phrasing',
		'video' : 'source', // transparent
		'wbr' : 'empty'
	},

	/**
	 * List of nodenames of blocklevel elements
	 * TODO: finish this list
	 * @hide
	 */
	blockLevelElements: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'div', 'pre'],

	/**
	 * List of nodenames of list elements
	 * @hide
	 */
	listElements: ['li', 'ol', 'ul'],

	/**
	 * Splits a DOM element at the given position up until the limiting object(s), so that it is valid HTML again afterwards.
	 * @param {RangeObject} range Range object that indicates the position of the splitting.
	 *				This range will be updated, so that it represents the same range as before the split.
	 * @param {jQuery} limit Limiting node(s) for the split.
	 *				The limiting node will not be included in the split itself.
	 *				If no limiting object is set, the document body will be the limiting object.
	 * @param {boolean} atEnd If set to true, the DOM will be splitted at the end of the range otherwise at the start.
	 * @return {object} jQuery object containing the two root DOM objects of the split, true if the DOM did not need to be split or false if the DOM could not be split
	 * @method
	 */
	split: function (range, limit, atEnd) {
		var
			splitElement = jQuery(range.startContainer),
			splitPosition = range.startOffset,
			updateRange, path, parents,
			newDom, insertElement, secondPart;


		if (atEnd) {
			splitElement = jQuery(range.endContainer);
			splitPosition = range.endOffset;
		}

		if (limit.length < 1) {
			limit = jQuery(document.body);
		}

		// we may have to update the range if it is not collapsed and we are splitting at the start
		updateRange = (!range.isCollapsed() && !atEnd);

		// find the path up to the highest object that will be splitted
		parents = splitElement.parents().get();
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
			return true;
		}

		path = path.reverse();

		// iterate over the path, create new dom nodes for every element and move
		// the contents right of the split to the new element
		for(var i=0, pathLength = path.length; i < pathLength; ++i) {
			var element = path[i], newElement;
			if (i === pathLength - 1) {
				// last element in the path -> we have to split it

				// split the last part into two parts
				if (element.nodeType === 3) {
					// text node
					secondPart = document.createTextNode(element.data.substring(splitPosition, element.data.length));
					element.data = element.data.substring(0, splitPosition);
				} else {
					// other nodes
					var jqelement = jQuery(element),
						children = jqelement.contents();
					newElement = jqelement.clone(false).empty();
					secondPart = newElement.append(children.slice(splitPosition, children.length)).get(0);
				}

				// update the range if necessary
				if (updateRange && range.endContainer === element) {
					range.endContainer = secondPart;
					range.endOffset -= splitPosition;
					range.clearCaches();
				}

				// add the second part
				if (insertElement) {
					insertElement.prepend(secondPart);
				} else {
					jQuery(element).after(secondPart);
				}
			} else {
				// create the new element of the same type and prepend it to the previously created element
				newElement = jQuery(element).clone(false).empty();
				var next;

				if (!newDom) {
					newDom = newElement;
				} else {
					insertElement.prepend(newElement);
				}
				insertElement = newElement;

				// move all contents right of the split to the new element
				while ( true ) {
					next = path[i+1].nextSibling;
					if ( !next ) { break; }
					insertElement.append(next);
				}

				// update the range if necessary
				if (updateRange && range.endContainer === element) {
					range.endContainer = newElement.get(0);
					var prev = path[i+1],
						offset = 0;
					while ( true ) {
						prev = prev.previousSibling;
						if ( !prev ) { break; }
						offset++;
					}
					range.endOffset -= offset;
					range.clearCaches();
				}
			}
		}

		// append the new dom
		jQuery(path[0]).after(newDom);

		return jQuery([path[0], newDom ? newDom.get(0) : secondPart]);
	},

	/**
	 * Check whether the HTML 5 specification allows direct nesting of the given DOM
	 * objects.
	 * @param {object} outerDOMObject
	 *            outer (nesting) DOM Object
	 * @param {object} innerDOMObject
	 *            inner (nested) DOM Object
	 * @return {boolean} true when the nesting is allowed, false if not
	 * @method
	 */
	allowsNesting: function (outerDOMObject, innerDOMObject) {
		if (!outerDOMObject || !outerDOMObject.nodeName || !innerDOMObject
				|| !innerDOMObject.nodeName) {
			return false;
		}

		var outerNodeName = outerDOMObject.nodeName.toLowerCase(),
			innerNodeName = innerDOMObject.nodeName.toLowerCase();

		if (!this.children[outerNodeName]) {
			return false;
		}

		// check whether the nesting is configured by node names (like for table)
		if (this.children[outerNodeName] == innerNodeName) {
			return true;
		}
		if (jQuery.isArray(this.children[outerNodeName])
				&& jQuery.inArray(innerNodeName, this.children[outerNodeName]) >= 0) {
			return true;
		}

		if (jQuery.isArray(this.tags[this.children[outerNodeName]])
				&& jQuery.inArray(innerNodeName,
						this.tags[this.children[outerNodeName]]) >= 0) {
			return true;
		}

		return false;
	},

	/**
	 * Apply the given markup additively to the given range. The given rangeObject will be modified if necessary
	 * @param {GENTICS.Utils.RangeObject} rangeObject range to which the markup shall be added
	 * @param {jQuery} markup markup to be applied as jQuery object
	 * @param {boolean} allownesting true when nesting of the added markup is allowed, false if not (default: false)
	 * @method
	 */
	addMarkup: function (rangeObject, markup, nesting) {
		// split partially contained text nodes at the start and end of the range
		if (rangeObject.startContainer.nodeType === 3 && rangeObject.startOffset > 0
				&& rangeObject.startOffset < rangeObject.startContainer.data.length) {
			this.split(rangeObject, jQuery(rangeObject.startContainer).parent(),
				false);
		}
		if (rangeObject.endContainer.nodeType === 3 && rangeObject.endOffset > 0
				&& rangeObject.endOffset < rangeObject.endContainer.data.length) {
			this.split(rangeObject, jQuery(rangeObject.endContainer).parent(),
				true);
		}

		// get the range tree
		var rangeTree = rangeObject.getRangeTree();
		this.recursiveAddMarkup(rangeTree, markup, rangeObject, nesting);

		// cleanup DOM
		this.doCleanup({'merge' : true, 'removeempty' : true}, rangeObject);
	},

	/**
	 * Recursive helper method to add the given markup to the range
	 * @param rangeTree rangetree at the current level
	 * @param markup markup to be applied
	 * @param rangeObject range object, which eventually is updated
	 * @param nesting true when nesting of the added markup is allowed, false if not
	 * @hide
	 */
	recursiveAddMarkup: function (rangeTree, markup, rangeObject, nesting) {
		// iterate through all rangetree objects of that level
		for (var i = 0, rangeLength = rangeTree.length; i < rangeLength; ++i) {
			// check whether the rangetree object is fully contained and the markup may be wrapped around the object
			if (rangeTree[i].type == 'full' && this.allowsNesting(markup.get(0), rangeTree[i].domobj)) {
				// we wrap the object, when
				// 1. nesting of markup is allowed or the node is not of the markup to be added
				// 2. the node an element node or a non-empty text node
				if ((nesting || rangeTree[i].domobj.nodeName != markup.get(0).nodeName)
						&& (rangeTree[i].domobj.nodeType !== 3 || jQuery
								.trim(rangeTree[i].domobj.data).length !== 0)) {
					// wrap the object
					jQuery(rangeTree[i].domobj).wrap(markup);

					// TODO eventually update the range (if it changed)

					// when nesting is not allowed, we remove the markup from the inner element
					if (!nesting && rangeTree[i].domobj.nodeType !== 3) {
						var innerRange = new GENTICS.Utils.RangeObject();
						innerRange.startContainer = innerRange.endContainer = rangeTree[i].domobj.parentNode;
						innerRange.startOffset = 0;
						innerRange.endOffset = innerRange.endContainer.childNodes.length;
						this.removeMarkup(innerRange, markup, jQuery(rangeTree[i].domobj.parentNode));
					}
				}
			} else {
				// TODO check whether the object may be replaced by the given markup
				if (false) {
					// TODO replace
				} else {
					// recurse into the children (if any), but not if nesting is not
					// allowed and the object is of the markup to be added
					if ((nesting || rangeTree[i].domobj.nodeName !== markup.get(0).nodeName)
						&& rangeTree[i].children && rangeTree[i].children.length > 0) {
						this.recursiveAddMarkup(rangeTree[i].children, markup);
					}
				}
			}
		}
	},

	/**
	 * Find the highest occurrence of a node with given nodename within the parents
	 * of the start. When limit objects are given, the search stops there.
	 * The limiting object is of the found type, it won't be considered
	 * @param {DOMObject} start start object
	 * @param {String} nodeName name of the node to search for (case-insensitive)
	 * @param {jQuery} limit Limiting node(s) as jQuery object (if none given, the search will stop when there are no more parents)
	 * @return {DOMObject} the found DOM object or undefined
	 * @method
	 */
	findHighestElement: function (start, nodeName, limit) {
		nodeName = nodeName.toLowerCase();

		var testObject = start,
		// helper function to stop when we reach a limit object
			isLimit = limit ? function () {
			return limit.filter(
					function() {
						return testObject == this;
					}
			).length;
		} : function () {
			return false;
		};

		// this will be the highest found markup object (up to a limit object)
		var highestObject;

		// now get the highest parent that has the given markup (until we reached
		// one of the limit objects or there are no more parent nodes)
		while (!isLimit() && testObject) {
			if (testObject.nodeName.toLowerCase() === nodeName) {
				highestObject = testObject;
			}
			testObject = testObject.parentNode;
		}

		return highestObject;
	},

	/**
	 * Remove the given markup from the given range. The given rangeObject will be modified if necessary
	 * TODO: add parameter deep/shallow
	 * @param {GENTICS.Utils.RangeObject} rangeObject range from which the markup shall be removed
	 * @param {jQuery} markup markup to be removed as jQuery object
	 * @param {jQuery} limit Limiting node(s) as jQuery object
	 * @method
	 */
	removeMarkup: function (rangeObject, markup, limit) {
		var nodeName = markup.get(0).nodeName,
			startSplitLimit = this.findHighestElement(rangeObject.startContainer, nodeName, limit),
			endSplitLimit = this.findHighestElement(rangeObject.endContainer, nodeName, limit),
			didSplit = false;

		if (startSplitLimit && rangeObject.startOffset > 0) {
			// when the start is in the start of its container, we don't split
			this.split(rangeObject, jQuery(startSplitLimit).parent(), false);
			didSplit = true;
		}

		if (endSplitLimit) {
			// when the end is in the end of its container, we don't split
			if (rangeObject.endContainer.nodeType === 3 && rangeObject.endOffset < rangeObject.endContainer.data.length) {
				this.split(rangeObject, jQuery(endSplitLimit).parent(), true);
				didSplit = true;
			}
			if (rangeObject.endContainer.nodeType === 1 && rangeObject.endOffset < rangeObject.childNodes.length) {
				this.split(rangeObject, jQuery(endSplitLimit).parent(), true);
				didSplit = true;
			}
		}

		// when we split the DOM, we maybe need to correct the range
		if (didSplit) {
			rangeObject.correctRange();
		}

		// find the highest occurrence of the markup
		var highestObject = this.findHighestElement(rangeObject.getCommonAncestorContainer(), nodeName, limit),
			root = highestObject ? highestObject.parentNode : undefined,
			// construct the range tree
			rangeTree = rangeObject.getRangeTree(root);

		// remove the markup from the range tree
		this.recursiveRemoveMarkup(rangeTree, markup);

		// cleanup DOM
		this.doCleanup({'merge' : true, 'removeempty' : true}, rangeObject, root);
	},

	/**
	 * TODO: pass the range itself and eventually update it if necessary
	 * Recursive helper method to remove the given markup from the range
	 * @param rangeTree rangetree at the current level
	 * @param markup markup to be applied
	 * @hide
	 */
	recursiveRemoveMarkup: function (rangeTree, markup) {
		// iterate over the rangetree objects of this level
		for (var i = 0, rangeLength = rangeTree.length; i < rangeLength; ++i) {
			// check whether the object is the markup to be removed and is fully into the range
			if (rangeTree[i].type == 'full' && rangeTree[i].domobj.nodeName == markup.get(0).nodeName) {
				// found the markup, so remove it
				var content = jQuery(rangeTree[i].domobj).contents();
				if (content.length > 0) {
					// when the object has children, we unwrap them
					content.first().unwrap();
				} else {
					// obj has no children, so just remove it
					jQuery(rangeTree[i].domobj).remove();
				}
			}

			// if the object has children, we do the recursion now
			if (rangeTree[i].children) {
				this.recursiveRemoveMarkup(rangeTree[i].children, markup);
			}
		}
	},

	/**
	 * Cleanup the DOM, starting with the given startobject (or the common ancestor container of the given range)
	 * Cleanup modes (given as properties in 'cleanup'):
	 * <pre>
	 * - merge: merges multiple successive nodes of same type, if this is allowed, starting at the children of the given node (defaults to false)
	 * - removeempty: removes empty element nodes (defaults to false)
	 * </pre>
	 * Example for calling this method:<br/>
	 * <code>GENTICS.Utils.Dom.doCleanup({merge:true,removeempty:false}, range)</code>
	 * @param {object} cleanup type of cleanup to be done
	 * @param {GENTICS.Utils.RangeObject} rangeObject range which is eventually updated
	 * @param {DOMObject} start start object, if not given, the commonancestorcontainer is used as startobject insted
	 * @return {boolean} true when the range (startContainer/startOffset/endContainer/endOffset) was modified, false if not
	 * @method
	 */
	doCleanup: function(cleanup, rangeObject, start) {
		var that = this;

		if (typeof cleanup === 'undefined') {
			cleanup = {'merge' : true, 'removeempty' : true};
		}

		if (typeof start === 'undefined' && rangeObject) {
			start = rangeObject.getCommonAncestorContainer();
		}
		// remember the previous node here (successive nodes of same type will be merged into this)
		var prevNode = false,
		// check whether the range needed to be modified during merging
			modifiedRange = false,
		// get the start object
			startObject = jQuery(start);

		// iterate through all sub nodes
		startObject.contents().each(function(index) {
			// decide further actions by node type
			switch(this.nodeType) {
			// found a non-text node
			case 1:
				if (prevNode && prevNode.nodeName == this.nodeName) {
					// found a successive node of same type

					// now we check whether the selection starts or ends in the mother node after the current node
					if (rangeObject.startContainer === startObject && rangeObject.startOffset > index) {
						// there will be one less object, so reduce the startOffset by one
						rangeObject.startOffset -= 1;
						// set the flag for range modification
						modifiedRange = true;
					}
					if (rangeObject.endContainer === startObject && rangeObject.endOffset > index) {
						// there will be one less object, so reduce the endOffset by one
						rangeObject.endOffset -= 1;
						// set the flag for range modification
						modifiedRange = true;
					}

					// merge the contents of this node into the previous one
					jQuery(prevNode).append(jQuery(this).contents());

					// after merging, we eventually need to cleanup the prevNode again
					modifiedRange |= that.doCleanup(cleanup, rangeObject, prevNode);

					// remove this node
					jQuery(this).remove();
				} else {
					// do the recursion step here
					modifiedRange |= that.doCleanup(cleanup, rangeObject, this);

					// eventually remove empty elements
					var removed = false;
					if (cleanup.removeempty) {
						if (GENTICS.Utils.Dom.isBlockLevelElement(this) && this.childNodes.length === 0) {
							jQuery(this).remove();
							removed = true;
						}
						if (jQuery.inArray(this.nodeName.toLowerCase(), that.mergeableTags) >= 0
								&& jQuery(this).text().length === 0 && this.childNodes.length === 0) {
							jQuery(this).remove();
							removed = true;
						}
					}

					// when the current node was not removed, we eventually store it as previous (mergeable) tag
					if (!removed) {
						if (jQuery.inArray(this.nodeName.toLowerCase(), that.mergeableTags) >= 0) {
							prevNode = this;
						} else {
							prevNode = false;
						}
					}
				}

				break;
			// found a text node
			case 3:
				// found a text node
				if (prevNode && prevNode.nodeType === 3 && cleanup.merge) {
					// the current text node will be merged into the last one, so
					// check whether the selection starts or ends in the current
					// text node
					if (rangeObject.startContainer === this) {
						// selection starts in the current text node

						// update the start container to the last node
						rangeObject.startContainer = prevNode;

						// update the start offset
						rangeObject.startOffset += prevNode.length;

						// set the flag for range modification
						modifiedRange = true;
					}

					if (rangeObject.endContainer === this) {
						// selection ends in the current text node

						// update the end container to be the last node
						rangeObject.endContainer = prevNode;

						// update the end offset
						rangeObject.endOffset += prevNode.length;

						// set the flag for range modification
						modifiedRange = true;
					}

					// now we check whether the selection starts or ends in the mother node after the current node
					if (rangeObject.startContainer === startObject && rangeObject.startOffset > index) {
						// there will be one less object, so reduce the startOffset by one
						rangeObject.startOffset -= 1;
						// set the flag for range modification
						modifiedRange = true;
					}
					if (rangeObject.endContainer === startObject && rangeObject.endOffset > index) {
						// there will be one less object, so reduce the endOffset by one
						rangeObject.endOffset -= 1;
						// set the flag for range modification
						modifiedRange = true;
					}

					// now append the contents of the current text node into the previous
					prevNode.data += this.data;

					// remove this text node
					jQuery(this).remove();
				} else {
					// remember it as the last text node
					prevNode = this;
				}
				break;
			}
		});

		// eventually remove the startnode itself
		if (cleanup.removeempty
				&& GENTICS.Utils.Dom.isBlockLevelElement(start)
				&& (!start.childNodes || start.childNodes.length === 0)) {
			if (rangeObject.startContainer == start) {
				rangeObject.startContainer = start.parentNode;
				rangeObject.startOffset = GENTICS.Utils.Dom.getIndexInParent(start);
			}
			if (rangeObject.endContainer == start) {
				rangeObject.endContainer = start.parentNode;
				rangeObject.endOffset = GENTICS.Utils.Dom.getIndexInParent(start);
			}
			startObject.remove();
			modifiedRange = true;
		}

		if (modifiedRange) {
			rangeObject.clearCaches();
		}

		return modifiedRange;
	},

	/**
	 * Get the index of the given node within its parent node
	 * @param {DOMObject} node node to check
	 * @return {Integer} index in the parent node or false if no node given or node has no parent
	 * @method
	 */
	getIndexInParent: function (node) {
		if (!node) {
			return false;
		}

		var
			index = 0,
			check = node.previousSibling;

		while(check) {
			index++;
			check = check.previousSibling;
		}

		return index;
	},

	/**
	 * Check whether the given node is a blocklevel element
	 * @param {DOMObject} node node to check
	 * @return {boolean} true if yes, false if not (or null)
	 * @method
	 */
	isBlockLevelElement: function (node) {
		if (!node) {
			return false;
		}
		if (node.nodeType === 1 && jQuery.inArray(node.nodeName.toLowerCase(), this.blockLevelElements) >= 0) {
			return true;
		} else {
			return false;
		}
	},

	/**
	 * Check whether the given node is a linebreak element
	 * @param {DOMObject} node node to check
	 * @return {boolean} true for linebreak elements, false for everything else
	 * @method
	 */
	isLineBreakElement: function (node) {
		if (!node) {
			return false;
		}
		return node.nodeType === 1 && node.nodeName.toLowerCase() == 'br';
	},

	/**
	 * Check whether the given node is a list element
	 * @param {DOMObject} node node to check
	 * @return {boolean} true for list elements (li, ul, ol), false for everything else
	 * @method
	 */
	isListElement: function (node) {
		if (!node) {
			return false;
		}
		return node.nodeType === 1 && jQuery.inArray(node.nodeName.toLowerCase(), this.listElements) >= 0;
	},

	/**
	 * This method checks, whether the passed dom object is a dom object, that would
	 * be split in cases of pressing enter. This currently is true for paragraphs
	 * and headings
	 * @param {DOMObject} el
	 *            dom object to check
	 * @return {boolean} true for split objects, false for other
	 * @method
	 */
	isSplitObject: function(el) {
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
	},

	/**
	 * Starting with the given position (between nodes), search in the given direction to an adjacent notempty text node
	 * @param {DOMObject} parent parent node containing the position
	 * @param {Integer} index index of the position within the parent node
	 * @param {boolean} searchleft true when search direction is 'left' (default), false for 'right'
	 * @param {object} stopat define at which types of element we shall stop, may contain the following properties
	 * <pre>
	 * - blocklevel (default: true)
	 * - list (default: true)
	 * - linebreak (default: true)
	 * </pre>
	 * @return {DOMObject} the found text node or false if none found
	 * @method
	 */
	searchAdjacentTextNode: function (parent, index, searchleft, stopat) {
		if (!parent || parent.nodeType !== 1 || index < 0 || index > parent.childNodes.length) {
			return false;
		}

		if (typeof stopat === 'undefined') {
			stopat = {'blocklevel' : true, 'list' : true, 'linebreak' : true};
		}

		if (typeof stopat.blocklevel === 'undefined') {
			stopal.blocklevel = true;
		}
		if (typeof stopat.list === 'undefined') {
			stopal.list = true;
		}
		if (typeof stopat.linebreak === 'undefined') {
			stopal.linebreak = true;
		}

		if (typeof searchleft === 'undefined') {
			searchleft = true;
		}

		var
			nextNode,
			currentParent = parent;

		// start at the node left/right of the given position
		if (searchleft && index > 0) {
			nextNode = parent.childNodes[index - 1];
		}
		if (!searchleft && index < parent.childNodes.length) {
			nextNode = parent.childNodes[index];
		}

		while (typeof currentParent !== 'undefined') {
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
			} else if (nextNode.nodeType === 3 && jQuery.trim(nextNode.data).length > 0) {
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
			} else if (nextNode.nodeType === 3) {
				// we found an empty text node, so step to the next
				nextNode = searchleft ? nextNode.previousSibling : nextNode.nextSibling;
			} else {
				// we found a non-blocklevel element, step into
				currentParent = nextNode;
				nextNode = searchleft ? nextNode.lastChild : nextNode.firstChild;
			}
		}
	},

	/**
	 * Insert the given DOM Object into the start/end of the given range. The method
	 * will find the appropriate place in the DOM tree for inserting the given
	 * object, and will eventually split elements in between. The given range will
	 * be updated if necessary. The updated range will NOT embrace the inserted
	 * object, which means that the object is actually inserted before or after the
	 * given range (depending on the atEnd parameter)
	 *
	 * @param {jQuery}
	 *				object object to insert into the DOM
	 * @param {GENTICS.Utils.RangeObject}
	 *				range range where to insert the object (at start or end)
	 * @param {jQuery}
	 *				limit limiting object(s) of the DOM modification
	 * @param {boolean}
	 *				atEnd true when the object shall be inserted at the end, false for
	 *				insertion at the start (default)
	 * @param {boolean}
	 *				true when the insertion shall be done, even if inserting the element
	 *				would not be allowed, false to deny inserting unallowed elements (default)
	 * @return true if the object could be inserted, false if not.
	 * @method
	 */
	insertIntoDOM: function (object, range, limit, atEnd, force) {
		// first find the appropriate place to insert the given object
		var parentElements = range.getContainerParents(limit, atEnd),
			that = this,
			newParent;

		if (!limit) {
			limit = jQuery(document.body);
		}

		// if no parent elements exist (up to the limit), the new parent will be the
		// limiter itself
		if (parentElements.length === 0) {
			newParent = limit.get(0);
		} else {
			jQuery.each(parentElements, function (index, parent) {
				if (that.allowsNesting(parent, object.get(0))) {
					newParent = parent;
					return false;
				}
			});
		}

		if (typeof newParent === 'undefined' && limit.length > 0) {
			// found no possible new parent, so split up to the limit object
			newParent = limit.get(0);
		}

		// check whether it is allowed to insert the element at all
		if (!this.allowsNesting(newParent, object.get(0)) && !force) {
			return false;
		}

		if (typeof newParent !== 'undefined') {
			// we found a possible new parent, so we split the DOM up to the new parent
			var splitParts = this.split(range, jQuery(newParent), atEnd);
			if (splitParts === true) {
				// DOM was not split (there was no need to split it), insert the new object anyway
				var container = range.startContainer,
					offset = range.startOffset;
				if (atEnd) {
					container = range.endContainer;
					offset = range.endOffset;
				}
				if (offset === 0) {
					// insert right before the first element in the container
					var contents = jQuery(container).contents();
					if (contents.length > 0) {
						contents.eq(0).before(object);
					} else {
						jQuery(container).append(object);
					}
					return true;
				} else {
					// insert right after the element at offset-1
					jQuery(container).contents().eq(offset-1).after(object);
					return true;
				}
			} else if (splitParts) {
				// if the DOM could be split, we insert the new object in between the split parts
				splitParts.eq(0).after(object);
				return true;
			} else {
				// could not split, so could not insert
				return false;
			}
		} else {
			// found no possible new parent, so we shall not insert
			return false;
		}
	},

	/**
	 * Remove the given DOM object from the DOM and modify the given range to reflect the user expected range after the object was removed
	 * TODO: finish this
	 * @param {DOMObject} object DOM object to remove
	 * @param {GENTICS.Utils.RangeObject} range range which eventually be modified
	 * @param {boolean} preserveContent true if the contents of the removed DOM object shall be preserved, false if not (default: false)
	 * @return true if the DOM object could be removed, false if not
	 * @hide
	 */
	removeFromDOM: function (object, range, preserveContent) {
		if (preserveContent) {
			// check whether the range will need modification
			var indexInParent = this.getIndexInParent(object),
				numChildren = jQuery(object).contents().length,
				parent = object.parentNode;

			if (range.startContainer == parent && range.startOffset > indexInParent) {
				range.startOffset += numChildren - 1;
			} else if (range.startContainer == object) {
				range.startContainer = parent;
				range.startOffset = indexInParent + range.startOffset;
			}

			if (range.endContainer == parent && range.endOffset > indexInParent) {
				range.endOffset += numChildren - 1;
			} else if (range.endContainer == object) {
				range.endContainer = parent;
				range.endOffset = indexInParent + range.endOffset;
			}

			// we simply unwrap the children of the object
			jQuery(object).contents().unwrap();

			// eventually do cleanup
			this.doCleanup({'merge' : true}, range, parent);
		} else {
			// TODO
		}
	},

	/**
	 * Extend the given range to have start and end at the nearest word boundaries to the left (start) and right (end)
	 * @param {GENTICS.Utils.RangeObject} range range to be extended
	 * @param {boolean} fromBoundaries true if extending will also be done, if one or both ends of the range already are at a word boundary, false if not, default: false
	 * @method
	 */
	extendToWord: function (range, fromBoundaries) {
		// search the word boundaries to the left and right
		var leftBoundary = this.searchWordBoundary(range.startContainer, range.startOffset, true),
			rightBoundary = this.searchWordBoundary(range.endContainer, range.endOffset, false);

		// check whether we must not extend the range from word boundaries
		if (!fromBoundaries) {
			// we only extend the range if both ends would be different
			if (range.startContainer == leftBoundary.container && range.startOffset == leftBoundary.offset) {
				return;
			}
			if (range.endContainer == rightBoundary.container && range.endOffset == rightBoundary.offset) {
				return;
			}
		}

		// set the new boundaries
		range.startContainer = leftBoundary.container;
		range.startOffset = leftBoundary.offset;
		range.endContainer = rightBoundary.container;
		range.endOffset = rightBoundary.offset;

		// correct the range
		range.correctRange();

		// clear caches
		range.clearCaches();
	},

	/**
	 * Helper method to check whether the given DOM object is a word boundary.
	 * @param {DOMObject} object DOM object in question
	 * @return {boolean} true when the DOM object is a word boundary, false if not
	 * @hide
	 */
	isWordBoundaryElement: function (object) {
		if (!object || !object.nodeName) {
			return false;
		}
		return jQuery.inArray(object.nodeName.toLowerCase(), this.nonWordBoundaryTags) == -1;
	},

	/**
	 * Search for the next word boundary, starting at the given position
	 * @param {DOMObject} container container of the start position
	 * @param {Integer} offset offset of the start position
	 * @param {boolean} searchleft true for searching to the left, false for searching to the right (default: true)
	 * @return {object} object with properties 'container' and 'offset' marking the found word boundary
	 * @method
	 */
	searchWordBoundary: function (container, offset, searchleft) {
		if (typeof searchleft === 'undefined') {
			searchleft = true;
		}
		var boundaryFound = false, wordBoundaryPos;
		while (!boundaryFound) {
			// check the node type
			if (container.nodeType === 3) {
				// we are currently in a text node

				// find the nearest word boundary character
				if (!searchleft) {
					// search right
					wordBoundaryPos = container.data.substring(offset).search(/\W/);
					if (wordBoundaryPos != -1) {
						// found a word boundary
						offset = offset + wordBoundaryPos;
						boundaryFound = true;
					} else {
						// found no word boundary, so we set the position after the container
						offset = this.getIndexInParent(container) + 1;
						container = container.parentNode;
					}
				} else {
					// search left
					wordBoundaryPos = container.data.substring(0, offset).search(/\W/);
					var tempWordBoundaryPos = wordBoundaryPos;
					while (tempWordBoundaryPos != -1) {
						wordBoundaryPos = tempWordBoundaryPos;
						tempWordBoundaryPos = container.data.substring(
								wordBoundaryPos + 1, offset).search(/\W/);
						if (tempWordBoundaryPos != -1) {
							tempWordBoundaryPos = tempWordBoundaryPos + wordBoundaryPos + 1;
						}
					}

					if (wordBoundaryPos != -1) {
						// found a word boundary
						offset = wordBoundaryPos + 1;
						boundaryFound = true;
					} else {
						// found no word boundary, so we set the position before the container
						offset = this.getIndexInParent(container);
						container = container.parentNode;
					}
				}
			} else if (container.nodeType === 1) {
				// we are currently in an element node (between nodes)

				if (!searchleft) {
					// check whether there is an element to the right
					if (offset < container.childNodes.length) {
						// there is an element to the right, check whether it is a word boundary element
						if (this.isWordBoundaryElement(container.childNodes[offset])) {
							// we are done
							boundaryFound = true;
						} else {
							// element to the right is no word boundary, so enter it
							container = container.childNodes[offset];
							offset = 0;
						}
					} else {
						// no element to the right, check whether the element itself is a boundary element
						if (this.isWordBoundaryElement(container)) {
							// we are done
							boundaryFound = true;
						} else {
							// element itself is no boundary element, so go to parent
							offset = this.getIndexInParent(container) + 1;
							container = container.parentNode;
						}
					}
				} else {
					// check whether there is an element to the left
					if (offset > 0) {
						// there is an element to the left, check whether it is a word boundary element
						if (this.isWordBoundaryElement(container.childNodes[offset - 1])) {
							// we are done
							boundaryFound = true;
						} else {
							// element to the left is no word boundary, so enter it
							container = container.childNodes[offset - 1];
							offset = container.nodeType === 3 ? container.data.length : container.childNodes.length;
						}
					} else {
						// no element to the left, check whether the element itself is a boundary element
						if (this.isWordBoundaryElement(container)) {
							// we are done
							boundaryFound = true;
						} else {
							// element itself is no boundary element, so go to parent
							offset = this.getIndexInParent(container);
							container = container.parentNode;
						}
					}
				}
			}
		}

		if (container.nodeType !== 3) {
			var textNode = this.searchAdjacentTextNode(container, offset, !searchleft);
			if (textNode) {
				container = textNode;
				offset = searchleft ? 0 : container.data.length;
			}
		}

		return {'container' : container, 'offset' : offset};
	},

	/**
	 * Check whether the given dom object is empty
	 * @param {DOMObject} domObject object to check
	 * @return {boolean} true when the object is empty, false if not
	 * @method
	 */
	isEmpty: function (domObject) {
		// a non dom object is considered empty
		if (!domObject) {
			return true;
		}

		// some tags are considered to be non-empty
		if (jQuery.inArray(domObject.nodeName.toLowerCase(), this.nonEmptyTags) != -1) {
			return false;
		}

		// text nodes are not empty, if they contain non-whitespace characters
		if (domObject.nodeType === 3) {
			return domObject.data.search(/\S/) == -1;
		}

		// all other nodes are not empty if they contain at least one child which is not empty
		for (var i = 0, childNodes = domObject.childNodes.length; i < childNodes; ++i) {
			if (!this.isEmpty(domObject.childNodes[i])) {
				return false;
			}
		}

		// found no contents, so the element is empty
		return true;
	},

	/**
	 * Set the cursor (collapsed selection) right after the given DOM object
	 * @param domObject DOM object
	 * @method
	 */
	setCursorAfter: function (domObject) {
		var newRange = new GENTICS.Utils.RangeObject();
		newRange.startContainer = newRange.endContainer = domObject.parentNode;
		newRange.startOffset = newRange.endOffset = this.getIndexInParent(domObject);

		// select the range
		newRange.select();
	},

	/**
	 * Set the cursor (collapsed selection) at the start into the given DOM object
	 * @param domObject DOM object
	 * @method
	 */
	setCursorInto: function (domObject) {
		// set a new range into the given dom object
		var newRange = new GENTICS.Utils.RangeObject();
		newRange.startContainer = newRange.endContainer = domObject;
		newRange.startOffset = newRange.endOffset = 0;

		// select the range
		newRange.select();
	}
});

/**
 * Create the singleton object
 * @hide
 */
GENTICS.Utils.Dom = new GENTICS.Utils.Dom();
