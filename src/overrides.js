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
 */
define([
	'dom',
	'misc',
	'maps',
	'arrays',
	'mutation',
	'boundaries'
], function (
	Dom,
	Misc,
	Maps,
	Arrays,
	Mutation,
	Boundaries
) {
	'use strict';

	/**
	 * A table of node names that correlate to override commands.
	 *
	 * @private
	 * @type {Object.<string, string>}
	 * @see  stateToNode
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
	 * @private
	 * @type {Object.<string, string>}
	 * @see  nodeToState
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
	 */
	var valueToStyle = {
		'hilitecolor' : 'background-color',
		'backcolor'   : 'background-color',
		'fontname'    : 'font-family',
		'fontsize'    : 'font-size',
		'fontcolor'   : 'color'
	};

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
	 */
	function harvest(node, until) {
		var stack = [];
		var nodes = Dom.childAndParentsUntil(node, until || Dom.isEditingHost);
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
	 * Inserts a DOM nodes at the given boundary to reflect the list of
	 * overrides.
	 *
	 * @param  {Boundary}         boundary
	 * @param  {Array.<Override>} overrides
	 * @return {Boundary}
	 */
	function consume(boundary, overrides) {
		var doc = Boundaries.document(boundary);
		var override = overrides.pop();
		var node;
		var wrapper;
		while (override) {
			if (stateToNode[override[0]]) {
				// TODO: implement handling for false overrides states
				wrapper = doc.createElement(stateToNode[override[0]]);
				if (node) {
					Dom.wrap(node, wrapper);
				} else {
					Mutation.insertNodeAtBoundary(wrapper, boundary);
					boundary = [wrapper, 0];
				}
				node = wrapper;
			} else {
				if (!node) {
					node = doc.createElement('span');
					Mutation.insertNodeAtBoundary(node, boundary);
					boundary = [node, 0];
				}
				Dom.setStyle(node, override[0], override[1]);
			}
			override = overrides.pop();
		}
		return boundary;
	}

	/**
	 * Looks for an override with the given command or state name from the given
	 * list of overrides.
	 *
	 * @param  {Array.<Override>} overrides
	 * @param  {string}           name
	 * @return {Override}
	 */
	function find(overrides, name) {
		for (var i = 0; i < overrides.length; i++) {
			if (name === overrides[i][0]) {
				return overrides[i];
			}
		}
		return null;
	}

	/**
	 * Toggles the value of the override matching the given name from among the
	 * list of overrides.
	 *
	 * @param  {Array.<Override>} overrides
	 * @param  {string}           name
	 * @param  {string}           value
	 * @return {Override}
	 */
	function toggle(overrides, name, value) {
		var found = find(overrides, name);
		return found ? Arrays.difference(overrides, [found])
		             : overrides.concat([[name, value]]);
	}

	/**
	 * Computes a table of the given override and those collected at the given
	 * node.
	 *
	 * @param  {Array.<Override>} overrides
	 * @param  {Node}             node
	 * @return {Object}           An object with overrides mapped against their names
	 */
	function map(overrides, node) {
		var table = Maps.merge(
			Maps.mapTuples(overrides),
			Maps.mapTuples(harvest(node))
		);
		if (!table['color']) {
			table['color'] = Dom.getComputedStyle(
				Dom.isTextNode(node) ? node.parentNode : node,
				'color'
			);
		}
		return table;
	}

	return {
		consume     : consume,
		harvest     : harvest,
		map         : map,
		nodeToState : nodeToState,
		toggle      : toggle
	};
});
