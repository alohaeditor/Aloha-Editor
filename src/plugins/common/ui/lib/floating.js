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

		$element.css('top', position.top + 'px');
		$element.css('left', position.left + 'px');
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
		position.top -= $element.height() + DISTANCE;
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
	 * Retreive the persisted pinned position of the FloatingMenu surface.
	 *
	 * TODO: can this be removed?
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
		} else if (top > $WINDOW.height()) {
			top = $WINDOW.height() / 2;
		}

		if (left < 0) {
			left = 0;
		} else if (left > $WINDOW.width()) {
			left = $WINDOW.width() / 2;
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
		var $surface = surface.$element;
		var offset = editable.obj.offset();
		var top = offset.top;
		var left = offset.left;
		var scrollTop = $WINDOW.scrollTop();
		var scrollLeft = $WINDOW.scrollLeft();
		var availableSpace = top - scrollTop - topGutter;
		// consider horizontal scrolling (important for rtl pages that are scrolled to the left)
		left = left - scrollLeft;
		var horizontalOverflow = left + $surface.width() - $WINDOW.width();

		if (horizontalOverflow > 0) {
			left = Math.max(0, left - horizontalOverflow);
		}

		// never ever float outside of the visible area (to the left)
		left = Math.max(0, left);

		if (sticky) {
			if (availableSpace >= $surface.height()) {
				$surface.css('position', 'absolute');
				$surface.css('top', (top - $surface.height() - DISTANCE) + 'px');
			} else if ($surface.height() > editable.obj.outerHeight()
				// TODO: decide whether to remove or enable to fixate the toolbar.
				//	&& top + editable.obj.outerHeight() + DISTANCE - scrollTop >= topGutter
				) {
				$surface.css('position', 'absolute');
				$surface.css('top', top + editable.obj.outerHeight() + DISTANCE + 'px');
			} else {
				$surface.css('position', 'fixed');
				$surface.css('top', topGutter + 'px');
			}

			$surface.css('left', left + 'px');
		} else {
			if (availableSpace >= $surface.height()) {
				floatAbove($surface, {
					top: top - scrollTop,
					left: left
				}, duration, callback);
			} else if (availableSpace + $surface.height() >
			           availableSpace + editable.obj.height()) {
				floatBelow($surface, {
					top: top + editable.obj.height() - scrollTop,
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
	 * @TODO:
	 * Resizable toolbars are possible, and would be a nice feature:
	 * surface.$element.resizable();
	 *
	 * @param {Surface} surface A UI Surface instance.
	 * @param {object} SurfaceTypeManager
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
		});

		surface.addPin();
		setPositionStyleToFixed(surface, positionStyle);

		if (!SurfaceTypeManager.isFloatingMode) {
			updateSurfacePosition();
		}

		if (typeof positionStyle == 'undefined') {
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
		togglePinSurface: togglePinSurface,
		POSITION_STYLE: POSITION_STYLE
	};
});
