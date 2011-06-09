(function($) {
	$.fn.alohaStage = function() {
		var switcher = this.find('ul.stage-switcher'),
			current,
			currentTab,
			autoplay,
			showNext = function() {
				var nextTab;
				if (!currentTab) {
					nextTab = switcher.find('li').first();
				} else {
					nextTab = currentTab.next();
					if (nextTab.length == 0) {
						nextTab = switcher.find('li').first();
					}
				}
				nextTab.click();
				autoplay = setTimeout(showNext, 6000);
			};
		switcher.children('li').each(function() {
			var li = $(this),
				item = $(this).find('.stage-item').detach();
			item.hide();
			item.appendTo(switcher.parent());
			li.click(function(event) {
				clearTimeout(autoplay);
				if (currentTab) currentTab.removeClass('active');
				currentTab = li;
				li.addClass('active');
				if (current) current.fadeOut(500);
				item.fadeIn(500);
				current = item;
			});
			li.mouseover(function() {
				li.addClass('hover');
			});
			li.mouseout(function() {
				li.removeClass('hover');
			});
		});
		showNext();
		autoplay = setTimeout(showNext, 6000);
		switcher.animate({right: -150}, {queue: false});
		switcher.mouseenter(function() {
			switcher.animate({right: 0}, {queue: false});
		});
		switcher.mouseleave(function() {
			switcher.animate({right: -150}, {queue: false});
		});
	};
})(jQuery);

$(function() {
	$('.stage-area').alohaStage();
});
