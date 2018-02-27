define([
	'jquery',
	'ui/component',
	'ui/utils'
], function (
	$,
	Component,
	Utils
) {
	'use strict';

	/**
	 * The AccordionMenuButton is similar in use to the MenuButton, but is optimised for small screens and touch-based
	 * interfaces as it does not rely on hover interactions and resizes to fit the available vertical space.
	 */
	var AccordionMenuButton = Component.extend({
		init: function initAccordianMenuButton() {
			this.element = makeAccordionMenuButton(this);
		}
	});

	var MENU_CONTAINER_CLASS = 'aloha-ui-accordion-menu-container';
	var TRIGGER_BUTTON_CLASS = 'aloha-ui-accordion-menu-expand';
	var ACCORDION_WRAPPER_CLASS = 'aloha-ui-accordion-menu-wrapper';
	var CATEGORY_WRAPPER_CLASS = 'aloha-ui-accordion-menu-category';
	var CATEGORY_LABEL_CLASS = 'category-label';
	var CATEGORY_ITEMS_WRAPPER_CLASS = 'category-items-wrapper';
	var CATEGORY_ITEMS_LIST_CLASS = 'category-items';
	var LIST_VISIBLE_CLASS = 'items-visible';
	var ITEM_LINK_CLASS = 'item-link';

	/**
	 * @param props button properties:
	 *        * menu - array of props for nested buttons
	 *        * tooltip - tooltip text
	 *        * text - button text
	 *        * html - button html
	 *        * iconUrl - button icon url
	 */
	function makeAccordionMenuButton(props) {
		var container = $('<div>', { class: MENU_CONTAINER_CLASS + ' aloha-ui-menubutton-container'});
		var triggerButton  = Utils.makeButtonElement({ class: TRIGGER_BUTTON_CLASS + ' aloha-ui-menubutton-expand aloha-ui-menubutton-single'});
		var categoryMenus = [];
		var heightWithAllCollapsed = 0;

		Utils.makeButton(triggerButton, props, true);

		if (props.tooltip) {
			container.children('[title]').removeAttr('title').end()
				.attr('title', props.tooltip)
				.tooltip({
					tooltipClass: 'aloha aloha-ui-tooltip',
					position: {
						my: 'left top',
						at: 'right bottom'
					}
				});
		}

		var $accordionWrapper = $('<div></div>', { class: ACCORDION_WRAPPER_CLASS });
		for (var i = 0; i < props.menu.length; i++) {
			var categoryMenu = new CategoryMenu(props.menu[i]);
			$accordionWrapper.append(categoryMenu.$element);
			categoryMenus.push(categoryMenu);
		}

		$accordionWrapper.on('click', function(event) {
			if ($(event.target).hasClass(ITEM_LINK_CLASS)) {
				// A tag link was clicked
				closeAccordion();
			} else {
				// An accordion category was clicked
				$.each(categoryMenus, function (index, categoryMenu) {
					var clickedWrapper = $(event.target).closest('.' + CATEGORY_WRAPPER_CLASS).get(0);
					var currentWrapper = categoryMenu.$element.get(0);
					if (currentWrapper !== clickedWrapper) {
						categoryMenu.collapse();
					} else {
						categoryMenu.expand(heightWithAllCollapsed);
					}
				});
				event.stopPropagation();
			}
		});

		triggerButton.click(function (event) {
			if ($accordionWrapper.is(':visible')) {
				closeAccordion();
			} else {
				openAccordion();
				event.stopPropagation();
			}
		});

		function closeAccordion() {
			$accordionWrapper.hide();
			container.tooltip('enable');
			$.each(categoryMenus, function(index, categoryMenu) {
				categoryMenu.collapse();
			});
			$(document).off('click', closeAccordion);
			$accordionWrapper.css('max-width', 'initial');
		}

		function openAccordion() {
			$accordionWrapper.show().position({
				my: 'left top',
				at: 'left bottom',
				of: triggerButton
			});
			heightWithAllCollapsed = $accordionWrapper.height();
			container.tooltip('disable');
			$(document).on('click', closeAccordion);
			$accordionWrapper.css('max-width', $accordionWrapper.width());
		}

		container.append(triggerButton).append($accordionWrapper);
		$accordionWrapper.hide();
		return container;
	}

	/**
	 * A constructor function which returns a CategoryMenu object which abstracts away the creation and
	 * manipulation of one sub-menu of the accordion.
	 *
	 * @param category
	 * @return {{$element: *|jQuery|HTMLElement, collapse: collapse, expand: expand}}
	 * @constructor
	 */
	function CategoryMenu(category) {
		var $category = $('<div></div>', { class: CATEGORY_WRAPPER_CLASS })
			.append(
				$('<div></div>', { class: CATEGORY_LABEL_CLASS }).text(category.text)
			);
		var $listWrapper = $('<div></div>', { class: CATEGORY_ITEMS_WRAPPER_CLASS });
		var $list = $('<ul></ul>', { class: CATEGORY_ITEMS_LIST_CLASS });

		for (var j = 0; j < category.menu.length; j++) {
			var item = category.menu[j];
			var $item = $('<li></li>');
			$item.append($('<a>', {
				class: ITEM_LINK_CLASS,
				href: 'javascript:void 0',
				html: Utils.makeButtonLabelWithIcon(item)
			}));
			if (typeof item.click === 'function') {
				$item.on('click', item.click);
			}
			$list.append($item);
		}

		$listWrapper.append($list);
		$category.append($listWrapper);

		function collapse() {
			$listWrapper.css('max-height', 0);
			$listWrapper.removeClass(LIST_VISIBLE_CLASS);
		}

		function expand(wrapperHeight) {
			var MARGIN = 10;
			var itemsListHeight = parseInt($listWrapper.find('.' + CATEGORY_ITEMS_LIST_CLASS).outerHeight(true));
			var wrapperRect = $listWrapper.closest('.' + ACCORDION_WRAPPER_CLASS).get(0).getBoundingClientRect();
			var availableHeight = window.innerHeight - wrapperRect.top - wrapperHeight - MARGIN;
			var maxHeight = itemsListHeight < availableHeight ? itemsListHeight : availableHeight;
			$listWrapper.css('max-height', maxHeight + 'px');
			$listWrapper.addClass(LIST_VISIBLE_CLASS);
		}

		return {
			$element: $category,
			collapse: collapse,
			expand: expand
		};
	}

	return AccordionMenuButton;
});
