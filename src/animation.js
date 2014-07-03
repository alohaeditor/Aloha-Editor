/**
 * animation.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['functions'], function (Fn) {
	'use strict';

	var requestAnimationFrame = window.requestAnimationFrame
	                         || window.webkitRequestAnimationFrame
	                         || window.mozRequestAnimationFrame
	                         || window.oRequestAnimationFrame
	                         || window.msRequestAnimationFrame
	                         || function (fn) {window.setTimeout(fn, 1000/60);};

	function easeLinear(percent, elapsed, start, end, total) {
		return start + (end - start) * percent;
	}

	function easeOutQuint(x, t, b, c, d) {
		return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
	}

	function easeInOutQuint(x, t, b, c, d) {
		return ((t /= d / 2) < 1)
			 ? (c / 2 * t * t * t * t * t + b)
			 : (c / 2 * ((t -= 2) * t * t * t * t + 2) + b);
	}

	function step(state) {
		var now = new Date().getTime();
		if (!state.starttime) {
			state.starttime = now;
		}
		var elapsed = now - state.starttime;
		var percent = Math.min(1, elapsed / state.duration);
		var position = state.easing(percent, elapsed, 0, 1, state.duration);
		var abort = state.interval(state.start + (state.delta * position), percent);
		return abort ? 1 : percent;
	}

	function animate(start, end, easing, duration, interval) {
		var state = {
			start    : start,
			delta    : end - start,
			duration : duration || 1,
			interval : interval || Fn.noop,
			easing   : easing || easeOutQuint
		};
		(function tick() {
			if (step(state) < 1) {
				requestAnimationFrame(tick);
			}
		}());
		return state;
	}

	return {
		step                  : step,
		animate               : animate,
		easeLinear            : easeLinear,
		easeOutQuint          : easeOutQuint,
		easeInOutQuint        : easeInOutQuint,
		requestAnimationFrame : requestAnimationFrame
	};
});
