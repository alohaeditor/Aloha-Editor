define([
	'jquery',
	'aloha/jquery-ui',
	'css!./css/ribbon.css'
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
		var expand = $('<button></button>');
		var menu = $('<ul></ul>');
		var wrapper = $('<div></div>').addClass("aloha-ribbon-split-button");

		var action = null;
		var buttonset = null;
		if (props.onclick) {
			action = $('<button></button>')
				.text(props.label)
				.button()
				.click(props.onclick);
			if (props.icon) {
				action.append($('<img></img>').attr('src', props.icon));
			}
			buttonset = $('<div></div>')
				.buttonset()
				.append(action)
				.append(expand);
		} else {
			expand.text(props.label);
		}

		expand
			.button({
				icons: { primary: 'ui-icon-triangle-1-s' }
			})
			.click(function(){
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
