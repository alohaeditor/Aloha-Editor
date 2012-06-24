define([
	'jquery',
	'aloha/jquery-ui',
	'css!./css/ribbon.css'
], function($){

	/**
	 * @param props button properties:
	 *        onclick - if provided will generate a split button,
	 *                  otherwise just a normal select button.
	 *        menu - array of props for nested buttons
	 *        label - button text
	 *        icon - button icon
	 *        siblingContainer
	 *             - a jQuery object that will be searched for other split buttons.
	 *               If a split button is expanded, all the other split buttons in
	 *               this container will be closed.
	 */
	function makeMenuButton(props) {
		var wrapper = $('<div>'   , {'class': 'aloha-ribbon-split'});
		var expand  = $('<button>', {'class': 'aloha-ribbon-expand'});
		var menu    = $('<ul>'    , {'class': 'aloha-ribbon-menu'});

		var action = null;
		var buttonset = null;
		if (props.onclick) {
			action = $('<button>', {'class': 'aloha-ribbon-action'})
				.text(props.label)
				.button()
				.click(props.onclick);
			buttonset = $('<div></div>')
				.buttonset()
				.append(action)
				.append(expand);
			if (props.icon) {
				action.button('option', 'icons', { 'primary': props.icon });
			}
		} else {
			expand.text(props.label);
		}

		expand
			.button({
				icons: { primary: 'aloha-jqueryui-icon ui-icon-triangle-1-s' }
			})
			.click(function(){
				if (props.siblingContainer) {
					props.siblingContainer
						.find('.aloha-ribbon-menu')
						.each(function(){
							if (this !== menu[0]) {
								$(this).hide();
							}
						});
				}
				if (menu.is(":visible")) {
					menu.hide();
					return;
				}
				menu.show().position({
					my: 'left top',
					at: 'left bottom',
					of: action || expand
				});
				$(window.document).bind('click', function(event){
					menu.hide();
					$(this).unbind(event);
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
				elem.data('aloha-ribbon-select', function(){
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
		return function(){
			// We must blur the parent menu otherwise it will remain in
			// focused state and not expand the next time it is hovered over
			// after the user has selected an item.
			menu.blur().hide();
			parentCloseHandler();
		};
	}

	function onSelect(event, ui) {
		var clickHandler = ui.item.data("aloha-ribbon-select");
		clickHandler && clickHandler(event, ui);
		// We use preventDefault() to keep a click on a menu item from
		// scrolling to the top of the page.
		event.preventDefault();
	}

	return {
		makeMenuButton: makeMenuButton
	};
});
