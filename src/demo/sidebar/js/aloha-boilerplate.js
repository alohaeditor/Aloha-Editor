
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
				autoplay = setTimeout(showNext, 6000);
			};
		switcher.children('li').each(function() {
			var $this = $(this),
				editable = $this.find('.area-content'), // make stage switcher available thru editable
				item = $this.find('.stage-item').detach();
			editable[0].tab = $this;
			item.hide();
			item.appendTo(switcher.parent());
			$this.click(function(event) {
				clearTimeout(autoplay);
				if (me.currentTab) me.currentTab.removeClass('active');
				me.currentTab = $this;
				$this.addClass('active');
				if (current && current != item ) {
					if (current) current.fadeOut(500);
				}
				item.fadeIn(500);
				current = item;
			});
			$this.mouseover(function() {
				$this.addClass('hover');
				clearTimeout(autoplay);
			});
			$this.mouseout(function() {
				$this.removeClass('hover');
				autoplay = setTimeout(showNext, 6000);
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
		

		$('body').bind('aloha',function(){
			Aloha.bind('aloha-editable-activated', function(e,a){
				if ( a.editable.obj[0].tab ) {
					a.editable.obj[0].tab.click();
				}
			});
			Aloha.bind('aloha-editable-deactivated', function(e,a){
				autoplay = setTimeout(showNext, 6000);
			});
		});

	};