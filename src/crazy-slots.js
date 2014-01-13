/**
 * crazy-slots.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'arrays',
	'ranges',
	'dom/nodes',
	'boundaries',
	'undo',
	'functions'
], function CrazySlots(
	Arrays,
	Ranges,
	Nodes,
	Boundaries,
	Undo,
	Fn
) {
	'use strict';

	function repeat(value, n) {
		var result = new Array(n);
		var i;
		for (i = 0; i < n; i++) {
			result[i] = value;
		}
		return result;
	}

	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	function randomIntDecreasingProbability(min, max, tweak) {
		return Math.floor(Math.pow(Math.random(), tweak) * (max - min + 1)) + min;
	}

	function boundariesInElem(elem) {
		var children = Nodes.children(elem);
		return children.map(function (node, i) {
			return [elem, i];
		}).concat([[elem, children.length]]);
	}

	function randomRange(elem, boundaryProbability, distance) {
		var boundaries = Arrays.mapcat(boundariesInElem(elem), function (boundary) {
			return repeat(boundary, boundaryProbability(boundary));
		});
		var index = randomInt(0, boundaries.length - 1);
		var start = boundaries[index];
		if (null == distance) {
			distance = randomInt(0, boundaries.length - 1);
		}
		var end = boundaries[Math.min(index + distance(boundaries.length - 1),
		                              boundaries.length - 1)];
		var range = Ranges.fromBoundaries(start, end);
		Boundaries.setRange(range, start, end);
		return range;
	}

	function defaultBoundaryProbability(mutation, boundary) {
		return ((null != mutation.endOfLineProbability
		         && Boundaries.isAtEnd(boundary))
		        ? mutation.endOfLineProbability
		        : 1);
	}

	function deleteRangeDistance(deletesRange, totalDistance) {
		return randomIntDecreasingProbability(
			0,
			totalDistance,
			(deletesRange ? 4 : 2)
		);
	}

	function logException(fn) {
		try {
			fn();
		} catch (e) {
			console.log(e);
			return true;
		}
		return false;
	}

	function empty(elem) {
		Nodes.children(elem).forEach(function (child) {
			elem.removeChild(child);
		});
	}

	function replaceChildren(target, source) {
		empty(target);
		Nodes.children(source).forEach(function (child) {
			target.appendChild(child);
		});
	}

	function run(editable, mutations, opts) {
		opts = opts || {};
		var wait = opts.wait || 0;
		var initialElem = Nodes.clone(editable.elem);
		var maxRuns = (null != opts.runs ? opts.run : Number.POSITIVE_INFINITY);
		var runs = 0;
		var timeout;
		var lastLog = +new Date();
		mutations = Arrays.mapcat(mutations, function (mutation) {
			var probability = mutation.probability;
			return repeat(mutation, (null != probability ? probability : 1));
		});
		Undo.enter(editable.undoContext, {
			meta: {type: 'external'},
			partitionRecords: true
		});
		function mutate() {
			if (runs >= opts.runs) {
				return;
			}
			runs += 1;
			var mutation = mutations[randomInt(0, mutations.length - 1)];
			var boundaryProbability
				= Fn.partial(opts.boundaryProbability || defaultBoundaryProbability,
				             mutation);
			var distance = Fn.partial(deleteRangeDistance, mutation.deletesRange);
			var range = randomRange(editable.elem, boundaryProbability, distance);
			if (opts.continueOnError) {
				var error = logException(function () {
					mutation.mutate(editable.elem, range);
				});
				if (error) {
					replaceChildren(editable.elem, Nodes.clone(initialElem));
					editable.undoContext.stack.length = 0;
					editable.undoContext.frame = null;
					Undo.enter(editable.undoContext, {
						meta: {type: 'external'},
						partitionRecords: true
					});
				}
			} else {
				mutation.mutate(editable.elem, range);
			}
			timeout = window.setTimeout(mutate, wait);
			if (opts.log && 1000 < +new Date() - lastLog) {
				lastLog = +new Date();
				console.log('runs: ' + runs);
			}
		}
		timeout = window.setTimeout(mutate, wait);
		return function () {
			window.cancelTimeout(timeout);
		};
	}

	return {
		run       : run,
		randomInt : randomInt
	};
});
