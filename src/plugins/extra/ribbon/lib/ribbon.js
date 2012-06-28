define([
	'jquery',
	'aloha/jquery-ui',
	'css!./css/ribbon.css'
], function ($) {
	'use strict';

	/**
	 * @param props button properties:
	 *        onclick - if provided will generate a split button,
	 *                  otherwise just a normal select button.
	 *        menu - array of props for nested buttons
	 *        label - button text
	 *        icon - button icon
	 *        siblingContainer
	 *             - a $ object that will be searched for other split buttons.
	 *               If a split button is expanded, all the other split buttons in
	 *               this container will be closed.
	 */
	function makeMenuButton(props) {
		var wrapper = $('<div>'   , {'class': 'aloha-ui-menubutton-container'});
		var expand  = $('<button>', {'class': 'aloha-ui-menubutton-expand'});
		var menu    = $('<ul>'    , {'class': 'aloha-ui-menubutton-menu'});
		var action = null;
		var buttonset = null;

		if (props.onclick) {
			action = $('<button>', {'class': 'aloha-ui-menubutton-action'})
				.text(props.label)
				.button()
				.click(props.onclick);

			buttonset = $('<div>')
				.buttonset()
				.append(action)
				.append(expand);

			if (props.icon) {
				action.button('option', 'icons', {'primary': props.icon});
			}
		} else {
			expand.text(props.label)
			      .addClass('aloha-ui-menubutton-single');
		}

		function hideMenu(menu) {
			$(menu).hide().parent().removeClass('aloha-ui-menubutton-pressed');
		}

		expand
			.button({
				icons: {primary: 'aloha-jqueryui-icon ui-icon-triangle-1-s'}
			})
			.click(function (){
				wrapper.addClass('aloha-ui-menubutton-pressed');

				if (props.siblingContainer) {
					props.siblingContainer
						.find('.aloha-ui-menubutton-menu')
						.each(function (){
							if (this !== menu[0]) {
								hideMenu(this);
							}
						});
				}

				if (menu.is(':visible')) {
					hideMenu(menu);
					return;
				}

				menu.show().position({
					my: 'left top',
					at: 'left bottom',
					of: action || expand
				});

				// In order to prevent the floating menu from being partially
				// covered by the ribbon, we use "position: relative" and an
				// invisible border to pad the top of the document.  This
				// throws off the offset to the menu button so we need to
				// compensate in ordet to ensure that the menu is placed
				// underneatht the menubutton.
				var target = action || expand;
				var bodyOffset = parseInt($('body').css('border-top-width'), 10) || 0;
				menu.css('top', target.height() + target.offset().top + bodyOffset);

				$(document).bind('click', function (event){
					menu.hide();
					$(this).unbind(event);
					wrapper.removeClass('aloha-ui-menubutton-pressed');
				});

				return false;
			});

		wrapper.append(buttonset || expand).append(menu);

		menu.append(makeNestedMenus(makeCloseHandler(menu), props.menu));

		menu.hide().menu({
			'select': onSelect
		});

		return wrapper;
	}

	function makeNestedMenus(parentCloseHandler, menu){
		var elems = [];
		for (var i = 0; i < menu.length; i++) {
			var item = menu[i];
			var elem = $('<li>');
			elem.append($('<a>', {'href': 'javascript:void 0', 'text': item.label}));
			if (item.onclick) {
				elem.data('aloha-ribbon-select', function (){
					parentCloseHandler();
					item.onclick();
				});
			}
			if (item.menu) {
				var nestedMenu = $('<ul>').appendTo(elem);
				nestedMenu.append(
					makeNestedMenus(makeCloseHandler(nestedMenu, parentCloseHandler),
									item.menu));
			}
			elems.push(elem[0]);
		}
		return elems;
	}

	function makeCloseHandler(menu, parentCloseHandler) {
		parentCloseHandler = parentCloseHandler || $.noop;
		return function (){
			// We must blur the parent menu otherwise it will remain in
			// focused state and not expand the next time it is hovered over
			// after the user has selected an item.
			menu.blur().hide();
			menu.parent().removeClass('aloha-ui-menubutton-pressed');
			parentCloseHandler();
		};
	}

	function onSelect(event, ui) {
		var clickHandler = ui.item.data('aloha-ribbon-select');
		clickHandler && clickHandler(event, ui);
		// We use preventDefault() to keep a click on a menu item from
		// scrolling to the top of the page.
		event.preventDefault();
	}

	return {
		makeMenuButton: makeMenuButton
	};
});
