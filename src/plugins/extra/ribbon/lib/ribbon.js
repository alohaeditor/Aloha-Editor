define([
 'aloha/jquery',
 'order!aloha/jquery-ui',
/* The menu and menubar versions distributed with Aloha
  * (jquery-ui-1.9m6) have a bug. See jquery.ui.menu for more
  * information.
  * TODO: these includes should be removed once the bug is fixed in the
  * jquery-ui version released with Aloha */
 'order!ribbon/vendor/jquery.ui.menu',
 'order!ribbon/vendor/jquery.ui.menubar',
 /* TODO fixing the style is still an open issue. If the new CSS files
  * are not needed, remove them.
 'css!ribbon/vendor/jquery.ui.menu.css',
 'css!ribbon/vendor/jquery.ui.menubar.css',*/
 'order!css!./css/ribbon.css'
], function($){

	function onSelect(event, ui) {
		var clickHandler = ui.item.data("aloha-ribbon-click-handler");
		clickHandler && clickHandler(event, ui);
		// We use preventDefault() to keep a click on a menu item from
		// scrolling to the top of the page.
		event.preventDefault();
	}

	function setupButton(parentElem, props) {
		var elem = $("<li></li>")
			.appendTo(parentElem)
			.append('<a href="#">' + props.label + '</a>');
		if (props.onclick) {
			elem.data("aloha-ribbon-click-handler", props.onclick);
		}
		if (props.menu) {
			var subMenu = $("<ul></ul>").appendTo(elem);
			for (var i = 0; i < props.menu.length; i++) {
				setupButton(subMenu, props.menu[i]);
			}
		}
	}

	function makeSplitButton(props) {
		var action = $('<button></button>');
		var expand = action.clone();
		var buttonset = $('<div></div>');
		var menu = $('<ul></ul>');
		var wrapper = buttonset.clone().addClass("aloha-ribbon-split-button");

		if (props.icon) {
			action.append($('<img></img>').attr('src', props.icon));
		}

		action
			.text(props.label)
			.button()
			.click(props.onclick);

		expand
			.button({
				text: false, icons: { primary: 'ui-icon-triangle-1-s' }
			})
			.click(function(){
				menu.show().position({
					my: 'left top',
					at: 'left bottom',
					of: action
				});
				$(window.document).bind('click', function(event){
					menu.hide();
					$(this).unbind(event);
				});
				return false;
			});

		buttonset.buttonset();
		buttonset.append(action).append(expand);
		wrapper.append(buttonset).append(menu);

		for (var i = 0; i < props.menu.length; i++) {
			var menuItem = props.menu[i];
			var item = $('<li></li>');
			var label = $('<span></span>');
			var icon = $('<img/>');
			label.text(menuItem.label);
			icon.attr('url', menuItem.icon);
			item.append(icon).append(label).appendTo(menu);
			item.click(menuItem.onclick);
		}
		menu.hide().menu().css({
			'position': 'absolute',
			'width': '200px'
		});

		return wrapper;
	}

	return {
		onSelect: onSelect,
		setupButton: setupButton,
		makeSplitButton: makeSplitButton
	};
});
