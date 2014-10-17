/**
 * trees.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'maps',
	'functions'
], function (
	Arrays,
	Maps,
	Fn
) {
	'use strict';

	/**
	 * An empty container object of the same type as the argument, or
	 * undefined if the argument is not a container object.
	 */
	function empty(obj) {
		if (Array.isArray(obj)) {
			return [];
		}
		if (Maps.isMap(obj)) {
			return {};
		}
	}

	/**
	 * Walks over arrays or objects/maps and invokes the given function
	 * on each item, passing in the item, the key of the item, and the
	 * result argument.
	 *
	 * @param obj {Array.<*>|Object.<string,*>}
	 * @param step {function(*, (integer|string), (Array.<*>|Object.<string,*>))}
	 * @return the given result argument.
	 */
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

	/**
	 * Similar to walkContainerWithResult() except will call the step
	 * function with an empty result object (which will get filled up by
	 * the step function).
	 */
	function walkContainer(obj, step) {
		return walkContainerWithResult(obj, step, empty(obj));
	}

	/**
	 * Similar to walkContainer() except will call the step function
	 * with the given obj as the result. This is useful to mutate trees
	 * in-place.
	 */
	function walkContainerInplace(obj, step) {
		return walkContainerWithResult(obj, step, obj);
	}

	/**
	 * Similar to walkContainer() except will work with leaf objects as
	 * well and call the given leaf function on them.
	 */
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
	 * @param optWalkContainer {function ((Array.<*>|Object.<string,*>),
	 *                                    function(*,
	 *                                              (string|integer),
	 *                                              (Array.<*>|Object.<string,*>))
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

	/**
	 * A step function that can be passed to walkContainer().
	 *
	 * @param value {*}
	 * @param key {integer|string}
	 * @param result {Array.<*>|Object.<string,*>}
	 * @param rec {function(*):*}
	 */
	function identityStep(value, key, result, rec) {
		result[key] = rec(value);
	}

	/**
	 * Similar to identityStep, except it takes an additional function
	 * as the first argument that will get the value applied to it
	 * before recursion.
	 */
	function prewalkStep(fn, value, key, result, rec) {
		result[key] = rec(fn(value));
	}

	/**
	 * Similar to prewalkStep, except the given function will get the
	 * value applied to it after recursion.
	 */
	function postwalkStep(fn, value, key, result, rec) {
		result[key] = fn(rec(value));
	}

	/**
	 * Similar to prewalkStep() except the value will be pruned when the
	 * given function returns false.
	 */
	function prepruneStep(fn, value, key, result, rec) {
		if (fn(value)) {
			result[key] = rec(value);
		}
	}

	/**
	 * Similar to prepruneStep() except the the decision whether the
	 * value will be pruned is done after recursion.
	 */
	function postpruneStep(fn, value, key, result, rec) {
		var keep = rec(value);
		if (keep) {
			result[key] = value;
		}
	}

	/**
	 * Shortcut for pre* / post* functions.
	 */
	function prepost(value, fn, optWalkContainer, step) {
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
	 * @param optWalkContainer {function ((Array.<*>|Object.<string,*>),
	 *                                    function(*,
	 *                                              (string|integer),
	 *                                              (Array.<*>|Object.<string,*>))
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

	/**
	 * Whether two trees are equal.
	 *
	 * @param a {*}
	 * @param b {*}
	 * @param isLeafEqual {function(*,*):boolean}
	 */
	function deepEqual(nodeA, nodeB, isLeafEqual) {
		isLeafEqual = isLeafEqual || Fn.strictEquals;
		var isArrayA = Array.isArray(nodeA);
		var isArrayB = Array.isArray(nodeB);
		var isMapA = Maps.isMap(nodeA);
		var isMapB = Maps.isMap(nodeB);
		function rec(nodeA, nodeB) {
			return deepEqual(nodeA, nodeB, isLeafEqual);
		}
		if (isArrayA && isArrayB) {
			return Arrays.equal(nodeA, nodeB, rec);
		}
		if (isMapA && isMapB) {
			var ksA = Maps.keys(nodeA).sort();
			var ksB = Maps.keys(nodeB).sort();
			return (Arrays.equal(ksA, ksB)
			        && Arrays.equal(Maps.selectVals(nodeA, ksA),
			                        Maps.selectVals(nodeB, ksB),
			                        rec));
		}
		return (!isArrayA && !isArrayB
				&& !isMapA && !isMapB
				&& isLeafEqual(nodeA, nodeB));
	}

	return {
		prewalk              : prewalk,
		postwalk             : postwalk,
		preprune             : preprune,
		postprune            : postprune,
		leaves               : leaves,
		clone                : clone,
		flatten              : flatten,
		deepEqual            : deepEqual,
		walkContainer        : walkContainer,
		walkContainerInplace : walkContainerInplace,
		walk                 : walk,
		walkRec              : walkRec,
		identityStep         : identityStep
	};
});
