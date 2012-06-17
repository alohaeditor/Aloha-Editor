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

	return {
		onSelect: onSelect,
		setupButton: setupButton
	};
});
