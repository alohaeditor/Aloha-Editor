Aloha.ready(function() {
	Aloha.require( ['aloha', 'aloha/jquery'], function( Aloha, $) {

		$.fn.alohaStage = function() {
			var switcher = this.find('ul.stage-switcher'),
				me = this,
				current,
				autoplay,
				showNext = function() {
					var nextTab;
					if (!me.currentTab) {
						nextTab = switcher.find('li').first();
					} else {
						nextTab = me.currentTab.next();
						if (nextTab.length == 0) {
							nextTab = switcher.find('li').first();
						}
					}
					nextTab.click();
					clearTimeout( autoplay );
					autoplay = setTimeout( showNext, 6000 );
				};
			switcher.children('li').each(function() {
				var $this = $(this),
					editable = $this.find('.area-content'), // make stage switcher available thru editable
					item = $this.find('.stage-item').detach();
				editable[0].tab = $this;
				item.hide();
				item.appendTo(switcher.parent());
				$this.click(function(event) {
					if (me.currentTab) me.currentTab.removeClass('active');
					me.currentTab = $this;
					$this.addClass('active');
					if (current && current != item ) {
						if (current) current.fadeOut(500);
					}
					item.fadeIn(500);
					current = item;
					clearTimeout( autoplay );
				});
				$this.mouseover(function() {
					$this.addClass('hover');
				});
				$this.mouseout(function() {
					$this.removeClass('hover');
				});
			});
			showNext();
			switcher.animate({right: -150}, {queue: false});
			switcher.mouseenter(function() {
				switcher.animate({right: 0}, {queue: false});
			});
			switcher.mouseleave(function() {
				switcher.animate({right: -150}, {queue: false});
			});
		

			Aloha.bind('aloha-editable-activated', function(e,a){
				if ( a.editable.obj[0].tab ) {
					a.editable.obj[0].tab.click();
				}
				clearTimeout( autoplay );
			});
			Aloha.bind('aloha-editable-deactivated', function(e,a){
				clearTimeout( autoplay );
				autoplay = setTimeout( showNext, 6000 );
			});
		};
		$('.stage-area').alohaStage();
		
	});
});
