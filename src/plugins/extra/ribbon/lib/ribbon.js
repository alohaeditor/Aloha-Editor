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
	 */
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
				icons: { primary: 'aloha-jqueryui-icon ui-icon-triangle-1-s' }
			})
			.click(function(){
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
		makeSplitButton: makeSplitButton
	};
});
