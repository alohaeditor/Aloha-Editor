// TODO: This code needs inline-documentation!
define([
	'aloha/core',
	'jquery'
], function (Aloha, jQuery) {
	var PADDING = 10;
	var ANIMATION_TIME = 500;
	var $window = jQuery(window);

	function floatTo($element, position, callback) {
		$element.stop().animate(position, ANIMATION_TIME, function () {
			callback(position);
		});
	}

	function floatAbove($element, position, callback) {
		position.top -= $element.height() + PADDING;
		floatTo($element, position, callback);
	}

	function floatBelow($element, position, callback) {
		position.top += PADDING;
		floatTo($element, position, callback);
	}

	function floatSurface(surface, editable, callback) {
		var $element = surface.$element;
		var surfaceOrientation = $element.offset();
		var editableOrientation = editable.obj.offset();
		var scrollTop = $window.scrollTop();
		var availableSpace = editableOrientation.top - scrollTop;
		var left = editableOrientation.left;
		var horizontalOverflow = (left + $element.width())
		                       - ($window.width() - PADDING);

		if (horizontalOverflow > 0) {
			left -= horizontalOverflow;
		}

		if (availableSpace >= $element.height()) {
			floatAbove($element, editableOrientation, callback);
		} else if (availableSpace + $element.height() > editable.obj.height()) {
			floatBelow($element, {
				top: editableOrientation.top + editable.obj.height(),
				left: left
			}, callback);
		} else {
			floatBelow($element, {
				top: scrollTop,
				left: left
			}, callback);
		}
	}

	function togglePinSurfaces(surfaces, position, isFloating) {
		var $elements = jQuery();
		var j = surfaces.length;
		while (j) {
			$elements = $elements.add(surfaces[--j].$element);
		}

		if (isFloating) {
			$elements.find('.aloha-ui-pin').removeClass('aloha-ui-pin-down');
			$elements.css({
				position: 'absolute',
				top: position.top
			});
		} else {
			$elements.find('.aloha-ui-pin').addClass('aloha-ui-pin-down');
			$elements.css({
				position: 'fixed',
				top: position.top - jQuery(window).scrollTop()
			});
		}
	}

	return {
		floatSurface: floatSurface,
		togglePinSurfaces: togglePinSurfaces
	};
});
