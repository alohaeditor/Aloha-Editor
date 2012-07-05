// TODO: This code needs inline-documentation!
define(['aloha/core', 'jquery'], function (Aloha, $) {
	'use strict';

	/**
	 * The distance the floating surface should remain from the editable it is
	 * floating to.
	 *
	 * @constant
	 * @type {string}
	 */
	var PADDING = 10;

	/**
	 * The length of time in milliseconds that the floating animation should
	 * take to complete.
	 *
	 * @constant
	 * @type {string}
	 */
	var DURATION = 500;

	/**
	 * Reference to the global window object for quicker lookup.
	 * @type {jQuery.<window>}
	 */
	var $window = $(window);

	/**
	 * Animates the given element into the specified position.
	 *
	 * @param {jQuery.<HTMLElement>} $element The element to move.
	 * @param {object} position The top and left position to which the element
	 *                         should be moved.
	 * @param {number} duration The length of time (in milliseconds) that the
	 *                         animation should run for.
	 * @param {function} callback Function to be invoked when animation
	 *                           completes.
	 */
	function floatTo($element, position, duration, callback) {
		$element.stop().animate(position, duration, function () {
			callback(position);
		});
	}

	/**
	 * Move the element above the given position.
	 *
	 * @param {jQuery.<HTMLElement>} $element The element to move.
	 * @param {object} position The top and left position to which the element
	 *                         should be moved.
	 * @param {number} duration The length of time (in milliseconds) that the
	 *                         animation should run for.
	 * @param {function} callback Function to be invoked when animation
	 *                           completes.
	 */
	function floatAbove($element, position, duration, callback) {
		position.top -= $element.height() + PADDING;
		floatTo($element, position, duration, callback);
	}

	/**
	 * Move the element below the given position.
	 *
	 * @param {jQuery.<HTMLElement>} $element The element to move.
	 * @param {object} position The top and left position to which the element
	 *                         should be moved.
	 * @param {number} duration The length of time (in milliseconds) that the
	 *                         animation should run for.
	 * @param {function} callback Function to be invoked when animation
	 *                           completes.
	 */
	function floatBelow($element, position, duration, callback) {
		position.top += PADDING;
		floatTo($element, position, duration, callback);
	}

	/**
	 * Cause the surface to float to the appropriate position around the given
	 * editable
	 *
	 * @param {Surface} surface The surface to be positioned
	 * @param {Aloha.Editable} editable The editable around which the surface
	 *                                  should be positioned.
	 * @param {number} duration The length of time (in milliseconds) for the
	 *                          animation should run.
	 * @param {function} callback Function to be invoked after the animation
	 *                            is completed.
	 */
	function floatSurface(surface, editable, duration, callback) {
		if (typeof duration !== 'number') {
			duration = DURATION;
		}

		var margin = parseInt($('body').css('marginTop'), 10) || 0;
		var $element = surface.$element;
		var surfaceOrientation = $element.offset();
		var editableOrientation = editable.obj.offset();
		var scrollTop = $window.scrollTop();
		var availableSpace = editableOrientation.top - scrollTop - margin;
		var left = editableOrientation.left;
		var horizontalOverflow = left + $element.width()
		                       - $window.width() - PADDING;

		if (horizontalOverflow > 0) {
			left -= horizontalOverflow;
		}

		if (availableSpace >= $element.height()) {
			editableOrientation.top -= scrollTop;
			floatAbove($element, editableOrientation, duration, callback);
		} else if (availableSpace + $element.height() >
			editableOrientation.top + editable.obj.height()) {
			floatBelow($element, {
				top: editableOrientation.top + editable.obj.height(),
				left: left
			}, duration, callback);
		} else {
			floatBelow($element, {
				top: margin,
				left: left
			}, duration, callback);
		}
	}

	/**
	 * Pins the given surfaces at the speficied position on the view port.
	 *
	 * @param {Surface} surfaces The surfaces that are to be pinned.
	 * @param {object} position The top and left position of where the surface
	 *                          is to be pinned.
	 * @param {boolean} isFloating Whether or not the surface type is in
	 *                             "floating" mode or not.
	 */
	function togglePinSurfaces(surfaces, position, isFloating) {
		var $elements = $();
		var j = surfaces.length;
		while (j) {
			$elements = $elements.add(surfaces[--j].$element);
		}

		if (isFloating) {
			$elements.find('.aloha-ui-pin').removeClass('aloha-ui-pin-down');
		} else {
			$elements.find('.aloha-ui-pin').addClass('aloha-ui-pin-down');
		}

		$elements.css({
			position: 'fixed',
			top: position.top
		});
	}

	return {
		floatSurface: floatSurface,
		togglePinSurfaces: togglePinSurfaces
	};
});
