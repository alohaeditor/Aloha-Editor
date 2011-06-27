/*!
 * This file is part of Aloha Editor
 * Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 */

// ----------------------------------------------------------------------------
//
// Please look at http://www.aloha-editor.org/wiki/Sidebar for more information
// Please remember to document your contributions there.
//
// ----------------------------------------------------------------------------


// We give our immediately invoked function a name to aid in debugging
(function SidebarClosure (window, undefined) {
	
	'use strict';
	
	var jQuery = window.alohaQuery || window.jQuery,
	         $ = jQuery,
	   GENTICS = window.GENTICS || (window.GENTICS = {}),
	     Aloha = window.Aloha;
	
	// ------------------------------------------------------------------------
	// Local (helper) variables
	// ------------------------------------------------------------------------
	
	// Pseudo-namespace prefix for Sidebar elements
	// Rational:
	// We use a prefix instead of an enclosing class or id because we need to
	// be paranoid of unintended style inheritance in an environment like the
	// one in which Aloha-Editor operates in, with its numerous custom plugins.
	// eg: .inner or .btn can be used in several plugins, with eaching adding
	// to the class styles properties that we don't want.
	var cssNS = 'aloha-sidebar';
	
	var uid  = +(new Date),
		nsClasses = {
			bar				: nsClass('bar'),
			bottom			: nsClass('bottom'),
			'config-btn'	: nsClass('config-btn'),
			handle			: nsClass('handle'),
			inner			: nsClass('inner'),
			'panel-content'	: nsClass('panel-content'),
			'panel-content-inner'
							:  nsClass('panel-content-inner'),
			panels			: nsClass('panels'),
			'panel-title'	: nsClass('panel-title'),
			shadow			: nsClass('shadow'),
			'panel-title-arrow'
							: nsClass('panel-title-arrow'),
			'panel-title-text'
							: nsClass('panel-title-text')
		};
	
	// ------------------------------------------------------------------------
	// Extend jQuery easing animations... for now
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
	// Local (helper) functions
	// ------------------------------------------------------------------------
	
	// TODO: This suffices for now. But we are to consider a more robust
	//		 templating engine.
	// TODO: Offer parameter to define left and right delimiters in case the
	//		 default "{", and "}" are problematic
	String.prototype.supplant = function (/*'lDelim, rDelim,'*/ obj) {
		return this.replace(/\{([a-z0-9\-\_]+)\}/ig, function (str, p1, offset, s) {
			var replacement = obj[p1] || str;
			return (typeof replacement == 'function')
						? replacement() : replacement;
		});
	};
	
	// Creates a selector string with this component's namepsace prefixed the each classname
	function nsSel () {
		var str = '',
			prx = cssNS; // ... for quicker lookup
		$.each(arguments, function () {str += ' .' + prx + '-' + this;});
		return str.trim();
	};
	
	// Creates string with this component's namepsace prefixed the each classname
	function nsClass () {
		var str = '',
			prx = cssNS;
		$.each(arguments, function () {str += ' ' + prx + '-' + this;});
		return str.trim();
	};
	
	function renderTemplate (str) {
		return (typeof str == 'string')
					? str.supplant(nsClasses)
					: str;
	};
	
	// ------------------------------------------------------------------------
	// Sidebar constructor
	// Only instance properties are to be defined here
	// ------------------------------------------------------------------------
	var Sidebar = function Sidebar (opts) {
		this.id = nsClass(++uid);
		this.panels = {};
		this.container = $(renderTemplate('				\
			<div class="{bar}">							\
				<div class="{shadow}"></div>			\
				<div class="{handle}">					\
					<span class="{handle-icon}"></span>	\
				</div>									\
				<div class="{inner}">		 			\
					<ul class="{panels}"></ul>			\
					<div class="{bottom}"></div>		\
				</div>									\
			</div>										\
		'));
		this._activePanel = null;
		// defaults
		this.width = 300;
		this.isOpen = true;
		
		this.init(opts);
	};
	
	// ------------------------------------------------------------------------
	// Sidebar prototype
	// All properties to be shared across Sidebar instances can be placed in
	// the prototype object
	// ------------------------------------------------------------------------
	$.extend(Sidebar.prototype, {
		
		// Build as much of the sidebar as we can before appending it to DOM to
		// minimize reflow.
		init: function (opts) {
			var that = this,
				body = $('body'),
				bar	 = this.container,
				panels;
			
			// Pluck panels list from opts
			if (typeof opts == 'object') {
				panels = opts.panels;
				delete opts.panels;
			}
			
			// Copy any implements, and overrides in opts to this Sidebar instance
			$.extend(this, opts);
			
			if (typeof panels == 'object') {
				$.each(panels, function () {
					that.addPanel(this);
				});
			}
			
			// Place the bar into the DOM
			bar.appendTo(body)
			   .click(function () {that._barClicked.apply(that, arguments);})
			   .find(nsSel('panels')).width(this.width);
			
			$(window).resize(function () {
				that._updateScrolling();
			});
			
			this._updateScrolling();
			this._roundCorners();
			
			var toggledClass = nsClass('toggled');
			
			bar.find(nsSel('handle'))
				.click(function () {
					if (that.isOpen) {
						$(this).removeClass(toggledClass);
						that.close();
						that.isOpen = false;
					} else {
						$(this).addClass(toggledClass);
						that.open();
						that.isOpen = true;
					}
				}).hover(
					function () {
						if (that.isOpen) {
							$(this).stop().animate({marginRight: 5}, 200);
						} else {
							$(this).stop().animate({marginRight: 0}, 200);
						}
					},
					function () {
						if (that.isOpen) {
							$(this).stop().animate({marginRight: 0}, 600, 'easeOutElastic');
						} else {
							$(this).stop().animate({marginRight: 5}, 600, 'easeOutElastic');
						} 
					}
				);
			
			
			// Announce that the Sidebar has arrived!
			body.trigger(nsClass('initialized'));
		},
		
		_roundCorners: function () {
			var bar = this.container,
				lis = bar.find(nsSel('panels>li')),
				topClass = nsClass('panel-top'),
				bottomClass = nsClass('panel-bottom');
			
			bar.find(nsSel('panel-top,', 'panel-bottom'))
			   .removeClass(topClass)
			   .removeClass(bottomClass);
			 
			lis.first().find(nsSel('panel-title')).addClass(topClass);
			lis.last().find(nsSel('panel-content')).addClass(bottomClass);
		},
		
		_updateScrolling: function () {
			var bar = this.container,
				bottom = bar.find(nsSel('bottom')).position(),
				h = $(window).height();
			
			bar.height(h)
			   .find(nsSel('shadow')).height(h);
			bar.find(nsSel('inner')).height(h);
			
			/*
			var panel = this.getActivePanel();
			
			if (!panel) {
				return;
			}
			
			panel.container
				.css({
					height	  : $(window).height(),
					overflowY : (bottom.top > bar.height()) ? 'scroll' : 'auto'
				});
			*/
		},
		
		// We delegate all sidebar onclick events to the container. 
		// We then use _handleBarclick method until we bubble up to the first
		// significant thing that we can to interact with, and we do so
		_barClicked: function (ev) {
			this._handleBarclick($(ev.target));
		},
		
		_handleBarclick: function (el) {
			if (el.hasClass(nsClass('panel-title'))) {
				this._togglePanel(el);
			} else if (el.hasClass(nsClass('panel-content'))) {
				// console.log('Content clicked');
			} else if (el.hasClass(nsClass('handle'))) {
				// console.log('Handle clicked');
			} else if (el.hasClass(nsClass('bar'))) {
				// console.log('Sidebar clicked');
			} else {
				this._handleBarclick(el.parent());
			}
		},
		
		_getPanelById: function (id) {
			return this.panels[id];
		},
		
		_getPanelByElement: function (el) {
			var li = (el[0].tagName == 'LI') ? el : el.parent('li');
			return this._getPanelById(li[0].id);
		},
		
		_togglePanel: function (el) {
			this._getPanelByElement(el).toggle();
		},
		
		open: function (duration, callback) {
			this.container.animate({marginLeft: 0}, 500, 'easeOutExpo');
		},
		
		close: function (duration, callback) {
			this.container.animate({marginLeft: -this.width}, 500, 'easeOutExpo');
		},
		
		expandPanel: function (panel, callback) {
			if (typeof panel == 'string') {
				panel = this._getPanelById(panel);
			}
			
			if (panel){
				panel.expand(callback);
			}
			
			return this;
		},
		
		collapsePanel: function (panel, duration, callback) {
			if (typeof panel == 'string') {
				panel = this._getPanelById(panel);
			}
			
			if (panel){
				panel.collapse(callback);
			}
			
			return this;
		},
		
		// We try and build as much of the panel DOM as we can before inserting
		// it into the DOM in order to reduce reflow.
		addPanel: function (panel) {
			if (!(panel instanceof Panel)) {
				if (!panel.width) {
					panel.width = this.width;
				}
				panel = new Panel(panel);
			}
			
			this.panels[panel.id] = panel;
			
			this.container.find(nsSel('panels')).append(panel.element);
			
			return this;
		}
		
	});
	
	
	// ------------------------------------------------------------------------
	// Panel constructor
	//
	//	TODO: Can we get a way with never exposing Panel as Aloha.Panel and
	//		  thereby force all interfacing with Panel to be done through the
	//		  Sidebar?
	// ------------------------------------------------------------------------
	var Panel = function Panel (opts) {
		this.id		  = null;
		this.folds	  = {};
		this.button	  = null;
		this.title	  = $(renderTemplate('						 \
			<div class="{panel-title}">							 \
				<span class="{panel-title-arrow}"></span>		 \
				<span class="{panel-title-text}">Untitled</span> \
			</div>												 \
		'));
		this.content  = $(renderTemplate('					\
			<div class="{panel-content}">					\
				<div class="{panel-content-inner}"></div>	\
			</div>											\
		'));
		this.element  = null;
		this.expanded = false;
		
		this.init(opts);
	};
	
	// ------------------------------------------------------------------------
	// Panel prototype
	// ------------------------------------------------------------------------
	$.extend(Panel.prototype, {
		
		init: function (opts) {
			this.setTitle(opts.title)
				.setContent(opts.content);
			
			delete opts.title;
			delete opts.content;
			
			$.extend(this, opts);
			
			if (!this.id) {
				this.id = nsClass(++uid);
			}
			
			var li = this.element =
				$('<li id="' +this.id + '">')
					.append(this.title, this.content);
			
			if (this.expanded ){
				this.content.height('auto');
				this.rotateArrow(90, 0);
			}
			
			// Disable text selection on title element
			this.title
				.attr('unselectable', 'on')
				.css('-moz-user-select', 'none')
				.each(function() {this.onselectstart = function() {return false;};});
		},
		
		toggle: function () {
			if (this.expanded) {
				this.collapse();
			} else {
				this.expand();
			}
		},
		
		expand: function (callback) {
			var  that = this,
				   el = this.content,
				old_h = el.height(),
				new_h = el.height('auto').height();
			
			el.height(old_h).stop().animate(
				{height: new_h}, 500, 'easeOutExpo',
				function () {
					if (typeof callback == 'function') {
						callback.call(that);
					}
				}
			);
			
			this.rotateArrow(90);
			
			this.expanded = true;
			
			return this;
		},
		
		collapse: function (duration, callback) {
			var that = this;
			
			this.content.stop().animate(
				{height: 5}, 250, 'easeOutExpo',
				function () {
					if (typeof callback == 'function') {
						callback.call(that);
					}
				}
			);
			
			this.rotateArrow(0);
			
			this.expanded = false;
			
			return this;
		},
		
		// May also be called by the Sidebar to update title of panel
		// @param html - Markup string, DOM object, or jQuery object 
		setTitle: function (html) {
			this.title.find(nsSel('panel-title-text')).html(html);
			return this;
		},
		
		// May also be called by the Sidebar to update content of panel
		// @param html - Markup string, DOM object, or jQuery object
		setContent: function (html) {
			this.content.find(nsSel('panel-content-inner')).html(html);
			return this;
		},
		
		rotateArrow: function (angle, duration) {
			var arr = this.title.find(nsSel('panel-title-arrow'));
			arr.animate({angle: angle}, {
					duration: (typeof duration == 'number') ? duration : 500,
					easing: 'easeOutExpo',
					step: function (val, fx) {
						arr.css({
							'-webkit-transform'	: 'rotate(' + val + 'deg)',
							'-moz-transform'	: 'rotate(' + val + 'deg)',
							'-ms-transform'		: 'rotate(' + val + 'deg)'
						 // filter				: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=1.5)'
						});
					}
				});
		}
		
	});
	
	$('body').bind(nsClass('initialized'), function () {
		
	});
	// Automatically invoke the Sidebar as soon as the DOM is ready
	$(function () {
		//Aloha.Sidebar = new Sidebar();
		window.Sidebar = new Sidebar({
			width: 250,
			panels: [
				{
					id: 't1',
					title: 'Start open',
					content: 'Test content',
					expanded: true
				},
				{
					id: 't2',
					title: 'Long content',
					content: '<pre>\
						... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					    ... \
					</pre>',
					expanded: false
				},
				{
					id: 't3',
					title: 'Click me to open',
					content: 'Test content',
					expanded: false
				}
			]
		});
	});
	
})(window);
