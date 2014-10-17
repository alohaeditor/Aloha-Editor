/**
 * overrides.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Refernces:
 * http://www.w3.org/TR/CSS2/propidx.html
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#value
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#state
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#value-override
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#state-override
 *
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#specified-command-value
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#inline-command-activated-values
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#equivalent-values
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#effective-command-value
 *
 * http://www.w3.org/TR/CSS2/propidx.html
 * @namespace overrides
 */
define([
	'dom',
	'misc',
	'maps',
	'html',
	'arrays',
	'mutation',
	'boundaries'
], function (
	Dom,
	Misc,
	Maps,
	Html,
	Arrays,
	Mutation,
	Boundaries
) {
	'use strict';

	/**
	 * A table of node names that correlate to override commands.
	 *
	 * @type {Object.<string, string>}
	 * @see  stateToNode
	 * @memberOf overrides
	 */
	var nodeToState = {
		'A'      : 'link',
		'U'      : 'underline',
		'B'      : 'bold',
		'STRONG' : 'bold',
		'I'      : 'italic',
		'EM'     : 'italic',
		'STRIKE' : 'strikethrough',
		'SUB'    : 'subscript',
		'SUP'    : 'superscript'
	};

	/**
	 * A table of overrides an node names that correlate to them.
	 *
	 * @type {Object.<string, string>}
	 * @see  nodeToState
	 * @memberOf overrides
	 */
	var stateToNode = {
		'link'          : 'A',
		'underline'     : 'U',
		'bold'          : 'B',
		'italic'        : 'I',
		'strikethrough' : 'STRIKE',
		'subscript'     : 'SUB',
		'superscript'   : 'SUP'
	};

	/**
	 * Any element whose node name corresponds with the given command states
	 * ("bold", "italic", "underline", "strikethrough"), must also have the
	 * associated style property match the expected value, otherwise that
	 * element's state is considered nullified by the CSS styles that has been
	 * applied to it.
	 *
	 * @private
	 * @type {Object.<string, Array.<string|null>>}
	 */
	var stateToStyle = {
		'bold'          : ['fontWeight', 'bold', null],
		'italic'        : ['fontStyle', 'italic', null],
		'underline'     : ['textDecoration', 'underline', 'none'],
		'strikethrough' : ['textDecoration', 'line-through', 'none']
	};

	/**
	 * Translation of override values to styles.
	 *
	 * @private
	 * @type {Object.<string, string>}
	var valueToStyle = {
		'hilitecolor' : 'background-color',
		'backcolor'   : 'background-color',
		'fontname'    : 'font-family',
		'fontsize'    : 'font-size',
		'fontcolor'   : 'color'
	};
	 */

	/**
	 * List of styles that can be affected through overrides.
	 *
	 * @private
	 * @type {Object.<string, string>}
	 */
	var styles = [
		'textTransform',

		'backgroundColor',

		'color',
		'fontSize',
		'fontFamily',

		'border',
		'borderColor',
		'borderStyle',
		'borderWidth',

		'borderTop',
		'borderTopColor',
		'borderTopStyle',
		'borderTopWidth',

		'borderBottom',
		'borderBottomColor',
		'borderBottomStyle',
		'borderBottomWidth',

		'borderLeft',
		'borderLeftColor',
		'borderLeftStyle',
		'borderLeftWidth',

		'borderRight',
		'borderRightColor',
		'borderRightStyle',
		'borderRightWidth'
	];

	/**
	 * Creates a list of overrides from the given element node.
	 *
	 * @private
	 * @param  {Element} elem
	 * @return {Array.<Override>}
	 */
	function fromStyles(elem) {
		var overrides = [];
		Maps.forEach(stateToStyle, function (style, state) {
			var value = Dom.getStyle(elem, style[0]);
			if (value) {
				if (style[2]) {
					if (value === style[2]) {
						overrides.push([state, false]);
					} else if (value === style[1]) {
						overrides.push([state, true]);
					}
				} else {
					overrides.push([state, value === style[1]]);
				}
			}
		});
		return overrides;
	}

	/**
	 * Creates a list of overrides from the given node.
	 *
	 * @private
	 * @param  {Node} node
	 * @return {Array.<Override>}
	 */
	function fromNode(node) {
		if (Dom.isTextNode(node)) {
			return [];
		}
		var state = nodeToState[node.nodeName];
		return (state ? [[state, true]] : []).concat(fromStyles(node));
	}

	/**
	 * Creates a list of overrides
	 *
	 * @private
	 * @param  {Node} node
	 * @return {Array.<Override>}
	 */
	function valuesFromNode(node) {
		if (Dom.isTextNode(node)) {
			return [];
		}
		return styles.reduce(function (values, style) {
			var value = Dom.getStyle(node, style);
			return value ? values.concat([[style, value]]) : values;
		}, []);
	}

	/**
	 * Creates a list of overrides from the given node and all ancestors until
	 * the given predicate or the editing host.
	 *
	 * @param  {Node}                   node
	 * @param  {function(Node):boolean} until
	 * @return {Array.<Override>}
	 * @memberOf overrides
	 */
	function harvest(node, until) {
		var nodes = Dom.childAndParentsUntil(node, until || Dom.isEditingHost);
		var stack = [];
		var map = {};
		var i = nodes.length;
		var j;
		var len;
		var states;
		var state;
		var index;
		while (i--) {
			states = fromNode(nodes[i]);
			for (j = 0, len = states.length; j < len; j++) {
				state = states[j];
				index = map[state[0]];
				if (Misc.defined(index)) {
					stack.splice(index - 1, 1, null);
				}
				map[state[0]] = stack.push(state);
			}
			stack = stack.concat(valuesFromNode(nodes[i]));
		}
		return stack.reduce(function (overrides, override) {
			return override ? overrides.concat([override]) : overrides;
		}, []);
	}

	/**
	 * Remove any node/formatting that corresponds to `state` at the given
	 * boundary.
	 *
	 * @private
	 * @param  {string}   state
	 * @param  {Boundary} boundary
	 * @return {Boundary}
	 */
	function purgeFormat(state, boundary) {
		var container = Boundaries.container(boundary);
		var nodes = Dom.childAndParentsUntil(container, Dom.isEditingHost);
		var nodeName = stateToNode[state];
		var style = stateToStyle[state];
		var styleName = style[0];
		var styleValue = style[1];
		var count = nodes.length;
		var limit;
		var node;
		while (count--) {
			node = nodes[count];
			if (Dom.isElementNode(node)
					&& (nodeName === node.nodeName
						|| Dom.getStyle(node, styleName) === styleValue)) {
				limit = node.parentNode;
				break;
			}
		}
		if (!limit) {
			return boundary;
		}
		var overrides = harvest(container, function (node) {
			return node == limit;
		}).reduce(function (list, override) {
			return state === override[0] ? list : list.concat([override]);
		}, []);
		boundary = Mutation.splitBoundaryUntil(boundary, function (boundary) {
			return Boundaries.container(boundary) === limit;
		});
		var boundaries = [boundary];
		var prevNode = Boundaries.prevNode(boundaries[0]);
		if (Html.isUnrendered(prevNode)) {
			boundaries = Mutation.removeNode(prevNode, boundaries);
		}
		var nextNode = Boundaries.nextNode(boundaries[0]);
		if (Html.isUnrendered(nextNode)) {
			boundaries = Mutation.removeNode(nextNode, boundaries);
		}
		return consume(boundaries[0], overrides);
	}

	/**
	 * Inserts a DOM nodes at the given boundary to reflect the list of
	 * overrides.
	 *
	 * @param  {Boundary}         boundary
	 * @param  {Array.<Override>} overrides
	 * @return {Boundary}
	 * @memberOf overrides
	 */
	function consume(boundary, overrides) {
		var doc = Boundaries.document(boundary);
		var node;
		Maps.forEach(Maps.mapTuples(overrides), function (value, state) {
			if (stateToNode[state]) {
				if (value) {
					var wrapper = doc.createElement(stateToNode[state]);
					if (node) {
						Dom.wrap(node, wrapper);
					} else {
						Mutation.insertNodeAtBoundary(wrapper, boundary);
						boundary = Boundaries.create(wrapper, 0);
					}
					node = wrapper;
				} else {
					boundary = purgeFormat(state, boundary);
				}
				return;
			}
			if (!node) {
				node = doc.createElement('span');
				Mutation.insertNodeAtBoundary(node, boundary);
				boundary = Boundaries.create(node, 0);
			}
			Dom.setStyle(node, state, value);
		});
		return boundary;
	}

	/**
	 * Returns the index of an override with the given command or state name in
	 * the given list of overrides.
	 *
	 * Returns -1 if override is not found.
	 *
	 * @param  {Array.<Override>} overrides
	 * @param  {string}           name
	 * @return {number}
	 * @memberOf overrides
	 */
	function indexOf(overrides, name) {
		for (var i = 0; i < overrides.length; i++) {
			if (name === overrides[i][0]) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Toggles the value of the override matching the given name from among the
	 * list of overrides.
	 *
	 * Returns a copy of overrides that represents the new toggle state/value.
	 *
	 * @param  {Array.<Override>} overrides
	 * @param  {string}           name
	 * @param  {string|boolean}   value
	 * @return {Array.<Override>}
	 * @memberOf overrides
	 */
	function toggle(overrides, name, value) {
		var index = indexOf(overrides, name);
		if (-1 === index) {
			return overrides.concat([[name, value]]);
		}
		var copy = overrides.concat();
		copy[index][1] = ('boolean' === typeof copy[index][1])
		               ? !copy[index][1]
		               : value;
		return copy;
	}

	/**
	 * Returns a unique set from the given list of overrides.
	 *
	 * The last override of any given key (first element of tuple) in the list
	 * will be the value that is included in the resultant set.
	 *
	 * @param  {Array.<Override>} overrides
	 * @return {Array.<Override>}
	 * @memberOf overrides
	 */
	function unique(overrides) {
		var tuple;
		var set = [];
		var map = Maps.create();
		var count = overrides.length;
		while (count--) {
			tuple = overrides[count];
			if (!map[tuple[0]]) {
				map[tuple[0]] = true;
				set.push(tuple);
			}
		}
		return set.reverse();
	}

	/**
	 * Joins a variable list of overrides-lists into a single unique set.
	 *
	 * @param  {...Array.<Override>}
	 * @return {Array.<Override>}
	 * @memberOf overrides
	 */
	function joinToSet() {
		return unique(
			Array.prototype.concat.apply([], Arrays.coerce(arguments))
		);
	}

	return {
		indexOf     : indexOf,
		unique      : unique,
		toggle      : toggle,
		consume     : consume,
		harvest     : harvest,
		joinToSet   : joinToSet,
		nodeToState : nodeToState,
		stateToNode : stateToNode
	};
});
