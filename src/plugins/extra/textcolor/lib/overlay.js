define(['aloha/jquery'], function ($) {
	'use strict';

	var $DOCUMENT = $(document);
	var $WINDOW = $(window);

	/**
	 * Checks whether the overlay is visible.
	 *
	 * @param {Overlay} overlay
	 * @return {boolean}
	 *         True if the overlay is visible.
	 */
	function isOverlayVisible(overlay) {
		return overlay.$element.css('display') === 'table';
	}

	/**
	 * Prepares the overlay to close when a click event is triggered on the body
	 * document.
	 *
	 * @param {Overlay} overlay
	 */
	function hideOnDocumentClick(overlay, button) {
		$(document).on('click', function (event) {
			// Because click events on the overlay ui should not cause it to
			// hide itself.
			if (!overlay._active
					|| (event.target === overlay.$element[0])
					|| $(button).is(event.target)
					|| $(button).find(event.target).length) {
				return;
			}
			overlay.hide();
		});
	}

	/**
	 * Prepares the given overlay to close when the ESC button is clicked.
	 *
	 * @param {Overlay} overlay
	 */
	function hideOnEsc(overlay) {
		$DOCUMENT.keyup(function (event) {
			if ((27 === event.keyCode) && isOverlayVisible(overlay)) {
				overlay.hide();
			}
		});
	}

	/**
	 * Enables navigation through the overlay table with the arrow keys and
	 * select one with the enter key.
	 *
	 * @param {Overlay} overlay
	 * @param {Function(DOMObject)} onSelect Function to invoke when Enter is pressed.
	 */
	function movements(overlay, onSelect) {
		var blur = function blur($elem) {
			$elem.removeClass('focused');
		};
		var focus = function focus($elem) {
			$elem.addClass('focused');
		};
		var keys = {
			// ←┘
			13: function enter($current) {
				overlay.hide();
				focus($current);
				onSelect($current[0]);
			},
			// ←
			37: function left($current) {
				var $prev = $current.prev();
				if ($prev.length) {
					blur($current);
					focus($prev);
				}
			},
			// ↑
			38: function up($current) {
				var $prevRow = $current.parent().prev();
				if ($prevRow.length) {
					var $prev = $($prevRow.children()[$current.index()]);
					if ($prev.length) {
						blur($current);
						focus($prev);
					}
				}
			},
			// →
			39: function right($current) {
				var $next = $current.next();
				if ($next.length) {
					blur($current);
					focus($next);
				}
			},
			// ↓
			40: function down($current) {
				var $nextRow = $current.parent().next();
				if ($nextRow.length) {
					var $next = $($nextRow.children()[$current.index()]);
					if ($next.length) {
						blur($current);
						focus($next);
					}
				}
			}
		};
		$DOCUMENT.keydown(function (event) {
			event.stopPropagation();
			if (keys[event.keyCode] && isOverlayVisible(overlay)) {
				var $current = overlay.$element.find('.focused');
				if (0 === $current.length) {
					$current = overlay.$element.find('.selected');
				}
				keys[event.keyCode]($current);
				return false;
			}
		});
	}

	/**
	 * Calculates the offset at which to position the overlay element.
	 *
	 * @param {jQuery.<DOMObject>} $element
	 *        A DOM element around which to calculate the offset.
	 */
	function calculateOffset($element, positionStyle) {
		var offset = $element.offset();
		if ('fixed' === positionStyle) {
			offset.top -= $WINDOW.scrollTop();
			offset.left -= $WINDOW.scrollLeft();
		}
		return offset;
	}

	/**
	 * Populates the overlay with a table containing the given array of items.
	 *
	 * @param {Overlay} overlay
	 * @param {Array<String>} items
	 * @param {Function(DOMObject)} onSelect
	 */
	function populate(overlay, items, onSelect) {
		var table = ['<tr>'];
		var i = 0;
		var item = items[i];
		// add new rows depending on the number of items
		var newRowAtItems = items.length <= 37 ? 6 : items.length <= 145 ? 12 : 18;
		while (item) {
			if (0 !== i && (0 === (i % newRowAtItems))) {
				table.push('</tr><tr>');
			}
			table.push('<td unselectable="on">' + item + '</td>');
			item = items[++i];
		}
		table.push('</tr>');

		overlay.$element.find('tbody').empty().append(table.join(''));

		var $tds = overlay.$element.find('td');

		overlay.$element.on('mouseover', 'td', function () {
			$(this).addClass('focused');
		}).on('mouseout', 'td', function () {
			$tds.filter('td.focused').removeClass('focused');
		}).on('click', 'td', function () {
			overlay.$element.hide();
			onSelect(this);
		});
	}

	/**
	 * Overlay object.
	 *
	 * @param {Array<String>} items
	 * @param {Function(DOMObject)} onSelect
	 * @param {Button} button
	 * @type {Overlay}
	 */
	function Overlay(items, onSelect, button) {
		var overlay = this;
		overlay.$element = $(
			'<table unselectable="on" role="dialog"><tbody></tbody></table>'
		).appendTo('body');
		hideOnDocumentClick(overlay, button);
		hideOnEsc(overlay);
		movements(overlay, onSelect);
		populate(overlay, items, onSelect);
	}

	Overlay.prototype = {

		/**
		 * Shows the overlay at the given button's position.
		 */
		show: function (offset) {
			this.$element.css(offset).show();
			this._active = true;
		},

		/**
		 * Hides the overlay.
		 */
		hide: function () {
			this.$element.hide();
			this._active = false;
		}
	};

	Overlay.calculateOffset = calculateOffset;

	return Overlay;
});
