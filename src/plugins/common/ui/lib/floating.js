/* floating.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
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
 *
 * @overview
 * Implements position and floating animation effect for UI surfaces.
 */
define([
	'jquery',
	'aloha/core',
	'ui/surface',
	'ui/subguarded',
	'PubSub',
	'vendor/amplify.store',
	'util/browser'
], function (
	$,
	Aloha,
	Surface,
	subguarded,
	PubSub,
	amplifyStore,
	Browser
) {
	'use strict';

	/**
	 * The distance that the floating surface should maintain from the editable
	 * it is floating to.
	 *
	 * @type {string}
	 * @const
	 */
	var DISTANCE = 10;

	/**
	 * The width of viewport below which we consider the device to have a "small screen", i.e. a mobile device.
	 * @type {number}
	 * @const
	 */
	var SMALL_SCREEN_WIDTH = 600;

	/**
	 * The duration of the floating animation in milliseconds.
	 *
	 * @type {number}
	 * @const
	 */
	var DURATION = 500;

	/**
	 * jQuery unit set containing a feference to the global window.
	 *
	 * @type {jQuery.<window>}
	 * @const
	 */
	var $WINDOW = $(window);

	/**
	 * The "position" style value.
	 *
	 * IE 7 does not support "fixed" position styling.  Since "fixed" position
	 * results in smoother animation the use of "absolute" is made as a special
	 * accomodation for IE 7.
	 *
	 * @type {string}
	 * @const
	 */
	var POSITION_STYLE = Browser.ie7 ? 'absolute' : 'fixed';

	/**
	 * The position of the floating menu.
	 *
	 * Used to float dialoges (eg special character-picker) with the floating
	 * menu.
	 *
	 * @type {object<string,*>}
	 */
	var POSITION = {
		style: POSITION_STYLE,
		offset: {
			top: 0,
			left: 0
		}
	};

	/**
	 * Data attributes used to restore the css styles of the <body> element after it has
	 * been adjusted to accomodate the responsive floating toolbar.
	 */
	var BODY_ORIGINAL_MARGIN_TOP_KEY = 'aloha-editable-original-margin-top';
	var BODY_ORIGINAL_TRANSFORM_KEY = 'aloha-editable-original-transform';
	var BODY_ORIGINAL_TRANSITION_KEY = 'aloha-editable-original-transition';

	/**
	 * Keeps track of the adjustment made to the <body> marginTop css style.
	 * @type {number}
	 */
	var bodyMarginTopAdjustment = 0;

	/**
	 * Timer value used in cancelling the setTimeout which is used to properly synchronize
	 * the removal of adjusted css values on the <body> element.
	 * @type {number}
	 */
	var resetBodyTransitionTimeout = 0;

	/**
	 * Animates a surface element to the given position.
	 *
	 * @param {jQuery.<HTMLElement>} $element jQuery unit set of the DOM
	 *                                        element to move.
	 * @param {object} position The x and y position to which the element
	 *                          should end up.
	 * @param {number} duration The length of time (in milliseconds) that the
	 *                          animation should run for.
	 * @param {function} callback Function to be invoked when animation
	 *                            completes.
	 */
	function floatTo($element, position, duration, callback) {
		if ('absolute' === POSITION_STYLE) {
			position.top += $WINDOW.scrollTop();
			position.left += $WINDOW.scrollLeft();
		}

		POSITION.offset = position;

		$element.stop().animate(position, duration, function () {
			callback(position);
			PubSub.pub('aloha.floating.changed', {
				position: $.extend({}, POSITION)
			});
		});
	}

	/**
	 * Moves an element above the given coordinates.
	 *
	 * @param {jQuery.<HTMLElement>} $element jQuery unit set of the DOM
	 *                                        element to move.
	 * @param {object} position The x and y position to which the element
	 *                          should end up.
	 * @param {number} duration The length of time (in milliseconds) that the
	 *                          animation should run for.
	 * @param {function} callback Function to be invoked when animation
	 *                            completes.
	 */
	function floatAbove($element, position, duration, callback) {
		position.top -= parseInt($element.css("height")) + DISTANCE;
		floatTo($element, position, duration, callback);
	}

	/**
	 * Moves the element below the given coordinates.
	 *
	 * @param {jQuery.<HTMLElement>} $element jQuery unit set of the DOM
	 *                                        element to move.
	 * @param {object} position The x and y position to which the element
	 *                          should end up.
	 * @param {number} duration The length of time (in milliseconds) that the
	 *                          animation should run for.
	 * @param {function} callback Function to be invoked when animation
	 *                            completes.
	 */
	function floatBelow($element, position, duration, callback) {
		position.top += DISTANCE;
		floatTo($element, position, duration, callback);
	}

	/**
	 * Persist the "top" and "left" positions of the FloatingMenu surface.
	 */
	function storePinPosition(offset) {
		amplifyStore.store('Aloha.FloatingMenu.pinned', 'true');
		amplifyStore.store('Aloha.FloatingMenu.top', offset.top);
		amplifyStore.store('Aloha.FloatingMenu.left', offset.left);
	}

	/**
	 * Clears persisted state of the FloatingMenu surface.
	 */
	function unstorePinPosition() {
		amplifyStore.store('Aloha.FloatingMenu.pinned', null);
		amplifyStore.store('Aloha.FloatingMenu.top', null);
		amplifyStore.store('Aloha.FloatingMenu.left', null);
	}

	/**
	 * Retrieve the persisted pinned position of the FloatingMenu surface.
	 *
	 * @return {object}
	 */
	function getPinState() {
		if (amplifyStore.store('Aloha.FloatingMenu.pinned') === 'true') {
			return {
				top: parseInt(amplifyStore.store('Aloha.FloatingMenu.top'), 10),
				left: parseInt(amplifyStore.store('Aloha.FloatingMenu.left'), 10),
				isPinned: true
			};
		}
		return {
			top: null,
			left: null,
			isPinned: false
		};
	}

	/**
	 * Constrains the given position coordinates to be within the viewport.
	 *
	 * @param {object} position "Top" and "left" coordinates.
	 * @param {object} Constrained "top" and "left" coordinates.
	 */
	function forcePositionIntoWindow(position) {
		var left = position.left;
		var top = position.top;

		if (top < 0) {
			top = 0;
		} else if (top > parseInt($WINDOW.css("height"))) {
			top = parseInt($WINDOW.css("height")) / 2;
		}

		if (left < 0) {
			left = 0;
		} else if (left > parseInt($WINDOW.css("width"))) {
			left = parseInt($WINDOW.css("width")) / 2;
		}

		return {
			top: top,
			left: left
		};
	}

	/**
	 * Floats a surface to the appropriate position around the given editable.
	 *
	 * @param {Surface} surface The surface to be positioned.
	 * @param {Aloha.Editable} editable The editable around which the surface
	 *                                  should be positioned.
	 * @param {number} duration The length of time (in milliseconds) for the
	 *                          animation should run.
	 * @param {function} callback Function to be invoked after the animation
	 *                            is completed.
	 */
	function floatSurface(surface, editable, duration, callback) {
		var sticky = duration === false;
		if (typeof duration !== 'number') {
			duration = DURATION;
		}

		var topGutter = (parseInt($('body').css('marginTop'), 10) || 0)
			+ (parseInt($('body').css('paddingTop'), 10) || 0);
		if ($WINDOW.width() <= SMALL_SCREEN_WIDTH) {
			topGutter = 0;
		}
		var $surface = surface.$element;
		var offset = editable.obj.offset();
		var top = offset.top;
		var left = offset.left;
		var scrollTop = $WINDOW.scrollTop();
		var scrollLeft = $WINDOW.scrollLeft();
		var availableSpace = top - scrollTop - topGutter - bodyMarginTopAdjustment;
		// consider horizontal scrolling (important for rtl pages that are scrolled to the left)
		left = left - scrollLeft;
		var horizontalOverflow = left + parseInt($surface.css("width")) - $WINDOW.width();

		if (horizontalOverflow > 0) {
			left = Math.max(0, left - horizontalOverflow);
		}

		// never ever float outside of the visible area (to the left)
		left = Math.max(0, left);

		var editableVisible = top - scrollTop < $WINDOW.height()
			&& top + parseInt(editable.obj.css("height")) >= scrollTop;

		if (editableVisible) {
			if (!$surface.is(':visible')) {
				$surface.show();
			}
		} else {
			if ($surface.is(':visible')) {
				$surface.hide();
			}

			return;
		}

		if (sticky) {
			var $editableElement = editable.obj;
			var $body = $(document.body);
			$surface.css('margin-top', '0');
			resetBodyStyles();

			var recalculatedTop = editable.obj.offset().top;

			if (availableSpace >= parseInt($surface.css("height"))) {
				$surface.css('position', 'absolute');
				$surface.css('top', (recalculatedTop - parseInt($surface.css("height")) - DISTANCE) + 'px');
			} else if (parseInt($surface.css("height")) > parseInt(editable.obj.css("height"))+parseInt(editable.obj.css("padding-top"))+parseInt(editable.obj.css("padding-bottom"))) {
				if (bodyMarginTopAdjustment) {
					// the body css had been adjusted but now is reverting to the initial state after a timeout.
					bodyMarginTopAdjustment = 0;
					recalculatedTop -= parseInt($surface.css("height"));
				}
				$surface.css('position', 'absolute');
				$surface.css('top', recalculatedTop + parseInt(editable.obj.css("height"))+parseInt(editable.obj.css("padding-top"))+parseInt(editable.obj.css("padding-bottom")) + DISTANCE + 'px');
			} else {
				var bodyOriginalMarginTop = parseInt($body.data(BODY_ORIGINAL_MARGIN_TOP_KEY) || 0);
				var editableTop = $editableElement.offset().top - parseInt($body.css('margin-top')) - bodyOriginalMarginTop;
				var toolbarHeight = parseInt($surface.css("height"));
				if (editableTop < toolbarHeight && window.scrollY === 0) {
					clearTimeout(resetBodyTransitionTimeout);
					adjustBodyStyles(toolbarHeight);
					$surface.css('margin-top', (toolbarHeight * -1) + 'px');
					$surface.css('top', '0');
				} else {
					$surface.css('position', 'fixed');
					$surface.css('top', topGutter + 'px');
				}
			}
			$surface.css('left', left + 'px');
		} else {
			if (availableSpace >= parseInt($surface.css("height"))) {
				floatAbove($surface, {
					top: top - scrollTop,
					left: left
				}, duration, callback);
			} else if (availableSpace + parseInt($surface.css("height")) >
				availableSpace + parseInt(editable.obj.css("height"))) {
				floatBelow($surface, {
					top: top + parseInt(editable.obj.css("height")) - scrollTop,
					left: left
				}, duration, callback);
			} else {
				floatBelow($surface, {
					top: topGutter,
					left: left
				}, duration, callback);
			}
		}
	}

	function removeResponsiveStyles() {
		resetBodyStyles();
	}

	/**
	 * When in responsiveMode, the toolbar's position cannot be adjusted by the user with drag & drop.
	 * @param toolbarHeight
	 */
	function adjustBodyStyles(toolbarHeight) {
		var body = document.body;
		var $body = $(body);
		if ($body.data(BODY_ORIGINAL_MARGIN_TOP_KEY) === undefined) {
			$body.data(BODY_ORIGINAL_MARGIN_TOP_KEY, body.style.marginTop);
		}
		if ($body.data(BODY_ORIGINAL_TRANSFORM_KEY) === undefined) {
			$body.data(BODY_ORIGINAL_TRANSFORM_KEY, body.style.transform);
		}
		if ($body.data(BODY_ORIGINAL_TRANSITION_KEY) === undefined) {
			$body.data(BODY_ORIGINAL_TRANSITION_KEY, body.style.transition);
		}
		$body.css('margin-top', toolbarHeight + 'px');
		$body.css('transform','translateZ(0)');
		$body.css('transition', 'margin-top 0.3s');
		bodyMarginTopAdjustment = toolbarHeight;
	}

	/**
	 * When in responsiveMode, the <body> css may have been adjusted in order to allow the toolbar to fit above
	 * the editable without overlapping. If so, this method ensures those css adjustments are cleaned up and
	 * the <body> element is returned to its original state.
	 */
	function resetBodyStyles() {
		var $body = $(document.body);
		var initialMarginTop = $body.data(BODY_ORIGINAL_MARGIN_TOP_KEY);
		var initialTransform = $body.data(BODY_ORIGINAL_TRANSFORM_KEY);
		var initialTransition = $body.data(BODY_ORIGINAL_TRANSITION_KEY);
		if (typeof initialMarginTop !== 'undefined') {
			$body.css('margin-top', initialMarginTop);
		}
		clearTimeout(resetBodyTransitionTimeout);
		// Wrap in a setTimeout to allow time for the margin to animate
		resetBodyTransitionTimeout = setTimeout(function() {
			$body.css('transition', initialTransition);
			$body.css('transform', initialTransform);
			bodyMarginTopAdjustment = 0;
		}, 300);
	}

	/**
	 * Pins a surface at the speficied position on the viewport.
	 *
	 * @param {Surface} surfaces The surfaces that are to be pinned.
	 * @param {object} position The "top" and "left" position of where the
	 *                          surface is to be pinned.
	 * @param {boolean} isFloating Whether or not the surface type is in
	 *                             "floating" mode or not.
	 */
	function togglePinSurface(surface, position, isFloating) {
		var $surface = surface.$element;
		if (isFloating) {
			unstorePinPosition();
			$surface.find('.aloha-ui-pin').removeClass('aloha-ui-pin-down');
		} else {
			storePinPosition(position);
			$surface.find('.aloha-ui-pin').addClass('aloha-ui-pin-down');
		}
		$surface.css({
			position: 'fixed',
			top: position.top
		});
	}

	/**
	 * Filters surface activation events.
	 */
	function onActivatedSurface(tuples, eventName, $event, range, nativeEvent) {
		var i;
		for (i = 0; i < tuples.length; i++) {
			if (tuples[i][0].isActive()) {
				tuples[i][1]($event, range, nativeEvent);
			}
		}
	}

	/**
	 * Sets the surface's DOM element's "position" property to "fixed."
	 *
	 * IE7 will not properly set the position property to "fixed" if our
	 * element is not rendered.  We therefore have to do a rigmarole to
	 * temorarily render the element in order to set the position correctly.
	 *
	 * @param {Surface} surface
	 */
	function setPositionStyleToFixed(surface, positionStyle) {
		if (typeof positionStyle == 'undefined') {
			positionStyle = POSITION_STYLE;
		}

		if ($.browser.msie) {
			var $parent = surface.$element.parent();
			surface.$element.appendTo('body');
			surface.$element.css('position', positionStyle);
			if ($parent.length) {
				surface.$element.appendTo($parent);
			} else {
				surface.$element.detach();
			}
		} else {
			surface.$element.css('position', positionStyle);
		}
	}

	/**
	 * Binds floating facilities on a surface.
	 *
	 * @param {Surface} surface A UI Surface instance.
	 * @param {object} SurfaceTypeManager
	 * @param {string} positionStyle - A valid CSS position value - "fixed", "absolute", "relative".
	 */
	function makeFloating(surface, SurfaceTypeManager, positionStyle) {
		subguarded([
			'aloha-selection-changed',
			'aloha.ui.container.selected'
		], onActivatedSurface, surface, function () {
			surface._move();
		});

		var updateSurfacePosition = function () {
			var position = forcePositionIntoWindow({
				top: SurfaceTypeManager.pinTop,
				left: SurfaceTypeManager.pinLeft
			});
			SurfaceTypeManager.setFloatingPosition(position);
			surface.$element.css({
				top: position.top,
				left: position.left
			});
		};

		$WINDOW.scroll(function () {
			// TODO: only do this for active surfaces.
			surface._move(0);
		});

		$WINDOW.resize(function () {
			if (!SurfaceTypeManager.isFloatingMode) {
				updateSurfacePosition();
			}
			surface.reposition();
		});

		surface.addPin();
		setPositionStyleToFixed(surface, positionStyle);

		if (!SurfaceTypeManager.isFloatingMode) {
			updateSurfacePosition();
		}

		if (typeof positionStyle === 'undefined') {
			surface.$element.css('z-index', 10100).draggable({
				distance: 20,
				stop: function (event, ui) {
					SurfaceTypeManager.setFloatingPosition(ui.position);
					if (!SurfaceTypeManager.isFloatingMode) {
						storePinPosition(ui.position);
					}
				}
			});
		}
	}

	return {
		getPinState: getPinState,
		makeFloating: makeFloating,
		floatSurface: floatSurface,
		removeResponsiveStyles: removeResponsiveStyles,
		togglePinSurface: togglePinSurface,
		POSITION_STYLE: POSITION_STYLE
	};
});
