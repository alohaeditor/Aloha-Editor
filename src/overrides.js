/* overrides.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Refernces:
 * http://www.w3.org/TR/CSS2/propidx.html
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#value
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#state
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#value-override
 * https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#state-override
 */
define([
	'dom',
	'misc',
	'maps',
	'traversing'
], function Overrides(
	Dom,
	Misc,
	Maps,
	Traversing
) {
	'use strict';

	var nodeToState = {
		'A'      : 'createLink',
		'U'      : 'underline',
		'B'      : 'bold',
		'STRONG' : 'bold',
		'I'      : 'italic',
		'EM'     : 'italic',
		'STRIKE' : 'strikethrough',
		'SUB'    : 'subscript',
		'SUP'    : 'superscript'
	};

	var stateToValue = {
		'hilitecolor' : 'background-color',
		'backcolor'   : 'background-color',
		'fontname'    : 'font-family',
		'fontsize'    : 'font-size',
		'fontcolor'   : 'color'
	};

	/**
	 * Any element whose node name corresponds with the given command states
	 * ("bold", "italic", "underline", "strikethrough"), must also have the
	 * associated style property match the expected value, otherwise that
	 * element's state is considered nullified by the CSS styles that has been
	 * applied to it.
	 */
	var stateToStyle = {
		'bold'          : ['fontWeight', 'bold', null],
		'italic'        : ['fontStyle', 'italic', null],
		'underline'     : ['textDecoration', 'underline', 'none'],
		'strikethrough' : ['textDecoration', 'line-through', 'none']
	};

	function statesFromStyles(elem) {
		var states = [];
		Maps.forEach(stateToStyle, function (style, state) {
			var value = Dom.getStyle(elem, style[0]);
			if (value) {
				if (style[2]) {
					if (value === style[2]) {
						states.push([state, false]);
					} else if (value === style[1]) {
						states.push([state, true]);
					}
				} else {
					states.push([state, value === style[1]]);
				}
			}
		});
		return states;
	}

	function getStates(elem) {
		if (Dom.isTextNode(elem)) {
			return [];
		}
		var state = nodeToState[elem.nodeName];
		return (state ? [[state, true]] : []).concat(statesFromStyles(elem));
	}

	function record(node, until) {
		var overrides = [];
		var nodes = Traversing.childAndParentsUntil(
			node,
			until || Dom.isEditingHost
		);
		var map = {};
		var i = nodes.length;
		var j;
		var len;
		var states;
		var state;
		var index;
		while (i--) {
			states = getStates(nodes[i]);
			for (j = 0, len = states.length; j < len; j++) {
				state = states[j];
				index = map[state[0]];
				if (Misc.defined(index)) {
					overrides.splice(index - 1, 1, null);
				}
				map[state[0]] = overrides.push(state);
			}
		}
		for (i = 0, len = overrides.length; i < len; i++) {
			if (!overrides[i]) {
				overrides.splice(i, 1);
			}
		}
		return overrides;
	}

	var exports = {
		record: record
	};

	exports['record'] = exports.record;

	return exports;
});
