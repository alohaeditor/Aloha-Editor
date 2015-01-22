(function ($) {
	'use strict';

	var VENDOR_PREFIX = (function () {
		var elem = document.createElement('div');
		var prefixes = ['', '-webkit-', '-moz-', '-ms-', '-o-'];
		var style = elem.style;
		for (var i = 0; i < prefixes.length; i++) {
			if (style.hasOwnProperty(prefixes[i] + 'transform')) {
				return prefixes[i];
			}
		}
		return '';
	}());

	var $window = $(window);

	var state = {
		offsets  : [],
		viewport : {width: 0, height: 0}
	};

	function onresize() {
		state.offsets = [];
		state.viewport = {
			width  : $window.width(),
			height : $window.height()
		};
		$('.rainbow').each(function (i, elem) {
			var $elem = $(elem);
			var offset = $elem.offset().top;
			state.offsets.push([offset, offset + $elem.height(), $elem.find('.bg')]);
		});
	}

	function delayed(fn, delay) {
		var timeout = null;
		return function () {
			if (timeout) {
				clearTimeout(timeout);
			}
			timeout = setTimeout(fn, delay);
		};
	}

	$(function () {
		if (0 < $('.rainbow .bg').length) {
			window.requestAnimationFrame(function parallax() {
				var yStart = $window.scrollTop();
				var yEnd = yStart + state.viewport.height;
				state.offsets.forEach(function (offsets, index) {
					if (offsets[0] < yEnd && offsets[1] > yStart) {
						var position = Math.round(yStart - offsets[0]);
						if (0 === index) {
							position /= 5;
							var tilt = Math.round(90 * (yStart / offsets[1]));
							offsets[2].css(
								VENDOR_PREFIX + 'transform',
								'translate3d(0,' + position + 'px,' + position + 'px) rotate3d(1,0,0,' + tilt + 'deg)'
							);
						} else {
							offsets[2].css(
								VENDOR_PREFIX + 'transform',
								'translate3d(0,' + (position / 2) + 'px,0)'
							);
						}
					}
				});
				window.requestAnimationFrame(parallax);
			});
			$window.on('resize', delayed(onresize, 50));
			onresize();
			setTimeout(function () {
				state.offsets[0][2].parent().css(VENDOR_PREFIX + 'perspective', '1000px');
			}, 1300);
		}

		var $items = $('.rainbow,.rainbow-static');

		setInterval((function colorcycle() {
			var colors = [
				'#54c8eb', // light blue
				'#4ea9de', // med blue
				'#4b97d2', // dark blue
				'#92cc8f', // light green
				'#41bb98', // mint green
				//'#c9de83', // yellowish green
				//'#dee569', // yellowisher green (too light)
				'#c891c0', // light purple
				//'#9464a8', // med purple (too light)
				'#7755a1', // dark purple
				'#f069a1', // light pink
				'#f05884', // med pink
				'#e7457b', // dark pink
				'#ffd47e', // peach
				'#f69078'  // salmon
			];
			$items.css('background-color', colors[Math.round(Math.random() * (colors.length - 1))]);
			return colorcycle;
		}()), 8000);
	});

}(window.jQuery));
