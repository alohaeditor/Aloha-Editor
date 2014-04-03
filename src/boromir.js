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
	'dom',
	'assert'
], function (
	Fn,
	Maps,
	Accessor,
	Record,
	Dom,
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
	var SPECIAL_PRIVATE_VALUE = {};

	function setName(node, value, set) {
		assertElement(node);
		return set(node, value);
	}

	function setChildren(node, value, set) {
		assertElement(node);
		return set(node, value);
	}

	function setText(node, value, set) {
		assertTextNode(node);
		return set(node, value);
	}

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
			nodes.push(Node(childNodes[i]));
		}
		return nodes;
	}

	function nameFromDomNode(domNode) {
		return domNode.nodeName;
	}

	function textFromDomNode(domNode) {
		return domNode.data;
	}

	function setPropsFromDomNode(node, domNode) {
		node = node.asTransient();
		node = node.id.setT(node, allocateId());
		node = node.type.computeT(node, typeFromDomNode, domNode);
		node = node.name.computeT(node, nameFromDomNode, domNode);
		node = node.text.computeT(node, textFromDomNode, domNode);
		node = node.attrs.computeT(node, Dom.attrs, domNode);
		node = node.children.computeT(node, childrenFromDomNode, domNode);
		return node.asPersistent();
	}

	function setTextProps(node, props) {
		Assert.assertNou(props.name);
		Assert.assertNou(props.nodeType);
		var affinity = props.affinity || AFFINITY_DEFAULT;
		node = node.asTransient();
		node = node.id.setT(node, allocateId());
		node = node.type.setT(node, 3);
		node = node.text.setT(node, props.text);
		node = node.affinity.setT(node, affinity);
		return node.asPersistent();
	}

	function setElementProps(node, props) {
		Assert.assertNou(props.text);
		Assert.assertNou(props.nodeType);
		var name = props.name;
		var attrs = props.attrs || {};
		var children = props.children || [];
		var affinity = props.affinity || AFFINITY_DEFAULT;
		node = node.asTransient();
		node = node.id.setT(node, allocateId());
		node = node.type.setT(node, 1);
		node = node.name.setT(node, name);
		node = node.attrs.setT(node, attrs);
		node = node.children.setT(node, children);
		node = node.affinity.setT(node, affinity);
		return node.asPersistent();
	}

	// TODO: NodeProps should actually just be a Node with changed and
	// unchanged properties being null.
	var NodeProps = Record.define({
		id              : {},
		type            : {computable: true},
		name            : {computable: true},
		text            : {computable: true},
		// Includes style attribute.
		attrs           : {computable: true},
		children        : {computable: true},
		affinity        : {defaultValue: AFFINITY_DEFAULT},
		attrAffinityMap : {},
		classAffinityMap: {}
	});

	var ChangeProps = Record.define({
		changedAttrs        : {},
		changedStyles       : {},
		changedAttrAffinity : {},
		changedClassAffinity: {},
		cachedAttrs         : {computable: true},
		cachedStyles        : {computable: true}
	}, function (props) {
		props = props.asTransient();
		props = props.cachedAttrs.computeT(props, Object);
		props = props.cachedStyles.computeT(props, Object);
		return props.asPersistent();
	});

	var Node = Record.define({
		domNode      : {},
		type         : {computable: true},
		name         : {computable: true, set: setName},
		text         : {computable: true, set: setText},
		// Excludes style attribute.
		attrs        : {computable: true, set: setAttrsAffectChanges},
		children     : {computable: true, set: setChildren},
		affinity     : {defaultValue: AFFINITY_DEFAULT},
		// Nested records that are used to track changes to this record.
		changed      : {},
		unchanged    : {}
	}, function (node, domNodeOrProps) {
		if (domNodeOrProps) {
			node = node.asTransient();
			var unchanged = NodeProps();
			if (domNodeOrProps.nodeType) {
				node = node.domNode.setT(node, domNodeOrProps);
				unchanged = setPropsFromDomNode(unchanged, domNodeOrProps);
			} else if (!Fn.isNou(domNodeOrProps.text)) {
				node = node.domNode.setT(node, domNodeOrProps.domNode);
				unchanged = setTextProps(unchanged, domNodeOrProps)
			} else if (!Fn.isNou(domNodeOrProps.name)) {
				node = node.domNode.setT(node, domNodeOrProps.domNode);
				unchanged = setElementProps(unchanged, domNodeOrProps);
			}
			node = node.type.computeT(node, NodeProps.prototype.type.get, unchanged);
			node = node.name.computeT(node, NodeProps.prototype.name.get, unchanged);
			node = node.text.computeT(node, NodeProps.prototype.text.get, unchanged);
			node = node.children.computeT(node, NodeProps.prototype.children.get, unchanged);
			node = node.unchanged.setT(node, unchanged);
			node = node.changed.setT(node, ChangeProps());
			node = node.asPersistent();
			node = node.attrs.compute(node, attrsWithChangesWithoutStyle, node);
		}
		return node;
	});

	function assertElement(node) {
		Assert.assert(1 === node.type.get(node), Assert.EXPECT_ELEMENT);
	}

	function assertTextNode(node) {
		Assert.assert(3 === node.type.get(node), Assert.EXPECT_TEXT_NODE);
	}

	function getChanged(node, name, changedField, default_) {
		var changedProps = node.changed.get(node);
		var changedMap = changedField.get(changedProps);
		if (changedMap && changedMap.hasOwnProperty(name)) {
			return changedMap[name];
		}
		return default_;
	}

	function getChangedOrUnchanged(node, name, changedField, unchangedField, default_) {
		var value = getChanged(node, name, changedField, SPECIAL_PRIVATE_VALUE);
		if (value !== SPECIAL_PRIVATE_VALUE) {
			return value;
		}
		var unchangedProps = node.unchanged.get(node);
		var unchangedMap = unchangedField.get(unchangedProps);
		if (unchangedMap && unchangedMap.hasOwnProperty(name)) {
			return unchangedMap[name];
		}
		return default_;
	}

	function getChangedOrCached(node, name, getFromDom, changedField, cachedField) {
		var value = getChanged(node, name, changedField, SPECIAL_PRIVATE_VALUE);
		if (value !== SPECIAL_PRIVATE_VALUE) {
			return value;
		}
		var changedProps = node.changed.get(node);
		var cachedMap = cachedField.get(changedProps);
		if (cachedMap.hasOwnProperty(name)) {
			return cachedMap[name];
		}
		var domNode = node.domNode.get(node);
		// This is the only place where we might read from the domNode
		// even if we have already for example read all attributes or
		// set all the attributes, because there is no way to tell
		// whether there aren't more attributes on the element that we
		// have not read. Contrast this to children which we always read
		// in one go and therefore know that we've read all of them.
		if (!domNode) {
			return null;
		}
		value = cachedMap[name] = getFromDom(domNode, name);
		return value;
	}

	function setChanged(node, name, value, changedField) {
		var changedProps = node.changed.get(node);
		var changedMap = changedField.get(changedProps) || {};
		var updatedMap = Maps.cloneSet(changedMap, name, value);
		changedProps = changedField.set(changedProps, updatedMap);
		return node.changed.set(node, changedProps);
	}

	function setAttrsAffectChanges(node, attrs, set) {
		assertElement(node);
		Assert.assert(Fn.isNou(attrs['style']), Assert.STYLE_NOT_AS_ATTR);
		var changedProps = node.changed.get(node);
		var changedAttrs = changedProps.changedAttrs.get(changedProps) || {};
		var unchangedProps = node.unchanged.get(node);
		var unchangedAttrs = unchangedProps.attrs.get(unchangedProps);
		var removedAttrs = Maps.fillKeys({}, Maps.keys(unchangedAttrs), null);
		var changedAttrs = Maps.extend(removedAttrs, attrs);
		changedProps = changedProps.changedAttrs.set(changedProps, changedAttrs);
		node = node.changed.set(node, changedProps);
		return set(node, attrs);
	}

	function attrsWithChangesWithoutStyle(node) {
		assertElement(node);
		var unchangedProps = node.unchanged.get(node);
		var unchangedAttrs = unchangedProps.attrs.get(unchangedProps);
		var changedProps = node.changed.get(node);
		var attrs = unchangedAttrs;
		if (attrs.hasOwnProperty('style')) {
			attrs = Maps.cloneDelete(attrs, 'style');
		}
		var changedAttrs = changedProps.changedAttrs.get(changedProps);
		if (changedAttrs) {
			attrs = Maps.merge(unchangedAttrs, changedAttrs);
			attrs = Maps.filter(attrs, Fn.complement(Fn.isNou));
		}
		return attrs;
	}

	function setAttrAffectChanges(node, name, value) {
		assertElement(node);
		Assert.assert('style' !== name, Assert.STYLE_NOT_AS_ATTR);
		node = setChanged(node, name, value, ChangeProps.prototype.changedAttrs);
		node = node.attrs.compute(node, attrsWithChangesWithoutStyle, node);
		return node;
	}

	function setStyleAffectChanges(node, name, value) {
		assertElement(node);
		return setChanged(node, name, value, ChangeProps.prototype.changedStyles);
	}

	function setAttrAffinityAffectChanges(node, name, affinity) {
		assertElement(node);
		return setChanged(node, name, affinity, ChangeProps.prototype.changedAttrAffinity);
	}

	function setClassAffinityAffectChanges(node, name, affinity) {
		assertElement(node);
		return setChanged(node, name, affinity, ChangeProps.prototype.changedClassAffinity);
	}

	/**
	 * Gets the value of the attribute with the given name.
	 *
	 * The node has to be of the Element type (node.type() === 1), and
	 * the name mustn't be "style" (use node.style(name) instead).
	 *
	 * The reason the style attribute isn't accessible is that styles
	 * can be updated on the Boromir node without affecting the DOM
	 * node, and the serialization/deserialization of styls isn't
	 * currently implemented as part of Boromir.
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
		return getChangedOrCached(node, name, Dom.getAttr,
		                          ChangeProps.prototype.changedAttrs,
		                          ChangeProps.prototype.cachedAttrs);
	}

	/**
	 * Gets the value of a style with the given name.
	 *
	 * Same caveates regarding DOM update as with getAttr().
	 */
	function getStyle(node, name) {
		assertElement(node);
		return getChangedOrCached(node, name, Dom.getStyle,
		                          ChangeProps.prototype.changedStyles,
		                          ChangeProps.prototype.cachedStyles);
	}

	function getAttrAffinity(node, name) {
		assertElement(node);
		return getChangedOrUnchanged(node, name,
		                             ChangeProps.prototype.changedAttrAffinity,
		                             NodeProps.prototype.attrAffinityMap,
		                             AFFINITY_DEFAULT);
	}

	function getClassAffinity(node, name) {
		assertElement(node);
		return getChangedOrUnchanged(node, name,
		                             ChangeProps.prototype.changedClassAffinity,
		                             NodeProps.prototype.classAffinityMap,
		                             AFFINITY_DEFAULT);
	}

	function updateDomNodeFromMap(domNode, map, updateFn) {
		Maps.forEach(map, function (value, name) {
			updateFn(domNode, name, value);
		});
	}

	// TODO here and in updateText we should track changes to the
	// name/text properties rather than checking whether they are
	// memoized, since we can't depend on being the only ones to compute
	// properties.
	function updateName(node) {
		if (node.name.isMemoized(node)) {
			var name = node.name.get(node);
			var unchangedProps = node.unchanged.get(node);
			if (!unchangedProps.name.isMemoized(unchangedProps)
			    || name !== unchangedProps.name.get(unchangedProps)) {
				Assert.notImplemented();
			}
		}
		return node;
	}

	function updateText(node) {
		if (node.text.isMemoized(node)) {
			var text = node.text.get(node);
			var unchangedProps = node.unchanged.get(node);
			if (!unchangedProps.text.isMemoized(unchangedProps)
			    || text !== unchangedProps.text.get(unchangedProps)) {
				var domNode = node.domNode.get(node);
				domNode.data = text;
				unchangedProps = unchangedProps.text.set(unchangedProps, text);
				node = node.unchanged.set(node, unchangedProps);
			}
		}
		return node;
	}

	function updateFromMapField(updateDom, node, changedField, cachedField) {
		var changedProps = node.changed.get(node);
		var changedMap = changedField.get(changedProps);
		if (!changedMap) {
			return node;
		}
		var domNode = node.domNode.get(node);
		updateDomNodeFromMap(domNode, changedMap, updateDom);
		changedProps = changedField.set(changedProps, null);
		if (cachedField.isMemoized(changedProps)) {
			var cachedMap = cachedField.get(changedProps);
			cachedMap = Maps.extend({}, cachedMap, changedMap);
			changedProps = cachedField.set(changedProps, cachedMap);
		}
		return node.changed.set(node, changedProps);
	}

	function updateAttrs(node) {
		var unchangedProps = node.unchanged.get(node);
		var changedProps = node.changed.get(node);
		if (unchangedProps.attrs.isMemoized(unchangedProps)
		    && changedProps.changedAttrs.get(changedProps)) {
			unchangedProps = unchangedProps.attrs.set(unchangedProps, node.attrs.get(node));
			node = node.unchanged.set(node, unchangedProps);
		}
		var attrAffinityMap = unchangedProps.attrAffinityMap.get(unchangedProps);
		var classAffinityMap = unchangedProps.classAffinityMap.get(unchangedProps);
		var changedAttrAffinity = changedProps.changedAttrAffinity.get(changedProps);
		var changedClassAffinity = changedProps.changedClassAffinity.get(changedProps);
		if (changedAttrAffinity) {
			// TODO
		}
		if (changedClassAffinity) {
			// TODO
		}
		return updateFromMapField(Dom.setAttr, node, 
		                          ChangeProps.prototype.changedAttrs,
		                          ChangeProps.prototype.cachedAttrs);
	}

	function updateStyles(node) {
		return updateFromMapField(Dom.setStyle, node,
		                          ChangeProps.prototype.changedStyles,
		                          ChangeProps.prototype.cachedStyles);
	}

	function createElementNode(doc, node) {
		var name = node.name.get(node);
		var attrs = node.attrs.get(node);
		var domNode = doc.createElement(name);
		updateDomNodeFromMap(domNode, attrs, Dom.setAttr);
		var unchangedProps = node.unchanged.get(node);
		var unchangedStyle = unchangedProps.attrs.get(unchangedProps)['style'];
		Dom.setAttr(domNode, 'style', unchangedStyle);
		var changedProps = node.changed.get(node);
		var changedStyles = changedProps.changedStyles.get(changedProps);
		updateDomNodeFromMap(domNode, changedStyles, Dom.setStyle);
		return domNode;
	}

	function createTextNode(doc, node) {
		var text = node.text.get(node);
		return doc.createTextNode(text);
	}

	function createDomNode(doc, node) {
		var type = node.type.get(node);
		if (1 === type) {
			return createElementNode(doc, node);
		} else if (3 === type) {
			return createTextNode(doc, node);
		} else {
			Assert.notImplemented()
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
		var childDomNode = createDomNode(doc, child);
		domNode.insertBefore(childDomNode, refNode);
		child = child.domNode.set(child, childDomNode);
		var unchanged = child.unchanged.get(child);
		unchanged = unchanged.children.set(unchanged, []);
		child = child.unchanged.set(child, unchanged);
		child = updateDomRec(child, doc, insertIndex);
		return child;
	}

	function removeChild(domNode, childNodes, i) {
		domNode.removeChild(childNodes[i]);
	}

	function indexChildren(children, index, value) {
		children.forEach(function (child) {
			var unchanged = child.unchanged.get(child);
			index[unchanged.id.get(unchanged)] = value;
		});
		return index;
	}

	/**
	 * Fast for common cases, but may have a suboptimal result (too many
	 * removes/inserts) when siblings are moved around rather than just
	 * inserted and removed.
	 */
	function childrenChangedInParent(oldChildren, newChildren) {
		if (newChildren === oldChildren) {
			return null;
		}
		var newIndex = null;
		var i = 0;
		var j = 0;
		var oldLen = oldChildren.length;
		var newLen = newChildren.length;
		var changedInParent = [];
		var changed = false;
		while (i < oldLen && j < newLen) {
			var oldChild = oldChildren[i];
			var newChild = newChildren[j];
			var oldUnchanged = oldChild.unchanged.get(oldChild);
			var newUnchanged = newChild.unchanged.get(newChild);
			var oldId = oldUnchanged.id.get(oldUnchanged);
			var newId = newUnchanged.id.get(newUnchanged);
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
			var oldChild = oldChildren[i];
			changed = true;
			changedInParent.push(CHANGE_REMOVE);
		}
		for (; j < newLen; j++) {
			var newChild = newChildren[j];
			changed = true;
			changedInParent.push(CHANGE_INSERT);
		}
		if (!changed) {
			return null;
		}
		return changedInParent;
	}

	function updateChildren(node, doc, insertIndex) {
		if (!node.children.isMemoized(node)) {
			return node;
		}
		var newChildren = node.children.get(node)
		var unchangedProps = node.unchanged.get(node);
		var oldChildren = unchangedProps.children.get(unchangedProps)
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
			var unchangedProps = child.unchanged.get(child);
			var unchangedAffinity = unchangedProps.affinity.get(unchangedProps);
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
					removeChild(domNode, childNodes, domI)
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
		node = node.asTransient();
		node = node.children.setT(node, children);
		var unchangedProps = node.unchanged.get(node);
		unchangedProps = unchangedProps.children.set(unchangedProps, children);
		node = node.unchanged.setT(node, unchangedProps);
		return node.asPersistent();
	}

	function updateDomRec(node, doc, insertIndex) {
		var type = node.type.get(node);
		if (1 === type) {
			node = updateName(node);
			node = updateAttrs(node);
			node = updateStyles(node);
			node = updateChildren(node, doc, insertIndex);
		} else if (3 === type) {
			node = updateText(node);
		} else {
			// Nothing to do for other nodes
		}
		return node;
	}

	function updateDom(node, opts) {
		var domNode = node.domNode.get(node);
		var doc = domNode.ownerDocument;
		Assert.assert(doc, Assert.ELEMENT_NOT_ATTACHED);
		return updateDomRec(node, doc, {});
	}

	Maps.extend(Node.prototype, {
		attr         : Accessor.asMethod(Accessor(getAttr         , setAttrAffectChanges)),
		style        : Accessor.asMethod(Accessor(getStyle        , setStyleAffectChanges)),
		attrAffinity : Accessor.asMethod(Accessor(getAttrAffinity , setAttrAffinityAffectChanges)),
		classAffinity: Accessor.asMethod(Accessor(getClassAffinity, setClassAffinityAffectChanges)),
		create       : Node,
		updateDom    : Fn.asMethod(updateDom)
	});

	Node.CHANGE_INSERT  = CHANGE_INSERT;
	Node.CHANGE_REMOVE  = CHANGE_REMOVE;
	Node.CHANGE_REF     = CHANGE_REF;
	Node.CHANGE_NONE    = CHANGE_NONE;
	Node.AFFINITY_DOM   = AFFINITY_DOM;
	Node.AFFINITY_MODEL = AFFINITY_MODEL;
	Node.AFFINITY_DEFAULT = AFFINITY_DEFAULT;
	Node.childrenChangedInParent = childrenChangedInParent;

	return Node;
});
