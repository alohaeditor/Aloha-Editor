/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

(function (window, undefined) {
	
	'use strict';
	
	var jQuery = window.alohaQuery || window.jQuery,
	         $ = jQuery,
	   GENTICS = window.GENTICS || (window.GENTICS = {}),
	     Aloha = window.Aloha;
	
	var clss = 'aloha-sidebar',
		uid  = +(new Date);
	// ------------------------------------------------------------------------
	// Extend jQuery easing animations
	// ------------------------------------------------------------------------
	$.extend($.easing, {
		easeOutExpo: function (x, t, b, c, d) {
			return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
		},
		easeOutElastic: function (x, t, b, c, d) {
			var s=1.70158;var p=0;var a=c;
			if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
			if (a < Math.abs(c)) { a=c; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (c/a);
			return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
		}
	});
	
	// ------------------------------------------------------------------------
	// Helper functions
	// ------------------------------------------------------------------------
	function mkdotclass () {
		var str = '',
			prx = clss; // Make a copy of clss here for quicker lookup
		$.each(arguments, function () {str += ' .' + prx + '-' + this;});
		return str.trim();
	};
	
	function mkclass () {
		var str = '',
			prx = clss;
		$.each(arguments, function () {str += ' ' + prx + '-' + this;});
		return str.trim();
	};
	
	// ------------------------------------------------------------------------
	// Sidebar
	// ------------------------------------------------------------------------
	var Sidebar = function () {
		
		this.container = null;
		this.panels = {};
		
		this.init();
		
	};
	
	$.extend(Sidebar.prototype, {
		
		// We build as much of the sidebar as we can before appending it to the
		// DOM in order to minimize reflow
		init: function () {
			var that = this,
				body = $('body'),
				bar	 = this.container = $('											\
					<div class="' + mkclass('bar') + '">							\
						<div class="' + mkclass('bar-shadow') + '"></div>			\
						<div class="' + mkclass('bar-toggle') + '">					\
							<div class="' + mkclass('bar-toggle-img') + '"></div>	\
						</div>														\
						<div class="' + mkclass('bar-inner') + '">					\
							<h2>													\
								Aloha Comments										\
								<span class="' + mkclass('config-btn') + '"></span> \
							</h2>													\
							<ul></ul>												\
							<div class="' + mkclass('bar-bottom') + '">				\
							</div>													\
						</div>														\
					</div>															\
				');
			
			bar.css('opacity', 0)
			   .click(function () {
					that.barClicked.apply(that, arguments);
				});
			
			body.append(bar);
			
			$(window).resize(function () {
				that._updateScrolling();
			});
			
			this._updateScrolling();
			
			// Fade in nice and slow
			bar.animate({opacity: 1}, 2000, 'linear');
			
			// Announce that the Sidebar has entered the building!
			body.trigger(mkclass('initialized'));
		},
		
		_updateScrolling: function () {
		
		}
		
	});
	
	$('body').bind(mkclass('initialized'), function () {
		console.dir(arguments);
	});
	
	// Automatically invoke the Sidebar as soon as the DOM is ready
	$(function () {
		//Aloha.Sidebar = new Sidebar();
		window.Sidebar = new Sidebar();
	});
	
})(window);
