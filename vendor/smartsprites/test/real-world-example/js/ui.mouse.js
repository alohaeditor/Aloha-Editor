(function($) {
	
	//If the UI scope is not available, add it
	$.ui = $.ui || {};
	
	//Add methods that are vital for all mouse interaction stuff (plugin registering)
	$.extend($.ui, {
		plugin: {
			add: function(module, option, set) {
				var proto = $.ui[module].prototype;
				for(var i in set) {
					proto.plugins[i] = proto.plugins[i] || [];
					proto.plugins[i].push([option, set[i]]);
				}
			},
			call: function(instance, name, arguments) {
				var set = instance.plugins[name]; if(!set) return;
				for (var i = 0; i < set.length; i++) {
					if (instance.options[set[i][0]]) set[i][1].apply(instance.element, arguments);
				}
			}	
		},
		cssCache: {},
		css: function(name) {
			if ($.ui.cssCache[name]) return $.ui.cssCache[name];
			
			var tmp = $("<div class='ui-resizable-gen'>").addClass(name).css(
				{position:'absolute', top:'-5000px', left:'-5000px', display:'block'}
			).appendTo('body');
			
			//Opera and Safari set width and height to 0px instead of auto
			//Safari returns rgba(0,0,0,0) when bgcolor is not set
			$.ui.cssCache[name] = !!(
				(/^[1-9]/.test(tmp.css('height')) || /^[1-9]/.test(tmp.css('width')) || 
				!/none/.test(tmp.css('backgroundImage')) || !/transparent|rgba\(0, 0, 0, 0\)/.test(tmp.css('backgroundColor')))
			);
			try { $('body').get(0).removeChild(tmp.get(0));	} catch(e){}
			return $.ui.cssCache[name];
		},
		disableSelection: function(e) {
			if (!e) return;
			e.unselectable = "on";
			e.onselectstart = function() {	return false; };
			if (e.style) e.style.MozUserSelect = "none";
		},
		enableSelection: function(e) {
			if (!e) return;
			e.unselectable = "off";
			e.onselectstart = function() { return true; };
			if (e.style) e.style.MozUserSelect = "";
		}
	});
	
	/********************************************************************************************************/

	$.fn.extend({
		mouseInteraction: function(o) {
			return this.each(function() {
				new $.ui.mouseInteraction(this, o);
			});
		},
		removeMouseInteraction: function(o) {
			return this.each(function() {
				if($.data(this, "ui-mouse"))
					$.data(this, "ui-mouse").destroy();
			});
		}
	});
	
	/********************************************************************************************************/
	
	$.ui.mouseInteraction = function(element, options) {
	
		var self = this;
		this.element = element;
		$.data(this.element, "ui-mouse", this);
		this.options = $.extend({}, options);
		
		$(element).bind('mousedown.draggable', function() { return self.click.apply(self, arguments); });
		if($.browser.msie) $(element).attr('unselectable', 'on'); //Prevent text selection in IE
		
	};
	
	$.extend($.ui.mouseInteraction.prototype, {
		
		destroy: function() { $(this.element).unbind('mousedown.draggable'); },
		trigger: function() { return this.click.apply(this, arguments); },
		click: function(e) {
			
			if(
				   e.which != 1 //only left click starts dragging
				|| $.inArray(e.target.nodeName.toLowerCase(), this.options.dragPrevention) != -1 // Prevent execution on defined elements
				|| (this.options.condition && !this.options.condition.apply(this.options.executor || this, [e, this.element])) //Prevent execution on condition
			) return true;
			
			var self = this;
			var initialize = function() {
				window.focus();
				self._MP = { left: e.pageX, top: e.pageY }; // Store the click mouse position
				$(document).bind('mouseup.draggable', function() { return self.stop.apply(self, arguments); });
				$(document).bind('mousemove.draggable', function() { return self.drag.apply(self, arguments); });
			};

			if(this.options.delay) {
				if(this.timer) clearInterval(this.timer);
				this.timer = setTimeout(initialize, this.options.delay);
			} else {
				initialize();
			}
			
			return false;
			
		},
		stop: function(e) {			
			
			var o = this.options;
			if(!this.initialized) return $(document).unbind('mouseup.draggable').unbind('mousemove.draggable');

			if(this.options.stop) this.options.stop.call(this.options.executor || this, e, this.element);
			$(document).unbind('mouseup.draggable').unbind('mousemove.draggable');
			this.initialized = false;
			return false;
			
		},
		drag: function(e) {

			var o = this.options;
			if ($.browser.msie && !e.button) return this.stop.apply(this, [e]); // IE mouseup check
			
			if(!this.initialized && (Math.abs(this._MP.left-e.pageX) >= o.distance || Math.abs(this._MP.top-e.pageY) >= o.distance)) {
				if(this.options.start) this.options.start.call(this.options.executor || this, e, this.element);
				this.initialized = true;
			} else {
				if(!this.initialized) return false;
			}

			if(o.drag) o.drag.call(this.options.executor || this, e, this.element);
			return false;
			
		}
	});

 })(jQuery);