/* trees.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Tree walking functions.
 *
 * prewalk(form, fn, inplace)
 *
 *     Descend into the given form, which is a tree of arrays andmaps
 *     (javascript Object), and build a new tree with the result of
 *     applying the given fn to each branch and leaf. Only arrays and
 *     maps are descended into, everything else is considered a leaf.
 *
 *     The given fn is applied as the tree is descended into - the
 *     function application (pre)cedes descending into the tree.
 *
 *     By default, an entirely new structure is returned. If the
 *     optional inplace argument is true, the algorithm will not
 *     allocate any new structures, but modify the given form in-place.
 *     The benefit of this is more performance due to less allocation,
 *     and reduced memory overhead, but see the "Note" below.
 *
 * postwalk(form, fn, inplace)
 *
 *     the same as prewalk, except the given fn is applied as the tree
 *     is ascended.
 *
 * preprune(form, pred, inplace)
 *
 *     the same as prewalk, except pred is a predicate function and any
 *     branch or leaf that is encountered and for which pred returns
 *     true is removed from the tree.
 *
 * postprune(form, pred, inplace)
 *
 *     the same as preprune, except the predicate function is applied as
 *     the tree is ascended.
 *
 *     Postpruning is potentially slower than prepruning since it always
 *     descendes into the whole tree, even into pruned nodes, while
 *     prepruning skips any pruned nodes.
 *
 * leaves(form, leaf, inplace)
 *
 *     Like postwalk, except the leaf function is applied only to
 *     leaves, and not to the arrays or maps that make up the tree
 *     structure of form.
 *
 *     Useful when one is only interested in tranforming leaves.
 *
 * flatten(form)
 *
 *     Makes an array of all of the given form's leaves.
 *
 * clone(form)
 *
 *     Constructs a deep clone of the given form.
 *
 * walk(form, recurse, inplace)
 *
 *     If form is an array or map, calls recurse on each of its items.
 *     If inplace is true, modifies the form and sets each item to the
 *     result of the call to recurse. If inplace is false, creates a new
 *     array/map containing the results of calling recurse. Returns
 *     either form if inplace is true, or the newly created array/map.
 *
 *     If form is not an array or map, it is simply returned.
 *
 *     An example using walk() in a custom recursive traversal function:
 *
 *     function doSomething(root) {
 *         function step(form) {
 *             form = Trees.walk(form, step);
 *             // do something with form
 *             return form ? [form] : [];
 *         }
 *         return step(root)[0] || null;
 *     }
 *
 * walk(form, recurse)
 *
 *     Short for walk(form, recurse, true)
 *
 * Note: When walking arrays and maps, if the fn and leaf functions
 *       modify the parent or any ancestor of the passed form, the
 *       resulting behaviour is undefined. Only modification of the
 *       passed form and descendants of the passed form is valid.
 *
 * Note: the algorithms are recursive and the maximum nesting level of
 *       the input set is therefore bound to the maximum stack depth.
 *       IE7 and IE8 for example have a maximum stack depth of greater
 *       than 1000, so the maximum input nesting level should not exceed
 *       about 300 (3 stack frames are needed per nesting level).
 */
define([], function Trees() {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('trees');
	}

	function walk(form, step, inplace) {
		var subResult,
			result,
			resultOff,
			len,
			i,
			key;
		if (Array.isArray(form)) {
			result = (inplace ? form : []);
			resultOff = 0;
			for (i = 0, len = form.length; i < len; i++) {
				subResult = step(form[i]);
				if (subResult.length) {
					result[resultOff++] = subResult[0];
				}
			}
			result.length = resultOff;
		} else if ('object' === typeof form) {
			result = (inplace ? form : {});
			for (key in form) {
				if (form.hasOwnProperty(key)) {
					subResult = step(form[key]);
					if (subResult.length) {
						result[key] = subResult[0];
					} else {
						delete result[key];
					}
				}
			}
		} else {
			result = form;
		}
		return result;
	}

	function walkInplace(form, step) {
		return walk(form, step, true);
	}

	function prewalkStep(step, fn, walk, form) {
		return [walk(fn(form), step)];
	}

	function postwalkStep(step, fn, walk, form) {
		return [fn(walk(form, step))];
	}

	function prepruneStep(step, fn, walk, form) {
		return fn(form) ? [] : [walk(form, step)];
	}

	function postpruneStep(step, fn, walk, form) {
		var subForm = walk(form, step);
		return fn(subForm) ? [] : [subForm];
	}

	function prepost(step, fnOrPred, walk, form) {
		function prepostStep(form) {
			return step(prepostStep, fnOrPred, walk, form);
		}
		return prepostStep(form)[0];
	}

	function prewalk(form, fn, inplace) {
		return prepost(prewalkStep, fn, inplace ? walkInplace : walk, form);
	}

	function postwalk(form, fn, inplace) {
		return prepost(postwalkStep, fn, inplace ? walkInplace : walk, form);
	}

	function preprune(form, pred, inplace) {
		return prepost(prepruneStep, pred, inplace ? walkInplace : walk, form);
	}

	function postprune(form, pred, inplace) {
		return prepost(postpruneStep, pred, inplace ? walkInplace : walk, form);
	}

	function isLeaf(form) {
		return 'object' !== typeof form && !Array.isArray(form);
	}

	function identityStep(step, walk, form) {
		return [walk(form, step)];
	}

	function leaves(form, leaf, inplace) {
		var leafWalk = inplace ? walkInplace : walk;

		function leafStep(form) {
			if (isLeaf(form)) {
				return [leaf(form)];
			}
			return identityStep(leafStep, leafWalk, form);
		}
		return leafStep(form)[0];
	}

	function clone(form) {
		function cloneStep(form) {
			return identityStep(cloneStep, walk, form);
		}
		return cloneStep(form)[0];
	}

	function flatten(form) {
		var inplace = true;
		var result = [];
		leaves(form, function (leaf) {
			result.push(leaf);
			return leaf;
		}, inplace);
		return result;
	}

	var exports = {
		prewalk: prewalk,
		postwalk: postwalk,
		preprune: preprune,
		postprune: postprune,
		isLeaf: isLeaf,
		leaves: leaves,
		clone: clone,
		flatten: flatten,
		walk: walk,
		walkInplace: walkInplace
	};

	exports['prewalk'] = exports.prewalk;
	exports['postwalk'] = exports.postwalk;
	exports['preprune'] = exports.preprune;
	exports['postprune'] = exports.postprune;
	exports['isLeaf'] = exports.isLeaf;
	exports['leaves'] = exports.leaves;
	exports['clone'] = exports.clone;
	exports['flatten'] = exports.flatten;
	exports['walk'] = exports.walk;
	exports['walkInplace'] = exports.walkInplace;

	return exports;
});
