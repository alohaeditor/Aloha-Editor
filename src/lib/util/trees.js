/**
 * Tree walking functions.
 *
 * prewalk(form, fn, leaf)
 *
 *     Descend into the given tree and build a new tree with the result
 *     of applying the given function to each branch and leaf.
 *
 *     An optional leaf function will be applied only to the leaves of
 *     the tree before being applied to the given function.
 *
 *     The given function is applied as the tree is descended into - the
 *     function application (pre)cedes descending into the tree.
 *
 * postwalk(form, fn, leaf)
 *
 *     The same as prewalk, except the given function is applied as
 *     the tree is ascended.
 *
 * preprune(form, pred, leaf)
 *
 *     The same as prewalk, except fn is a predicate function and any
 *     branch or leaf that is encountered and for which pred returns
 *     true is removed from the tree.
 *
 * postprune(form, pred, leaf)
 *
 *     The same as preprune, except the predicate function is applied as
 *     the tree is ascended.
 *
 * leaves(form, leaf)
 *
 *     Invokes the given leaf function for each leaf in the tree.
 *
 * flatten(form)
 *
 *     Makes an array of all leaves in the tree.
 *
 * prepruneNodes(form, fn, leaf)
 *
 *     Like preprune(form, fn, leaf) except for DOM nodes.
 *
 * postpruneNodes(form, fn, leaf
 *
 *     Like postprune(form, fn, leaf) except for DOM nodes.
 */
define(['jquery', 'util/functions'],function($, Functions){
	'use strict';

	function walk(form, recurse, leaf) {
		var type = $.type(form),
		    result;
		if ('array' === type) {
			result = [];
			for (var i = 0, len = form.length; i < len; i++) {
				recurse(form[i], result.length, result);
			}
		} else if ('object' === type) {
			result = {};
			for (var key in form) {
				if (form.hasOwnProperty(key)) {
					recurse(form[key], key, result);
				}
			}
		} else {
			result = leaf(form);
		}
		return result;
	}
	
	function walkNodes(form, recurseFn, leafFn) {
		var result;
		if (1 === form.nodeType) {
			var clone = form.cloneNode(false);
			var child = form.firstChild;
			var subResult = [];
			while (child) {
				recurseFn(child, 0, subResult);
				if (0 !== subResult.length) {
					clone.appendChild(subResult[0]);
				}
				child = child.nextSibling;
			}
			result = clone;
		} else {
			result = leafFn(form.cloneNode(true));
		}
		return result;
	}

	function prewalk(form, fn, leaf, recurse, key, result, walk) {
		result[key] = walk(
			fn(form),
			recurse,
			leaf
		);
	}

	function postwalk(form, fn, leaf, recurse, key, result, walk) {
		result[key] = fn(walk(
			form,
			recurse,
			leaf
		));
	}

	function preprune(form, fn, leaf, recurse, key, result, walk) {
		if (!fn(form)) {
			result[key] = walk(
				form,
				recurse,
				leaf
			);
		}
	}

	function postprune(form, fn, leaf, recurse, key, result, walk) {
		var subForm = walk(
			form,
			recurse,
			leaf
		);
		if (!fn(subForm)) {
			result[key] = subForm;
		}
	}

	function walkrec(form, fn, leaf, walkFn, walk) {
		var result = [null];
		(function recurse(subForm, key, result) {
			walkFn(subForm, fn, leaf, recurse, key, result, walk);
		}(form, 0, result));
		return result[0];
	}

	return {
		prewalk  : function(form, fn, leaf   ) { return walkrec(form, fn, leaf || Functions.identity, prewalk, walk); },
		postwalk : function(form, fn, leaf   ) { return walkrec(form, fn, leaf || Functions.identity, postwalk, walk); },
		preprune : function(form, pred, leaf ) { return walkrec(form, pred, leaf || Functions.identity, preprune, walk); },
		postprune: function(form, pred, leaf ) { return walkrec(form, pred, leaf || Functions.identity, postprune, walk); },
		leaves   : function(form, leaf       ) { return walkrec(form, Functions.identity, leaf, postwalk, walk); },
		prepruneNodes : function(form, pred, leaf) { return walkrec(form, pred, leaf || Functions.identity, preprune, walkNodes); },
		postpruneNodes: function(form, pred, leaf) { return walkrec(form, pred, leaf || Functions.identity, postprune, walkNodes); },
		flatten  : function(form) {
			var result = [];
			walkrec(form, Functions.identity, function(leaf){ result.push(leaf); }, postwalk, walk);
			return result;
		}
	};
});
