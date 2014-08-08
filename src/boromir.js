/**
 * "One does not simply mutate the DOM" - Boromir
 *
 * Boromir - represent a DOM with immutable javascript data structures
 * (arrays and objects), transform the representation with functional
 * algorithms (no update in place), and efficiently update the DOM from
 * the transformed representation.
 *
 * Uses cases:
 *
 * present a normalized view (no empty text nodes, subsequent text nodes
 *   joined) (wouldn't call normalize() unnecessarily with a DOM
 *   representation),
 * 
 * shadow-dom - ignore shadow-dom/ephemera/non-visible elements for the
 *   purpose of the algorithm - whether or not ephemera/non-visible
 *   elements can be ignored completely depends on the algorithm - for
 *   example when inserting a node, does it matter whether it comes
 *   after or before a non-visible or ephemera node? - what is
 *   considered shadow DOM and what isn't is controllable,
 * 
 * inject ranges in the the content (wouldn't do it with the DOM,
 *   especially if the algorithm is read-only (read algorithms shouldn't
 *   mutate, otherwise composability is affected))
 * 
 * inject things like arrays into the content to allow a more convenient
 *   structure to be seen (wouldn't do it with the DOM, see above)
 * 
 * any mutate algorithms is also a read-only algorithm - apply a
 *   mutating algorithm and interpret the result without mutating the
 *   DOM directly (can clone the DOM and mutate the clone, but the
 *   mapping back to the DOM would be lost, also efficiency)
 * 
 * as-if algorithms - insert content into the tree without mutating the
 *   DOM, and apply algorithms as if the content was there, and
 *   interpret the results
 *
 * schema validation decoupled from algorithms (invalid DOM structure
 *   never inserted into the DOM, and multiple anti-violation strategies
 *   possible like don't mutate anything on violation (rollback), or
 *   automatically clean invalid nesting and try to preserve valid
 *   content).
 * 
 * immutable datastructure - functional programming - no suprising
 *   mutation effects in an algorithm (impossible with the DOM).
 * 
 * no surprises like walking up the ancestors - does your algorithm
 *   require to be attached to an editable, or not? dom nodes implicity
 *   carry around the context with them, which is fragile in practice
 *   (if I pass the dom node, what else do I really pass?).
 * 
 * read once, write once (otherwise, either within an algorithm, or even
 *   if an algorithm itself does read-once write-once, when composing
 *   multiple algoirthms, you'd have read multiple times, write multiple
 *   times)
 * 
 * optimal DOM updating (no split text node and re-insert, then split
 *   again reinsert and join and reinsert etc.)
 */
define([
	'functions',
	'maps',
	'accessor',
	'record',
	'delayed-map',
	'dom',
	'strings',
	'assert'
], function (
	Fn,
	Maps,
	Accessor,
	Record,
	DelayedMap,
	Dom,
	Strings,
	Assert
) {
	'use strict';

	var idCounter = 0;
	var CHANGE_NONE = 0;
	var CHANGE_INSERT = 1;
	var CHANGE_REMOVE = 2;
	var CHANGE_REF = 4;
	var AFFINITY_DOM = 1;
	var AFFINITY_MODEL = 2;
	var AFFINITY_DEFAULT = AFFINITY_DOM | AFFINITY_MODEL;
	var CHANGED_INIT = 1;
	var CHANGED_NAME = 2;
	var CHANGED_TEXT = 4;
	var CHANGED_ATTRS = 8;
	var CHANGED_STYLES = 16;
	var CHANGED_CHILDREN = 32;
	var CHANGED_AFFINITY = 64;
	var ELEMENT = 1;
	var TEXT = 3;

	function allocateId() {
		return ++idCounter;
	}

	function typeFromDomNode(domNode) {
		return domNode.nodeType;
	}

	function childrenFromDomNode(domNode) {
		var childNodes = domNode.childNodes;
		var nodes = [];
		for (var i = 0, len = childNodes.length; i < len; i++) {
			nodes.push(Boromir(childNodes[i]));
		}
		return nodes;
	}

	function nameFromDomNode(domNode) {
		return domNode.nodeName;
	}

	function textFromDomNode(domNode) {
		return domNode.data;
	}

	var delayedAttrsFromDom = {
		realize: Dom.attrs,
		get: DelayedMap.makeGetWithDefault(Dom.getAttr, Fn.isNou)
	};

	var delayedStylesFromDom = {
		realize: Assert.notImplemented,
		get: DelayedMap.makeGetWithDefault(Dom.getStyle, Fn.isNou)
	};

	function setPropsFromDomNodeT(nodeT, domNode) {
		var delayedAttrs  = DelayedMap(delayedAttrsFromDom, domNode);
		var delayedStyles = DelayedMap(delayedStylesFromDom, domNode);
		nodeT = nodeT.setT(nodeT.domNode, domNode);
		nodeT = nodeT.delayT(nodeT.type, typeFromDomNode, domNode);
		nodeT = nodeT.delayT(nodeT.name, nameFromDomNode, domNode);
		nodeT = nodeT.delayT(nodeT.text, textFromDomNode, domNode);
		nodeT = nodeT.delayT(nodeT.children, childrenFromDomNode, domNode);
		nodeT = nodeT.setT(delayedAttrsField, delayedAttrs);
		nodeT = nodeT.setT(delayedStylesField, delayedStyles);
		var node = nodeT.asPersistent();
		nodeT = node.asTransient().delayT(classesField, classesFromNodeAttrs, node);
		return nodeT;
	}

	function setTextPropsT(nodeT, props) {
		Assert.assertNou(props.name);
		Assert.assertNou(props.nodeType);
		var affinity = props.affinity || AFFINITY_DEFAULT;
		nodeT = nodeT.setT(nodeT.domNode, props.domNode);
		nodeT = nodeT.setT(nodeT.type, TEXT);
		nodeT = nodeT.setT(nodeT.text, props.text);
		nodeT = nodeT.setT(nodeT.affinity, affinity);
		return nodeT;
	}

	function setElementPropsT(nodeT, props) {
		Assert.assertNou(props.text);
		Assert.assertNou(props.nodeType);
		var name = props.name;
		var attrs = props.attrs || {};
		var styles = props.styles || {};
		var children = props.children || [];
		var affinity = props.affinity || AFFINITY_DEFAULT;
		Assert.assert(Fn.isNou(attrs['style']), Assert.STYLE_NOT_AS_ATTR);
		nodeT = nodeT.setT(nodeT.domNode, props.domNode);
		nodeT = nodeT.setT(nodeT.type, ELEMENT);
		nodeT = nodeT.setT(nodeT.name, name);
		nodeT = nodeT.setT(nodeT.children, children);
		nodeT = nodeT.setT(nodeT.affinity, affinity);
		nodeT = nodeT.setT(delayedAttrsField, DelayedMap.realized(attrs));
		nodeT = nodeT.setT(delayedStylesField, DelayedMap.realized(styles));
		return nodeT;
	}

	function initWithDomNodeOrPropsT(nodeT, domNodeOrProps) {
		if (!domNodeOrProps) {
			return nodeT;
		}
		if (domNodeOrProps.nodeType) {
			nodeT = setPropsFromDomNodeT(nodeT, domNodeOrProps);
		} else if (!Fn.isNou(domNodeOrProps.text)) {
			nodeT = setTextPropsT(nodeT, domNodeOrProps);
		} else if (!Fn.isNou(domNodeOrProps.name)) {
			nodeT = setElementPropsT(nodeT, domNodeOrProps);
		} else {
			Assert.error(Assert.INVALID_ARGUMENT);
		}
		return nodeT;
	}

	var Boromir = Record.define({
		domNode      : null,
		type         : null,
		name         : null,
		text         : null,
		classes      : {},
		children     : null,
		affinity     : AFFINITY_DEFAULT
	}, function (node, domNodeOrProps) {
		var nodeT = node.asTransient();
		nodeT = initWithDomNodeOrPropsT(nodeT, domNodeOrProps);
		nodeT = nodeT.setT(idField, allocateId());
		// We start listening for changes after all changable fields
		// have been initialized.
		nodeT = nodeT.setT(changedField, CHANGED_INIT);
		node = nodeT.asPersistent();
		node = unchangedField.set(node, node);
		return node;
	});
	var classesField       = Boromir.prototype.classes;
	var unchangedField     = Boromir.addField();
	var idField            = Boromir.addField();
	var delayedAttrsField  = Boromir.addField();
	var delayedStylesField = Boromir.addField();
	var changedAttrsField  = Boromir.addField();
	var changedStylesField = Boromir.addField();
	var changedField       = Boromir.addField();

	function updateMask(node, changedMask, set) {
		var changed = changedField.get(node);
		if ((changed & CHANGED_INIT)
		    && changedMask !== (changed & changedMask)) {
			changed |= changedMask;
			node = set(node, changed);
		}
		return node;
	}

	function hookUpdateChanged(field, changedMask) {
		return Record.hookSetter(field, function (node) {
			return updateMask(node, changedMask, changedField.set);
		} , function (node) {
			return updateMask(node, changedMask, changedField.set.setT);
		});
	}

	function assertElement(node) {
		Assert.assert(ELEMENT === node.type.get(node), Assert.EXPECT_ELEMENT);
	}

	function getChangedOrDelayed(changedMapField, delayedField, node, name) {
		var changedMap = changedMapField.get(node);
		if (changedMap && changedMap.hasOwnProperty(name)) {
			return changedMap[name];
		}
		var delayedMap = delayedField.get(node);
		return delayedMap.get(name);
	}

	function setChanged(changedMapField, changedMask, node, name, value) {
		var changedMap = changedMapField.get(node);
		changedMap = Maps.cloneSet(changedMap || {}, name, value);
		node = node.asTransient();
		node = node.setT(changedMapField, changedMap);
		node = updateMask(node, changedMask, changedField.set.setT);
		return node.asPersistent();
	}

	/**
	 * Gets the value of the attribute with the given name.
	 *
	 * The node has to be of the Element type, and the name mustn't be
	 * "style" (use node.style(name) instead).
	 *
	 * The reason the style attribute isn't accessible is that
	 * individual styles can be updated on the Boromir node without
	 * affecting the DOM node, and the serialization/deserialization of
	 * individual styles from/into an attribute value isn't currently
	 * implemented as part of Boromir.
	 *
	 * Attribtes are read from the element lazily and cached. This also
	 * means that, should attributes be added to the DOM node that
	 * haven't been read through the Boromir node before the update,
	 * they will become available after the DOM update, but attributes
	 * removed from the DOM will still be readable through Boromir,
	 * which may result in an unexpected view of the DOM.
	 */
	function getAttr(node, name) {
		assertElement(node);
		Assert.assert('style' !== name, Assert.STYLE_NOT_AS_ATTR);
		return getChangedOrDelayed(changedAttrsField, delayedAttrsField, node, name);
	}

	function parseClasses(classStr) {
		return Maps.fillKeys({}, Strings.words(classStr), true);
	}

	function setAttr(node, name, value) {
		assertElement(node);
		Assert.assert('style' !== name, Assert.STYLE_NOT_AS_ATTR);
		node = setChanged(changedAttrsField, CHANGED_ATTRS, node, name, value);
		if ('class' === name) {
			node = updateClassesFromAttr(node);
		}
		return node;
	}

	/**
	 * Gets the value of a style with the given name.
	 *
	 * Same caveates regarding DOM update as with getAttr().
	 */
	function getStyle(node, name) {
		assertElement(node);
		return getChangedOrDelayed(changedStylesField, delayedStylesField, node, name);
	}

	function setStyle(node, name, value) {
		assertElement(node);
		return setChanged(changedStylesField, CHANGED_STYLES, node, name, value);
	}

	function getAttrs(node) {
		assertElement(node);
		var delayedMap = delayedAttrsField.get(node);
		var changedMap = changedAttrsField.get(node);
		var attrs = delayedMap.realize();
		attrs = Maps.extend({}, attrs, changedMap);
		attrs = Maps.filter(attrs, Fn.complement(Fn.isNou));
		delete attrs['style']; // safe because Maps.extends copies the map
		return attrs;
	}

	function setAttrs(node, attrs) {
		assertElement(node);
		Assert.assert(Fn.isNou(attrs['style']), Assert.STYLE_NOT_AS_ATTR);
		var delayedMap = delayedAttrsField.get(node);
		var removedMap = Maps.fillKeys({}, delayedMap.keys(), null);
		var changedMap = Maps.extend(removedMap, attrs);
		delete changedMap['style']; // safe because fillKeys copies the map
		node = node.asTransient();
		node = updateMask(node, CHANGED_ATTRS, changedField.set.setT);
		node = node.setT(changedAttrsField, changedMap);
		return node.asPersistent();
	}

	function updateInUnchanged(node, field, value, nodeSet) {
		var unchangedNode = unchangedField.get(node);
		unchangedNode = field.set(unchangedNode, value);
		return nodeSet(node, unchangedNode);
	}

	function getInUnchanged(node, field) {
		var unchangedNode = unchangedField.get(node);
		return field.get(unchangedNode);
	}

	function updateName(node) {
		Assert.notImplemented();
	}

	function updateText(node) {
		var text = node.text.get(node);
		var domNode = node.domNode.get(node);
		domNode.data = text;
		return updateInUnchanged(node, node.text, text, unchangedField.set);
	}

	function updateDomNodeFromMap(domNode, map, updateDom) {
		Maps.forEach(map, function (value, name) {
			updateDom(domNode, name, value);
		});
	}

	function updateChangedAndDelayed(changedField, delayedField, updateDom, node) {
		var changedMap = changedField.get(node);
		if (!changedMap) {
			return node;
		}
		var domNode = node.domNode.get(node);
		updateDomNodeFromMap(domNode, changedMap, updateDom);
		var newAttrs = delayedField.get(node).mergeObject(changedMap, true);
		node = node.asTransient();
		node = node.setT(changedField, null);
		node = node.setT(delayedField, newAttrs);
		return node.asPersistent();
	}

	var updateAttrs = Fn.partial(updateChangedAndDelayed, changedAttrsField,
	                             delayedAttrsField, Dom.setAttr);
	var updateStyles = Fn.partial(updateChangedAndDelayed, changedStylesField,
	                              delayedStylesField, Dom.setStyle);

	function createElementNode(node, doc) {
		var name = node.name.get(node);
		var attrs = node.attrs.get(node);
		var domNode = doc.createElement(name);
		updateDomNodeFromMap(domNode, attrs, Dom.setAttr);
		var delayedAttrMap = delayedAttrsField.get(node);
		Dom.setAttr(domNode, 'style', delayedAttrMap.get('style'));
		var changedStylesMap = changedStylesField.get(node);
		updateDomNodeFromMap(domNode, changedStylesMap, Dom.setStyle);
		return domNode;
	}

	function createTextNode(node, doc) {
		return doc.createTextNode(node.text.get(node));
	}

	function createDomNode(node, doc) {
		var type = node.type.get(node);
		if (ELEMENT === type) {
			return createElementNode(node, doc);
		} else if (TEXT === type) {
			return createTextNode(node, doc);
		} else {
			Assert.notImplemented();
		}
	}

	// TODO use insertIndex to move elements if a node is
	// being removed in the old tree during a recursive
	// update.
	// TODO support normalized update that will join
	// inserted text nodes and re-use existing text nodes if
	// the content is the same instead of replacing them, so
	// that you can split up Boromir text nodes any way you
	// want and it will not result in changes to the DOM.
	function insertChild(domNode, childNodes, child, i, doc, insertIndex) {
		var refNode = i < childNodes.length ? childNodes[i] : null;
		var childDomNode = createDomNode(child, doc);
		domNode.insertBefore(childDomNode, refNode);
		child = child.asTransient();
		child = child.setT(child.domNode, childDomNode);
		child = child.setT(idField, allocateId());
		child = updateInUnchanged(child, child.children, [], unchangedField.set.setT);
		child = child.setT(changedField, changedField.get(child) | CHANGED_CHILDREN);
		child = child.asPersistent();
		child = updateDomRec(child, doc, insertIndex);
		return child;
	}

	function removeChild(domNode, childNodes, i) {
		domNode.removeChild(childNodes[i]);
	}

	/**
	 * Creates a map that maps the ids of the given children to the
	 * given value.
	 * @private
	 */
	function indexChildren(children, index, value) {
		children.forEach(function (child) {
			index[idField.get(child)] = value;
		});
		return index;
	}

	/**
	 * Determines, given an old and a new children array, which ones
	 * were inserted or removed, based on the id of the node.
	 *
	 * Fast for common cases, but may have a suboptimal result (too many
	 * removes/inserts) when siblings are moved around rather than just
	 * inserted and removed.
	 *
	 * @param oldChildren {!Array.<!Boromir>}
	 * @param newChildren {!Array.<!Boromir>}
	 * @return {!Array.<int>}
	 */
	function childrenChangedInParent(oldChildren, newChildren) {
		if (newChildren === oldChildren) {
			return null;
		}
		var oldChild;
		var newChild;
		var newIndex = null;
		var i = 0;
		var j = 0;
		var oldLen = oldChildren.length;
		var newLen = newChildren.length;
		var changedInParent = [];
		var changed = false;
		while (i < oldLen && j < newLen) {
			oldChild = oldChildren[i];
			newChild = newChildren[j];
			var oldId = idField.get(oldChild);
			var newId = idField.get(newChild);
			var change;
			if (oldId === newId) {
				if (oldChild === newChild) {
					change = CHANGE_NONE;
				} else {
					changed = true;
					change = CHANGE_REF;
				}
				i += 1;
				j += 1;
			} else {
				newIndex = newIndex || indexChildren(newChildren, {}, true);
				if (!newIndex[oldId]) {
					changed = true;
					change = CHANGE_REMOVE;
					i += 1;
				} else {
					changed = true;
					change = CHANGE_INSERT;
					j += 1;
				}
			}
			changedInParent.push(change);
		}
		for (; i < oldLen; i++) {
			oldChild = oldChildren[i];
			changed = true;
			changedInParent.push(CHANGE_REMOVE);
		}
		for (; j < newLen; j++) {
			newChild = newChildren[j];
			changed = true;
			changedInParent.push(CHANGE_INSERT);
		}
		if (!changed) {
			return null;
		}
		return changedInParent;
	}

	/**
	 * Updates the children of the DOM node wrapped by the given boromir
	 * node.
	 * @private
	 */
	function updateChildren(node, doc, insertIndex) {
		var newChildren = node.children.get(node);
		var oldChildren = getInUnchanged(node, node.children);
		var changedInParent = childrenChangedInParent(oldChildren, newChildren);
		if (!changedInParent) {
			return node;
		}
		var domNode = node.domNode.get(node);
		var childNodes = domNode.childNodes;
		var children = [];
		var oldI = 0, newI = 0, domI = 0;
		changedInParent.forEach(function (change) {
			var child;
			if (change & CHANGE_INSERT) {
				child = newChildren[newI];
				newI += 1;
			} else if (change & CHANGE_REMOVE) {
				child = oldChildren[oldI];
				oldI += 1;
			} else {
				child = newChildren[newI];
				newI += 1;
				oldI += 1;
			}
			var affinity = child.affinity.get(child);
			var unchangedAffinity = getInUnchanged(node, node.affinity);
			if ((affinity & AFFINITY_DOM) !== (unchangedAffinity & AFFINITY_DOM)) {
				if ((affinity & AFFINITY_DOM) && !(change & CHANGE_REMOVE)) {
					child = insertChild(domNode, childNodes, child, domI, doc, insertIndex);
					domI += 1;
				} else if (!(change & CHANGE_INSERT)) {
					removeChild(domNode, childNodes, domI);
				}
			} else if (affinity & AFFINITY_DOM) {
				if (change & CHANGE_INSERT) {
					child = insertChild(domNode, childNodes, child, domI, doc, insertIndex);
					domI += 1;
				} else if (change & CHANGE_REMOVE) {
					removeChild(domNode, childNodes, domI);
				} else {
					if (change & CHANGE_REF) {
						child = updateDomRec(child, doc, insertIndex);
					}
					domI += 1;
				}
			}
			if (!(change & CHANGE_REMOVE)) {
				children.push(child);
			}
		});
		node = node.set(node.children, children);
		node = updateInUnchanged(node, node.children, children, unchangedField.set);
		return node;
	}

	/**
	 * Recursively updates the DOM wrapped by the given boromir tree.
	 * @private
	 */
	function updateDomRec(node, doc, insertIndex) {
		var type = node.type.get(node);
		var changed = changedField.get(node);
		if (ELEMENT === type) {
			if (changed & CHANGED_NAME) {
				node = updateName(node);
			}
			if (changed & CHANGED_ATTRS) {
				node = updateAttrs(node);
			}
			if (changed & CHANGED_STYLES) {
				node = updateStyles(node);
			}
			if (changed & CHANGED_CHILDREN) {
				node = updateChildren(node, doc, insertIndex);
			}
		} else if (TEXT === type) {
			if (changed & CHANGED_TEXT) {
				node = updateText(node);
			}
		} else {
			// Nothing to do for other nodes
		}
		return node;
	}

	/**
	 * Given a boromir node that wraps a DOM tree, updates the wrapped
	 * DOM tree to reflect the given boromir tree, and returns a new
	 * boromir tree that reflects the update.
	 *
	 * Subtrees that don't have modifications, will not be visited.
	 *
	 * The DOM must not have been modified since it was wrapped with
	 * boromir nodes, otherwise the behviour is undefined and may cause
	 * errors to be thrown. The assumption that the tree wasn't modified
	 * is necessary so that the DOM can be updated in the most efficient
	 * manner possible, without peforming any redundant read operations
	 * on the DOM.
	 *
	 * For the reason above, after the DOM has been updated, the boromir
	 * tree given to updateDom() can't be used any more to update the
	 * DOM. Instead, a new boromir tree is returned that reflects the
	 * updated DOM and which can be used in a subsequent updateDom()
	 * operation.
	 *
	 * @param node {!Boromir}
	 * @param opts {Map.<string,*>} no options currently
	 * @return {!Boromir}
	 */
	function updateDom(node, opts) {
		var domNode = node.domNode.get(node);
		var doc = domNode.ownerDocument;
		Assert.assert(doc, Assert.ELEMENT_NOT_ATTACHED);
		return updateDomRec(node, doc, {});
	}

	/**
	 * Creates a new dom tree that represents the given boromir tree.
	 *
	 * Doesn't change any existing DOM nodes.
	 *
	 * @param node {!Boromir}
	 * @param doc {!Document} the document to creat the new DOM tree with
	 * @return {!Node} a dom node representing the given boromir tree
	 */
	function asDom(node, doc) {
		var domNode;
		if (ELEMENT === node.type()) {
			domNode = createElementNode(node, doc);
			node.children().forEach(function (child) {
				domNode.appendChild(asDom(child, doc));
			});
		} else if (TEXT === node.type()) {
			domNode = createTextNode(node, doc);
		} else {
			Assert.notImplemented();
		}
		return domNode;
	}

	function classesFromNodeAttrs(node) {
		var cls = getAttr(node, 'class');
		return Fn.isNou(cls) ? {} : parseClasses(cls);
	}

	function updateClassesFromAttr(node) {
		return node.set(classesField, classesFromNodeAttrs(node));
	}

	function updateAttrFromClasses(node) {
		var classStr = Maps.keys(node.get(node.classes)).join(' ');
		return setChanged(changedAttrsField, CHANGED_ATTRS, node, 'class', classStr);
	}

	function hasClass(node, cls) {
		return node.get(node.classes)[cls];
	}

	function addClass(node, cls) {
		var classMap = node.get(node.classes);
		if (classMap[cls]) {
			return node;
		}
		classMap = Maps.cloneSet(classMap, cls, true);
		node = node.set(node.classes, classMap);
		return node;
	}

	function removeClass(node, cls) {
		var classMap = node.get(node.classes);
		if (!classMap[cls]) {
			return node;
		}
		classMap = Maps.cloneDelete(classMap, cls);
		node = node.set(node.classes, classMap);
		return node;
	}

	var hookedName     = hookUpdateChanged(Boromir.prototype.name, CHANGED_NAME);
	var hookedText     = hookUpdateChanged(Boromir.prototype.text, CHANGED_TEXT);
	var hookedChildren = hookUpdateChanged(Boromir.prototype.children, CHANGED_CHILDREN);
	var hookedAffinity = hookUpdateChanged(Boromir.prototype.affinity, CHANGED_AFFINITY);

	Maps.extend(Boromir.prototype, {
		name         : Accessor.asMethod(hookedName),
		text         : Accessor.asMethod(hookedText),
		children     : Accessor.asMethod(hookedChildren),
		affinity     : Accessor.asMethod(hookedAffinity),
		attrs        : Accessor.asMethod(Accessor(getAttrs, setAttrs)),
		attr         : Accessor.asMethod(Accessor(getAttr, setAttr)),
		style        : Accessor.asMethod(Accessor(getStyle, setStyle)),
		updateDom    : Fn.asMethod(updateDom),
		asDom        : Fn.asMethod(asDom),
		create       : Boromir,
		hasClass     : Fn.asMethod(hasClass),
		addClass     : Fn.asMethod(addClass),
		removeClass  : Fn.asMethod(removeClass)
	});

	Boromir.prototype.attrs = Accessor.asMethod(
		Record.hookSetterRecompute(Boromir.prototype.attrs,
		                           classesField,
		                           classesFromNodeAttrs,
		                           classesFromNodeAttrs)
	);
	Boromir.prototype.classes = Accessor.asMethod(
		Record.hookSetter(classesField,
		                  updateAttrFromClasses,
		                  updateAttrFromClasses)
	);

	Boromir.CHANGE_INSERT    = CHANGE_INSERT;
	Boromir.CHANGE_REMOVE    = CHANGE_REMOVE;
	Boromir.CHANGE_REF       = CHANGE_REF;
	Boromir.CHANGE_NONE      = CHANGE_NONE;
	Boromir.AFFINITY_DOM     = AFFINITY_DOM;
	Boromir.AFFINITY_MODEL   = AFFINITY_MODEL;
	Boromir.AFFINITY_DEFAULT = AFFINITY_DEFAULT;
	Boromir.childrenChangedInParent = childrenChangedInParent;
	Boromir.ELEMENT          = ELEMENT;
	Boromir.TEXT             = TEXT;

	return Boromir;
});
