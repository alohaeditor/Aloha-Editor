/**
 * ecma5schims.js - Shim for ECMA5 compatibility
 * (http://en.wikipedia.org/wiki/Shim_%28computing%29)
 *
 * A shim library that implements common functions that are missing on some
 * environments in order to complete ECMA5 compatibility across all major
 * browsers.
 *
 * TODO: This code needs to be refactored so as to conform to Aloha coding
 *       standards.  It is also severly lacking in documentation.  Please take
 *       note of: https://github.com/alohaeditor/Aloha-Editor/wiki/Commit-Checklist .
 */

define([], function () {
	'use strict';
	var $_;

	var shims = {
		// Function bind
		bind: function (owner) {
			var obj = this.obj || this;
			var native_method = Function.prototype.bind;
			var args = Array.prototype.slice.call(arguments, 1);

			if (native_method) {
				return native_method.apply(obj, arguments);
			}
			return function () {
				return obj.apply(owner, arguments.length === 0 ? args : args.concat(Array.prototype.slice.call(arguments)));
			};
		},

		// String trim
		trim: function () {
			var obj = this.obj || this;
			var native_method = String.prototype.trim;

			if (native_method) {
				return native_method.call(obj);
			}
			return obj.replace(/^\s+/, '').replace(/\s+$/, '');
		},

		// Array methods 
		// i optional
		indexOf: function (find, i) {
			var obj = this.obj || this;
			var native_method = Array.prototype.indexOf;

			if (native_method) {
				return native_method.call(obj, find, i);
			}
			if (i === undefined) {
				i = 0;
			}
			if (i < 0) {
				i += obj.length;
			}
			if (i < 0) {
				i = 0;
			}
			var n;
			for (n = obj.length; i < n; i++) {
				if (undefined !== obj[i] && obj[i] === find) {
					return i;
				}
			}
			return -1;
		},

		// that optional
		forEach: function (action, that) {
			var obj = this.obj || this;
			var native_method = Array.prototype.forEach;

			if (native_method) {
				return native_method.call(obj, action, that);
			}
			var i, n;
			for (i = 0, n = obj.length; i < n; i++) {
				if (undefined !== obj[i]) {
					action.call(that, obj[i], i, obj);
				}
			}
		},

		// that optional
		// chain optional
		map: function (mapper, that, chain) {
			var obj = this.obj || this;
			var native_method = Array.prototype.map;
			var returnWrapper = (typeof arguments[arguments.length - 1] == "boolean") ? Array.prototype.pop.call(arguments) : false;
			var result = [];

			if (native_method) {
				result = native_method.call(obj, mapper, that);
			} else {
				var other = [];
				var i, n;
				for (i = 0, n = obj.length; i < n; i++) {
					if (undefined !== obj[i]) {
						other[i] = mapper.call(that, obj[i], i, obj);
					}
				}
				result = other;
			}

			return returnWrapper ? $_(result) : result;
		},

		// that optional
		// chain optional
		filter: function (filterFunc, that, chain) {
			var obj = this.obj || this;
			var native_method = Array.prototype.filter;
			var returnWrapper = (typeof arguments[arguments.length - 1] == "boolean") ? Array.prototype.pop.call(arguments) : false;
			var result = [];

			if (native_method) {
				result = native_method.call(obj, filterFunc, that);
			} else {
				var other = [],
				    v,
				    i,
				    n;
				for (i = 0, n = obj.length; i < n; i++) {
					if (undefined !== obj[i] && filterFunc.call(that, v = obj[i], i, obj)) {
						other.push(v);
					}
				}
				result = other;
			}

			return returnWrapper ? $_(result) : result;
		},

		// that optional
		every: function (tester, that) {
			var obj = this.obj || this;
			var native_method = Array.prototype.every;

			if (native_method) {
				return native_method.call(obj, tester, that);
			}
			var i, n;
			for (i = 0, n = obj.length; i < n; i++) {
				if (undefined !== obj[i] && !tester.call(that, obj[i], i, obj)) {
					return false;
				}
			}
			return true;
		},

		// that optional
		some: function (tester, that) {
			var obj = this.obj || this;
			var native_method = Array.prototype.some;

			if (native_method) {
				return native_method.call(obj, tester, that);
			}
			var i, n;
			for (i = 0, n = obj.length; i < n; i++) {
				if (undefined !== obj[i] && tester.call(that, obj[i], i, obj)) {
					return true;
				}
			}
			return false;
		},

		// Since IE7 doesn't support 'hasAttribute' method on nodes
		// TODO: raise an exception if the object is not an node
		hasAttribute: function (attr) {
			var obj = this.obj || this;
			var native_method = obj.hasAttribute;

			if (native_method) {
				return obj.hasAttribute(attr);
			}
			return !!obj.getAttribute(attr);
		}

	};

	$_ = function (obj) {
		var Wrapper = function () {};
		Wrapper.prototype = shims;

		var wrapper_instance = new Wrapper();
		wrapper_instance.obj = obj;
		return wrapper_instance;
	};

	var shim;
	for (shim in shims) {
		if (shims.hasOwnProperty(shim)) {
			$_[shim] = shims[shim];
		}
	}


	// Node constants
	// http://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-1841493061
	if (typeof window.Node != 'undefined') {
		$_.Node = window.Node;
	} else {
		$_.Node = {
			'ELEMENT_NODE': 1,
			'ATTRIBUTE_NODE': 2,
			'TEXT_NODE': 3,
			'CDATA_SECTION_NODE': 4,
			'ENTITY_REFERENCE_NODE': 5,
			'ENTITY_NODE': 6,
			'PROCESSING_INSTRUCTION_NODE': 7,
			'COMMENT_NODE': 8,
			'DOCUMENT_NODE': 9,
			'DOCUMENT_TYPE_NODE': 10,
			'DOCUMENT_FRAGMENT_NODE': 11,
			'NOTATION_NODE': 12,
			//The two nodes are disconnected. Order between disconnected nodes is always implementation-specific.
			'DOCUMENT_POSITION_DISCONNECTED': 0x01,
			//The second node precedes the reference node.
			'DOCUMENT_POSITION_PRECEDING': 0x02,
			//The node follows the reference node.
			'DOCUMENT_POSITION_FOLLOWING': 0x04,
			//The node contains the reference node. A node which contains is always preceding, too.
			'DOCUMENT_POSITION_CONTAINS': 0x08,
			//The node is contained by the reference node. A node which is contained is always following, too.
			'DOCUMENT_POSITION_CONTAINED_BY': 0x10,
			//The determination of preceding versus following is implementation-specific.
			'DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC': 0x20
		};
	}

	//node.ownerDocument gives the document object, which isn't the right info for a disconnect
	function getRootParent(node) {
		var parent = null;

		if (node) {
			do {
				parent = node;
			} while (null != (node = node.parentNode));
		}

		return parent;
	}

	//Compare Position - MIT Licensed, John Resig; http://ejohn.org/blog/comparing-document-position/
	//Already checked for equality and disconnect
	function comparePosition(node1, node2) {
		return (node1.contains(node2) && 16) + (node2.contains(node1) && 8) + (node1.sourceIndex >= 0 && node2.sourceIndex >= 0 ? (node1.sourceIndex < node2.sourceIndex && 4) + (node1.sourceIndex > node2.sourceIndex && 2) : 1);
	}

	//get a node with a sourceIndex to use
	function getUseNode(node) {
		//if the node already has a sourceIndex, use that node
		if (null != node.sourceIndex) {
			return node;
		}
		//otherwise, insert a comment (which has a sourceIndex but minimal DOM impact) before the node and use that
		return node.parentNode.insertBefore(document.createComment(""), node);
	}

	// http://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-compareDocumentPosition
	// FIXME: Check if the DOMNode prototype can be set.
	$_.compareDocumentPosition = function (node1, node2) {

		if (document.documentElement.compareDocumentPosition) {
			return node1.compareDocumentPosition(node2);
		}

		if (!document.documentElement.contains) {
			throw 'neither compareDocumentPosition nor contains is supported by this browser.';
		}

		if (node1 == node2) {
			return 0;
		}

		//if they don't have the same parent, there's a disconnect
		if (getRootParent(node1) != getRootParent(node2)) {
			return 1;
		}

		//use this if both nodes have a sourceIndex (text nodes don't)
		if (null != node1.sourceIndex && null != node2.sourceIndex) {
			return comparePosition(node1, node2);
		}

		//document will definitely contain the other node
		if (node1 == document) {
			return 20;
		}
		if (node2 == document) {
			return 10;
		}

		//get sourceIndexes to use for both nodes
		var useNode1 = getUseNode(node1),
			useNode2 = getUseNode(node2);

		//call this function again to get the result
		var result = comparePosition(useNode1, useNode2);

		//clean up if needed
		if (node1 != useNode1) {
			useNode1.parentNode.removeChild(useNode1);
		}
		if (node2 != useNode2) {
			useNode2.parentNode.removeChild(useNode2);
		}
		return result;
	};

	$_.getComputedStyle = function (node, style) {
		if (window.getComputedStyle) {
			return window.getComputedStyle(node, style);
		}
		if (node.currentStyle) {
			return node.currentStyle;
		}
		return null;
	};

	return $_;
});
