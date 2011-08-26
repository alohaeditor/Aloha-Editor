/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/

// ----------------------------------------------------------------------------
//
// Please look at http://www.aloha-editor.org/wiki/Sidebar for more information
// Please remember to document your contributions there.
//
// ----------------------------------------------------------------------------

define([
		
	'aloha/jquery',
	'aloha/plugin' // For when we plugify sidebar

], function SidebarClosure ($, Plugin) {
	
	'use strict';
	
	var
		Aloha = window.Aloha,
		undefined = void 0;
	
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
	var ns = 'aloha-sidebar',
		uid  = +(new Date),
		// namespaced classnames
		nsClasses = {
			bar				: nsClass('bar'),
			'config-btn'	: nsClass('config-btn'),
			handle			: nsClass('handle'),
			'handle-icon'	: nsClass('handle-icon'),
			inner			: nsClass('inner'),
			'panel-content'	: nsClass('panel-content'),
			'panel-content-inner'
							: nsClass('panel-content-inner'),
			'panel-content-inner-text'
							: nsClass('panel-content-inner-text'),
			panels			: nsClass('panels'),
			'panel-title'	: nsClass('panel-title'),
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
	
	// It is prefered that we render strings through this function rather than
	// going directly to String.prototype.supplant
	function renderTemplate (str) {
		return (typeof str === 'string')
					? str.supplant(nsClasses)
					: str;
	};
	
	// Creates a selector string with this component's namepsace prefixed the each classname
	function nsSel () {
		var strBldr = [], prx = ns;
		$.each(arguments, function () { strBldr.push('.' + (this == '' ? prx : prx + '-' + this)); });
		return $.trim(strBldr.join(' '));
	};
	
	// Creates string with this component's namepsace prefixed the each classname
	function nsClass () {
		var strBldr = [], prx = ns;
		$.each(arguments, function () { strBldr.push(this == '' ? prx : prx + '-' + this); });
		return $.trim(strBldr.join(' '));
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
				<div class="{handle}">					\
					<span class="{handle-icon}"></span>	\
				</div>									\
				<div class="{inner}">		 			\
					<ul class="{panels}"></ul>			\
				</div>									\
			</div>										\
		'));
		// defaults
		this.width = 300;
		this.opened = false;
		this.isOpen = false;
		
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
					that.addPanel(this, true);
				});
			}
			
			if (this.position == 'right') {
				bar.addClass(nsClass('right'));
			}
			
			// Place the bar into the DOM
			bar.css('opacity', 0)
			   .appendTo(body)
			   .click(function () {that.barClicked.apply(that, arguments);})
			   .find(nsSel('panels')).width(this.width);
			
			this.width = bar.width();

			$(window).resize(function () {
				that.updateHeight();
			});
			
			this.updateHeight();
			this.roundCorners();
			this.initToggler();
			
			this.container.css(this.position == 'right' ? 'marginRight' : 'marginLeft', -this.width);
			
			if (this.opened) {
				this.open(0);
			}

			this.subscribeToEvents();
			
			$(window).resize(function () {
				that.correctHeight();
			});
			
			this.correctHeight();
		},
		
		// Fade in nice and slow
		show: function () {
			this.container
				.css('display', 'block')
				.animate({opacity: 1}, 1000);
			
			return this;
		},
		
		// Fade out
		hide: function () {
			this.container
				.animate({opacity: 0}, 1000, function () {
					$(this).css('display', 'block')
				});
			
			return this;
		},
		
		checkActivePanels: function(rangeObject) {
			var that = this;
			
			var panels = that.panels,
					effective = [],
					i = 0,
					obj;
			if (typeof rangeObject != 'undefined' && typeof rangeObject.markupEffectiveAtStart != 'undefined') {
				for (; i < rangeObject.markupEffectiveAtStart.length; i++) {
					obj = $(rangeObject.markupEffectiveAtStart[i]);
					effective.push(obj);
				}
			}
			
			$.each(panels, function () {
				that.showActivePanel(this, effective);
			});
		
			that.correctHeight();
		},
		
		subscribeToEvents: function () {
			var that = this;
			var $container = $(this.container);
			Aloha.bind('aloha-selection-changed', function(event, rangeObject) {
				that.checkActivePanels(rangeObject);
			});
			$container.mousedown(function(e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = true;
				//e.stopSelectionUpdate = true;
			});
			$container.mouseup(function (e) {
				e.originalEvent.stopSelectionUpdate = true;
				Aloha.eventHandled = false;
			});
			Aloha.bind("aloha-editable-deactivated", function(event, params) { 
				that.checkActivePanels();
			});
		},
		
		// Perfoms an algorithm to dynamically fix appropriate heights for panels
		// TODO: Improve this when you have time
		correctHeight: function () {
			var height = this.container.find(nsSel('inner')).height() - (15 * 2),
				panels = [];
			
			$.each(this.panels, function () {
				if (this.isActive) {
					panels.push(this);
				}
			});
			
			if (panels.length == 0) {
				return;
			}
			
			var remainingHeight = height - ((panels[0].title.outerHeight() + 10) * panels.length),
				panel,
				targetHeight,
				panelInner,
				panelText,
				undone,
				toadd = 0;
			
			while (panels.length > 0 && remainingHeight > 0) {
				var j = panels.length - 1;
				
				remainingHeight += toadd;
				
				toadd = 0;
				undone = [];
				
				for (; j >= 0; j--) {
					panel = panels[j];
					panelInner = panel.content.find(nsSel('panel-content-inner'));
					
					targetHeight = Math.min(
						panelInner.height('auto').height(),
						Math.floor(remainingHeight / (j + 1))
					);
					
					panelInner.height(targetHeight);
					
					remainingHeight -= targetHeight;
					
					panelText = panelInner.find(nsSel('panel-content-inner-text'));
					
					if (panelText.height() > targetHeight) {
						undone.push(panel);
						toadd += targetHeight;
						panelInner.css({
							'overflow-x': 'hidden',
							'overflow-y': 'scroll'
						});
					} else {
						panelInner.css('overflow-y', 'hidden');
					}
					
					if (panel.expanded) {
						panel.expand();
					}
				}
				
				panels = undone;
			}
		},
		
		showActivePanel: function (panel, effectiveElems) {
			var i = 0,
				j = effectiveElems.length,
				count = 0,
				li = panel.content.parent('li'),
				activeOn = panel.activeOn,
				effective = $();
			
			for (; i < j; i++) {
				if (activeOn(effectiveElems[i])) {
					count++;
					$.merge(effective, effectiveElems[i]);
				}
			}
			
			if (count > 0) { 
				panel.activate(effective);
			} else {
				panel.deactivate();
			}
			
			this.roundCorners();
		},
		
		initToggler: function () {
			var that = this,
				bar = this.container,
				icon = bar.find(nsSel('handle-icon')),
				toggledClass = nsClass('toggled'),
				bounceTimer,
				isRight = (this.position == 'right');
			
			if (this.opened) {
				this.rotateArrow(isRight ? 0 : 180, 0);
			}
			
			bar.find(nsSel('handle'))
				.click(function () {
					if (bounceTimer) {
						clearInterval(bounceTimer);
					}
					
					icon.stop().css('marginLeft', 4);
					
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
						var flag = that.isOpen ? -1 : 1;
						
						if (bounceTimer) {
							clearInterval(bounceTimer);
						}
						
						icon.stop();
						
						$(this).stop().animate(
							isRight ? {marginLeft: '-=' + (flag * 5)} : {marginRight: '-=' + (flag * 5)},
							200
						);
						
						bounceTimer = setInterval(function () {
							flag *= -1;
							icon.animate(
								isRight ? {left: '-=' + (flag * 4)} : {right: '-=' + (flag * 4)},
								300
							);
						}, 300);
					},
					
					function () {
						if (bounceTimer) {
							clearInterval(bounceTimer);
						}
						
						icon.stop().css(isRight ? 'left' : 'right', 5);
						
						$(this).stop().animate(
							isRight ? {marginLeft: 0} : {marginRight: 0},
							600, 'easeOutElastic'
						);
					}
				);
		},
		
		roundCorners: function () {
			var bar = this.container,
				lis = bar.find(nsSel('panels>li:not(', 'deactivated)')),
				topClass = nsClass('panel-top'),
				bottomClass = nsClass('panel-bottom');
			
			bar.find(nsSel('panel-top,', 'panel-bottom'))
			   .removeClass(topClass)
			   .removeClass(bottomClass);
			
			lis.first().find(nsSel('panel-title')).addClass(topClass);
			lis.last().find(nsSel('panel-content')).addClass(bottomClass);
		},
		
		updateHeight: function () {
			var h = $(window).height();
			this.container.height(h).find(nsSel('inner')).height(h);
		},
		
		// Delegate all sidebar onclick events to the container. 
		// Then use handleBarclick method until we bubble up to the first
		// significant thing that we can to interact with, and we do so
		barClicked: function (ev) {
			this.handleBarclick($(ev.target));
		},
		
		handleBarclick: function (el) {
			if (el.hasClass(nsClass('panel-title'))) {
				this.togglePanel(el);
			} else if (el.hasClass(nsClass('panel-content'))) {
				// console.log('Content clicked');
			} else if (el.hasClass(nsClass('handle'))) {
				// console.log('Handle clicked');
			} else if (el.hasClass(nsClass('bar'))) {
				// console.log('Sidebar clicked');
			} else {
				this.handleBarclick(el.parent());
			}
		},
		
		getPanelById: function (id) {
			return this.panels[id];
		},
		
		getPanelByElement: function (el) {
			var li = (el[0].tagName == 'LI') ? el : el.parent('li');
			return this.getPanelById(li[0].id);
		},
		
		togglePanel: function (el) {
			this.getPanelByElement(el).toggle();
		},
		
		rotateArrow: function (angle, duration) {
			var arr = this.container.find(nsSel('handle-icon'));
			arr.animate({angle: angle}, {
					duration: (typeof duration == 'number' || typeof duration == 'string') ? duration : 500,
					easing: 'easeOutExpo',
					step: function (val, fx) {
						var ieAngle = angle / 90;
						arr.css({
							'-webkit-transform'	: 'rotate(' + val + 'deg)',
							'-moz-transform'	: 'rotate(' + val + 'deg)',
							'-ms-transform'		: 'rotate(' + val + 'deg)',
							filter				: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + ieAngle + ')'
						});
					}
				});
		},
		
		open: function (duration, callback) {
			if (this.isOpen) {
				return this;
			}
			
			var isRight = (this.position == 'right'),
				anim = isRight ? {marginRight: 0} : {marginLeft: 0};
			
			this.rotateArrow(isRight ? 0 : 180, 0);
			
			this.container.animate(
				anim,
				(typeof duration === 'number' || typeof duration === 'string')
					? duration : 500,
				'easeOutExpo'
			);
			
			$('body').animate(
			isRight ? {marginRight: '+=' + this.width} : {marginLeft: '+=' + this.width},
			500, 'easeOutExpo');
			
			this.isOpen = true;

			$('body').trigger(nsClass('opened'), this);
			
			return this;
		},
		
		close: function (duration, callback) {
			if (!this.isOpen) {
				return this;
			}

			var isRight = (this.position == 'right'),
				anim = isRight ? {marginRight: -this.width} : {marginLeft: -this.width};
			
			this.rotateArrow(isRight ? 180 : 0, 0);
			
			this.container.animate(
				anim,
				(typeof duration === 'number' || typeof duration === 'string')
					? duration : 500,
				'easeOutExpo'
			);
			
			$('body').animate(
			isRight ? {marginRight: '-=' + this.width} : {marginLeft: '-=' + this.width},
			500, 'easeOutExpo');

			this.isOpen = false;

			return this;
		},
		
		activatePanel: function (panel, element) {
			if (typeof panel === 'string') {
				panel = this.getPanelById(panel);
			}
			
			if (panel){
				panel.activate(element);
			}
			
			this.roundCorners();
			
			return this;
		},
		
		expandPanel: function (panel, callback) {
			if (typeof panel === 'string') {
				panel = this.getPanelById(panel);
			}
			
			if (panel){
				panel.expand(callback);
			}
			
			return this;
		},
		
		collapsePanel: function (panel, callback) {
			if (typeof panel == 'string') {
				panel = this.getPanelById(panel);
			}
			
			if (panel){
				panel.collapse(callback);
			}
			
			return this;
		},
		
		/**
		 * Adds a panel to this sidebar instance.
		 *
		 * We try and build as much of the panel DOM as we can before inserting
		 * it into the DOM in order to reduce reflow.
		 *
		 * @param {Object} panel - either a panel instance or an associative
		 *			   array containing settings for the construction
		 *			   of a new panel.
		 * @param {Boolean} deferRounding - (Optional) If true, the rounding-off
		 *				    of the top most and bottom most panels
		 *				    will not be automatically done. Set
		 *				    this to true when adding a lot of panels
		 *				    at once.
		 * @return {Object} - The newly created panel.
		 */
		addPanel: function (panel, deferRounding) {
			if (!(panel instanceof Panel)) {
				if (!panel.width) {
					panel.width = this.width;
				}
				panel.sidebar = this;
				panel = new Panel(panel);
			}
			
			this.panels[panel.id] = panel;
			
			this.container.find(nsSel('panels')).append(panel.element);
			
			if (deferRounding !== true) {
				this.roundCorners();
			}
			this.checkActivePanels(Aloha.Selection.getRangeObject());
			return panel;
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
				<div class="{panel-content-inner}">			\
					<div class="{panel-content-inner-text}">\
					</div>									\
				</div>										\
			</div>											\
		'));
		this.element  = null;
		this.expanded = false;
		this.effectiveElement = null;
		this.isActive = true;
		
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
			
			if (this.expanded){
				this.content.height('auto');
				this.rotateArrow(90, 0);
			}
			
			this.coerceActiveOn();
			
			// Disable text selection on title element
			this.title
				.attr('unselectable', 'on')
				.css('-moz-user-select', 'none')
				.each(function() {this.onselectstart = function() {return false;};});
			
			if (typeof this.onInit === 'function') {
				this.onInit.apply(this);
			}
		},
		
		/**
		 * Coerce activeOn to function
		 */
		coerceActiveOn: function () {
			if (typeof this.activeOn !== 'function') {
				var activeOn = this.activeOn;
				
				this.activeOn = (function () {
					var typeofActiveOn = typeof activeOn,
						fn;
					
					if (typeofActiveOn === 'boolean') {
						fn = function () {
							return typeofActiveOn;
						};
					} else if (typeofActiveOn === 'undefined') {
						fn = function () {
							return true;
						};
					} else if (typeofActiveOn === 'string') {
						fn = function (el) {
							return el.is(activeOn);
						};
					} else {
						fn = function () {
							return false;
						};
					}
					
					return fn;
				})();
			}
		},
		
		activate: function (effective) {
			this.isActive = true;
			this.content.parent('li').show().removeClass(nsClass('deactivated'));
			this.effectiveElement = effective;
			if (typeof this.onActivate === 'function') {
				this.onActivate.call(this, effective);
			}
		},
		
		deactivate: function () {
			this.isActive = false;
			this.content.parent('li').hide().addClass(nsClass('deactivated'));
			this.effectiveElement = null;
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
			// We do this so that empty panel contents don't appear collapsed
			if (!html || html == '') {
				html = '&nbsp;';
			}
			
			this.content.find(nsSel('panel-content-inner-text')).html(html);
			return this;
		},
		
		rotateArrow: function (angle, duration) {
			var arr = this.title.find(nsSel('panel-title-arrow'));
			arr.animate({angle: angle}, {
					duration: (typeof duration == 'number') ? duration : 500,
					easing: 'easeOutExpo',
					step: function (val, fx) {
						var ieAngle = angle / 90;
						arr.css({
							'-webkit-transform'	: 'rotate(' + val + 'deg)',
							'-moz-transform'	: 'rotate(' + val + 'deg)',
							'-ms-transform'		: 'rotate(' + val + 'deg)',
							filter				: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + ieAngle + ')'
						});
					}
				});
		},
		
		renderEffectiveParents: function (effective, renderer) {
			var el = effective.first(),
				content = [],
				path = [],
				activeOn = this.activeOn,
				l,
				pathRev;
			
			while (el.length > 0 && !el.is('.aloha-editable')) {
				
				if (activeOn(el)) {
					path.push('<span>' + el[0].tagName.toLowerCase() + '</span>');
					l = path.length;
					pathRev = [];
					while (l--) {
						pathRev.push(path[l]);
					}
					content.push(
						'<div class="aloha-sidebar-panel-parent">\
							<div class="aloha-sidebar-panel-parent-path">{path}</div>\
							<div class="aloha-sidebar-panel-parent-content aloha-sidebar-opened">{content}</div>\
						 </div>'.supplant({
							path	: pathRev.join(''),
							content	: (typeof renderer === 'function') ? renderer(el) : '----'
						})
					);
				}
				
				el = el.parent();
			}
			
			this.setContent(content.join(''));
			
			$('.aloha-sidebar-panel-parent-path').click(function () {
				var c = $(this).parent().find('.aloha-sidebar-panel-parent-content');
				
				if (c.hasClass('aloha-sidebar-opened')) {
					c.hide().removeClass('aloha-sidebar-opened');
				} else {
					c.show().addClass('aloha-sidebar-opened');
				}
			});
			
			//console.log(this.content);
			this.content.height('auto').find('.aloha-sidebar-panel-content-inner').height('auto');
			//this.sidebar.updateHeight();
		}
		
	});
	
	// Expose Sidebar through Aloha as soon Aloha becomes available
	$('body').bind('aloha', function () {
		var left = new Sidebar({
			position : 'left',
			width	 : 250 // TODO define in config
		});
		
		var right = new Sidebar({
			position : 'right',
			width	 : 250 // TODO define in config
		});

		Aloha.Sidebars = {
			left  : left,
			right : right
		};
		
		// Broadcast that Sidebars have arrived!
		$('body').trigger(nsClass('initialized'), Aloha.Sidebars);
	});
	
	return Sidebar;
}

); // require
