/* trees.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['maps', 'functions'], function Trees(Maps, Fn) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('trees');
	}

	function empty(obj) {
		if (Array.isArray(obj)) {
			return [];
		}
		if (Maps.isMap(obj)) {
			return {};
		}
	}

	function walkContainerWithResult(obj, step, result) {
		function each(value, key) {
			step(value, key, result);
		}
		if (Array.isArray(obj)) {
			obj.forEach(each);
		} else {
			Maps.forEach(obj, each);
		}
		return result;
	}

	function walkContainer(obj, step) {
		return walkContainerWithResult(obj, step, empty(obj));
	}

	function walkContainerInplace(obj, step) {
		return walkContainerWithResult(obj, step, obj);
	}

	function walk(walkContainer, stepContainer, stepLeaf, obj) {
		if (empty(obj)) {
			return walkContainer(obj, stepContainer);
		}
		return stepLeaf(obj);
	}

	/**
	 * Walks the given value recursively, applying all values to the given functions.
	 *
	 * stepContainer will encounter all values.
	 * stepLeaf will only encounter non-container values.
	 *
	 * @param optWalkContainer {?function (Array.<*>|Object.<string,*>,
	 *                                    function(*,
	 *                                              string|integer,
	 *                                              Array.<*>|Object.<string,*>)
	 *                                    :void)
	 *                          :void}
	 *        A function to use to walk container values (for example
	 *        walkContainer() or walkContainerInplace()).
	 * @param stepContainer {function(*,
	 *                                string|integer,Array.<*>|Object.<string,*>,
	 *                                function(*))
	 *                       :void}
	 * @param stepLeaf {function(*):void}
	 * @param value {*}
	 */
	function walkRec(walkContainer, stepContainer, stepLeaf, value) {
		var rec;
		function recStep(value, key, result) {
			stepContainer(value, key, result, rec);
		}
		rec = Fn.partial(walk, walkContainer, recStep, stepLeaf);
		var result = [];
		recStep(value, 0, result);
		return result[0];
	}

	function identityStep(value, key, result, rec) {
		result[key] = rec(value);
	}

	function prewalkStep(fn, value, key, result, rec) {
		result[key] = rec(fn(value));
	}

	function postwalkStep(fn, value, key, result, rec) {
		result[key] = fn(rec(value));
	}

	function prepruneStep(fn, value, key, result, rec) {
		if (fn(value)) {
			result[key] = rec(value);
		}
	}

	function postpruneStep(fn, value, key, result, rec) {
		var keep = rec(value);
		if (keep) {
			result[key] = value;
		}
	}

	function prepost(value, fn, optWalkContainer, step)  {
		return walkRec(optWalkContainer || walkContainer, Fn.partial(step, fn), Fn.identity, value);
	}

	/**
	 * Descend into the given form, which may be a tree of arrays and
	 * maps or any other value (integer, boolean etc.), and build a new
	 * tree with the result of applying the given fn to each node.
	 *
	 * The given fn is applied as the tree is descended into - the
	 * function application (pre)cedes descending into the tree.
	 *
	 * @param value {*}
	 *        The tree to descend into
	 * @param fn {function(*):*}
	 *        A function to apply each value in the given tree to (or
	 *        only to the given value itself if it isn't a tree).
	 *        The return value will replace the corresponding value in
	 *        the result tree.
	 * @param optWalkContainer {?function (Array.<*>|Object.<string,*>,
	 *                                    function(*,
	 *                                              string|integer,
	 *                                              Array.<*>|Object.<string,*>)
	 *                                    :void)
	 *                          :void}
	 *        A function to use to walk container values (for example
	 *        walkContainer() or walkContainerInplace()).
	 */
	function prewalk(value, fn, optWalkContainer) {
		return prepost(value, fn, optWalkContainer, prewalkStep);
	}

	/**
	 * Similar to prewalk(), except the given fn is applied as the tree
	 * is descended out of.
	 */
	function postwalk(value, fn, optWalkContainer) {
		return prepost(value, fn, optWalkContainer, postwalkStep);
	}

	/**
	 * Similar to prewalk(), except it will remove values from the tree
	 * if the given function returns a true/false value.
	 */
	function preprune(value, fn, optWalkContainer) {
		return prepost(value, fn, optWalkContainer, prepruneStep);
	}

	/**
	 * Similar to preprune(), except will apply the function as the tree
	 * is descended out of.
	 */
	function postprune(value, fn, optWalkContainer) {
		return prepost(value, fn, optWalkContainer, postpruneStep);
	}
	
	/**
	 * Apply all leaf nodes of the given tree to the given function.
	 */
	function leaves(value, fn, optWalkContainer) {
		return walkRec(optWalkContainer || walkContainer, identityStep, fn, value);
	}

	/**
	 * Clone the given tree.
	 *
	 * Only container objects will be cloned. See Map.isMap() for what
	 * is not considered a container object.
	 */
	function clone(value) {
		return walkRec(walkContainer, identityStep, Fn.identity, value);
	}

	/**
	 * Get all the leaf (not container) nodes of the given tree.
	 */
	function flatten(value) {
		var result = [];
		leaves(value, function (leaf) {
			result.push(leaf);
		}, walkContainerInplace);
		return result;
	}

	var exports = {
		prewalk: prewalk,
		postwalk: postwalk,
		preprune: preprune,
		postprune: postprune,
		leaves: leaves,
		clone: clone,
		flatten: flatten,
		walkContainer: walkContainer,
		walkContainerInplace: walkContainerInplace,
		walk: walk,
		walkRec: walkRec,
		identityStep: identityStep
	};

	exports['prewalk'] = exports.prewalk;
	exports['postwalk'] = exports.postwalk;
	exports['preprune'] = exports.preprune;
	exports['postprune'] = exports.postprune;
	exports['leaves'] = exports.leaves;
	exports['clone'] = exports.clone;
	exports['flatten'] = exports.flatten;
	exports['walkContainer'] = exports.walk;
	exports['walkContainerInplace'] = exports.walkInplace;
	exports['walk'] = exports.walk;
	exports['walkRec'] = exports.walkRec;
	exports['identityStep'] = exports.identityStep;

	return exports;
});
