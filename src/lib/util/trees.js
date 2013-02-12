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
 * prepruneDom(form, pred, inplace)
 *
 *     Like preprune() except:
 *
 *     - the given form may be either an element or other DOM node, and
 *       only elements are descended into, all other node types are
 *       considered leaves.
 *
 *     - the given form will be cloned before it is being traversed, unless
 *       inplace is true.
 *
 *       This is different from prewalk, where the subforms that are
 *       passed to fn are not clones. Making a deep clone first
 *       simplifies some things, basically because an array or map can
 *       be the child of multiple arrays and maps at the same time,
 *       while a node can only be the child of a single parent node at
 *       any one time.
 *   
 * postpruneDom(form, pred, inplace)
 *
 *     Like prepruneDom(), except the given function is applied as the tree
 *     is ascended.
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
 * walkDomInplace(form, recurse)
 *
 *     Similar to walk() but operates on DOM nodes.
 *
 *     Elements are considered non-leaf, and everything else is
 *     considerd a leaf.
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
define(['jquery'], function ($) {
	'use strict';

	function walk(form, step, inplace) {
		var type = $.type(form),
			subResult,
			result,
			resultOff,
			len,
			i,
			key;
		if ('array' === type) {
			result = (inplace ? form : []);
			resultOff = 0;
			for (i = 0, len = form.length; i < len; i++) {
				subResult = step(form[i]);
				if (subResult.length) {
					result[resultOff++] = subResult[0];
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

	function walkDomInplace(form, step) {
		var subResult,
		    child,
		    nextChild;
		if (1 === form.nodeType) {
			child = form.firstChild;
			while (child) {
				subResult = step(child);
				// Advance to the next child _after stepping into child_
				// to pick up modifications of the DOM.
				nextChild = child.nextSibling;
				if (subResult.length) {
					if (subResult[0] !== child) {
						form.replaceChild(subResult[0], child);
					}
				} else {
					form.removeChild(child);
				}
				child = nextChild;
			}
		}
		return form;
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

	function prewalkDom(form, fn, inplace) {
		return prepost(prewalkStep, fn, walkDomInplace, inplace ? form : form.cloneNode(true));
	}

	function postwalkDom(form, fn, inplace) {
		return prepost(postwalkStep, fn, walkDomInplace, inplace ? form : form.cloneNode(true));
	}

	function prepruneDom(form, pred, inplace) {
		return prepost(prepruneStep, pred, walkDomInplace, inplace ? form : form.cloneNode(true));
	}

	function postpruneDom(form, pred, inplace) {
		return prepost(postpruneStep, pred, walkDomInplace, inplace ? form : form.cloneNode(true));
	}

	function isLeaf(form) {
		var type = $.type(form);
		return type !== 'object' && type !== 'array';
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

	return {
		prewalk: prewalk,
		postwalk: postwalk,
		preprune: preprune,
		postprune: postprune,
		prewalkDom: prewalkDom,
		postwalkDom: postwalkDom,
		prepruneDom: prepruneDom,
		postpruneDom: postpruneDom,
		isLeaf: isLeaf,
		leaves: leaves,
		clone: clone,
		flatten: flatten,
		walk: walk,
		walkInplace: walkInplace,
		walkDomInplace: walkDomInplace
	};
});
