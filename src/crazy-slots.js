/* crazy-slots.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['arrays', 'ranges', 'dom', 'boundaries'], function CrazySlots(Arrays, Ranges, Dom, Boundaries) {
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
		var children = Dom.children(elem);
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
		var range = Ranges.create();
		Dom.setRangeFromBoundaries(range, start, end);
		return range;
	}

	function defaultBoundaryProbability(mutation, boundary) {
		return ((null != mutation.endOfLineProbability
		         && Boundaries.atEnd(boundary))
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

	function run(elem, mutations, opts) {
		var wait = opts.wait || 0;
		var runs = 0;
		var timeout;
		mutations = Arrays.mapcat(mutations, function (mutation) {
			var probability = mutation.probability;
			return repeat(mutation, (null != probability ? probability : 1));
		});
		function mutate() {
			if (runs >= opts.runs) {
				return;
			}
			runs += 1;
			var mutation = mutations[randomInt(0, mutations.length - 1)];
			var boundaryProbability
				= (opts.boundaryProbability
				   || defaultBoundaryProbability).bind(null, mutation);
			var distance = deleteRangeDistance.bind(null, mutation.deletesRange);
			var range = randomRange(elem, boundaryProbability, distance);
			mutation.mutate(elem, range);
			timeout = window.setTimeout(mutate, wait);
		}
		timeout = window.setTimeout(mutate, wait);
		return function () {
			window.cancelTimeout(timeout);
		};
	}

	var exports = {
		run: run,
		randomInt: randomInt
	};

	return exports;
});
