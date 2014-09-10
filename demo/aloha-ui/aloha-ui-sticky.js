(function (aloha) {
	'use strict';

	var $$ = aloha.editor.ui.$$;
	var Dom = aloha.dom;

	/*
	 * make elements with the .aloha-sticky-top class stick to the top when scrolling
	 */
	$$(window).on('scroll', function (event) {
		var stickies = $$('.aloha-sticky-top');
		var scrollTop = Dom.scrollTop(document);
		stickies.elements.forEach(function (element) {
			if (Dom.hasClass(element, 'aloha-sticky-top-active')) {
				if (scrollTop <= Dom.getAttr(element, 'data-aloha-sticky-top-pos')) {
					Dom.setAttr(element, 'data-aloha-sticky-top-pos', null);
					Dom.removeClass(element, 'aloha-sticky-top-active');
				}
			} else {
				if (scrollTop > Dom.absoluteTop(element)) {
					Dom.setAttr(element, 'data-aloha-sticky-top-pos', Dom.absoluteTop(element));
					Dom.addClass(element, 'aloha-sticky-top-active');
				}
			}
		});
	});	
})(window.aloha);