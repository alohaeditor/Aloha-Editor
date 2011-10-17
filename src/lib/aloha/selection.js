/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

"use strict";
define(
[ 'aloha/core', 'aloha/jquery', 'aloha/floatingmenu', 'util/class', 'util/range', 'aloha/rangy-core' ],
function(Aloha, jQuery, FloatingMenu, Class, Range) {
	var
//		$ = jQuery,
//		Aloha = window.Aloha,
//		Class = window.Class,
		GENTICS = window.GENTICS;

	/**
	 * @namespace Aloha
	 * @class Selection
	 * This singleton class always represents the current user selection
	 * @singleton
	 */
	var Selection = Class.extend({
		_constructor: function(){
			// Pseudo Range Clone being cleaned up for better HTML wrapping support
			this.rangeObject = {};

			this.preventSelectionChangedFlag = false; // will remember if someone urged us to skip the next aloha-selection-changed event

			// define basics first
			this.tagHierarchy = {
				'textNode' : [],
				'abbr' : ['textNode'],
				'b' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img','a','del','ins','u', 'cite', 'q', 'code', 'abbr', 'strong'],
				'pre' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img','a','del','ins','u', 'cite','q', 'code', 'abbr', 'code'],
				'blockquote' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img','a','del','ins','u', 'cite', 'q', 'code', 'abbr', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
				'ins' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img','a','u', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
				'ul' : ['li'],
				'ol' : ['li'],
				'li' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img', 'ul', 'ol', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'del', 'ins', 'u'],
				'tr' : ['td','th'],
				'table' : ['tr'],
				'div' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img', 'ul', 'ol', 'table', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'del', 'ins', 'u', 'p', 'div', 'pre', 'blockquote'],
				'h1' : ['textNode', 'b', 'i', 'em', 'sup', 'sub', 'br', 'span', 'img','a', 'del', 'ins', 'u']
			};
			// now reference the basics for all other equal tags (important: don't forget to include
			// the basics itself as reference: 'b' : this.tagHierarchy.b
			this.tagHierarchy = {
				'textNode' : this.tagHierarchy.textNode,
				'abbr' : this.tagHierarchy.abbr,
				'br' : this.tagHierarchy.textNode,
				'img' : this.tagHierarchy.textNode,
				'b' : this.tagHierarchy.b,
				'strong' : this.tagHierarchy.b,
				'code' : this.tagHierarchy.b,
				'q' : this.tagHierarchy.b,
				'blockquote' : this.tagHierarchy.blockquote,
				'cite' : this.tagHierarchy.b,
				'i' : this.tagHierarchy.b,
				'em' : this.tagHierarchy.b,
				'sup' : this.tagHierarchy.b,
				'sub' : this.tagHierarchy.b,
				'span' : this.tagHierarchy.b,
				'del' : this.tagHierarchy.del,
				'ins' : this.tagHierarchy.ins,
				'u' : this.tagHierarchy.b,
				'p' : this.tagHierarchy.b,
				'pre' : this.tagHierarchy.pre,
				'a' : this.tagHierarchy.b,
				'ul' : this.tagHierarchy.ul,
				'ol' : this.tagHierarchy.ol,
				'li' : this.tagHierarchy.li,
				'td' : this.tagHierarchy.li,
				'div' : this.tagHierarchy.div,
				'h1' : this.tagHierarchy.h1,
				'h2' : this.tagHierarchy.h1,
				'h3' : this.tagHierarchy.h1,
				'h4' : this.tagHierarchy.h1,
				'h5' : this.tagHierarchy.h1,
				'h6' : this.tagHierarchy.h1,
				'table' : this.tagHierarchy.table
			};

			// When applying this elements to selection they will replace the assigned elements
			this.replacingElements = {
				'h1' : ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6','pre', 'blockquote']
			};
			this.replacingElements = {
					'h1' : this.replacingElements.h1,
					'h2' : this.replacingElements.h1,
					'h3' : this.replacingElements.h1,
					'h4' : this.replacingElements.h1,
					'h5' : this.replacingElements.h1,
					'h6' : this.replacingElements.h1,
					'pre' : this.replacingElements.h1,
					'p' : this.replacingElements.h1,
					'blockquote' : this.replacingElements.h1
			};
			this.allowedToStealElements = {
					'h1' : ['textNode']
			};
			this.allowedToStealElements = {
					'h1' : this.allowedToStealElements.h1,
					'h2' : this.allowedToStealElements.h1,
					'h3' : this.allowedToStealElements.h1,
					'h4' : this.allowedToStealElements.h1,
					'h5' : this.allowedToStealElements.h1,
					'h6' : this.allowedToStealElements.h1,
					'p' : this.tagHierarchy.b
			};
		},

		/**
		 * Class definition of a SelectionTree (relevant for all formatting / markup changes)
		 * TODO: remove this (was moved to range.js)
		 * Structure:
		 * +
		 * |-domobj: <reference to the DOM Object> (NOT jQuery)
		 * |-selection: defines if this node is marked by user [none|partial|full]
		 * |-children: recursive structure like this
		 * @hide
		 */
		SelectionTree: function() {
			this.domobj = {};
			this.selection = undefined;
			this.children = [];
		},

		/**
		 * INFO: Method is used for integration with Gentics Aloha, has no use otherwise
		 * Updates the rangeObject according to the current user selection
		 * Method is always called on selection change
		 * @param objectClicked Object that triggered the selectionChange event
		 * @return true when rangeObject was modified, false otherwise
		 * @hide
		 */
		onChange: function(objectClicked, event) {
			if (this.updateSelectionTimeout) {
				window.clearTimeout(this.updateSelectionTimeout);
				this.updateSelectionTimeout = undefined;
			}
			//we have to work around an IE bug that causes the user
			//selection to be incorrectly set on the body element when
			//the updateSelectionTimeout triggers. We remember the range
			//from the time when this onChange is triggered and provide
			//it instead of the current user selection when the timout
			//is triggered. The bug is caused by selecting some text and
			//then clicking once inside the selection (which collapses
			//the selection). Interesting fact: when the timeout is
			//increased to 500 milliseconds, the bug will not cause any
			//problems since the selection will correct itself somehow.
			var range = new Aloha.Selection.SelectionRange(true);
			this.updateSelectionTimeout = window.setTimeout(function () {
				Aloha.Selection._updateSelection(event, range);
			}, 5);
		},

		/**
		 * prevents the next aloha-selection-changed event from being triggered
		 */
		preventSelectionChanged: function () {
			this.preventSelectionChangedFlag = true;
		},

		/**
		 * will return wheter selection change event was prevented or not, and reset the preventSelectionChangedFlag
		 * @return boolean true if aloha-selection-change event was prevented
		 */
		isSelectionChangedPrevented: function () {
			var prevented = this.preventSelectionChangedFlag;
			this.preventSelectionChangedFlag = false;
			return prevented;
		},

		/**
		 * INFO: Method is used for integration with Gentics Aloha, has no use otherwise
		 * Updates the rangeObject according to the current user selection
		 * Method is always called on selection change
		 * @param event jQuery browser event object
		 * @return true when rangeObject was modified, false otherwise
		 * @hide
		 */
		updateSelection: function(event) {
			return this._updateSelection(event, null);
		},

		/**
		 * Internal version of updateSelection that adds the range parameter to be
		 * able to work around an IE bug that caused the current user selection
		 * sometimes to be on the body element.
		 * @param range a substitute for the current user selection. if not provided,
		 *   the current user selection will be used.
		 * @hide
		 */
		_updateSelection: function(event, range) {
			if (event !== undefined && event.originalEvent !== undefined &&
					event.originalEvent.stopSelectionUpdate === true) {
				return false;
			}

			this.rangeObject = range || new Aloha.Selection.SelectionRange(true);

			// find the CAC (Common Ancestor Container) and update the selection Tree
			this.rangeObject.update();

			// check if aloha-selection-changed event has been prevented
			if (this.isSelectionChangedPrevented()) {
				return true;
			}

			// Only set the specific scope if an event was provided, which means
			// that somehow an editable was selected
			// TODO Bind code to aloha-selection-changed event to remove coupling to floatingmenu
			if (event !== undefined) {
				// Initiallly set the scope to 'continuoustext'
				FloatingMenu.setScope('Aloha.continuoustext');
			}

			// throw the event that the selection has changed. Plugins now have the
			// chance to react on the chancurrentElements[childCount].children.lengthged selection
			Aloha.trigger('aloha-selection-changed', [ this.rangeObject, event ]);

			return true;
		},

		/**
		 * creates an object with x items containing all relevant dom objects.
		 * Structure:
		 * +
		 * |-domobj: <reference to the DOM Object> (NOT jQuery)
		 * |-selection: defines if this node is marked by user [none|partial|full]
		 * |-children: recursive structure like this ("x.." because it's then shown last in DOM Browsers...)
		 * TODO: remove this (was moved to range.js)
		 *
		 * @param rangeObject "Aloha clean" range object including a commonAncestorContainer
		 * @return obj selection
		 * @hide
		 */
		getSelectionTree: function(rangeObject) {
			if (!rangeObject) { // if called without any parameters, the method acts as getter for this.selectionTree
				return this.rangeObject.getSelectionTree();
			}
			if (!rangeObject.commonAncestorContainer) {
				Aloha.Log.error(this, 'the rangeObject is missing the commonAncestorContainer');
				return false;
			}

			this.inselection = false;

			// before getting the selection tree, we do a cleanup
			if (GENTICS.Utils.Dom.doCleanup({'merge' : true}, rangeObject)) {
				this.rangeObject.update();
				this.rangeObject.select();
			}

			return this.recursiveGetSelectionTree(rangeObject, rangeObject.commonAncestorContainer);
		},

		/**
		 * Recursive inner function for generating the selection tree.
		 * TODO: remove this (was moved to range.js)
		 * @param rangeObject range object
		 * @param currentObject current DOM object for which the selection tree shall be generated
		 * @return array of SelectionTree objects for the children of the current DOM object
		 * @hide
		 */
		recursiveGetSelectionTree: function (rangeObject, currentObject) {
			// get all direct children of the given object
			var jQueryCurrentObject = jQuery(currentObject),
				childCount = 0,
				that = this,
				currentElements = [];

			jQueryCurrentObject.contents().each(function(index) {
				var selectionType = 'none',
					startOffset = false,
					endOffset = false,
					collapsedFound = false,
					i, elementsLength,
					noneFound = false,
					partialFound = false,
					fullFound = false;

				// check for collapsed selections between nodes
				if (rangeObject.isCollapsed() && currentObject === rangeObject.startContainer && rangeObject.startOffset == index) {
					// insert an extra selectiontree object for the collapsed selection here
					currentElements[childCount] = new Aloha.Selection.SelectionTree();
					currentElements[childCount].selection = 'collapsed';
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
						if (this === rangeObject.startContainer) {
							// the selection starts here
							that.inselection = true;

							// when the startoffset is > 0, the selection type is only partial
							selectionType = rangeObject.startOffset > 0 ? 'partial' : 'full';
							startOffset = rangeObject.startOffset;
							endOffset = this.length;
						}
						break;
					case 1: // element node
						if (this === rangeObject.startContainer && rangeObject.startOffset === 0) {
							// the selection starts here
							that.inselection = true;
							selectionType = 'full';
						}
						if (currentObject === rangeObject.startContainer && rangeObject.startOffset === index) {
							// the selection starts here
							that.inselection = true;
							selectionType = 'full';
						}
						break;
					}
				}

				if (that.inselection && !collapsedFound) {
					if (selectionType == 'none') {
						selectionType = 'full';
					}
					// we already found the start of the selection, so look for the end of the selection now
					// check whether the end of the selection is found here

					switch(this.nodeType) {
					case 3: // text node
						if (this === rangeObject.endContainer) {
							// the selection ends here
							that.inselection = false;

							// check for partial selection here
							if (rangeObject.endOffset < this.length) {
								selectionType = 'partial';
							}
							if (startOffset === false) {
								startOffset = 0;
							}
							endOffset = rangeObject.endOffset;
						}
						break;
					case 1: // element node
						if (this === rangeObject.endContainer && rangeObject.endOffset === 0) {
							that.inselection = false;
						}
						break;
					}
					if (currentObject === rangeObject.endContainer && rangeObject.endOffset <= index) {
						that.inselection = false;
						selectionType = 'none';
					}
				}

				// create the current selection tree entry
				currentElements[childCount] = new Aloha.Selection.SelectionTree();
				currentElements[childCount].domobj = this;
				currentElements[childCount].selection = selectionType;
				if (selectionType == 'partial') {
					currentElements[childCount].startOffset = startOffset;
					currentElements[childCount].endOffset = endOffset;
				}

				// now do the recursion step into the current object
				currentElements[childCount].children = that.recursiveGetSelectionTree(rangeObject, this);
				elementsLength = currentElements[childCount].children.length;

				// check whether a selection was found within the children
				if (elementsLength > 0) {
					for ( i = 0; i < elementsLength; ++i) {
						switch(currentElements[childCount].children[i].selection) {
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
						// found at least one 'partial' selection in the children, or both 'full' and 'none', so this element is also 'partial' selected
						currentElements[childCount].selection = 'partial';
					} else if (fullFound && !partialFound && !noneFound) {
						// only found 'full' selected children, so this element is also 'full' selected
						currentElements[childCount].selection = 'full';
					}
				}

				childCount++;
			});

			// extra check for collapsed selections at the end of the current element
			if (rangeObject.isCollapsed()
					&& currentObject === rangeObject.startContainer
					&& rangeObject.startOffset == currentObject.childNodes.length) {
				currentElements[childCount] = new Aloha.Selection.SelectionTree();
				currentElements[childCount].selection = 'collapsed';
				currentElements[childCount].domobj = undefined;
			}

			return currentElements;
		},

		/**
		 * Get the currently selected range
		 * @return {Aloha.Selection.SelectionRange} currently selected range
		 * @method
		 */
		getRangeObject: function() {
			return this.rangeObject;
		},

		/**
		 * method finds out, if a node is within a certain markup or not
		 * @param rangeObj Aloha rangeObject
		 * @param startOrEnd boolean; defines, if start or endContainer should be used: false for start, true for end
		 * @param markupObject jQuery object of the markup to look for
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @param limitObject dom object which limits the search are within the dom. normally this will be the active Editable
		 * @return true, if the markup is effective on the range objects start or end node
		 * @hide
		 */
		isRangeObjectWithinMarkup: function(rangeObject, startOrEnd, markupObject, tagComparator, limitObject) {
			var
				domObj = !startOrEnd?rangeObject.startContainer:rangeObject.endContainer,
				that = this,
				parents = jQuery(domObj).parents(),
				returnVal = false,
				i = -1;
			
			// check if a comparison method was passed as parameter ...
			if (typeof tagComparator !== 'undefined' && typeof tagComparator !== 'function') {
				Aloha.Log.error(this,'parameter tagComparator is not a function');
			}
			// ... if not use this as standard tag comparison method
			if (typeof tagComparator === 'undefined') {
				tagComparator = function(domobj, markupObject) {
					return that.standardTextLevelSemanticsComparator(domobj, markupObject); // TODO should actually be this.getStandardTagComparator(markupObject)
				};
			}
		
			if (parents.length > 0) {
				parents.each(function() {
					// the limit object was reached (normally the Editable Element)
					if (this === limitObject) {
						Aloha.Log.debug(that,'reached limit dom obj');
						return false; // break() of jQuery .each(); THIS IS NOT THE FUNCTION RETURN VALUE
					}
					if (tagComparator(this, markupObject)) {
						if (returnVal === false) {
							returnVal = [];
						}
						Aloha.Log.debug(that,'reached object equal to markup');
						i++;
						returnVal[i] = this;
						return true; // continue() of jQuery .each(); THIS IS NOT THE FUNCTION RETURN VALUE
					}
				});
			}
			return returnVal;
		},

		/**
		 * standard method, to compare a domobj and a jquery object for sections and grouping content (e.g. p, h1, h2, ul, ....).
		 * is always used when no other tag comparator is passed as parameter
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardSectionsAndGroupingContentComparator: function(domobj, markupObject) {
			if  (domobj.nodeType === 1) {
				if (markupObject[0].tagName && Aloha.Selection.replacingElements[ domobj.tagName.toLowerCase() ] && Aloha.Selection.replacingElements[ domobj.tagName.toLowerCase() ].indexOf(markupObject[0].tagName.toLowerCase()) != -1) {
					return true;
				}
			} else {
				Aloha.Log.debug(this,'only element nodes (nodeType == 1) can be compared');
			}
			return false;
		},

		/**
		 * standard method, to compare a domobj and a jquery object for their tagName (aka span elements, e.g. b, i, sup, span, ...).
		 * is always used when no other tag comparator is passed as parameter
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardTagNameComparator : function(domobj, markupObject) {
			if  (domobj.nodeType === 1) {
				if (domobj.tagName.toLowerCase() != markupObject[0].tagName.toLowerCase()) {
					//			Aloha.Log.debug(this, 'tag comparison for <' + domobj.tagName.toLowerCase() + '> and <' + markupObject[0].tagName.toLowerCase() + '> failed because tags are different');
					return false;
				}
				return true;//domobj.attributes.length
			} else {
				Aloha.Log.debug(this,'only element nodes (nodeType == 1) can be compared');
			}
			return false;
		},
		
		/**
		 * standard method, to compare a domobj and a jquery object for text level semantics (aka span elements, e.g. b, i, sup, span, ...).
		 * is always used when no other tag comparator is passed as parameter
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardTextLevelSemanticsComparator: function(domobj, markupObject) {
			// only element nodes can be compared
			if  (domobj.nodeType === 1) {
				if (domobj.tagName.toLowerCase() != markupObject[0].tagName.toLowerCase()) {
		//			Aloha.Log.debug(this, 'tag comparison for <' + domobj.tagName.toLowerCase() + '> and <' + markupObject[0].tagName.toLowerCase() + '> failed because tags are different');
					return false;
				}
				if (!this.standardAttributesComparator(domobj, markupObject)) {
					return false;
				}
				return true;//domobj.attributes.length
			} else {
				Aloha.Log.debug(this,'only element nodes (nodeType == 1) can be compared');
			}
			return false;
		},


		/**
		 * standard method, to compare attributes of one dom obj and one markup obj (jQuery)
		 * @param domobj domobject to compare with markup
		 * @param markupObject jQuery object of the markup to compare with domobj
		 * @return true if objects are equal and false if not
		 * @hide
		 */
		standardAttributesComparator: function(domobj, markupObject) {
			var i, attr, classString, classes, classes2, classLength, attrLength, domAttrLength;

			if (domobj.attributes && domobj.attributes.length && domobj.attributes.length > 0) {
				for (i = 0, domAttrLength = domobj.attributes.length; i < domAttrLength; i++) {
					attr = domobj.attributes[i];
					if (attr.nodeName.toLowerCase() == 'class' && attr.nodeValue.length > 0) {
						classString = attr.nodeValue;
						classes = classString.split(' ');
					}
				}
			}

			if (markupObject[0].attributes && markupObject[0].attributes.length && markupObject[0].attributes.length > 0) {
				for (i = 0, attrLength = markupObject[0].attributes.length; i < attrLength; i++) {
					attr = markupObject[0].attributes[i];
					if (attr.nodeName.toLowerCase() == 'class' && attr.nodeValue.length > 0) {
						classString = attr.nodeValue;
						classes2 = classString.split(' ');
					}
				}
			}

			if (classes && !classes2 || classes2 && !classes) {
				Aloha.Log.debug(this, 'tag comparison for <' + domobj.tagName.toLowerCase() + '> failed because one element has classes and the other has not');
				return false;
			}

			if (classes && classes2 && classes.length !== classes2.length) {
				Aloha.Log.debug(this, 'tag comparison for <' + domobj.tagName.toLowerCase() + '> failed because of a different amount of classes');
				return false;
			}
			if (classes && classes2 && classes.length === classes2.length && classes.length !== 0) {
				for (i = 0, classLength = classes.length; i < classLength; i++) {
					if (!markupObject.hasClass(classes[ i ])) {
						Aloha.Log.debug(this, 'tag comparison for <' + domobj.tagName.toLowerCase() + '> failed because of different classes');
						return false;
					}
				}
			}
			return true;
		},

		/**
		 * method finds out, if a node is within a certain markup or not
		 * @param rangeObj Aloha rangeObject
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return void; TODO: should return true if the markup applied successfully and false if not
		 * @hide
		 */
		changeMarkup: function(rangeObject, markupObject, tagComparator) {
			var
				tagName = markupObject[0].tagName.toLowerCase(),
				newCAC, limitObject,
				backupRangeObject,
				relevantMarkupObjectsAtSelectionStart = this.isRangeObjectWithinMarkup(rangeObject, false, markupObject, tagComparator, limitObject),
				relevantMarkupObjectsAtSelectionEnd = this.isRangeObjectWithinMarkup(rangeObject, true, markupObject, tagComparator, limitObject),
				nextSibling, relevantMarkupObjectAfterSelection,
				prevSibling, relevantMarkupObjectBeforeSelection,
				extendedRangeObject;

			// if the element is a replacing element (like p/h1/h2/h3/h4/h5/h6...), which must not wrap each other
			// use a clone of rangeObject
			if (this.replacingElements[ tagName ]) {
				// backup rangeObject for later selection;
				backupRangeObject = rangeObject;

				// create a new range object to not modify the orginal
				rangeObject = new this.SelectionRange(rangeObject);

				// either select the active Editable as new commonAncestorContainer (CAC) or use the body
				if (Aloha.activeEditable) {
					newCAC= Aloha.activeEditable.obj.get(0);
				} else {
					newCAC = jQuery('body');
				}
				// update rangeObject by setting the newCAC and automatically recalculating the selectionTree
				rangeObject.update(newCAC);

				// store the information, that the markupObject can be replaced (not must be!!) inside the jQuery markup object
				markupObject.isReplacingElement = true;
			}
			// if the element is NOT a replacing element, then something needs to be selected, otherwise it can not be wrapped
			// therefor the method can return false, if nothing is selected ( = rangeObject is collapsed)
			else {
				if (rangeObject.isCollapsed()) {
					Aloha.Log.debug(this, 'early returning from applying markup because nothing is currently selected');
					return false;
				}
			}

			// is Start/End DOM Obj inside the markup to change
			if (Aloha.activeEditable) {
				limitObject = Aloha.activeEditable.obj[0];
			} else {
				limitObject = jQuery('body');
			}

			if (!markupObject.isReplacingElement && rangeObject.startOffset === 0) { // don't care about replacers, because they never extend
				if (prevSibling = this.getTextNodeSibling(false, rangeObject.commonAncestorContainer.parentNode, rangeObject.startContainer)) {
					relevantMarkupObjectBeforeSelection = this.isRangeObjectWithinMarkup({startContainer : prevSibling, startOffset : 0}, false, markupObject, tagComparator, limitObject);
				}
			}
			if (!markupObject.isReplacingElement && (rangeObject.endOffset === rangeObject.endContainer.length)) { // don't care about replacers, because they never extend
				if (nextSibling = this.getTextNodeSibling(true, rangeObject.commonAncestorContainer.parentNode, rangeObject.endContainer)) {
					relevantMarkupObjectAfterSelection = this.isRangeObjectWithinMarkup({startContainer: nextSibling, startOffset: 0}, false, markupObject, tagComparator, limitObject);
				}
			}

			// decide what to do (expand or reduce markup)
			// Alternative A: from markup to no-markup: markup will be removed in selection;
			// reapplied from original markup start to selection start
			if (!markupObject.isReplacingElement && (relevantMarkupObjectsAtSelectionStart && !relevantMarkupObjectsAtSelectionEnd)) {
				Aloha.Log.info(this, 'markup 2 non-markup');
				this.prepareForRemoval(rangeObject.getSelectionTree(), markupObject, tagComparator);
				jQuery(relevantMarkupObjectsAtSelectionStart).addClass('preparedForRemoval');
				this.insertCroppedMarkups(relevantMarkupObjectsAtSelectionStart, rangeObject, false, tagComparator);
			}

			// Alternative B: from markup to markup:
			// remove selected markup (=split existing markup if single, shrink if two different)
			else if (!markupObject.isReplacingElement && relevantMarkupObjectsAtSelectionStart && relevantMarkupObjectsAtSelectionEnd) {
				Aloha.Log.info(this, 'markup 2 markup');
				this.prepareForRemoval(rangeObject.getSelectionTree(), markupObject, tagComparator);
				this.splitRelevantMarkupObject(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject, tagComparator);
			}

			// Alternative C: from no-markup to markup OR with next2markup:
			// new markup is wrapped from selection start to end of originalmarkup, original is remove afterwards
			else if (!markupObject.isReplacingElement && ((!relevantMarkupObjectsAtSelectionStart && relevantMarkupObjectsAtSelectionEnd) || relevantMarkupObjectAfterSelection || relevantMarkupObjectBeforeSelection )) { //
				Aloha.Log.info(this, 'non-markup 2 markup OR with next2markup');
				// move end of rangeObject to end of relevant markups
				if (relevantMarkupObjectBeforeSelection && relevantMarkupObjectAfterSelection) {
					extendedRangeObject = new Aloha.Selection.SelectionRange(rangeObject);
					extendedRangeObject.startContainer = jQuery(relevantMarkupObjectBeforeSelection[ relevantMarkupObjectBeforeSelection.length-1 ]).textNodes()[0];
					extendedRangeObject.startOffset = 0;
					extendedRangeObject.endContainer = jQuery(relevantMarkupObjectAfterSelection[ relevantMarkupObjectAfterSelection.length-1 ]).textNodes().last()[0];
					extendedRangeObject.endOffset = extendedRangeObject.endContainer.length;
					extendedRangeObject.update();
					this.applyMarkup(extendedRangeObject.getSelectionTree(), rangeObject, markupObject, tagComparator);
					Aloha.Log.info(this, 'double extending previous markup(previous and after selection), actually wrapping it ...');

				} else if (relevantMarkupObjectBeforeSelection && !relevantMarkupObjectAfterSelection && !relevantMarkupObjectsAtSelectionEnd) {
					this.extendExistingMarkupWithSelection(relevantMarkupObjectBeforeSelection, rangeObject, false, tagComparator);
					Aloha.Log.info(this, 'extending previous markup');

				} else if (relevantMarkupObjectBeforeSelection && !relevantMarkupObjectAfterSelection && relevantMarkupObjectsAtSelectionEnd) {
					extendedRangeObject = new Aloha.Selection.SelectionRange(rangeObject);
					extendedRangeObject.startContainer = jQuery(relevantMarkupObjectBeforeSelection[ relevantMarkupObjectBeforeSelection.length-1 ]).textNodes()[0];
					extendedRangeObject.startOffset = 0;
					extendedRangeObject.endContainer = jQuery(relevantMarkupObjectsAtSelectionEnd[ relevantMarkupObjectsAtSelectionEnd.length-1 ]).textNodes().last()[0];
					extendedRangeObject.endOffset = extendedRangeObject.endContainer.length;
					extendedRangeObject.update();
					this.applyMarkup(extendedRangeObject.getSelectionTree(), rangeObject, markupObject, tagComparator);
					Aloha.Log.info(this, 'double extending previous markup(previous and relevant at the end), actually wrapping it ...');

				} else if (!relevantMarkupObjectBeforeSelection && relevantMarkupObjectAfterSelection) {
					this.extendExistingMarkupWithSelection(relevantMarkupObjectAfterSelection, rangeObject, true, tagComparator);
					Aloha.Log.info(this, 'extending following markup backwards');

				} else {
					this.extendExistingMarkupWithSelection(relevantMarkupObjectsAtSelectionEnd, rangeObject, true, tagComparator);
				}
			}

			// Alternative D: no-markup to no-markup: easy
			else if (markupObject.isReplacingElement || (!relevantMarkupObjectsAtSelectionStart && !relevantMarkupObjectsAtSelectionEnd && !relevantMarkupObjectBeforeSelection && !relevantMarkupObjectAfterSelection)) {
				Aloha.Log.info(this, 'non-markup 2 non-markup');
				this.applyMarkup(rangeObject.getSelectionTree(), rangeObject, markupObject, tagComparator, {setRangeObject2NewMarkup: true});
			}

			// remove all marked items
			jQuery('.preparedForRemoval').zap();

			// recalculate cac and selectionTree
			rangeObject.update();

			// update selection
			if (markupObject.isReplacingElement) {
		//		this.setSelection(backupRangeObject, true);
				backupRangeObject.select();
			} else {
		//		this.setSelection(rangeObject);
				rangeObject.select();
			}
		},

		/**
		 * method compares a JS array of domobjects with a range object and decides, if the rangeObject spans the whole markup objects. method is used to decide if a markup2markup selection can be completely remove or if it must be splitted into 2 separate markups
		 * @param relevantMarkupObjectsAtSelectionStart JS Array of dom objects, which are parents to the rangeObject.startContainer
		 * @param relevantMarkupObjectsAtSelectionEnd JS Array of dom objects, which are parents to the rangeObject.endContainer
		 * @param rangeObj Aloha rangeObject
		 * @return true, if rangeObjects and markup objects are identical, false otherwise
		 * @hide
		 */
		areMarkupObjectsAsLongAsRangeObject: function(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject) {
			var i, el, textNode, relMarkupEnd, relMarkupStart;

			if (rangeObject.startOffset !== 0) {
				return false;
			}

			for (i = 0, relMarkupStart = relevantMarkupObjectsAtSelectionStart.length; i < relMarkupStart; i++) {
				el = jQuery(relevantMarkupObjectsAtSelectionStart[i]);
				if (el.textNodes().first()[0] !== rangeObject.startContainer) {
					return false;
				}
			}

			for (i = 0, relMarkupEnd = relevantMarkupObjectsAtSelectionEnd.length; i < relMarkupEnd; i++) {
				el = jQuery(relevantMarkupObjectsAtSelectionEnd[i]);
				textNode = el.textNodes().last()[0];
				if (textNode !== rangeObject.endContainer || textNode.length != rangeObject.endOffset) {
					return false;
				}
			}

			return true;
		},

		/**
		 * method used to remove/split markup from a "markup2markup" selection
		 * @param relevantMarkupObjectsAtSelectionStart JS Array of dom objects, which are parents to the rangeObject.startContainer
		 * @param relevantMarkupObjectsAtSelectionEnd JS Array of dom objects, which are parents to the rangeObject.endContainer
		 * @param rangeObj Aloha rangeObject
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return true (always, since no "false" case is currently known...but might be added)
		 * @hide
		 */
		splitRelevantMarkupObject: function(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject, tagComparator) {
			// mark them to be deleted
			jQuery(relevantMarkupObjectsAtSelectionStart).addClass('preparedForRemoval');
			jQuery(relevantMarkupObjectsAtSelectionEnd).addClass('preparedForRemoval');

			// check if the rangeObject is identical with the relevantMarkupObjects (in this case the markup can simply be removed)
			if (this.areMarkupObjectsAsLongAsRangeObject(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd, rangeObject)) {
				return true;
			}

			// find intersection (this can always only be one dom element (namely the highest) because all others will be removed
			var relevantMarkupObjectAtSelectionStartAndEnd = this.intersectRelevantMarkupObjects(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd);

			if (relevantMarkupObjectAtSelectionStartAndEnd) {
				this.insertCroppedMarkups([relevantMarkupObjectAtSelectionStartAndEnd], rangeObject, false, tagComparator);
				this.insertCroppedMarkups([relevantMarkupObjectAtSelectionStartAndEnd], rangeObject, true, tagComparator);
			} else {
				this.insertCroppedMarkups(relevantMarkupObjectsAtSelectionStart, rangeObject, false, tagComparator);
				this.insertCroppedMarkups(relevantMarkupObjectsAtSelectionEnd, rangeObject, true, tagComparator);
			}
			return true;
		},

		/**
		 * method takes two arrays of bottom up dom objects, compares them and returns either the object closest to the root or false
		 * @param relevantMarkupObjectsAtSelectionStart JS Array of dom objects
		 * @param relevantMarkupObjectsAtSelectionEnd JS Array of dom objects
		 * @return dom object closest to the root or false
		 * @hide
		 */
		intersectRelevantMarkupObjects: function(relevantMarkupObjectsAtSelectionStart, relevantMarkupObjectsAtSelectionEnd) {
			var intersection = false, i, elStart, j, elEnd, relMarkupStart, relMarkupEnd;
			if (!relevantMarkupObjectsAtSelectionStart || !relevantMarkupObjectsAtSelectionEnd) {
				return intersection; // we can only intersect, if we have to arrays!
			}
			relMarkupStart = relevantMarkupObjectsAtSelectionStart.length;
			relMarkupEnd = relevantMarkupObjectsAtSelectionEnd.length;
			for (i = 0; i < relMarkupStart; i++) {
				elStart = relevantMarkupObjectsAtSelectionStart[i];
				for (j = 0; j < relMarkupEnd; j++) {
					elEnd = relevantMarkupObjectsAtSelectionEnd[j];
					if (elStart === elEnd) {
						intersection = elStart;
					}
				}
			}
			return intersection;
		},

		/**
		 * method used to add markup to a nonmarkup2markup selection
		 * @param relevantMarkupObjects JS Array of dom objects effecting either the start or endContainer of a selection (which should be extended)
		 * @param rangeObject Aloha rangeObject the markups should be extended to
		 * @param startOrEnd boolean; defines, if the existing markups should be extended forwards or backwards (is propably redundant and could be found out by comparing start or end container with the markup array dom objects)
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return true
		 * @hide
		 */
		extendExistingMarkupWithSelection: function(relevantMarkupObjects, rangeObject, startOrEnd, tagComparator) {
			var extendMarkupsAtStart, extendMarkupsAtEnd, objects, i, relMarkupLength, el, textnodes, nodeNr;
			if (!startOrEnd) { // = Start
				// start part of rangeObject should be used, therefor existing markups are cropped at the end
				extendMarkupsAtStart = true;
			}
			if (startOrEnd) { // = End
				// end part of rangeObject should be used, therefor existing markups are cropped at start (beginning)
				extendMarkupsAtEnd = true;
			}
			objects = [];
			for( i = 0, relMarkupLength = relevantMarkupObjects.length; i < relMarkupLength; i++){
				objects[i] = new this.SelectionRange();
				el = relevantMarkupObjects[i];
				if (extendMarkupsAtEnd && !extendMarkupsAtStart) {
					objects[i].startContainer = rangeObject.startContainer; // jQuery(el).contents()[0];
					objects[i].startOffset = rangeObject.startOffset;
					textnodes = jQuery(el).textNodes(true);

					nodeNr = textnodes.length - 1;
					objects[i].endContainer = textnodes[ nodeNr ];
					objects[i].endOffset = textnodes[ nodeNr ].length;
					objects[i].update();
					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {setRangeObject2NewMarkup: true});
				}
				if (!extendMarkupsAtEnd && extendMarkupsAtStart) {
					textnodes = jQuery(el).textNodes(true);
					objects[i].startContainer = textnodes[0]; // jQuery(el).contents()[0];
					objects[i].startOffset = 0;
					objects[i].endContainer = rangeObject.endContainer;
					objects[i].endOffset = rangeObject.endOffset;
					objects[i].update();
					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {setRangeObject2NewMarkup: true});
				}
			}
			return true;
		},

		/**
		 * method creates an empty markup jQuery object from a dom object passed as paramter
		 * @param domobj domobject to be cloned, cleaned and emptied
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return jQuery wrapper object to be passed to e.g. this.applyMarkup(...)
		 * @hide
		 */
		getClonedMarkup4Wrapping: function(domobj) {
			var wrapper = jQuery(domobj).clone().removeClass('preparedForRemoval').empty();
			if (wrapper.attr('class').length === 0) {
				wrapper.removeAttr('class');
			}
			return wrapper;
		},

		/**
		 * method used to subtract the range object from existing markup. in other words: certain markup is removed from the selections defined by the rangeObject
		 * @param relevantMarkupObjects JS Array of dom objects effecting either the start or endContainer of a selection (which should be extended)
		 * @param rangeObject Aloha rangeObject the markups should be removed from
		 * @param startOrEnd boolean; defines, if the existing markups should be reduced at the beginning of the tag or at the end (is propably redundant and could be found out by comparing start or end container with the markup array dom objects)
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return true
		 * @hide
		 */
		insertCroppedMarkups: function(relevantMarkupObjects, rangeObject, startOrEnd, tagComparator) {
			var cropMarkupsAtEnd,cropMarkupsAtStart,textnodes,objects,i,el,textNodes;
			if (!startOrEnd) { // = Start
				// start part of rangeObject should be used, therefor existing markups are cropped at the end
				cropMarkupsAtEnd = true;
			} else { // = End
				// end part of rangeObject should be used, therefor existing markups are cropped at start (beginning)
				cropMarkupsAtStart = true;
			}
			objects = [];
			for( i = 0; i<relevantMarkupObjects.length; i++){
				objects[i] = new this.SelectionRange();
				el = relevantMarkupObjects[i];
				if (cropMarkupsAtEnd && !cropMarkupsAtStart) {
					textNodes = jQuery(el).textNodes(true);
					objects[i].startContainer = textNodes[0];
					objects[i].startOffset = 0;
					// if the existing markup startContainer & startOffset are equal to the rangeObject startContainer and startOffset,
					// then markupobject does not have to be added again, because it would have no content (zero-length)
					if (objects[i].startContainer === rangeObject.startContainer && objects[i].startOffset === rangeObject.startOffset) {
						continue;
					}
					if (rangeObject.startOffset === 0) {
						objects[i].endContainer = this.getTextNodeSibling(false, el, rangeObject.startContainer);
						objects[i].endOffset = objects[i].endContainer.length;
					} else {
						objects[i].endContainer = rangeObject.startContainer;
						objects[i].endOffset = rangeObject.startOffset;
					}

					objects[i].update();

					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {setRangeObject2NextSibling: true});
				}

				if (!cropMarkupsAtEnd && cropMarkupsAtStart) {
					objects[i].startContainer = rangeObject.endContainer; // jQuery(el).contents()[0];
					objects[i].startOffset = rangeObject.endOffset;
					textnodes = jQuery(el).textNodes(true);
					objects[i].endContainer = textnodes[ textnodes.length-1 ];
					objects[i].endOffset = textnodes[ textnodes.length-1 ].length;
					objects[i].update();
					this.applyMarkup(objects[i].getSelectionTree(), rangeObject, this.getClonedMarkup4Wrapping(el), tagComparator, {setRangeObject2PreviousSibling: true});
				}
			}
			return true;
		},

		/**
		 * apply a certain markup to the current selection
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return void
		 * @hide
		 */
		changeMarkupOnSelection: function(markupObject) {
			// change the markup
			this.changeMarkup(this.getRangeObject(), markupObject, this.getStandardTagComparator(markupObject));

			// merge text nodes

			GENTICS.Utils.Dom.doCleanup({'merge' : true}, this.rangeObject);
			// update the range and select it
			this.rangeObject.update();
			this.rangeObject.select();
		},

		/**
		 * apply a certain markup to the selection Tree
		 * @param selectionTree SelectionTree Object markup should be applied to
		 * @param rangeObject Aloha rangeObject which will be modified to reflect the dom changes, after the the markup was applied (only if activated via options)
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @param options JS object, with the following boolean properties: setRangeObject2NewMarkup, setRangeObject2NextSibling, setRangeObject2PreviousSibling
		 * @return void
		 * @hide
		 */
		applyMarkup: function(selectionTree, rangeObject, markupObject, tagComparator, options) {
			var optimizedSelectionTree, i, el, breakpoint;

			options = options ? options : {};
			// first same tags from within fully selected nodes for removal
			this.prepareForRemoval(selectionTree, markupObject, tagComparator);

			// first let's optimize the selection Tree in useful groups which can be wrapped together
			optimizedSelectionTree = this.optimizeSelectionTree4Markup(selectionTree, markupObject, tagComparator);
			breakpoint = true;

			// now iterate over grouped elements and either recursively dive into object or wrap it as a whole
			for ( i = 0; i < optimizedSelectionTree.length; i++) {
				 el = optimizedSelectionTree[i];
				if (el.wrappable) {
					this.wrapMarkupAroundSelectionTree(el.elements, rangeObject, markupObject, tagComparator, options);
				} else {
					Aloha.Log.debug(this,'dive further into non-wrappable object');
					this.applyMarkup(el.element.children, rangeObject, markupObject, tagComparator, options);
				}
			}
		},

		/**
		 * returns the type of the given markup (trying to match HTML5)
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return string name of the markup type
		 * @hide
		 */
		getMarkupType: function(markupObject) {
			var nn = jQuery(markupObject)[0].nodeName.toLowerCase();
			if (markupObject.outerHtml) {
				Aloha.Log.debug(this, 'Node name detected: ' + nn + ' for: ' + markupObject.outerHtml());
			}
			if (nn == '#text') {return 'textNode';}
			if (this.replacingElements[ nn ]) {return 'sectionOrGroupingContent';}
			if (this.tagHierarchy [ nn ]) {return 'textLevelSemantics';}
			Aloha.Log.warn(this, 'unknown markup passed to this.getMarkupType(...): ' + markupObject.outerHtml());
		},

		/**
		 * returns the standard tag comparator for the given markup object
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return function tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @hide
		 */
		getStandardTagComparator: function(markupObject) {
			var that = this, result;
			switch(this.getMarkupType(markupObject)) {
				case 'textNode':
					result = function(p1, p2) {
						return false;
					};
					break;

				case 'sectionOrGroupingContent':
					result = function(domobj, markupObject) {
						return that.standardSectionsAndGroupingContentComparator(domobj, markupObject);
					};
					break;

				case 'textLevelSemantics':
				/* falls through */
				default:
					result = function(domobj, markupObject) {
						return that.standardTextLevelSemanticsComparator(domobj, markupObject);
					};
					break;
			}
			return result;
		},

		/**
		 * searches for fully selected equal markup tags
		 * @param selectionTree SelectionTree Object markup should be applied to
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @return void
		 * @hide
		 */
		prepareForRemoval: function(selectionTree, markupObject, tagComparator) {
			var that = this, i, el;

			// check if a comparison method was passed as parameter ...
			if (typeof tagComparator !== 'undefined' && typeof tagComparator !== 'function') {
				Aloha.Log.error(this,'parameter tagComparator is not a function');
			}
			// ... if not use this as standard tag comparison method
			if (typeof tagComparator === 'undefined') {
				tagComparator = this.getStandardTagComparator(markupObject);
			}
			for ( i = 0; i<selectionTree.length; i++) {
				el = selectionTree[i];
				if (el.domobj && (el.selection == 'full' || (el.selection == 'partial' && markupObject.isReplacingElement))) {
					// mark for removal
					if (el.domobj.nodeType === 1 && tagComparator(el.domobj, markupObject)) {
						Aloha.Log.debug(this, 'Marking for removal: ' + el.domobj.nodeName);
						jQuery(el.domobj).addClass('preparedForRemoval');
					}
				}
				if (el.selection != 'none' && el.children.length > 0) {
					this.prepareForRemoval(el.children, markupObject, tagComparator);
				}

			}
		},

		/**
		 * searches for fully selected equal markup tags
		 * @param selectionTree SelectionTree Object markup should be applied to
		 * @param rangeObject Aloha rangeObject the markup will be applied to
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @param tagComparator method, which is used to compare the dom object and the jQuery markup object. the method must accept 2 parameters, the first is the domobj, the second is the jquery object. if no method is specified, the method this.standardTextLevelSemanticsComparator is used
		 * @param options JS object, with the following boolean properties: setRangeObject2NewMarkup, setRangeObject2NextSibling, setRangeObject2PreviousSibling
		 * @return void
		 * @hide
		 */
		wrapMarkupAroundSelectionTree: function(selectionTree, rangeObject, markupObject, tagComparator, options) {
			// first let's find out if theoretically the whole selection can be wrapped with one tag and save it for later use
			var objects2wrap = [], // // this will be used later to collect objects
				j = -1, // internal counter,
				breakpoint = true,
				preText = '',
				postText = '',
				prevOrNext,
				textNode2Start,
				textnodes,
				newMarkup,
				i, el, middleText;



			Aloha.Log.debug(this,'The formatting <' + markupObject[0].tagName + '> will be wrapped around the selection');

			// now lets iterate over the elements
			for (i = 0; i < selectionTree.length; i++) {
				el = selectionTree[i];

				// check if markup is allowed inside the elements parent
				if (el.domobj && !this.canTag1WrapTag2(el.domobj.parentNode.tagName.toLowerCase(), markupObject[0].tagName.toLowerCase())) {
					Aloha.Log.info(this,'Skipping the wrapping of <' + markupObject[0].tagName.toLowerCase() + '> because this tag is not allowed inside <' + el.domobj.parentNode.tagName.toLowerCase() + '>');
					continue;
				}

				// skip empty text nodes
				if (el.domobj && el.domobj.nodeType === 3 && jQuery.trim(el.domobj.nodeValue).length === 0) {
					continue;
				}

				// partial element, can either be a textnode and therefore be wrapped (at least partially)
				// or can be a nodeType == 1 (tag) which must be dived into
				if (el.domobj && el.selection == 'partial' && !markupObject.isReplacingElement) {
					if (el.startOffset !== undefined && el.endOffset === undefined) {
						j++;
						preText += el.domobj.data.substr(0,el.startOffset);
						el.domobj.data = el.domobj.data.substr(el.startOffset, el.domobj.data.length-el.startOffset);
						objects2wrap[j] = el.domobj;
					} else if (el.endOffset !== undefined && el.startOffset === undefined) {
						j++;
						postText += el.domobj.data.substr(el.endOffset, el.domobj.data.length-el.endOffset);
						el.domobj.data = el.domobj.data.substr(0, el.endOffset);
						objects2wrap[j] = el.domobj;
					} else if (el.endOffset !== undefined && el.startOffset !== undefined) {
						if (el.startOffset == el.endOffset) { // do not wrap empty selections
							Aloha.Log.debug(this, 'skipping empty selection');
							continue;
						}
						j++;
						preText += el.domobj.data.substr(0,el.startOffset);
						middleText = el.domobj.data.substr(el.startOffset,el.endOffset-el.startOffset);
						postText += el.domobj.data.substr(el.endOffset, el.domobj.data.length-el.endOffset);
						el.domobj.data = middleText;
						objects2wrap[j] = el.domobj;
					} else {
						// a partially selected item without selectionStart/EndOffset is a nodeType 1 Element on the way to the textnode
						Aloha.Log.debug(this, 'diving into object');
						this.applyMarkup(el.children, rangeObject, markupObject, tagComparator, options);
					}
				}
				// fully selected dom elements can be wrapped as whole element
				if (el.domobj && (el.selection == 'full' || (el.selection == 'partial' && markupObject.isReplacingElement))) {
					j++;
					objects2wrap[j] = el.domobj;
				}
			}

			if (objects2wrap.length > 0) {
				// wrap collected DOM object with markupObject
				objects2wrap = jQuery(objects2wrap);

				// make a fix for text nodes in <li>'s in ie
				jQuery.each(objects2wrap, function(index, element) {
					if (jQuery.browser.msie && element.nodeType == 3
							&& !element.nextSibling && !element.previousSibling
							&& element.parentNode
							&& element.parentNode.nodeName.toLowerCase() == 'li') {
						element.data = jQuery.trim(element.data);
					}
				});

				newMarkup = objects2wrap.wrapAll(markupObject).parent();
				newMarkup.before(preText).after(postText);

				if (options.setRangeObject2NewMarkup) { // this is used, when markup is added to normal/normal Text
					textnodes = objects2wrap.textNodes();

					if (textnodes.index(rangeObject.startContainer) != -1) {
						rangeObject.startOffset = 0;
					}
					if (textnodes.index(rangeObject.endContainer) != -1) {
						rangeObject.endOffset = rangeObject.endContainer.length;
					}
					breakpoint=true;
				}
				if (options.setRangeObject2NextSibling){
					prevOrNext = true;
					textNode2Start = newMarkup.textNodes(true).last()[0];
					if (objects2wrap.index(rangeObject.startContainer) != -1) {
						rangeObject.startContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.startOffset = 0;
					}
					if (objects2wrap.index(rangeObject.endContainer) != -1) {
						rangeObject.endContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.endOffset = rangeObject.endOffset - textNode2Start.length;
					}
				}
				if (options.setRangeObject2PreviousSibling){
					prevOrNext = false;
					textNode2Start = newMarkup.textNodes(true).first()[0];
					if (objects2wrap.index(rangeObject.startContainer) != -1) {
						rangeObject.startContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.startOffset = 0;
					}
					if (objects2wrap.index(rangeObject.endContainer) != -1) {
						rangeObject.endContainer = this.getTextNodeSibling(prevOrNext, newMarkup.parent(), textNode2Start);
						rangeObject.endOffset = rangeObject.endContainer.length;
					}
				}
			}
		},

		/**
		 * takes a text node and return either the next recursive text node sibling or the previous
		 * @param previousOrNext boolean, false for previous, true for next sibling
		 * @param commonAncestorContainer dom object to be used as root for the sibling search
		 * @param currentTextNode dom object of the originating text node
		 * @return dom object of the sibling text node
		 * @hide
		 */
		getTextNodeSibling: function(previousOrNext, commonAncestorContainer, currentTextNode) {
			var textNodes = jQuery(commonAncestorContainer).textNodes(true),
				newIndex, index;
			
			index = textNodes.index(currentTextNode);
			if (index == -1) { // currentTextNode was not found
				return false;
			}
			newIndex = index + (!previousOrNext ? -1 : 1);
			return textNodes[newIndex] ? textNodes[newIndex] : false;
		},

		/**
		 * takes a selection tree and groups it into markup wrappable selection trees
		 * @param selectionTree rangeObject selection tree
		 * @param markupObject jQuery object of the markup to be applied (e.g. created with obj = jQuery('<b></b>'); )
		 * @return JS array of wrappable selection trees
		 * @hide
		 */
		optimizeSelectionTree4Markup: function(selectionTree, markupObject, tagComparator) {
			var groupMap = [],
				outerGroupIndex = 0,
				innerGroupIndex = 0,
				that = this,
				i,j,
				endPosition, startPosition;

			if (typeof tagComparator === 'undefined') {
				tagComparator = function(domobj, markupObject) {
					return that.standardTextLevelSemanticsComparator(markupObject);
				};
			}
			for( i = 0; i<selectionTree.length; i++) {
				// we are just interested in selected item, but not in non-selected items
				if (selectionTree[i].domobj && selectionTree[i].selection != 'none') {
					if (markupObject.isReplacingElement && tagComparator(markupObject[0], jQuery(selectionTree[i].domobj))) {
						if (groupMap[outerGroupIndex] !== undefined) {
							outerGroupIndex++;
						}
						groupMap[outerGroupIndex] = {};
						groupMap[outerGroupIndex].wrappable = true;
						groupMap[outerGroupIndex].elements = [];
						groupMap[outerGroupIndex].elements[innerGroupIndex] = selectionTree[i];
						outerGroupIndex++;

					} else
					// now check, if the children of our item could be wrapped all together by the markup object
					if (this.canMarkupBeApplied2ElementAsWhole([ selectionTree[i] ], markupObject)) {
						// if yes, add it to the current group
						if (groupMap[outerGroupIndex] === undefined) {
							groupMap[outerGroupIndex] = {};
							groupMap[outerGroupIndex].wrappable = true;
							groupMap[outerGroupIndex].elements = [];
						}
						if (markupObject.isReplacingElement) { //  && selectionTree[i].domobj.nodeType === 3
							/* we found the node to wrap for a replacing element. however there might
							 * be siblings which should be included as well
							 * although they are actually not selected. example:
							 * li
							 * |-textNode ( .selection = 'none')
							 * |-textNode (cursor inside, therefor .selection = 'partial')
							 * |-textNode ( .selection = 'none')
							 *
							 * in this case it would be useful to select the previous and following textNodes as well (they might result from a previous DOM manipulation)
							 * Think about other cases, where the parent is the Editable. In this case we propably only want to select from and until the next <br /> ??
							 * .... many possibilities, here I realize the two described cases
							 */

							// first find start element starting from the current element going backwards until sibling 0
							startPosition = i;
							for (j = i-1; j >= 0; j--) {
								if (this.canMarkupBeApplied2ElementAsWhole([ selectionTree[ j ] ], markupObject) && this.isMarkupAllowedToStealSelectionTreeElement(selectionTree[ j ], markupObject)) {
									startPosition = j;
								} else {
									break;
								}
							}

							// now find the end element starting from the current element going forward until the last sibling
							endPosition = i;
							for (j = i+1; j < selectionTree.length; j++) {
								if (this.canMarkupBeApplied2ElementAsWhole([ selectionTree[ j ] ], markupObject) && this.isMarkupAllowedToStealSelectionTreeElement(selectionTree[ j ], markupObject)) {
									endPosition = j;
								} else {
									break;
								}
							}

							// now add the elements to the groupMap
							innerGroupIndex = 0;
							for (j = startPosition; j <= endPosition; j++) {
								groupMap[outerGroupIndex].elements[innerGroupIndex]	= selectionTree[j];
								groupMap[outerGroupIndex].elements[innerGroupIndex].selection = 'full';
								innerGroupIndex++;
							}
							innerGroupIndex = 0;
						} else {
							// normal text level semantics object, no siblings need to be selected
							groupMap[outerGroupIndex].elements[innerGroupIndex] = selectionTree[i];
							innerGroupIndex++;
						}
					} else {
						// if no, isolate it in its own group
						if (groupMap[outerGroupIndex] !== undefined) {
							outerGroupIndex++;
						}
						groupMap[outerGroupIndex] = {};
						groupMap[outerGroupIndex].wrappable = false;
						groupMap[outerGroupIndex].element = selectionTree[i];
						innerGroupIndex = 0;
						outerGroupIndex++;
					}
				}
			}
			return groupMap;
		},

		/**
		 * very tricky method, which decides, if a certain markup (normally a replacing markup element like p, h1, blockquote)
		 * is allowed to extend the user selection to other dom objects (represented as selectionTreeElement)
		 * to understand the purpose: if the user selection is collapsed inside e.g. some text, which is currently not
		 * wrapped by the markup to be applied, and therefor the markup does not have an equal markup to replace, then the DOM
		 * manipulator has to decide which objects to wrap. real example:
		 * <div>
		 *	<h1>headline</h1>
		 *	some text blabla bla<br>
		 *	more text HERE THE | CURSOR BLINKING and <b>even more bold text</b>
		 * </div>
		 * when the user now wants to apply e.g. a <p> tag, what will be wrapped? it could be useful if the manipulator would actually
		 * wrap everything inside the div except the <h1>. but for this purpose someone has to decide, if the markup is
		 * allowed to wrap certain dom elements in this case the question would be, if the <p> is allowed to wrap
		 * textNodes, <br> and <b> and <h1>. therefore this tricky method should answer the question for those 3 elements
		 * with true, but for for the <h1> it should return false. and since the method does not know this, there is a configuration
		 * for this
		 *
		 * @param selectionTree rangeObject selection tree element (only one, not an array of)
		 * @param markupObject lowercase string of the tag to be verified (e.g. "b")
		 * @return true if the markup is allowed to wrap the selection tree element, false otherwise
		 * @hide
		 */
		isMarkupAllowedToStealSelectionTreeElement: function(selectionTreeElement, markupObject) {
			if (!selectionTreeElement.domobj) {
				return false;
			}
			var nodeName = selectionTreeElement.domobj.nodeName.toLowerCase(),
				markupName;
			
			nodeName = (nodeName == '#text') ? 'textNode' : nodeName;
			markupName = markupObject[0].nodeName.toLowerCase();
			// if nothing is defined for the markup, it's now allowed
			if (!this.allowedToStealElements[ markupName ]) {
				return false;
			}
			// if something is defined, but the specifig tag is not in the list
			if (this.allowedToStealElements[ markupName ].indexOf(nodeName) == -1) {
				return false;
			}
			return true;
		},

		/**
		 * checks if a selection can be completey wrapped by a certain html tags (helper method for this.optimizeSelectionTree4Markup
		 * @param selectionTree rangeObject selection tree
		 * @param markupObject lowercase string of the tag to be verified (e.g. "b")
		 * @return true if selection can be applied as whole, false otherwise
		 * @hide
		 */
		canMarkupBeApplied2ElementAsWhole: function(selectionTree, markupObject) {
			var htmlTag, i, el, returnVal;

			if (markupObject.jquery) {
				htmlTag = markupObject[0].tagName;
			}
			if (markupObject.tagName) {
				htmlTag = markupObject.tagName;
			}

			returnVal = true;
			for ( i = 0; i < selectionTree.length; i++) {
				el = selectionTree[i];
				if (el.domobj && (el.selection != "none" || markupObject.isReplacingElement)) {
					// Aloha.Log.debug(this, 'Checking, if  <' + htmlTag + '> can be applied to ' + el.domobj.nodeName);
					if (!this.canTag1WrapTag2(htmlTag, el.domobj.nodeName)) {
						return false;
					}
					if (el.children.length > 0 && !this.canMarkupBeApplied2ElementAsWhole(el.children, markupObject)) {
						return false;
					}
				}
			}
			return returnVal;
		},

		/**
		 * checks if a tag 1 (first parameter) can wrap tag 2 (second parameter).
		 * IMPORTANT: the method does not verify, if there have to be other tags in between
		 * Example: this.canTag1WrapTag2("table", "td") will return true, because the method does not take into account, that there has to be a "tr" in between
		 * @param t1 string: tagname of outer tag to verify, e.g. "b"
		 * @param t2 string: tagname of inner tag to verify, e.g. "b"
		 * @return true if tag 1 can wrap tag 2, false otherwise
		 * @hide
		 */
		canTag1WrapTag2: function(t1, t2) {
			t1 = (t1 == '#text')?'textNode':t1.toLowerCase();
			t2 = (t2 == '#text')?'textNode':t2.toLowerCase();
			if (!this.tagHierarchy[ t1 ]) {
				// Aloha.Log.warn(this, t1 + ' is an unknown tag to the method canTag1WrapTag2 (paramter 1). Sadfully allowing the wrapping...');
				return true;
			}
			if (!this.tagHierarchy[ t2 ]) {
				// Aloha.Log.warn(this, t2 + ' is an unknown tag to the method canTag1WrapTag2 (paramter 2). Sadfully allowing the wrapping...');
				return true;
			}
			var t1Array = this.tagHierarchy[ t1 ],
				returnVal = (t1Array.indexOf( t2 ) != -1) ? true : false;
			return returnVal;
		},

		/**
		 * Check whether it is allowed to insert the given tag at the start of the
		 * current selection. This method will check whether the markup effective for
		 * the start and outside of the editable part (starting with the editable tag
		 * itself) may wrap the given tag.
		 * @param tagName {String} name of the tag which shall be inserted
		 * @return true when it is allowed to insert that tag, false if not
		 * @hide
		 */
		mayInsertTag: function (tagName) {
			if (typeof this.rangeObject.unmodifiableMarkupAtStart == 'object') {
				// iterate over all DOM elements outside of the editable part
				for (var i = 0; i < this.rangeObject.unmodifiableMarkupAtStart.length; ++i) {
					// check whether an element may not wrap the given
					if (!this.canTag1WrapTag2(this.rangeObject.unmodifiableMarkupAtStart[i].nodeName, tagName)) {
						// found a DOM element which forbids to insert the given tag, we are done
						return false;
					}
				}

				// all of the found DOM elements allow inserting the given tag
				return true;
			} else {
				Aloha.Log.warn(this, 'Unable to determine whether tag ' + tagName + ' may be inserted');
				return true;
			}
		},

		/**
		 * String representation
		 * @return "Aloha.Selection"
		 * @hide
		 */
		toString: function() {
			return 'Aloha.Selection';
		},

		/**
		 * @namespace Aloha.Selection
		 * @class SelectionRange
		 * @extends GENTICS.Utils.RangeObject
		 * Constructor for a range object.
		 * Optionally you can pass in a range object that's properties will be assigned to the new range object.
		 * @param rangeObject A range object thats properties will be assigned to the new range object.
		 * @constructor
		 */
		SelectionRange: GENTICS.Utils.RangeObject.extend({
			_constructor: function(rangeObject){
				this._super(rangeObject);
				// If a range object was passed in we apply the values to the new range object
				if (rangeObject) {
					if (rangeObject.commonAncestorContainer) {
						this.commonAncestorContainer = rangeObject.commonAncestorContainer;
					}
					if (rangeObject.selectionTree) {
						this.selectionTree = rangeObject.selectionTree;
					}
					if (rangeObject.limitObject) {
						this.limitObject = rangeObject.limitObject;
					}
					if (rangeObject.markupEffectiveAtStart) {
						this.markupEffectiveAtStart = rangeObject.markupEffectiveAtStart;
					}
					if (rangeObject.unmodifiableMarkupAtStart) {
						this.unmodifiableMarkupAtStart = rangeObject.unmodifiableMarkupAtStart;
					}
					if (rangeObject.splitObject) {
						this.splitObject = rangeObject.splitObject;
					}
				}
			},

			/**
			 * DOM object of the common ancestor from startContainer and endContainer
			 * @hide
			 */
			commonAncestorContainer: undefined,

			/**
			 * The selection tree
			 * @hide
			 */
			selectionTree: undefined,

			/**
			 * Array of DOM objects effective for the start container and inside the
			 * editable part (inside the limit object). relevant for the button status
			 * @hide
			 */
			markupEffectiveAtStart: [],

			/**
			 * Array of DOM objects effective for the start container, which lies
			 * outside of the editable portion (starting with the limit object)
			 * @hide
			 */
			unmodifiableMarkupAtStart: [],

			/**
			 * DOM object being the limit for all markup relevant activities
			 * @hide
			 */
			limitObject: undefined,

			/**
			 * DOM object being split when enter key gets hit
			 * @hide
			 */
			splitObject: undefined,

			/**
			 * Sets the visible selection in the Browser based on the range object.
			 * If the selection is collapsed, this will result in a blinking cursor,
			 * otherwise in a text selection.
			 * @method
			 */
			select: function() {
				// Call Utils' select()
				this._super();

				// update the selection
				Aloha.Selection.updateSelection();
			},

			/**
			 * Method to update a range object internally
			 * @param commonAncestorContainer (DOM Object); optional Parameter; if set, the parameter
			 * will be used instead of the automatically calculated CAC
			 * @return void
			 * @hide
			 */
			update: function(commonAncestorContainer) {
				this.updatelimitObject();
				this.updateMarkupEffectiveAtStart();
				this.updateCommonAncestorContainer(commonAncestorContainer);

				// reset the selectiontree (must be recalculated)
				this.selectionTree = undefined;
			},

			/**
			 * Get the selection tree for this range
			 * TODO: remove this (was moved to range.js)
			 * @return selection tree
			 * @hide
			 */
			getSelectionTree: function () {
				// if not yet calculated, do this now
				if (!this.selectionTree) {
					this.selectionTree = Aloha.Selection.getSelectionTree(this);
				}

				return this.selectionTree;
			},

			/**
			 * TODO: move this to range.js
			 * Get an array of domobj (in dom tree order) of siblings of the given domobj, which are contained in the selection
			 * @param domobj dom object to start with
			 * @return array of siblings of the given domobj, which are also selected
			 * @hide
			 */
			getSelectedSiblings: function (domobj) {
				var selectionTree = this.getSelectionTree();

				return this.recursionGetSelectedSiblings(domobj, selectionTree);
			},

			/**
			 * TODO: move this to range.js
			 * Recursive method to find the selected siblings of the given domobj (which should be selected as well)
			 * @param domobj dom object for which the selected siblings shall be found
			 * @param selectionTree current level of the selection tree
			 * @return array of selected siblings of dom objects or false if none found
			 * @hide
			 */
			recursionGetSelectedSiblings: function (domobj, selectionTree) {
				var selectedSiblings = false,
					foundObj = false,
					i;

				for ( i = 0; i < selectionTree.length; ++i) {
					if (selectionTree[i].domobj === domobj) {
						foundObj = true;
						selectedSiblings = [];
					} else if (!foundObj && selectionTree[i].children) {
						// do the recursion
						selectedSiblings = this.recursionGetSelectedSiblings(domobj, selectionTree[i].children);
						if (selectedSiblings !== false) {
							break;
						}
					} else if (foundObj && selectionTree[i].domobj && selectionTree[i].selection != 'collapsed' && selectionTree[i].selection != 'none') {
						selectedSiblings.push(selectionTree[i].domobj);
					} else if (foundObj && selectionTree[i].selection == 'none') {
						break;
					}
				}

				return selectedSiblings;
			},

			/**
			 * TODO: move this to range.js
			 * Method updates member var markupEffectiveAtStart and splitObject, which is relevant primarily for button status and enter key behaviour
			 * @return void
			 * @hide
			 */
			updateMarkupEffectiveAtStart: function() {
				// reset the current markup
				this.markupEffectiveAtStart = [];
				this.unmodifiableMarkupAtStart = [];

				var
					parents = this.getStartContainerParents(),
					limitFound = false,
					splitObjectWasSet,
					i, el;

				for ( i = 0; i < parents.length; i++) {
					el = parents[i];
					if (!limitFound && (el !== this.limitObject)) {
						this.markupEffectiveAtStart[ i ] = el;
						if (!splitObjectWasSet && GENTICS.Utils.Dom.isSplitObject(el)) {
							splitObjectWasSet = true;
							this.splitObject = el;
						}
					} else {
						limitFound = true;
						this.unmodifiableMarkupAtStart.push(el);
					}
				}
				if (!splitObjectWasSet) {
					this.splitObject = false;
				}
				return;
			},

			/**
			 * TODO: remove this
			 * Method updates member var markupEffectiveAtStart, which is relevant primarily for button status
			 * @return void
			 * @hide
			 */
			updatelimitObject: function() {
				if (Aloha.editables && Aloha.editables.length > 0) {
					var parents = this.getStartContainerParents(),
						editables = Aloha.editables,
						i, el, j, editable;
					for ( i = 0; i < parents.length; i++) {
						 el = parents[i];
						for ( j = 0; j < editables.length; j++) {
							 editable = editables[j].obj[0];
							if (el === editable) {
								this.limitObject = el;
								return true;
							}
						}
					}
				}
				this.limitObject = jQuery('body');
				return true;
			},

			/**
			 * string representation of the range object
			 * @param	verbose	set to true for verbose output
			 * @return string representation of the range object
			 * @hide
			 */
			toString: function(verbose) {
				if (!verbose) {
					return 'Aloha.Selection.SelectionRange';
				}
				return 'Aloha.Selection.SelectionRange {start [' + this.startContainer.nodeValue + '] offset '
					+ this.startOffset + ', end [' + this.endContainer.nodeValue + '] offset ' + this.endOffset + '}';
			}

		}) // SelectionRange

	}); // Selection
	
	
	/*
	function getSelectionStartNode ( node ) {
		if ( !node || isVoidNode( node ) ) {
			return null;
		}
		
		if ( isSelectionStopNode( node ) ) {
			return node;
		}
		
		if ( node.childNodes.length ) {
			if ( isVoidNode( node.firstChild ) || isFlowNode( node.firstChild ) ) {
				return node; // FIXME: Should be null
			}
			
			return getSelectionStartNode( node.firstChild );
		}
		
		if ( node.nextSibling &&
			 !GENTICS.Utils.Dom.isEditingHost( node ) ) {
			return getSelectionStartNode( node.nextSibling );
		}
		
		return null;
	};
	
	function getSelectionEndNode ( node ) {
		if ( !node || isVoidNode( node ) ) {
			return null;
		}
		
		if ( isSelectionStopNode( node ) ) {
			return node;
		}
		
		if ( node.childNodes.length ) {
			if ( isVoidNode( node.lastChild ) || isFlowNode( node.lastChild ) ) {
				return null;
			}
			
			return getSelectionEndNode( node.lastChild );
		}
		
		if ( node.previousSibling &&
			 !GENTICS.Utils.Dom.isEditingHost( node ) ) {
			return getSelectionEndNode( node.previousSibling );
		}
		
		return null;
	};
	
	// Retrieves the nearest cousin in the DOM tree that preceeds the given
	// node. We do this by backtracking up the tree to find the nearest element
	// that is a sibling to the given node or one of its ancestors
	function moveBackwards ( node ) {
		if ( !node || isVoidNode( node ) || isFlowNode( node ) || GENTICS.Utils.Dom.isEditingHost( node ) ) {
			return null;
		}
		
		if ( node.previousSibling ) {
			return node.previousSibling;
		}
			
		if ( node.parentNode ) {
			return moveBackwards( node.parentNode );
		}
		
		return null;
	};
	
	// Retrieves the nearest cousin in the DOM tree that comes after the given
	// node. We do this by travers foward over the tree until we find a sibling
	// of the given node or one of the given node's ancestors
	function moveForwards ( node ) {
		if ( !node || isVoidNode( node ) || isFlowNode( node ) ) {
			return null;
		}
		
		if ( node.nextSibling ) {
			return node.nextSibling;
		}
		
		if ( node.parentNode ) {
			return moveForwards( node.parentNode );
		}
		
		return null;
	};
	
	function isSelectionStopNode ( node ) {
		return ( //isFlowNode( node ) ||
					node.nodeType == Node.TEXT_NODE && !isVoidNode( node ) );
	};
	
	function isPositionAtNodeEnd ( node, pos ) {
		return ( pos &&
				 ( node.length === pos ||
					( node.childNodes && node.childNodes.length === pos ) ) );
	};
	
	var voidNodes = {
		BR    : true,
		HR    : true,
		IMG   : true,
		INPUT : true
	};
	
	var flowNodes = {
		P	: true,
		PRE	: true,
		DIV	: true,
		H1	: true,
		H2	: true,
		H3	: true,
		H4	: true,
		H5	: true,
		H6	: true
	};
	
	*/
	
	/**
	 * We treat all void elements the same.
	 * Should we have any exceptions?
	 * @param {DOMNode} node
	 * @return {Boolean}
	 */
	/*
	function isVoidNode ( node ) {
		return node ? !!voidNodes[ node.nodeName ] : false;
	};
	
	function isFlowNode ( node ) {
		return node ? !!flowNodes[ node.nodeName ] : false;
	};
	*/
	
	/**
	 * Normalizes the native ranges from the browser to standardizes Aloha-
	 * Editor ranges. FYI: Aloha-Editor ranges conform, for the most part with
	 * Webkit, and Internet Explorer ranges.
	 *
	 * @param {Object:Range} range
	 * @return {Object:Range} normalized range
	 */
	/*
	function correctRange ( range ) {
		return range;
		
		var startContainer = range.startContainer,
		    endContainer = range.endContainer,
			startOffset = range.startOffset,
		    endOffset = range.endOffset,
			newStartContainer,
		    newEndContainer,
			newStartOffset = startOffset,
			newEndOffset = endOffset;
		
		//getStartPos( startContainer, startOffset );
		
		if ( isSelectionStopNode( endContainer ) ) {
			if ( endOffset == 0 ) {
				//debugger;
				newEndContainer = moveBackwards( endContainer );
			}
		} else if ( isVoidNode(
			endContainer.childNodes[ endOffset ? endOffset - 1 : 0 ] ) ) {
			if ( endOffset == 0 ) {
				newEndContainer = getSelectionEndNode(
					moveBackwards( endContainer )
				);
				newEndOffset = newEndContainer.length;
			}
		} else if ( isPositionAtNodeEnd ( endContainer, endOffset ) ) {
			// The endOffset is at the end of a node on which we cannot stop
			// at. We will therefore search for an appropriate node nested
			// inside this node at which to stop at
			newEndContainer = endContainer; 
		} else if ( endContainer.children &&
					endContainer.children.length ) {
			//debugger;
			newEndContainer = endContainer.children[ endOffset ];
			if ( isFlowNode( newEndContainer ) ) {
				newEndContainer = endContainer;
				newEndOffset = endOffset;
			}
			//newEndContainer = endContainer.children[
			//	endContainer.children.length - 1
			//];
		} else if ( moveBackwards( endContainer ) ) {
			newEndContainer = moveBackwards( endContainer );
		}
		
		//debugger;
		
		newEndContainer = getSelectionEndNode( newEndContainer );
		
		if ( newEndContainer ) {
			newEndOffset = newEndContainer.length;
		} else {
			newEndContainer = range.endContainer;
		}
		
		// rule:
		//		IF the end position is at the start of the end container
		//		THEN look for its previous relative node that is a phrase element
		//		WHICH would enable us to have an end positon that is greater than zero.
		//		IF we cannot find such a cousin node to be our new end container
		//		THEN leave the end position where it was.
		//
		// ie:
		//		[ '[foo<span>]bar</span>baz', '[foo]<span>bar</span>baz' ]
		//		[ '{foo<span>}bar</span>baz', '[foo]<span>bar</span>baz' ]
		//		[ 'foo{<span>}bar</span>baz', 'foo[]<span>bar</span>baz' ]
		//		[ 'foo<span><b>{<b><b>]bar</b></b></b></span>baz', 'foo[]<span><b><b><b>bar</b></b></b></span>baz' ]
		//		[ 'foo<i></i>{<span><b><b>}bar</b></b></span>baz', 'foo[]<i></i><span><b><b>bar</b></b></span>baz' ]
		//		[ 'foo<i>a</i>{<span><b><b>}bar</b></b></span>baz', 'foo<i>a[]</i><span><b><b>bar</b></b></span>baz' ]
		//		[ 'test<span>{<span><b><b>}bar</b></b></span>baz</span>', 'test[]<span><span><b><b>bar</b></b></span>baz</span>' ]
		//
		// nb:
		// 		Notice that in all cases below, we cannot get a start position that is greater than zero
		// 		and therefore we leave the end position where it was
		//
		//		[ '{<span><b><b>}bar</b></b></span>baz', '<span><b><b>[]bar</b></b></span>baz' ]
		//		[ '<i></i>{<span><b><b>}bar</b></b></span>baz', '<i></i><span><b><b>[]bar</b></b></span>baz' ]
		//		[ '<span>{<span><b><b>}bar</b></b></span>baz</span>', '<span><span><b><b>[]bar</b></b></span>baz</span>' ]
		//
		
		if ( newEndOffset == 0 && !isFlowNode( newEndContainer ) ) {
			var prev = getSelectionEndNode( moveBackwards( newEndContainer ) );
			
			if ( prev ) {
				newEndContainer = prev;
				newEndOffset = prev.length;
			} else {
				var next = getSelectionStartNode( newEndContainer );
				if ( next ) {
					newEndContainer = next;
					newEndOffset = 0;
				}
			}
			
			// TODO: !isVoidNode && !isFlowNode
		}
		
		if ( startContainer == newEndContainer ) {
			// logic:
			//		If the startContainer is the same as the *corrected*
			//		endContainer (newEndContainer), then we can infere that the
			//		corrected endContainer was the most suitable container to
			//		place the end selection position, and it is therefore also
			//		the nearest best container for the start position. The only
			//		things that differ are the start and end positions.
			//		Therefore do nothing.
			// ie:
			// 		Ensures that 'foo<span>bar[</span>]baz' is corrected to
			//		'foo<span>bar[]</span>baz'
			
			if ( newEndOffset == 0 ) {
				newStartContainer = getSelectionStartNode( newEndContainer );
				if ( newStartContainer ) {
					newEndContainer = newStartContainer;
				}
			}
		} else if ( isPositionAtNodeEnd( startContainer, startOffset ) &&
					startContainer.firstChild == newEndContainer ) {
			range.startContainer = newEndContainer;
			newStartOffset = newEndOffset;
		} else if ( endOffset == 0 &&
					//startContainer.childNodes.length &&
					startContainer.childNodes[ startOffset ] == endContainer &&
					moveBackwards( startContainer.childNodes[ startOffset ] ) ) {
			// Corrects 'foo{<span>}bar</span>baz' to 'foo[]<span>bar</span>baz'
			// by trying to find the nearest position to the original start
			// node. We do this by jumping to the previousSibling and
			// traversing to the end of it
			newStartContainer = getSelectionEndNode(
				moveBackwards( startContainer.childNodes[ startOffset ] )
			);
			
			if ( newStartContainer ) {
				range.startContainer = newStartContainer;
				newStartOffset = newStartContainer.length;
				newStartContainer = null; // Prevent going into getSelectionStartNode. Should we just return here?
			}
		} else if ( startOffset == startContainer.length &&
					isVoidNode( startContainer.nextSibling ) ) {
			//debugger;
		} else if ( isPositionAtNodeEnd( startContainer, startOffset ) &&
					moveForwards( startContainer ) ) {
			newStartContainer = moveForwards( startContainer );
		} else if ( startContainer.childNodes.length &&
					!isVoidNode( startContainer.childNodes[ startOffset ] ) ) {
			newStartContainer = startContainer.childNodes[ startOffset ];
		}
		
		newStartContainer = getSelectionStartNode( newStartContainer );
		
		if ( newStartContainer ) {
			newStartOffset = 0;
		} else {
			newStartContainer = range.startContainer;
		}
		
		// rule:
		//		The end position cannot preceed the start position.
		//		If we detect such a case, then we collapse the selection round
		//		the end position
		//
		// reference:
		//		http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-compareDocumentPosition
		//		Bits	Number	Meaning
		//		------  ------  -------
		//		000000	0		Elements are identical.
		//		000001	1		The nodes are in different documents (or one is outside of a document).
		//		000010	2		Node B precedes Node A.
		//		000100	4		Node A precedes Node B.
		//		001000	8		Node B contains Node A.
		//		010000	16		Node A contains Node B.
		//		100000	32		For private use by the browser.
		var posbits = compareDocumentPosition( newStartContainer, newEndContainer );
		
		if ( posbits & 2 && !( posbits & 8 ) ) {
			range.startOffset = newEndOffset;
			range.startContainer = newEndContainer;
			range.endOffset = newEndOffset;
			range.endContainer = newEndContainer;
			
			return range;
		}
		
		while ( !isFlowNode( newStartContainer ) &&
				newStartContainer == newEndContainer &&
				newStartOffset == newEndOffset - 1 &&
				!isSelectionStopNode( newStartContainer ) &&
				!isVoidNode( newStartContainer.childNodes[ newStartOffset ] ) ) {
			// We have this sort of situation: 'foo{<span><br></span>}baz'
			newStartContainer = newEndContainer = newStartContainer.childNodes[ newStartOffset ];
			newStartOffset = 0;
			if ( newEndContainer.childNodes ) {
				newEndOffset = newEndContainer.childNodes.length;
			} else {
				newEndOffset = newEndContainer.length;
			}
		}
		
		// Fix position around void elements
		
		if ( newStartContainer != newEndContainer || newStartOffset != newEndOffset ) {
			
			if ( newEndOffset == 0 && isVoidNode( newEndContainer.previousSibling ) ) {
				
				var index = getIndexOfChildNode(
					newEndContainer.parentNode, newEndContainer.previousSibling
				);
				
				if ( index != -1 ) {
					newEndContainer = newEndContainer.parentNode;
					newEndOffset = index + 1;
				}
				
			}
			
			if ( newStartContainer.length &&
				 newStartContainer.length == newStartOffset &&
				 isVoidNode( newStartContainer.nextSibling ) ) {
				
				var index = getIndexOfChildNode(
					newStartContainer.parentNode, newStartContainer.nextSibling
				);
				
				if ( index != -1 ) {
					newStartContainer = newStartContainer.parentNode;
					newStartOffset = index;
				}
				
			}
		} else {
			//debugger;
			//newStartContainer = getSelectionStartNode( newStartContainer );
			//if ( newStartContainer ) {
			//	newEndContainer = newStartContainer;
			//	newEndOffset = newStartOffset = 0;
			//}
		}
		
		// 'foo<span>{}<br></span>baz', 'foo[]<span><br></span>baz'
		// 'foo<span><br>{}</span>baz', 'foo<span><br></span>[]baz'
		if ( newStartOffset == 0 &&
			 newStartContainer == newEndContainer &&
			 isVoidNode( newStartContainer.firstChild ) ) {
			
			newStartContainer = getSelectionEndNode(
				moveBackwards( newStartContainer )
			);
			newStartOffset = newStartContainer.length;
		
		} else if ( newStartOffset == newStartContainer.childNodes.length &&
					isVoidNode( newStartContainer.lastChild ) ) {
			
			newStartContainer = moveForwards( newStartContainer );
			newStartOffset = 0;
			
		}
		
		if ( newEndOffset == 0 &&
			 newEndContainer.previousSibling &&
			 isVoidNode( newEndContainer.firstChild ) ) {
			
			newEndContainer = newEndContainer.previousSibling;
			newEndOffset = newEndContainer.length;
			
		} else if ( newEndContainer.nextSibling &&
					newEndOffset == newEndContainer.childNodes.length &&
					isVoidNode( newEndContainer.lastChild ) ) {
			
			newEndContainer = newEndContainer.nextSibling;
			newEndOffset = 0;
			
		}
		
		if ( newStartContainer != newEndContainer ) {
			if ( newStartContainer.length == newStartOffset ) {
				var next = moveForwards( newStartContainer );
			} else {
				var next = newStartContainer.childNodes[ newStartOffset ];
			}
			
			if ( next ) {
				if ( next.firstChild == next.lastChild && isVoidNode( next.firstChild ) ) {
					newStartContainer = next;
					newStartOffset = 0;
				}
			}
			
			if ( newEndOffset == 0 ) {
				var prev = moveBackwards( newEndContainer );
				
				if ( prev ) {
					if ( prev.firstChild == prev.lastChild && isVoidNode( prev.firstChild ) ) {
						newEndContainer = prev;
						newEndOffset = 1;
					}
				}
			}
		}
		
		// [ 'foo[}<br>baz', 'foo[]<br>baz' ],
		// [ 'foo<br>{]baz', 'foo<br>[]baz' ],
		if ( newStartContainer == newEndContainer &&
			 newStartOffset == newEndOffset &&
			 newStartContainer.childNodes.length &&
			 !isSelectionStopNode( newStartContainer ) ) {
			newStartContainer = newStartContainer.childNodes[ newStartOffset ];
			if ( isVoidNode( newStartContainer ) ) {
				newStartContainer = newStartContainer.previousSibling;
				newStartOffset = newEndOffset = newStartContainer.length;
			} else {
				newStartOffset = newEndOffset = 0;
			}
			
			newEndContainer = newStartContainer;
		}
		
		// Satisfies: '<p>[foo</p><p>]bar</p><p>baz</p>', '<p>[foo</p><p>}bar</p><p>baz</p>'
		if ( isFlowNode( newEndContainer.parentNode ) &&
			 newEndContainer.parentNode.firstChild == newEndContainer &&
			 newEndOffset == 0 ) {
			//debugger;
			newEndContainer = newEndContainer.parentNode,
			newEndOffset = 0;
		}
		
		if ( !isFlowNode( newEndContainer ) && // make sure we don't do correct this: </p>}foo to </p>]foo
			 !isSelectionStopNode( newEndContainer ) &&
			 isPositionAtNodeEnd( newEndContainer, newEndOffset + 1 ) &&
			 !isVoidNode( newEndContainer.childNodes[ newEndOffset ].previousSibling ) ) {
			newEndContainer = newEndContainer.childNodes[ newEndOffset ];
			newEndOffset = 0;
		}
		
		if ( newEndContainer ) {
			range.endContainer = newEndContainer;
			range.endOffset = newEndOffset;
		}
		
		if ( newStartContainer ) {
			range.startContainer = newStartContainer;
			range.startOffset = newStartOffset;
		}
		
		return range;
	};
	
	*/
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

// Reference: http://dev.w3.org/html5/markup/common-models.html
//
// Phrasing elements are a subset of flow elements.
// The set of void elements intersects with the set of phrasing elements but
// not intersect with the set of flow elements.
//
// We use a hash map instead of an array so that can compute in which set a
// given node belongs to the fastest possible time (ie: "constant" O(1)).
var flowElementsLookupTable = {
	'ADDRESS'    : true,
	'ARTICLE'    : true,
	'ASIDE'      : true,
	'AUDIO'      : true,
	'BLOCKQUOTE' : true,
	'DEL'        : true,
	'DETAILS'    : true,
	'DIV'        : true,
	'DL'         : true,
	'FIELDSET'   : true,
	'FIGURE'     : true,
	'FOOTER'     : true,
	'FORM'       : true,
	'H1'         : true,
	'H2'         : true,
	'H3'         : true,
	'H4'         : true,
	'H5'         : true,
	'H6'         : true,
	'HEADER'     : true,
	'HGROUP'     : true,
	'HR'         : true,
	'INS'        : true,
	'MAP'        : true,
	'MENU'       : true,
	'NAV'        : true,
	'NOSCRIPT'   : true,
	'OBJECT'     : true,
	'OL'         : true,
	'P'          : true,
	'PRE'        : true,
	'SECTION'    : true,
	'TABLE'      : true,
	'UL'         : true,
	'VIDEO'      : true
};

var phrasingElementsLookupTable = {
	'A'        : true,
	'ABBR'     : true,
	'AREA'     : true,
	'AUDIO'    : true,
	'B'        : true,
	'BDI'      : true,
	'BDO'      : true,
	'BR'       : true,
	'BUTTON'   : true,
	'CANVAS'   : true,
	'CITE'     : true,
	'CODE'     : true,
	'COMMAND'  : true,
	'DATALIST' : true,
	'DEL'      : true,
	'DFN'      : true,
	'EM'       : true,
	'EMBED'    : true,
	'I'        : true,
	'IFRAME'   : true,
	'IMG'      : true,
	'INPUT'    : true,
	'INS'      : true,
	'KBD'      : true,
	'KEYGEN'   : true,
	'LABEL'    : true,
	'MAP'      : true,
	'MARK'     : true,
	'METER'    : true,
	'NOSCRIPT' : true,
	'OBJECT'   : true,
	'OUTPUT'   : true,
	'PROGRESS' : true,
	'Q'        : true,
	'RUBY'     : true,
	'S'        : true,
	'SAMP'     : true,
	'SCRIPT'   : true,
	'SELECT'   : true,
	'SMALL'    : true,
	'SPAN'     : true,
	'STRONG'   : true,
	'SUB'      : true,
	'SUP'      : true,
	'TEXTAREA' : true,
	'TIME'     : true,
	'U'        : true,
	'VAR'      : true,
	'VIDEO'    : true,
	'WBR'      : true
<<<<<<< HEAD
}
=======
};
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	
var voidElementsLookupTable = {
	'AREA'    : true,
	'BASE'    : true,
	'BR'      : true,
	'COL'     : true,
	'COMMAND' : true,
	'EMBED'   : true,
	'HR'      : true,
	'IMG'     : true,
	'INPUT'   : true,
	'KEYGEN'  : true,
	'LINK'    : true,
	'META'    : true,
	'PARAM'   : true,
	'SOURCE'  : true,
	'TRACK'   : true,
	'WBR'     : true
};

// It appears to me that block level elements are generally non-phrasing
// flow elements
// Reference: https://developer.mozilla.org/en/HTML/Block-level_elements
var blockElementsLookupTable = {
	'ADDRESS'    : true,
	'ARTICLE'    : true,
	'ASIDE'      : true,
	'AUDIO'      : true,
	'BLOCKQUOTE' : true,
//	'BODY'       : true,
//	'BR'         : true,
//	'BUTTON'     : true,
	'CANVAS'     : true,
//	'CAPTION'    : true,
//	'COL'        : true,
//	'COLGROUP'   : true,
	'DD'         : true,
	'DIV'        : true,
	'DL'         : true,
//	'DT'         : true,
//	'EMBED'      : true,
	'FIELDSET'   : true,
	'FIGCAPTION' : true,
	'FIGURE'     : true,
	'FOOTER'     : true,
	'FORM'       : true,
	'H1'         : true,
	'H2'         : true,
	'H3'         : true,
	'H4'         : true,
	'H5'         : true,
	'H6'         : true,
	'HEADER'     : true,
	'HGROUP'     : true,
	'HR'         : true,
	'NOSCRIPT'   : true,
	'OL'         : true,
	'OUTPUT'     : true,
	'P'          : true,
	'PRE'        : true,
	'SECTION'    : true,
	'TABLE'      : true,
	'TFOOT'      : true,
	'UL'         : true,
	'VIDEO'      : true
};

// Useful functions defined in engine.js:
// isBlockNode
// isInlineNode
// isEditingHost
// isWhitespaceNode
// isCollapsedWhitespaceNode
// removeExtraneousLineBreaksBefore
// removeExtraneousLineBreaksAtTheEndOf
// removeExtraneousLineBreaksFrom
//
// Useful variables defined in engine.js:
// namesOfElementsWithInlineContents

<<<<<<< HEAD
/**
 * @param {DOMElement} node
 * @return {Boolean} returns true of node is a canonical block element
 */
=======
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
function isBlockElement ( node ) {
	return !!( node && flowElementsLookupTable[ node.nodeName ] );
	//return !!( node && blockElementsLookupTable[ node.nodeName ] );
};

function isVoidElement ( node ) {
	return !!( node && voidElementsLookupTable[ node.nodeName ] );
};

function isPhrasingElement ( node ) {
	return !!( node && phrasingElementsLookupTable[ node.nodeName ] );
};

// Phrasing elements are a subset of flow elements, so we return true is the
// node's name is in the flowElementsLookupTable or if it is in the phrasing-
// ElementsLookupTable
function isFlowElement ( node ) {
	if ( !node ) {
		return false;
	}
	
	return !!( flowElementsLookupTable[ node.nodeName ] ||
				phrasingElementsLookupTable[ node.nodeName ] );
};

function isTextNode ( node ) {
	return !!( node && node.nodeType == Node.TEXT_NODE );
};

function isEditingHost ( node ) {
	return !!( node && GENTICS.Utils.Dom.isEditingHost( node ) );
};

function getNodeLength ( node ) {
	if ( !node ) {
		return 0;
	}
	
	return isTextNode( node )
		? node.length
		: node.childNodes.length;
};

/**
 * Unit tests:
 *		given "<p><b>foo</b><i>foo</i></p>", if node is <i>, returns <b>
 *		given "<a>foo</a><p><b>bar</b></p>", if node is <b> return <a>
 *		given "<b>foo</b>", if node is <b> returns null
 *		given "<div><p><b>foo</b></p><i>bar</i></div>", if node is <b> return null
 *		given "<div><p><b>foo</b></p><i>bar</i></div>", if node is <i> return <p>
 *
 * Simple example test:
 *		getLeftNeighbor(jQuery('<p><b>foo</b><i>foo</i></p>').find('i')[0])
 *
 * @param {DOMElement} node
 */
function getLeftNeighbor ( node ) {
	if ( !node ) {
		return null;
	}
	
	if ( node.previousSibling ) {
		return node.previousSibling;
	}
	
	if ( !node.parentNode || isEditingHost( node.parentNode ) ) {
		return null;
	}
	
	return getLeftNeighbor( node.parentNode );
};

/**
 * Similar to getLeftNeighbor, but in the other direction
 * 
 * @param {DOMElement} node
 */
<<<<<<< HEAD
function getRightNeighbor ( node, predicate ) {
=======
function getRightNeighbor ( node ) {
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	if ( !node ) {
		return null;
	}
	
	if ( node.nextSibling ) {
<<<<<<< HEAD
		if ( typeof predicate !== 'function' ||
				predicate( node.nextSibling ) ) {
			return node.nextSibling;
		}
=======
		return node.nextSibling;
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	}
	
	if ( !node.parentNode || isEditingHost( node.parentNode ) ) {
		return null;
	}
	
<<<<<<< HEAD
	if ( typeof predicate === 'function' && predicate( node.parentNode ) ) {
		return node.parentNode;
	}
	
=======
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	return getRightNeighbor( node.parentNode );
};

function getNodeIndex ( node ) {
	if ( !node ) {
		return -1;
	}
	
	// A long as node is an existing node which has a parent, then it is a
	// logical certainty that node's parent will have 1 or more childNodes.
	// We therefore do not need to check for this.
	var kids = node.parent.childNodes,
		l = kids.length,
		i = 0;
	
	for ( ; i < l; ++i ) {
		if ( kids[ i ] === node ) {
			return i;
		}
	}
	
	return -1;
};

/**
 * @param {DOMElement} node
 * @param {Function} predicate
 */
function getLeftmostScion ( node, predicate ) {
	if ( !node || !node.firstChild ) {
		return null;
	}
	
	var scion = getLeftmostScion( node.firstChild, predicate ) || node.firstChild;
	
	if ( typeof predicate !== 'function' || predicate( scion ) ) {
		return scion;
	}
	
<<<<<<< HEAD
	//scion = getNearestRightNode( scion );
	scion = getRightNeighbor( scion );
	if ( scion ) {
		var grandScion = getLeftmostScion( scion, predicate );
		
		if ( grandScion ) {
			return grandScion;
		}
		
		if ( predicate( scion ) ) {
			return scion;
		}
=======
	scion = getNearestRightNode( scion );
	if ( scion ) {
		return getLeftmostScion( scion, predicate ) || scion;
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	}
	
	return null;
};

/**
 * Unit tests:
 *		given "<div><u><i>foo</i></u><b></b><p>bar</p></div>", if node is <div>, return <TextNode textContent="bar">
 *		given "<div><u><i>foo</i>test</u><b></b><p>bar</p></div>", if node is <u>, return <TextNode textContent="test">
 *		given "<div><u><i>foo<p>bar<b></b></p></i></u></div>" if node is <div>, return <b>
 *		given "<div><u><i>foo<p>bar</p><b>test</b></i></u></div>" if node is <div>, return <TextNode textContent="test">
 *		given "<div></div>", if node is <div>, return null
 *
 * @param {DOMElement} node
 * @param {Function} predicate
 */
function getRightmostScion ( node, predicate ) {
	if ( !node || !node.lastChild ) {
		return null;
	}
	
	var scion = getRightmostScion( node.lastChild, predicate ) || node.lastChild;
	
	if ( typeof predicate !== 'function' || predicate( scion ) ) {
		return scion;
	}
	
<<<<<<< HEAD
	// scion = getNearestLeftNode( scion );
	var posbits;
	var grandScion;
	while ( scion ) {
		posbits = compareDocumentPosition( node, scion );
		
		if ( !( posbits & 16 ) ) {
			return null
		}
		
		scion = getLeftNeighbor( scion );
		grandScion = getRightmostScion( scion, predicate );
		
		if ( grandScion ) {
			return grandScion;
		}
		
		if ( predicate( scion ) ) {
			return scion;
		}
	}
	
	/*
	scion = getLeftNeighbor( scion );
	if ( scion ) { debugger;
		var grandScion = getRightmostScion( scion, predicate );
		
		if ( grandScion ) {
			return grandScion;
		}
		
		if ( predicate( scion ) ) {
			return scion;
		}
	}
	*/
=======
	scion = getNearestLeftNode( scion );
	if ( scion ) {
		return getRightmostScion( scion, predicate ) || scion;
	}
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	
	return null;
};

/**
 * We walk backwards up the tree until we encounter a node which matches a
 * predicate condition
 *
 * Unit test:
 *		given: "<div><u><i>foo</i></u><b></b><p>bar</p></div>", if node is <p>, then return <b>
 *		given: "<div><u><i>foo</i><b>test</b></u><p>bar</p></div>", if node is <p>, then return <TextNode textContent="test">
 *
 * @param {Object: DOMElement} node
 * @param {Function} predicate
 */
function getNearestLeftNode ( node, predicate ) {
<<<<<<< HEAD
	if ( !node || isEditingHost( node ) ) {
=======
	if ( !node ) {
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		return null;
	}
	
	// First, get the next left neighbor...
	
	node = getLeftNeighbor( node );
	
	if ( !node ) {
		return null;
	}
	
	// ... then find the very right most container of this left neighbor
	
<<<<<<< HEAD
	var scion = getRightmostScion( node, predicate );
	
	if ( scion ) {
		if ( typeof predicate !== 'function' || predicate( scion ) ) {
=======
	var scion = getRightmostScion( node );
	
	if ( scion ) {
		if ( typeof predicate !== 'function' || predicate ( scion ) ) {
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
			return scion;
		}
	}
	
	// node has no children. check whether we should quit now or move left to
	// the next left neighbor
	
	if ( typeof predicate !== 'function' || predicate( node ) ) {
		return node;
	}
	
	scion = getNearestLeftNode( node, predicate );
	
	if ( scion ) {
		return scion;
	}
	
	return null;
};

/**
 * Like getNearestLeftNode, but in the other direction
 * <b></b><b></b>{<p><b></b><b>f</b>foo]</p>
 * <b></b><b></b><p><b></b><b>[f</b>foo]</p>
 */
function getNearestRightNode ( node, predicate ) {
<<<<<<< HEAD
	if ( !node || isEditingHost( node ) ) {
=======
	if ( !node ) {
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		return null;
	}
	
	node = getRightNeighbor( node );
	
	if ( !node ) {
		return null;
	}
	
	var scion = getLeftmostScion( node, predicate );
	
	if ( scion ) {
		return scion;
	}
	
	if ( typeof predicate !== 'function' || predicate( node ) ) {
		return node;
	}
	
	scion = getNearestRightNode( node, predicate );
	
	if ( scion ) {
		return scion;
	}
	
	return null;
};

/**
 * anatomy of a selection:
 * markup  : '<div>|<p>foo</p>|test{<p>bar</p><p>baz]</p>|</div>', '<div><p>foo</p>test<p>[bar</p><p>}baz</p></div>'
 * offsets :       0          1    2                3   4
 * startContainer : <div>
 * startOffset    : 2
 * endContainer   : <p>
 * endOffset      : 3
 * childNodes : [
 *		0 : <p>foo</p>
 *		1 : test
 *		2 : <p>bar</p>
 *		3 : <p>baz</p>
 *	]
 * 
 * rule:
 * 	IF the container is a flow element
 *	THEN the algorithm is greedy
 *	THEREFOR we try to expand the selection to the end of the nearest left
 *			 neighbor from the selection point, which has a node inwhich we can
 *			 place a new position.
 *			 ie:
 *				"test{<p>foo..." becomes "test[<p>foo..."
 *				"<b>test</b>{<p>foo..." becomes "<b>test[</b><p>foo..."
 *				"test<b></b>{<p>foo..." becomes "test[<b></b><p>foo..."
 *
 *	IF we cannot find a node inwhich we can position ourselves then we contract
 *	   the selection from the current start position in towards to nearest
 *	   right child or sibling
 * 	THEN
 * 		IF the start position is in front of a start tag of a flow element,
 * 			THEN we try to find a suitable start position by moving down or into the tree.
 * 				 We will try and land at the nearest position to where we started, which is the the start of the first stoppable node
 * 		ELSE IF the start position is in front of an end tag of a flow element, then we will try and land at the nearest position to where we started, which is the the end of the first stoppable node
 * unit tests:
			[ 'test{<p>foo</p><p>bar]</p>'			, 'test[<p>foo</p><p>bar]</p>'		  ],
			[ '<b>test</b>{<p>foo</p><p>bar]</p>'	, '<b>test[</b><p>foo</p><p>bar]</p>' ],
			[ '{<p>foo</p><p>bar]</p>'				, '<p>[foo</p><p>bar]</p>'			  ],
 */
function getStartPosition ( container, offset ) {
	if ( !container ) {
		return null;
	}
	
	// Should we just throw an INDEX_SIZE_ERR exception
	offset = sanitizeOffset( container, offset );
	
<<<<<<< HEAD
	if ( isTextNode( container ) ) {
		return {
			node   : container,
			offset : offset
		};
	}
	
=======
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	if ( isBlockElement( container ) ) {
		// If the offset is equal to the container's length, then either we
		// are positioned in an empty container, or else the offset is
		// positioned at the very end of the container--after the last node
		// child node. In either case, we are in front of the closing tag of a
		// block element, and we will therefore try and place our end position
		// somewhere backwards.
		if ( offset == getNodeLength( container ) ) {
			return getStartPositionFromEndOfBlockNode( container, offset );
		}
		
		// The offset is somewhere before the end of the container, therefore
		// check if the node at offset index is a block element.
		if ( isBlockElement( container.childNodes[ offset ] ) ) {
<<<<<<< HEAD
			return getStartPositionFromFrontOfBlockNode( container, offset );
		}
	}
	
	if ( offset == getNodeLength( container ) ) {	
		return getStartPositionFromEndOfInlineNode( container );
	}
	
	return getStartPositionFromFrontOfInlineNode( container.childNodes[ offset ] );
=======
			return getStartPositionFromFrontOfBlockNode(
				container.childNodes[ offset ], offset
			);
		}
		
		// We have a non-block level element
		return getStartPositionFromFrontOfInlineNode (
			container.childNodes[ offset ], offset
		);
		
		return {
			node   : container,
			offset : offset
		};
	}
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
};

function getEndPosition ( container, offset ) {
	if ( !container ) {
		return null;
	}
	
	// Should we just throw an INDEX_SIZE_ERR exception
	offset = sanitizeOffset( container, offset );
	
<<<<<<< HEAD
	if ( isTextNode( container ) ) {
		return {
			node   : container,
			offset : offset
		};
	}
	
=======
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	if ( isBlockElement( container ) ) {
		// If the offset is equal to the container's length, then either we
		// are positioned in an empty container, or else the offset is
		// positioned at the very end of the container--after the last node
		// child node. In either case, we are in front of the closing tag of a
		// block element, and we will therefore try and place our end position
		// somewhere backwards.
		if ( offset == getNodeLength( container ) ) {
			return getEndPositionFromEndOfBlockNode( container, offset );
		}
		
<<<<<<< HEAD
		// The offset is somewhere before the end of the container, therefore
		// check if the node at offset index is a block element.
		if ( isBlockElement( container.childNodes[ offset ] ) ) {
			return getEndPositionFromFrontOfBlockNode( container, offset );
		}
	}
	
	if ( offset == getNodeLength( container ) ) {
		return getEndPositionFromEndOfInlineNode( container, offset );
	}
	
	// We have a non-block level element
	return getEndPositionFromFrontOfInlineNode( container, offset );
};

function getEditingHost ( node ) {
	while ( !isEditingHost( node ) && ( node = node.parentNode ) );
	return node;
};

/**
 * Given that we are in front of an inline node...
 *
 * If we have a text node to the left, and to the right of our selection
 * where we can reposition our start point, we have to then check to see if
 * we have a situation where the original start position had one
 * or more inline nodes followed by a block node between the start position
 * and the text node on which we want reposition the range start point.
 * This will be the case in 2 different cases, which we have to handle
 * differently.
 * The first case is where we have a text node to the right of the original
 * start position, but none to the left.
 * eg: "{<b></b><p>bar]</p>"
 * In this case we simply accept the text node that we found as our new#
 * start position.
 * therefore:
 * "{<b></b><p>bar]</p>" corrects to "<b></b><p>[bar]</p>"
 * The other, second, case is where there is a text node to the right AND
 * to the left of our original start position.
 * eg: "foo{<b></b><p>bar]</p>"
 * In this case we will not take the text node we found as our new start
 * position. Instead, we will look for the nearest inline element to the
 * intercepting block node. We will also look for a position inside that
 * inline node that will place us as close as possible to the intercepting
 * block node.
 * therefore:
 * "foo{<b></b><p>bar]</p>" corrects to "foo<b>{</b><p>bar]</p>"
 * "foo<b><i>{</i></b><p>bar]</p>" corrects to "foo<b><i>{</i></b><p>bar]</p>"
 * "foo{<b></b><u></u><p>bar]</p>" corrects to "foo<b></b><u>{</u><p>bar]</p>"
 * "foo{<b></b><u><i></i><i></i></u><p>bar]</p>" corrects to "foo<b></b><u><i></i><i>{</i></u><p>bar]</p>"
 * 
 * How to determine if we have a block node start tag between the original
 * start position, and the text node on which we want to reposition the
 * start position:
 * Remember that no inline node can container a block node. This means that
 * with each inline node, we can infer that all its children and its
 * children will not be block nodes.
 * With this in mind, check if any of the text node's ancestors (within the
 * editing host) is a block element. If we encounter one on our way up the
 * parent chain, then use compareDocumentPosition to determine if this
 * element succeeds the original start node.
 * If it does, then look for the nearest inline element to the left of this
 * block element, and find the inline node's deepest rightmost node as our
 * new start position.
 * If there are no inline elements between this node and the original start
 * position, then use the text node as our new start position.
 * If the block element does not succeed the original start position, then,
 * the original start position must be contained somewhere in side this
 * ancestor block element.
 * Therefore, to find the nearest inline element starting from the last
 * inline element before we hit his block ancestor, and walk along it's
 * left neighbors until we encounter a inline node. When we find one, look
 * for its deepest, rightmost node that will put our start position as
 * close as possible to that intercepting block node.
 *
 * @param {DOMElement} node
 * @return {Object} position object with properties node and offset
 */
function getStartPositionFromFrontOfInlineNode ( node ) {
	var leftTextNode,
	    rightTextNode;
	
	if ( isTextNode( node ) ) {
		return {
			node   : node,
			offset : 0
		};
	}
	
	// In order to determine where we will reposition the start position, we
	// will need to know whether or not we have a text node to the left of our
	// start position
	leftTextNode = getNearestLeftNode( node, isTextNode );
	
	// Try to find a text node to the right of the start position...
	// First look for the nearest text node inside startNode.
	// Satisfies:
	// [ '{<b>foo]</b>', '<b>[foo]</b>' ],
	
	//rightTextNode = getLeftmostScion( node, isTextNode );
	
	// If there are no text nodes inside node, look for the nearest text
	// node outside of, and to the right of node.
	// Satisfies:
	// [ 'foo{<b></b><b>bar]</b>', 'foo<b></b><b>[bar]</b>' ],
	// [ 'foo{<b><i></i></b>bar]', 'foo<b><i></i></b>[bar]' ],
	// [ 'foo{<b><i></i></b><b>bar]</b>', 'foo<b><i></i></b><b>[bar]</b>' ],
	
	//if ( !rightTextNode ) {
	//	rightTextNode = getNearestRightNode( node, isTextNode );
	//}
	
	
	
	
	
	// Try to move our start position to the right without crossing over any
	// block nodes
	var rightNode = node;
	
	var succeedingBlockNode;
	
	while ( true ) {
		if ( rightNode.nextSibling ) {
			rightNode = rightNode.nextSibling;
			if ( isBlockElement( rightNode ) ) {
				if ( !succeedingBlockNode ) {
					succeedingBlockNode = rightNode;
				}
			}
		} else if ( isEditingHost( rightNode.parentNode )  ) {
			// game over
			break;
		} else if ( isBlockElement( rightNode.parentNode ) ) {
			rightNode = rightNode.parentNode;
			if ( !succeedingBlockNode ) {
				succeedingBlockNode = rightNode;
			}
			continue;
		} else {
			rightNode = rightNode.parentNode;
			continue;
		}
		
		// If rightNode is not a block element, then we know that none of its
		// children are block elements either.
		// If we find a text node somewhere inside of rightNode, then take it
		// stop here
		rightTextNode = isTextNode( rightNode )
			? rightNode
			: getLeftmostScion( rightNode, isTextNode );
		
		if ( rightTextNode ) {
			break;
		}
	}
	
	if ( !leftTextNode && !rightTextNode ) {
		return {
			node   : getEditingHost( node ),
			offset : 0
		}
	}
	
	if ( !leftTextNode && rightTextNode ) {
		return {
			node   : rightTextNode,
			offset : 0
		};
	}
	
	if ( leftTextNode && !rightTextNode ) {
		return {
			node   : leftTextNode,
			offset : getNodeLength( leftTextNode )
		};
	}
	
	// We have both a left and right text node... we have to do some more work
	// before we know where to reposition our start position
	if ( succeedingBlockNode ) {
		var pos = getStartPositionBetweenSucceedingBlockNode(
			node, leftTextNode, succeedingBlockNode
		);
		
		if ( pos ) {
			return pos;
		}
	}
	
	// We do not have an intercepting block to the right of our start position,
	// so use the right text node
	return {
		node   : rightTextNode,
		offset : 0
	};
};

/**
 * Given that we are in front of the end tag of an inline node (eg:
 * "...{</b>..."), an offset arguments is redundant since the offset must be
 * equal to the number of childNodes of the given node.
 *
 * @param {DOMElement} node - an inline node
 */
function getStartPositionFromEndOfInlineNode ( node ) {
	var leftTextNode,
	    rightTextNode,
	    rightNode;
	
	// Try to move our start position to the right without crossing over any
	// block nodes
	rightNode = node;
	
	var succeedingBlockNode;
	
	while ( true ) {
		if ( rightNode.nextSibling ) {
			rightNode = rightNode.nextSibling;
			if ( isBlockElement( rightNode ) ) {
				if ( !succeedingBlockNode ) {
					succeedingBlockNode = rightNode;
				}
			}
		} else if ( isEditingHost( rightNode.parentNode )  ) {
			// game over
			break;
		} else if ( isBlockElement( rightNode.parentNode ) ) {
			rightNode = rightNode.parentNode;
			if ( !succeedingBlockNode ) {
				succeedingBlockNode = rightNode;
			}
			continue;
		} else {
			rightNode = rightNode.parentNode;
			continue;
		}
		
		// If rightNode is not a block element, then we know that none of its
		// children are block elements either.
		// If we find a text node somewhere inside of rightNode, then take it
		// stop here
		rightTextNode = isTextNode( rightNode )
			? rightNode
			: getLeftmostScion( rightNode, isTextNode );
		
		if ( rightTextNode ) {
			break;
		}
	}
	
	// We have found a text node on the right side, and there is no block node
	// that is getting in our way. Therefore we will take this text node as our
	// new start position
	if ( rightTextNode && !succeedingBlockNode ) {
		return {
			node   : rightTextNode,
			offset : 0
		};
	}
	
	// If there is no text node to the right, or if there is a block node
	// between that text node and our original start position, then we cannot
	// move our start position anywhere in that direction. We must somehow go
	// left. The first thig we will try to do is to find a text node inside the
	// start container, because that will keep up closest to our original start
	// position
	if ( !rightTextNode || succeedingBlockNode ) {
		// [ 'foo<b>{</b>}', 'foo[]<b></b>' ]
		// [ '<b>foo{</b><p>bar]</p>', '<b>foo[</b><p>bar]</p>' ],
		leftTextNode = getRightmostScion( node, isTextNode );
		
		if ( leftTextNode &&
				( getRightNeighbor( node ) == succeedingBlockNode ) ) {
			return {
				node   : leftTextNode,
				offset : getNodeLength( leftTextNode )
			};
		}
	}
	
	// If we do not find a text node, then we determine that there are no text
	// nodes inside this editable, and we will move our start position to the
	// very start of the editing host
	
	if ( !leftTextNode ) {
		leftTextNode = getNearestLeftNode( node, isTextNode );
	}
	
	// [ 'foo<b>{</b>}', 'foo[]<b></b>' ]
	if ( leftTextNode && !rightTextNode ) {
		return {
			node   : leftTextNode,
			offset : getNodeLength( leftTextNode )
		};
	}
	
	// [ '<b>{</b><p>foo]</p>', '<b></b><p>[foo]</p>' ],
	if ( !leftTextNode && rightTextNode ) {
		return {
			node   : rightTextNode,
			offset : 0
		};
	}
	
	// The only reason we would have text node to the left and right of our
	// start position and not have already returned is that we have an
	// succeeding block node. We will reposition our start position to the
	// nearest node between our start position and the intercepting block node
	// [ 'foo<b>{</b><p>bar]</p>', 'foo<b>{</b><p>bar]</p>' ],
	if ( leftTextNode && rightTextNode /* && suceedingBlockNode */ ) {
		var pos = getStartPositionBetweenSucceedingBlockNode(
			node, leftTextNode, succeedingBlockNode
		);
		
		if ( pos ) {
			return pos;
		}
	}
	
	// [ '<b>{</b>}', '{}<b></b>' ]
	// if ( !leftTextNode && !rightTextNode )
	return {
		node   : getEditingHost( node ),
		offset : 0
	};
};

// rule:
//		The end position cannot preceed the start position.
//		If we detect such a case, then we collapse the selection round
//		the end position
//
// reference:
//		http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-compareDocumentPosition
//		Bits	Number	Meaning
//		------  ------  -------
//		000000	0		Elements are identical.
//		000001	1		The nodes are in different documents (or one is outside of a document).
//		000010	2		Node B precedes Node A.
//		000100	4		Node A precedes Node B.
//		001000	8		Node B contains Node A.
//		010000	16		Node A contains Node B.
//		100000	32		For private use by the browser.
function getStartPositionBetweenSucceedingBlockNode ( startNode, leftTextNode, succeedingBlockNode ) {
	var posbits = compareDocumentPosition( startNode, succeedingBlockNode );
	var correctNode;
	
	// If node precedes ancestor then we have a block node between the
	// original start position and our text node.
	// Because we know that we have a text node to the left of our start
	// position, we infere that we are in a situation that will resemble
	// the following:
	// [ 'foo{<b></b><p>bar]</p>', 'foo<b>{</b><p>bar]</p>' ],
	// [ 'foo{<b></b><p></p><p>bar]</p>', 'foo<b>{</b><p></p><p>bar]</p>' ],
	// [ '<b>foo{<u></u></b><p>bar]</p>', '<b>foo<u>{</u></b><p>bar]</p>' ],
	// [ 'foo{<b></b><p><u></u></p><p>bar]</p>', 'foo<b>{</b><p><u></u></p><p>bar]</p>' ],
	// [ '<p>foo{<b></b></p><div><u></u></div><p>bar]</p>', '<p>foo<b>{</b></p><div><u></u></div><p>bar]</p>' ],
	if ( posbits & 4 ) {
		correctNode = succeedingBlockNode;
		
		while ( correctNode = getLeftNeighbor( correctNode ) ) {
			if ( !isBlockElement( correctNode ) ||
					jQuery( correctNode ).find( leftTextNode ).length ) {
				correctNode = getRightmostScion( correctNode ) || correctNode;
				break
			}
		}
	}
	
	// Satisfies:
	// [ '<p>foo{<b></b></p><div><u></u></div><p>bar]</p>', '<p>foo<b>{</b></p><div><u></u></div><p>bar]</p>' ],
	// [ '<div>foo{<b></b><i></i></div><div><u></u></div><p>bar]</p>', '<div>foo<b></b><i>{</i></div><div><u></u></div><p>bar]</p>' ],
	// [ '<div>foo{<b></b><p></p></div><div><u></u></div><p>bar]</p>', '<div>foo<b>{</b><p></p></div><div><u></u></div><p>bar]</p>' ],
	// [ '<div>foo<p>test{<b></b></p></div><div><u></u></div><p>bar]</p>', '<div>foo<p>test<b>{</b></p></div><div><u></u></div><p>bar]</p>' ],
	if ( posbits & 8 ) {
		correctNode = getRightmostScion( succeedingBlockNode, isBlockElement );
		correctNode = correctNode
			? getLeftNeighbor( correctNode )
			: getRightmostScion( succeedingBlockNode );
	}
	
	if ( correctNode ) {
		return {
			node  : correctNode,
			offset : getNodeLength( correctNode )
		};
	}
};


/**
 * We are at the end tag of an inline node.
 *
 * @param {DOMElement} node - an inline node
 * @param {Number} offset - an integer that should be equal to the number of
 *							childNodes of node. This argument is therefore
 *							redundant.
 */
function getEndPositionFromEndOfInlineNode ( node, offset ) {
	/*
	var child,
	    leftNode,
	    rightNode;
	
	return {
		node   : node,
		offset : offset
	};
	*/
	
	// Satisfies
	// [ '<b>[foo}</b>', '<b>[foo]</b>' ],
	stop = getRightmostScion( node, isTextNode );
	if ( stop ) {
		return {
			node   : stop,
			offset : getNodeLength( stop )
		};
	}
	
=======
		// The offset is somewhere after the start of the container, therefore
		// check if the node at offset index is a block element.
		if ( isBlockElement( container.childNodes[ offset ] ) ) {
			return getEndPositionFromFrontOfBlockNode(
				container.childNodes[ offset ], offset
			);
		}
	}
	
	// We have a non-block level element
	return getEndPositionFromFrontOfInlineNode (
		container.childNodes[ offset ], offset
	);
};

/**
 * Won't offset always be 0?
 */
function getStartPositionFromFrontOfInlineNode ( node, offset ) {
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	return {
		node   : node,
		offset : offset
	};
};

function getEndPositionFromFrontOfInlineNode ( node, offset ) {
<<<<<<< HEAD
	var child = node.childNodes[ offset ];
	var stop;
	
	if ( isTextNode( child ) ) {
		return {
			node   : child,
			offset : 0
		};
	}
	
	// Try to go right...
	
	// Satisfies:
	// [ '{<b>foo]</b>', '<b>[foo]</b>' ],
	stop = getLeftmostScion( child, isTextNode );
	
	// Satisfies:
	// [ 'foo{<b></b><b>bar]</b>', 'foo<b></b><b>[bar]</b>' ],
	// [ 'foo{<b><i></i></b>bar]', 'foo<b><i></i></b>[bar]' ],
	// [ 'foo{<b><i></i></b><b>bar]</b>', 'foo<b><i></i></b><b>[bar]</b>' ],
	if ( !stop ) {
		stop = getNearestRightNode( child, isTextNode );
	}
	
	if ( stop ) {
		return {
			node   : stop,
			offset : 0
		};
=======
	var stop = node;
	
	while ( ( stop = stop.parentNode ) && !isEditingHost( stop ) ) {
		if ( isBlockElement( stop ) &&
				getNearestLeftNode( stop, isTextNode ) ) {
			return {
				node   : stop,
				offset : 0
			};
		}
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	}
	
	return {
		node   : node,
		offset : offset
	};
};

function getStartPositionFromFrontOfBlockNode ( node, offset ) {
<<<<<<< HEAD
	var child = node.childNodes[ offset ];
	var stop;
	
	// If this node has no nodes to the left of it, or
	// if the left neighbor of this node is a block element, we are not
	// permitted to explorer anywhere left of our current position to
	// find a new landing position. Our only option in to go right.
	if ( !child.previousSibling || isBlockElement( getLeftNeighbor( child ) ) ) {
		// Satisfies:
		// [ '{<p>}foo</p>', '<p>[]foo</p>' ],
		stop = getLeftmostScion( child, isTextNode );
		
		// Satisfies:
		// [ '{<p></p><p>}foo</p>', '<p></p><p>[]foo</p>' ],
		if ( !stop ) {
			stop = getNearestRightNode( child, isTextNode );
=======
	var stop;
	
	// If the left neighbor of this node is a block element, we are not
	// permitted to explorer anywhere left of our current position to
	// find a new landing position. Our only option in to go right.
	if ( !node.previousSibling || isBlockElement( getLeftNeighbor( node ) ) ) {
		stop = getLeftmostScion( node );
		
		while ( stop && stop.nodeType != Node.TEXT_NODE ) {
			stop = getNearestRightNode( stop );
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		}
		
		if ( stop ) {
			return  {
				node   : stop,
				offset : 0
			};
		}
	}
	
	// Get the nearest text node to the left of the start position. If we find
	// a text node. We therefore had one of the following start positions (where
	// "foo" represents out text node):
	// foo{<p>bar]</p> corrects to foo[<p>bar]</p>
	// <b>foo</b>{<p>bar]</p> corrects to <b>foo[</b><p>bar]</p>
	// foo<b></b>{<p>bar</p> correct to foo<b>{</b><p>bar]</p>
<<<<<<< HEAD
	stop = getNearestLeftNode( child, isTextNode );
	if ( stop ) {
		// Satisfies:
		// [ 'foo<b></b>{<p>bar]</p>', 'foo<b>{</b><p>bar]</p>' ]
		// [ 'bar<b></b>{<p></p><p>}foo</p>', 'bar<b>{</b><p></p><p>}foo</p>' ],
		// [ 'bar<b></b>{<p></p><p>}</p>', 'bar[]<b></b><p></p><p></p>' ]
		if ( getRightNeighbor( stop ) != child &&
				!getLeftmostScion( child, isTextNode ) &&
					getNearestRightNode( child, isTextNode ) ) {
			stop = getNearestLeftNode( child );
=======
	stop = getNearestLeftNode( node, isTextNode );
	if ( stop ) {
		// Satisfies:
		// [ 'foo<b></b>{<p>bar]</p>', 'foo<b>{</b><p>bar]</p>' ]
		if ( getRightNeighbor( stop ) != node ) {
			stop = getNearestLeftNode( node );
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		}
		
		return {
			node   : stop,
			offset : getNodeLength( stop )
		};
	}
	
	// We found no text node to the left of our start position.
	// Without a text node to land on, we cannot expand the selection to the
	// left, so we will contract the selection instead, by moving the start
	// position to the nearest text node to the right.
	// Satisfies:
<<<<<<< HEAD
	// [ '<b></b>{<p>foo]</p>', '<b></b><p>[foo]</p>' ]
	stop = getLeftmostScion( child, isTextNode );
	
	// Satisfies:
	// [ '<b></b>{<p></p><p>foo]</p>', '<b></b><p></p><p>[foo]</p>' ]
	if ( !stop ) {
		stop = getNearestRightNode( child, isTextNode );
	}
	
=======
	// [ '<p><b></b>foo]</p>', '<p><b></b>[foo]</p>' ]
	stop = getLeftmostScion( node, isTextNode );
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	if ( stop ) {
		return  {
			node   : stop,
			offset : 0
		};
	}
	
<<<<<<< HEAD
	// There is absolutely no textNode inwhich to place our start position, so
	// place it at the start of the editing host
	return {
		node   : getEditingHost( child ),
		offset : 0
=======
	// We found to text node to land on, return the original start
	// position ...
	return {
		node   : stop,
		offset : offset
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	};
};

function getStartPositionFromEndOfBlockNode ( node , offset ) {
<<<<<<< HEAD
	var correctNode;
	
	correctNode = getRightmostScion( node );
	if ( correctNode ) {
		return {
			node   : correctNode,
			offset : getNodeLength( correctNode )
=======
	var stop;
	
	stop = getRightmostScion( node );
	if ( stop ) {
		return {
			node   : stop,
			offset : getNodeLength( stop )
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		};
	}
	
	// There is no child nodes inside of the container node, so contract the
	// selection rightwards
<<<<<<< HEAD
	correctNode = getNearestRightNode( node );
	if ( correctNode ) {
		return {
			node   : correctNode,
=======
	stop = getNearestRightNode( node );
	if ( stop ) {
		return {
			node   : stop,
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
			offset : 0
		};
	}
	
	return {
		node   : node,
		offset : offset
	};
};

/**
 * Satisfies:
 *   [ '<p>[foo}</p>', '<p>[foo]</p>' ],
 *   [ '[foo<p>}</p>', '[foo]<p></p>' ],
 *   [ '[foo<div><p>}</p></div>', '[foo]<div><p></p></div>' ],
 *   [ '<p>[foo<b>bar</b>}</p>', '<p>[foo<b>bar]</b></p>' ],
 *   [ '<p>[foo<b>bar</b>test}</p>', '<p>[foo<b>bar</b>test]</p>' ],
 *   [ '<p>[foo<b>bar</b>}</p>test', '<p>[foo<b>bar]</b></p>test' ],
 *   [ '[foo<div><p><u>bar</u></p>}</div>', '[foo<div><p><u>bar]</u></p></div>' ],
 *   [ '[foo<div><p><u></u></p>}</div>', '[foo]<div><p><u></u></p></div>' ],
 *   [ '[foo<div><p>bar<u></u></p>}</div>', '[foo<div><p>bar]<u></u></p></div>' ]
 */
function getEndPositionFromEndOfBlockNode ( node, offset ) {
<<<<<<< HEAD
	var endNode;
	
	// Satisfies
	// [ '<p>[foo}</p>', '<p>[foo]</p>' ],
	endNode = getRightmostScion( node, isTextNode );
	if ( endNode ) {
		return {
			node   : endNode,
			offset : getNodeLength( endNode )
=======
	var stop;
	
	// Satisfies
	// [ '<p>[foo}</p>', '<p>[foo]</p>' ],
	stop = getRightmostScion( node, isTextNode );
	if ( stop ) {
		return {
			node   : stop,
			offset : getNodeLength( stop )
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		};
	}
	
	// There is no child nodes inside of our container node which have a text
	// node for us to stop in. We will therefor look left for a landing
	// position
	// Satisfies:
	// [ '[foo<p>}</p>', '[foo]<p></p>' ],
<<<<<<< HEAD
	endNode = getNearestLeftNode( node, isTextNode );
	if ( endNode ) {
		return {
			node   : endNode,
			offset : getNodeLength( endNode )
=======
	stop = getNearestLeftNode( node, isTextNode );
	if ( stop ) {
		return {
			node   : stop,
			offset : getNodeLength( stop )
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		};
	}
	
	// There is nowhere to land left of the end position either
	// Satisfies:
	// [ '{<b></b><p>}</p>', '{}<b></b><p></p>' ]
<<<<<<< HEAD
	// [ '{<p>}</p>', '{}<p></p>' ]
	return {
		node   : getEditingHost( node ),
		offset : 0
=======
	stop = getLeftNeighbor( node );
	if ( stop ) {
		return {
			node   : stop.parentNode,
			offset : 0
		};
	}
	
	return {
		node   : node,
		offset : offset
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	};
};

/**
 * Normalize the end position to conform with how WebKit works with ranges.
 * We have a big problem however: Internet Explorer will refuse to accept where
 * we want to position the range with this algorithm, many of the cases.
 *
 * This is because WebKit corrects '<p>[foo</p>}<p>bar</p>' to
 * '<p>[foo</p><p>}bar</p>' and Internet Explorer will always convert this to
 * '<p>[foo]</p><p>bar</p>'
 */
function getEndPositionFromFrontOfBlockNode ( node, offset ) {
<<<<<<< HEAD
	var child = node.childNodes[ offset ];
	var stop;
	
	// If there are no preceeding sibling (nodes to the left of our child node)
	// if the left neighbor of this node is a block element, we are not
=======
	var stop;
	
	// If the left neighbor of this node is a block element, we are not
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	// permitted to explorer anywhere left of our current position to
	// find a new landing position. Our only option in to go right.
	// We satisfy:
	// [ '<p>[foo</p>}<p>bar</p>', '<p>[foo</p><p>}bar</p>' ],
	// [ '<p>[foo</p>}<p></p>bar', '<p>[foo</p><p></p>]bar' ],
	// [ '<p>[foo</p>}<p><b></b>bar</p>', '<p>[foo</p><p>}<b></b>bar</p>' ]
	//
	// We check if there is no previousSibling in order to satisfy this:
	// '[foo<div>}<p>bar</p></div>', '[foo<div><p>}bar</p></div>'
<<<<<<< HEAD
	if ( !child.previousSibling || isBlockElement( getLeftNeighbor( child ) ) ) {
		/*
		stop = child;
		while ( stop && getNodeLength( stop ) == 0 ) {
			stop = stop.nextSibling;
		}
		*/
		
		stop = getNearestRightNode( child, isTextNode );
		
		if ( stop  ) {
			/*
			if ( isBlockElement( stop ) ) {
				// [ '{}<p>foo</p>', '<p>[]foo</p>' ],
				// [ '{}<div><p>bar</p></div>', '<div><p>[]bar</p></div>' ],
				// var textNode = getLeftmostScion( stop, isTextNode );
=======
	if ( !node.previousSibling || isBlockElement( getLeftNeighbor( node ) ) ) {
		stop = node;
		
		while ( stop && getNodeLength( stop ) == 0 ) {
			stop = stop.nextSibling;
		}
		
		if ( stop  ) {
			if ( isBlockElement( stop ) ) {
				// [ '{}<p>foo</p>', '<p>[]foo</p>' ],
				// [ '{}<div><p>bar</p></div>', '<div><p>[]bar</p></div>' ],
				var textNode = getLeftmostScion( stop, isTextNode );
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
				if ( textNode ) {
					return {
						node   : textNode,
						offset : 0
					};
				}
			}
<<<<<<< HEAD
			*/
=======
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
			
			return {
				node   : stop,
				offset : 0
			};
		}
	}
	
	// We cannot go right, then go left
	// Satisfies:
	// [ '<p>[foo</p>}<p></p>', '<p>[foo]</p><p</p>' ]
<<<<<<< HEAD
	stop = getNearestLeftNode( child, isTextNode );
=======
	stop = getNearestLeftNode( node, isTextNode );
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	if ( stop ) {
		return {
			node   : stop,
			offset : getNodeLength( stop )
		};
	}
	
<<<<<<< HEAD
	// We cannot go left or right.. jump to the front of the editing host
	// Satisfies:
	// [ '{}<p></p>', '{}<p></p>' ]
	// [ '{<p>}</p>', '{}<p></p>' ]
	// [ '{<p></p>}', '{<p></p>}' ]
	// [ '{<p></p>}<p></p>', '{}<p></p><p></p>' ]
	return {
		node   : getEditingHost( child ),
		offset : 0
=======
	// We cannot find a landing position on the left, then jump to the very
	// front.
	// Satisfies:
	// [ '{<p></p>}<p></p>', '{}<p></p><p></p>' ]
	stop = getLeftNeighbor( node );
	if ( stop ) {
		return {
			stop   : stop.parentNode,
			offset : 0
		};
	}
	
	return {
		stop   : node,
		offset : offset
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	};
};


/**
 * Sanitize the offset if it is out of bounds
 * Snap it to the front or end position of the container node
 */
function sanitizeOffset ( node, offset ) {
	if ( offset < 0 ) {
		offset = 0;
	} else if ( offset > getNodeLength( node ) ) {
		offset = getNodeLength( node );
	}
	
	return offset;
};

function correctRange ( range ) {
<<<<<<< HEAD
	// return range;
=======
	//return range;
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
	
	var startContainer = range.startContainer,
	    startOffset = range.startOffset,
	    startPos = getStartPosition( startContainer, startOffset );
	
	if ( startPos ) {
		range.startContainer = startPos.node;
		range.startOffset = startPos.offset;
	}
	
	var endContainer = range.endContainer,
	    endOffset = range.endOffset,
	    endPos = getEndPosition( endContainer, endOffset );
	
	if ( endPos ) {
		range.endContainer = endPos.node;
		range.endOffset = endPos.offset;
	}
	
	return range;
};



















































	/**
	 * Implements Selection http://html5.org/specs/dom-range.html#selection
	 * @namespace Aloha
	 * @class Selection This singleton class always represents the
	 *        current user selection
	 * @singleton
	 */
	var AlohaSelection = Class.extend({
		
		_constructor : function( nativeSelection ) {
			
			this._nativeSelection = nativeSelection;
			this.ranges = [];
			
			// will remember if urged to not change the selection
			this.preventChange = false;
			
		},
		
		/**
		 * Returns the element that contains the start of the selection. Returns null if there's no selection.
		 * @readonly
		 * @type Node
		 */
		anchorNode: null,
		
		/**
		 * Returns the offset of the start of the selection relative to the element that contains the start 
		 * of the selection. Returns 0 if there's no selection.
		 * @readonly
		 * @type int
		 */
		anchorOffset: 0,
		
		/**
		 * Returns the element that contains the end of the selection.
		 * Returns null if there's no selection.
		 * @readonly
		 * @type Node
		 */
		focusNode: null,
		
		/**
		 * Returns the offset of the end of the selection relative to the element that contains the end 
		 * of the selection. Returns 0 if there's no selection.
		 * @readonly
		 * @type int
		 */
		focusOffset: 0,
		
		/**
		 * Returns true if there's no selection or if the selection is empty. Otherwise, returns false.
		 * @readonly
		 * @type boolean
		 */
		isCollapsed: false,
		
		/**
		 * Returns the number of ranges in the selection.
		 * @readonly
		 * @type int
		 */
		rangeCount: 0,
					
		/**
		 * Replaces the selection with an empty one at the given position.
		 * @throws a WRONG_DOCUMENT_ERR exception if the given node is in a different document.
		 * @param parentNode Node of new selection
		 * @param offest offest of new Selection in parentNode
		 * @void
		 */
		collapse: function ( parentNode, offset ) {
			this._nativeSelection.collapse(  parentNode, offset );
		},
		
		/**
		 * Replaces the selection with an empty one at the position of the start of the current selection.
		 * @throws an INVALID_STATE_ERR exception if there is no selection.
		 * @void
		 */
		collapseToStart: function() {
			throw "NOT_IMPLEMENTED";
		},
		
		/** 
		 * @void
		 */
		extend: function ( parentNode, offset) {
			
		},
		
		/**
		 * @param alter DOMString 
		 * @param direction DOMString 
		 * @param granularity DOMString 
		 * @void
		 */
		modify: function ( alter, direction, granularity ) {
			
		},

		/**
		 * Replaces the selection with an empty one at the position of the end of the current selection.
		 * @throws an INVALID_STATE_ERR exception if there is no selection.
		 * @void
		 */
		collapseToEnd: function() {
			throw "NOT_IMPLEMENTED";
		},
		
		/**
		 * Replaces the selection with one that contains all the contents of the given element.
		 * @throws a WRONG_DOCUMENT_ERR exception if the given node is in a different document.
		 * @param parentNode Node the Node fully select
		 * @void
		 */
		selectAllChildren: function( parentNode ) {
			throw "NOT_IMPLEMENTED";
		},
		
		/**
		 * Deletes the contents of the selection
		 */
		deleteFromDocument: function() {
			throw "NOT_IMPLEMENTED";
		},
		
		/**
		 * NB!
		 * We have serious problem in IE.
		 * The range that we get in IE is not the same as the range we had set,
		 * so even if we normalize it during getRangeAt, in IE, we will be
		 * correcting the range to the "correct" place, but still not the place
		 * where it was originally set.
		 * 
		 * Returns the given range.
		 * The getRangeAt(index) method returns the indexth range in the list. 
		 * NOTE: Aloha Editor only support 1 range! index can only be 0
		 * @throws INDEX_SIZE_ERR DOM exception if index is less than zero or 
		 * greater or equal to the value returned by the rangeCount.
		 * @param index int 
		 * @return Range return the selected range from index
		 */
		getRangeAt: function ( index ) {
			return correctRange( this._nativeSelection.getRangeAt( index ) );
<<<<<<< HEAD

			//if ( index < 0 || this.rangeCount ) {
			//	throw "INDEX_SIZE_ERR DOM";
			//}
			//return this._ranges[index];
=======

			//if ( index < 0 || this.rangeCount ) {
			//	throw "INDEX_SIZE_ERR DOM";
			//}
			//return this._ranges[index];
>>>>>>> 0a847830c08391c3b62d6ab24b381aa751bda7ba
		},
		
		/**
		 * Adds the given range to the selection.
		 * The addRange(range) method adds the given range Range object to the list of
		 * selections, at the end (so the newly added range is the new last range). 
		 * NOTE: Aloha Editor only support 1 range! The added range will replace the 
		 * range at index 0
		 * see http://html5.org/specs/dom-range.html#selection note about addRange
		 * @throws an INVALID_NODE_TYPE_ERR exception if the given Range has a boundary point
		 * node that's not a Text or Element node, and an INVALID_MODIFICATION_ERR exception 
		 * if it has a boundary point node that doesn't descend from a Document.
		 * @param range Range adds the range to the selection
		 * @void
		 */ 
		addRange: function( range ) {
			// set readonly attributes
			this._nativeSelection.addRange( range );
			// We will correct the range after rangy has processed the native
			// selection range, so that our correction will be the final fix on
			// the range according to the guarentee's that Aloha wants to make
			this._nativeSelection._ranges[ 0 ] = correctRange( range );
		},
		
		/**
		 * Removes the given range from the selection, if the range was one of the ones in the selection.
		 * NOTE: Aloha Editor only support 1 range! The added range will replace the 
		 * range at with index 0
		 * @param range Range removes the range from the selection
		 * @void
		 */
		removeRange: function( range ) {
			this._nativeSelection.removeRange();
		},
		
		/**
		 * Removes all the ranges in the selection.
		 * @viod
		 */
		removeAllRanges: function() {
			this._nativeSelection.removeAllRanges();
		},
				
		/**
		 * prevents the next aloha-selection-changed event from
		 * being triggered
		 * @param flag boolean defines weather to update the selection on change or not
		 */
		preventedChange: function( flag ) {
//			this.preventChange = typeof flag === 'undefined' ? false : flag;
		},

		/**
		 * will return wheter selection change event was prevented or not, and reset the
		 * preventSelectionChangedFlag
		 * @return boolean true if aloha-selection-change event
		 *         was prevented
		 */
		isChangedPrevented: function() {
//			return this.preventSelectionChangedFlag;
		},

		/**
		 * INFO: Method is used for integration with Gentics
		 * Aloha, has no use otherwise Updates the rangeObject
		 * according to the current user selection Method is
		 * always called on selection change
		 * 
		 * @param event
		 *            jQuery browser event object
		 * @return true when rangeObject was modified, false
		 *         otherwise
		 * @hide
		 */
		refresh: function(event) {

		},

		/**
		 * String representation
		 * 
		 * @return "Aloha.Selection"
		 * @hide
		 */
		toString: function() {
			return 'Aloha.Selection';
		},
		
		getRangeCount: function() {
			return this._nativeSelection.rangeCount;
		}

	});
	

	/**
	 * A wrapper for the function of the same name in the rangy core-depdency.
	 * This function should be preferred as it hides the global rangy object.
	 * For more information look at the following sites:
	 * http://html5.org/specs/dom-range.html
	 * @param window optional - specifices the window to get the selection of
	 */
	Aloha.getSelection = function( target ) {
		var target = ( target !== document || target !== window ) ? window : target;
        // Aloha.Selection.refresh()
		// implement Aloha Selection 
		// TODO cache
		return new AlohaSelection( window.rangy.getSelection( target ) );
	};
	
	/**
	 * A wrapper for the function of the same name in the rangy core-depdency.
	 * This function should be preferred as it hides the global rangy object.
	 * Please note: when the range object is not needed anymore,
	 *   invoke the detach method on it. It is currently unknown to me why
	 *   this is required, but that's what it says in the rangy specification.
	 * For more information look at the following sites:
	 * http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html
	 * @param document optional - specifies which document to create the range for
	 */
	Aloha.createRange = function(givenWindow) {
		return window.rangy.createRange(givenWindow);
	};
	
	var selection = new Selection();
	Aloha.Selection = selection;

	return selection;
});
