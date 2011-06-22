/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

// ----------------------------------------------------------------------------
//
// Please look at http://www.aloha-editor.org/wiki/Sidebar for more
// information. Please remember to document your contributions here.
//
// TODO:
//	String.prototype.supplant method from here and place it into aloha factory
//
// ----------------------------------------------------------------------------


// We give our immediately invoked function a name to aid in debugging
(function __Sidebar (window, undefined) {
	
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
	
	var classes = {
		bar		: mkclass('bar'),
		shadow	: mkclass('bar-shadow'),
		toggle	: mkclass('bar-toggle'),
		'toggle-img': mkclass('bar-toggle-img'),
		inner	: mkclass('bar-inner'),
		tnd		: mkclass('config-btn'),
		bottom	: mkclass('bar-bottom')
	};
	
	String.prototype.supplant = function (/*'ld, rd,'*/obj) {
		return this.replace(/\{([a-z0-9\-\_]+)\}/ig, function (str, p1, offset, s) {
			return obj[p1] || str;
		});
	};
	
	// ------------------------------------------------------------------------
	// Sidebar constructor
	// Define only instance properties here
	// ------------------------------------------------------------------------
	var Sidebar = function () {
		
		this.container = null;
		this.panels = {};
		
		this.init();
		
	};
	
	// ------------------------------------------------------------------------
	// Sidebar prototype
	// All properties to be shared across Sidebar instances can be placed in
	// the prototype object
	// ------------------------------------------------------------------------
	$.extend(Sidebar.prototype, {
		
		// We minimize reflow by building as much of the sidebar as we can 
		// before appending it to DOM.
		init: function () {
			var that = this,
				body = $('body'),
				bar	 = this.container = $(
					('\
					<div class="{bar}">						 \
						<div class="{shadow}"></div>		 \
						<div class="{toggle}">				 \
							<div class="{toggle-img}"></div> \
						</div>								 \
						<div class="{inner}">		 		 \
							<h2>							 \
								Aloha Comments				 \
								<span class="{btn}"></span>  \
							</h2>							 \
							<ul></ul>						 \
							<div class="{bottom}">			 \
							</div>							 \
						</div>								 \
					</div>									 \
				').supplant(classes)
			);
			
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
		console.log(arguments);
	});
	
	// Automatically invoke the Sidebar as soon as the DOM is ready
	$(function () {
		//Aloha.Sidebar = new Sidebar();
		window.Sidebar = new Sidebar();
	});
	
})(window);
