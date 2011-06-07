/*!
 * Aloha Editor
 */

(function (window, undefined) {
	
	'use strict';
	
	var  jQuery	= window.alohaQuery || window.jQuery,
			  $ = jQuery,
		GENTICS = window.GENTICS,
		  Aloha	= window.Aloha;
	
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
	
	var dom_util = GENTICS.Utils.Dom,
		clss = 'aloha-comments',
		uid = +(new Date),
		add_box = $(
			'<div class="' + clss + '-addbox">' +
				'<div class="' + clss + '-content">' +
					'<h2>Comment:</h2>' +
					'<input class="' + clss + '-user" value="your@email.com" />' +
					'<textarea></textarea>' +
					'<ul class="' + clss + '-colors"></ul>' +
					'<button class="' + clss + '-submit">Submit</button>' +
					'<div class="' + clss + '-clear"></div>' +
				'</div>' +
				'<div class="' + clss + '-arrow">' +
					'<div class="' + clss + '-arrow-inner"></div>' +
				'</div>' +
			'</div>'
		),
		view_box = $(
			'<div class="' + clss + '-viewbox">' +
				'<div class="' + clss + '-content">' +
					'<h2>Comment:</h2>' +
					'<textarea></textarea>' +
					'<ul class="' + clss + '-colors"></ul>' +
					'<button class="' + clss + '-submit">Submit</button>' +
					'<div class="' + clss + '-clear"></div>' +
				'</div>' +
				'<div class="' + clss + '-arrow">' +
					'<div class="' + clss + '-arrow-inner"></div>' +
				'</div>' +
			'</div>'
		),
		current_comment;
	
	Aloha.Comments = new (Aloha.Plugin.extend({
		
		user: null,
		comments: {},
		colors: {
			'Golden Yellow' : '#fc0',
			'Blood Red'		: '#c33',
			'Sky Blue'		: '#9cf',
			'Grass Green'	: '#9c0'
		},
		isModalOpen: false,
		isRevealing: false,
		bar: null,
		isBarOpen: false,
		
		_constructor: function () {
			this._super('comments');
		},
		
		init: function () {
			var that = this,
				ul = add_box.find('.' + clss + '-colors');
			
			$('body').append(add_box).mousedown(function () {
				that.bodyClicked.apply(that, arguments);
			});
			
			$.each(this.colors, function (k, v) {
				ul.append(
					$('<li title="' + k + '" style="background-color:' + v + '"></li>')
						.click(function () {that.setColor(k);})
				);
			});
			
			add_box.find('.' + clss + '-submit').click(function () {
				that.submit();
			});
			
			this.preloadImages();
			this.initBtns();
			this.createBar();
		},
		
		initBtns: function () {
			var that = this,
				add_btn = new Aloha.ui.Button({
					iconClass: 'aloha-button aloha-comments-btn aloha-comments-btn-add',
					onclick: function () {
						that.addComment.apply(that, arguments);
					},
					tooltip: 'Comments tooltip'
				}),
				reveal_btn = new Aloha.ui.Button({
					iconClass: 'aloha-button aloha-comments-btn',
					onclick: function () {
						that.revealComments.apply(that, arguments);
					},
					tooltip: 'Comments tooltip'
				});
			
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				add_btn,
				'Comments',
				1
			);
			Aloha.FloatingMenu.addButton(
				'Aloha.continuoustext',
				reveal_btn,
				'Comments',
				1
			);
		},
		
		createBar: function () {
			var that = this,
				bar = this.bar = $(
				'<div class="' + clss + '-bar">' +
					'<h2>Comments:</h2>' +
					'<ul class="' + clss + '-bar-comments"></ul>' +
				'</div>'
			).css({height: $(window).height()}).click(function () {
				that.barClicked.apply(that, arguments);
			});
			
			$('body').append(bar);
		},
		
		barClicked: function (event) {
			var li = $(event.target);
			
			if (!li.hasClass(clss + '-thread-comment')) {
				li = li.parents('.' + clss + '-thread-comment');
			}
			
			if (li.length > 0) {
				li.html('tes');
			}
			
			console.log(li);
		},
		
		addComment: function () {
			var that = this,
				range = Aloha.Selection.getRangeObject(),
				id = clss + '-' + (++uid),
				classes = [clss + '-wrapper', id],
				wrapper = $('<div class="' + classes.join(' ') + '">');
			
			dom_util.addMarkup(range, wrapper);
			dom_util.doCleanup({'merge' : true, 'removeempty' : true}, range);
			
			var comment = current_comment = this.comments[id] = {
				id		  : id,
				timestamp : null,
				email	  : null,
				comment	  : null,
				kids	  : [],
				mom		  : null,
				color	  : this.colors['Golden Yellow'],
				elements  : $('.' + id),
				commonAncestor: $(range.getCommonAncestorContainer())
			};
			
			this.highlight(comment);
			this.openModal(comment);
			
			$('.aloha-floatingmenu').hide();
			
			comment.elements.click(function () {
				that.commentClicked(comment);
			}).hover(
				function () {that.hover(comment, true);},
				function () {that.hover(comment, false);}
			);
		},
		
		revealComments: function () {
			jQuery.each(this.comments, function (id, comment) {
				comment.elements
					.addClass(clss + '-active')
					.css('background-color', comment.color);
			});
			
			this.isRevealing = true;
		},
		
		openModal: function (comment) {
			var that = this,
				el = comment.elements,
				pos = el.first().offset(),
				win = jQuery(window);
			
			add_box.show().css('height', 'auto');
			
			var content = add_box.find('.' + clss + '-content'),
				h = content.height();
			
			add_box.css({
				left : pos.left + (el.first().width() / 2) - (add_box.outerWidth(true) / 2),
				top  : pos.top - (add_box.outerHeight(true) + 30),
				'margin-top': h,
				opacity: 0
			}).animate({
				'margin-top': 0,
				opacity: 1
			}, 750, 'easeOutElastic', function () {
			});
			
			if (!that.user) {
				add_box.find('input.' + clss + '-user').select();
			} else {
				add_box.find('input.' + clss + '-user').val(that.use);
				add_box.find('textarea').val('').focus();
			}
			
			$(document).scrollTop(add_box);
			content.css('height', 0).animate({height: h}, 750, 'easeOutElastic');
			
			this.isModalOpen = true;
		},
		
		closeModal: function () {
			$('.aloha-floatingmenu').show();
			
			/*
			var content = add_box.find('.' + clss + '-content'),
				h = content.height();
			content.animate({height: 0}, 250, 'linear', function () {
				$(this).parent().hide();
			});
			
			add_box.animate({
				'margin-top': h
			}, 250, 'linear');
			 */
			
			add_box.fadeOut(250);
			
			$('.' + clss + '-grayed')
				.removeClass(clss + '-grayed')
				.css('opacity', '');
			
			$('.' + clss + '-active, .' + clss + '-ancestor')
				.removeClass(clss + '-active')
				.removeClass(clss + '-ancestor')
			
			if (typeof current_comment == 'object') {
				current_comment.elements.css('background-color', '');
				current_comment = undefined;
			}
			
			this.isModalOpen = false;
		},
		
		highlight: function (comment) {
			comment.elements
				.css('background-color', comment.color)
				.addClass(clss + '-active')
				// traverse ancestors and mark them as such
				.parents().addClass(clss + '-ancestor')
				// find all siblings except floatingmenu -addbox -ancestor
				.siblings(':not(' +
					'.' + clss + '-addbox,'	  +
					'.' + clss + '-ancestor,' +
					'.' + clss + '-bar,'	  +
					'.aloha-floatingmenu'	  +
				')').addClass(clss + '-grayed');
			
			this.highlightElement(comment.commonAncestor);
			
			$('.' + clss + '-grayed').css('opacity', 0.1);
			
			$('.' + clss + '-cleanme').each(function () {
				if (dom_util.isEmpty(this)) {
					$(this).remove();
				}
			});
		},
		
		highlightElement: function (element) {
			var that = this;
			
			element.contents().each(function () {
				var el = (this.nodeType == 3)
					? $(this).wrap('<span class="' + clss + '-cleanme">').parent()
					: $(this);
				
				if (el.hasClass(clss + '-ancestor')) {
					that.highlightElement(el);
				} else if (!el.hasClass(clss + '-active')) {
					el.addClass(clss + '-grayed');
				}
			});
			
			return element;
		},
		
		hover: function (comment, onenter) {
			if (!this.isModalOpen && !this.isRevealing) {
				if (onenter) {
					comment.elements.addClass(clss + '-hover')
						.css('background-color', comment.color);
				} else {
					comment.elements.removeClass(clss + '-hover')
						.css('background-color', '');
				}
			}
		},
		
		commentClicked: function (comment) {
			this.showBar(comment);
		},
		
		showBar: function (comment) {
			this.bar.animate({
				'width': 300
			}, 250, 'easeOutExpo');
			
			jQuery('body').animate({
				'margin-left': 300
			}, 250, 'easeOutExpo');
			
			this.isBarOpen = true;
			
			this.highlight(comment);
			
			this.printThread(this.bar.find('.' + clss + '-bar-comments'), comment);
		},
		
		closeBar: function () {
			this.bar.animate({
				'width': 0
			}, 250, 'easeOutExpo');
			
			jQuery('body').animate({
				'margin-left': 0
			}, 250, 'easeOutExpo');
			
			this.isBarOpen = false;
		},
		
		printThread: function (el, comment) {
			var that = this,
				li = $(
					'<li class="' + clss + '-thread-comment">' +
						'<div>' + comment.comment + '</div>' +
					'</li>'
				);
			
			el.append(li);
			
			jQuery.each(comment.kids, function () {
				var ul = $('<ul>');
				li.append(ul);
				that.printThread(ul, this);
			});
		},
		
		setColor: function (index) {
			current_comment.color = this.colors[index];
			current_comment.elements.css('background-color', current_comment.color);
			add_box.find('textarea').focus();
		},
		
		submit: function () {
			var text = add_box.find('textarea'),
				user = add_box.find('.' + clss + '-user'),
				email = user.val().trim(),
				comment = text.val().trim(),
				errors = false;
			
			if (email == '') {
				user.focus().addClass(clss + '-error');
				errors = true;
			}
			
			if (comment == '') {
				text.focus().addClass(clss + '-error');
				errors = true;
			}
			
			if (!errors) {
				this.insertComment(current_comment.id, email, comment);
				this.closeModal();
				this.revealComments();
				text.val('');
				user.val('');
			}
		},
		
		insertComment : function (id, email, comment) {		
			return jQuery.extend(this.comments[id], {
				email	  : email,
				comment	  : comment,
				timestamp : (new Date()).getTime()
			});
		},
		
		bodyClicked: function (event) {
			var el = jQuery(event.target);
			
			if (
				(this.isModalOpen && !el.hasClass(clss + '-addbox'))
				||
				(this.isBarOpen && !el.hasClass(clss + '-bar'))
			) {
				if (el.parents('.' + clss + '-addbox').length == 0 ) {
					this.closeModal();
				}
				
				if (el.parents('.' + clss + '-bar').length == 0 ) {
					this.closeBar();
				}
			}
		},
		
		// What's the best way to determin the img path
		preloadImages: function () {
			jQuery.each([
				'hr.png',
				'textbox.png'
			], function () {(new Image()).src = '/Aloha-Editor/src/plugin/comments/img/' + this;});
		}
		
	}))(); // Aloha.Comments
	
})(window);