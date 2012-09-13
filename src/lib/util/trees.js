/* trees.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
/**
 * Tree walking functions.
 *
 * prewalk(form, fn, leaf, inplace)
 *
 *     Descend into the given form, which is a tree of arrays andmaps
 *     (javascript Object), and build a new tree with the result of
 *     applying the given fn and leaf functions to each branch and
 *     leaf. Only arrays and maps are descended into, everything else is
 *     considered a leaf.
 *
 *     The given fn is applied as the tree is descended into - the
 *     function application (pre)cedes descending into the tree.
 * 
 *     The optional leaf function is be applied to each leaf before fn:
 *     fn(leaf(leafObject)).
 *
 *     By default, an entirely new structure is returned. If the
 *     optional inplace argument is true, the algorithm will not
 *     allocate any new structures, but modify the given form in-place.
 *     The benefit of this is more performance due to less allocation,
 *     and reduced memory overhead, but see the "Note" below.
 *
 * postwalk(form, fn, leaf, inplace)
 *
 *     The same as prewalk, except the given fn is applied as the tree
 *     is ascended and the optonal leaf function is applied to each leaf
 *     after fn: leaf(fn(leafObject)).
 *
 * preprune(form, pred, leaf, inplace)
 *
 *     The same as prewalk, except fn is a predicate function and any
 *     branch or leaf that is encountered and for which pred returns
 *     true is removed from the tree.
 *
 * postprune(form, pred, leaf, inplace)
 *
 *     The same as preprune, except the predicate function is applied as
 *     the tree is ascended.
 *
 *     Postpruning is potentially slower than prepruning since it always
 *     descendes into the whole tree, even into pruned nodes, while
 *     prepruning skips any pruned nodes.
 *
 * leaves(form, leaf, inplace)
 *
 *     Shorthand for postwalk(form, Functions.identity, leaf, inplace)
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
 * prepruneDom(form, fn, leaf, inplace)
 *
 *     Like preprune() except:
 *
 *     - the given form may be either an element or other DOM node, and only
 *       elements are descended into.
 *
 *     - the given form will be cloned before it is being traversed, unless
 *       inplace is true.
 *
 *       This is different from prewalk, where non-clone subforms are
 *       passed to the fn and leaf functions. This is necessary because
 *       an array or map can be the child of multiple arrays and maps at
 *       the same time, while a node can only be the child of a single
 *       parent node at any one time.
 *   
 * postpruneDom(form, fn, leaf, inplace)
 *
 *     Like prepruneDom(), except the given function is applied as the tree
 *     is ascended.
 *
 * walkrec(form, fn, leaf, step, walk, inplace)
 *
 *     Iteration primitive used by more high level functions like
 *     prewalk/postwalk etc.
 *
 *     Useful to have more control over the walk process. In particular,
 *     this function allows a custom step function to be provided. The
 *     step function is what sets prewalk and postwalk or preprune and
 *     postprune apart.
 *
 *     @param step
 *            A function that accepts the following arguments
 *            form    - either the given form or a subform
 *            recurse - a function that should be passed on to the given walk function
 *            key     - used as the index to result
 *            result  - an array or map to place the result of the step into
 *            fn      - the same as the fn argument given to walkrec
 *            leaf    - the same as the leaf argument given to walkrec
 *            walk    - the same as the walk argument given to walkrec
 *            inplace - the same as the inplace argument given to walkrec
 *            returns - true if a value has been placed into result[key]
 *
 *            The given step function will be invoked for the form given
 *            to walkrec and each subform. The step function can decide
 *            whether to recurse into subforms by calling the given walk
 *            function with the given recurse function.
 *
 *            A value should be placed into result[key] as the result of
 *            this step, and true should be returned. If the step
 *            doesn't return true, no value will be added to the result
 *            of walkrec. For example, if the step function never
 *            returns true, the call to walkrec will return null.
 *
 *     @param walk
 *            A function that walks any non-leaf forms.
 *            Currently either Trees.walk or Trees.walkDom can be passed
 *            to walk arrays/map or DOM nodes respectively.
 *
 *     See prewalk() for form, fn, leaf and inplace.
 *
 * steprec(form, stepFn, walkFn, inplace)
 *
 *     Shorthand for walkrec(form, Functions.identity, Functions.identity, stepFn, walkFn, inplace)
 *
 *     Often only a step function is necessary and the fn and leaf
 *     functions can be ignored.
 *
 * walk(form, recurse, leaf, inplace)
 *
 *     If form is an array or map, calls recurse on each of its items.
 *     If inplace is true, modifies the form and sets each item to the
 *     result of the call to recurse. If inplace is false, creates a new
 *     array/map containing the results of calling recurse. Returns
 *     either form if inplace is true, or the newly created array/map.
 *
 *     If form is not an array or map, it is applied to leaf, and the
 *     result is returned.
 *
 * walkDom(form, recurseFn, leafFn, inplace)
 *
 *     Similar to walk() but operates on DOM nodes.
 *
 *     Elements are considered non-leaf, and everything else is
 *     considerd a leaf.
 *
 *     The inplace argument is ignored - walkDom always operates inplace.
 *
 * Note: All functions work on array+map trees, unless they are suffixed
 *       with Dom, in which case they only work on DOM nodes.
 *
 * Note: When walking arrays and maps, if the fn and leaf functions
 *       modify the parent or any ancestor of the passed form, the
 *       resulting behaviour is undefined. Only modification of the
 *       passed form and descendants of the passed form is valid.
 *
 *       During DOM traversal, it is allowed to insert-into/remove-from
 *       the children of the parent of the given form, as long the given
 *       form itself is not removed.
 *
 * Note: the algorithms are recursive and the maximum nesting level of
 *       the input set is therefore bound to the maximum stack depth.
 *       IE7 and IE8 for example have a maximum stack depth of greater
 *       than 1000, so the maximum input nesting level should not exceed
 *       about 300 (3 stack frames are needed per nesting level).
 */
define(['jquery', 'util/functions'],function($, Functions){
	'use strict';

	function walk(form, recurse, leaf, inplace) {
		var type = $.type(form),
		    result,
		    resultOff,
		    len,
		    i,
		    key;
		if ('array' === type) {
			result = (inplace ? form : []);
			resultOff = 0;
			for (i = 0, len = form.length; i < len; i++) {
				if (recurse(form[i], resultOff, result)) {
					resultOff += 1;
				}
			}
			if (resultOff !== result.length) {
				// TODO is result.length = resultOff better?
				result = result.slice(0, resultOff);
			}
		} else if ('object' === type) {
			result = (inplace ? form : {});
			for (key in form) {
				if (form.hasOwnProperty(key)) {
					if (!recurse(form[key], key, result)) {
						delete result[key];
					}
				}
			}
		} else {
			result = leaf(form);
		}
		return result;
	}
	
	function walkDom(form, recurseFn, leafFn, inplace) {
		var subResult,
		    child,
		    nextChild;
		if (1 === form.nodeType) {
			subResult = [];
			child = form.firstChild;
			while (child) {
				if (recurseFn(child, 0, subResult)) {
					// Advance to the next child _after recursion_ to pick
					// up modifications of the DOM.
					nextChild = child.nextSibling;
					if (subResult[0] !== child) {
						form.replaceChild(subResult[0], child);
					}
				} else {
					nextChild = child.nextSibling;
					form.removeChild(child);
				}
				child = nextChild;
			}
		} else {
			form = leafFn(form);
		}
		return form;
	}

	function prewalkStep(form, recurse, key, result, fn, leaf, walk, inplace) {
		result[key] = walk(
			fn(form),
			recurse,
			leaf,
			inplace
		);
		return true;
	}

	function postwalkStep(form, recurse, key, result, fn, leaf, walk, inplace) {
		result[key] = fn(walk(
			form,
			recurse,
			leaf,
			inplace
		));
		return true;
	}

	function prepruneStep(form, recurse, key, result, fn, leaf, walk, inplace) {
		if (!fn(form)) {
			result[key] = walk(
				form,
				recurse,
				leaf,
				inplace
			);
			return true;
		}
	}

	function postpruneStep(form, recurse, key, result, fn, leaf, walk, inplace) {
		var subForm = walk(
			form,
			recurse,
			leaf,
			inplace
		);
		if (!fn(subForm)) {
			result[key] = subForm;
			return true;
		}
	}

	function walkrec(form, fn, leaf, step, walk, inplace) {
		var result = [null];
		(function recurse(subForm, key, result) {
			return step(subForm, recurse, key, result, fn, leaf, walk, inplace);
		}(form, 0, result));
		return result[0];
	}

	var identity = Functions.identity;
	function prewalk     (form,   fn, leaf, inplace) { return walkrec(form,   fn, leaf || identity, prewalkStep  , walk, inplace); }
	function postwalk    (form,   fn, leaf, inplace) { return walkrec(form,   fn, leaf || identity, postwalkStep , walk, inplace); }
	function preprune    (form, pred, leaf, inplace) { return walkrec(form, pred, leaf || identity, prepruneStep , walk, inplace); }
	function postprune   (form, pred, leaf, inplace) { return walkrec(form, pred, leaf || identity, postpruneStep, walk, inplace); }
	function prewalkDom  (form,   fn, leaf, inplace) { return walkrec(inplace ? form : form.cloneNode(true),   fn, leaf || identity, prewalkStep  , walkDom, inplace); }
	function postwalkDom (form,   fn, leaf, inplace) { return walkrec(inplace ? form : form.cloneNode(true),   fn, leaf || identity, postwalkStep , walkDom, inplace); }
	function prepruneDom (form, pred, leaf, inplace) { return walkrec(inplace ? form : form.cloneNode(true), pred, leaf || identity, prepruneStep , walkDom, inplace); }
	function postpruneDom(form, pred, leaf, inplace) { return walkrec(inplace ? form : form.cloneNode(true), pred, leaf || identity, postpruneStep, walkDom, inplace); }

	function leaves(form, leaf, inplace) { return postwalk(form, identity, leaf, inplace); }
	function clone(form                ) { return postwalk(form, identity); }

	function flatten(form) {
		var inplace = true;
		var result = [];
		leaves(form, function(leaf){ result.push(leaf); return leaf; }, inplace);
		return result;
	}

	function steprec(form, stepFn, walkFn, inplace) {
		return walkrec(form, Functions.identity, Functions.identity, stepFn, walkFn, inplace);
	}

	return {
		prewalk: prewalk,
		postwalk: postwalk,
		preprune: preprune,
		postprune: postprune,
		prewalkDom: prewalkDom,
		postwalkDom: postwalkDom,
		prepruneDom: prepruneDom,
		postpruneDom: postpruneDom,
		leaves: leaves,
		clone: clone,
		flatten: flatten,
		walkrec: walkrec,
		walk: walk,
		steprec: steprec,
		walkDom: walkDom
	};
});
