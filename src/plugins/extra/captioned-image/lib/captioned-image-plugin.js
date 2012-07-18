/**
 * Captioned Images provides an Aloha block implementation that allows the
 * editor to work with images that have captions, such that an image with is
 * corresponding caption can be position, and aligned together in an editable.
 */
define([
	'jquery',
	'aloha/core',
	'aloha/plugin',
	'block/block',
	'block/blockmanager',
	'ui/ui',
	'ui/button'
], function (
	$,
	Aloha,
	Plugin,
	Block,
	BlockManager,
	Ui,
	Button
) {
	'use strict';

	$('<style type="text/css">').text('\
		.aloha-captioned-image {display: inline-block;}\
		.aloha-captioned-image>div {\
			text-align: center;\
			padding: 0 1em 1em;\
		}\
		.aloha-captioned-image .float-right {padding-right: 0;}\
		.aloha-captioned-image .float-left {padding-left: 0;}\
		.aloha-captioned-image .caption {\
			padding: 0.5em;\
			font-size: 0.9em;\
			background: rgba(0,0,0,0.8);\
			font-family: Arial;\
			color: #fff;\
			text-align: left;\
			min-width: 100px;\
		}\
		.aloha-captioned-image-hidden .caption {display: none;}\
		.aloha-captioned-image-hidden.aloha-block-active .caption {display: block;}\
	').appendTo('head:first');

	var components = [];

	components.push(Ui.adopt('imgFloatLeft', Button, {
		tooltip: 'Float image to left',
		text: 'Float left',
		click: function () {
			if (BlockManager._activeBlock) {
				BlockManager._activeBlock.attr('position', 'left');
			}
		}
	}));

	components.push(Ui.adopt('imgFloatRight', Button, {
		tooltip: 'Float image to right',
		text: 'Float right',
		click: function () {
			if (BlockManager._activeBlock) {
				BlockManager._activeBlock.attr('position', 'right');
			}
		}
	}));

	components.push(Ui.adopt('imgFloatClear', Button, {
		tooltip: 'Float image to clear',
		text: 'No floating',
		click: function () {
			if (BlockManager._activeBlock) {
				BlockManager._activeBlock.attr('position', 'none');
			}
		}
	}));

	function showComponents() {
		var j = components.length;
		while (j) {
			components[--j].foreground();
		}
	}

	var render = Aloha.settings &&
	             Aloha.settings.plugins &&
	             Aloha.settings.plugins.captionedImage &&
	             Aloha.settings.plugins.captionedImage.render;

	if (!render) {
		render = function (properties, callback, error) {
			var src = properties.src || 'img/noimg.gif';
			var alt = properties.alt || '';
			var caption = properties.caption || '';
			var $content = $(
				'<div>' +
					'<img src="' + src + '" alt="' + alt + '"/>' +
					'<div class="caption">' +  caption + '</div>' +
				'</div>'
			);

			if ('left' === properties.position || 'right' === properties.position) {
				$content.css('float', properties.position)
				        .addClass('float-' + properties.position);
			}

			$content.find('>img:first').css({
				width: properties.width || '',
				height: properties.height || ''
			});

			 callback({
				content: $content[0].outerHTML,
				image: '>div>img:first',
				caption: '>div>div.caption:first'
			});
		}
	}

	function onEditableClick() {
		if (BlockManager._activeBlock) {
			BlockManager._activeBlock.$_caption.focus();
			showComponents();
		}
	}

	function wrapNakedCaptionedImages($editable) {
		var $imgs = $editable.find('img.aloha-captioned-image');
		var j = $imgs.length;
		var $img;

		while (j) {
			var $img = $imgs.eq(--j);

			var $block = $img.removeClass('aloha-captioned-image')
							 .wrap('<div class="aloha-captioned-image">')
							 .parent();

			$block.attr('data-alt', $img.attr('alt'));
			$block.attr('data-source', $img.attr('src'));
			$block.attr('data-width', $img.attr('width'));
			$block.attr('data-height', $img.attr('height'));
			$block.attr('data-caption', $img.attr('data-caption'));

			$img.attr('width', '')
			    .attr('height', '')
			    .attr('data-caption', '')
			    .attr('data-aloha-captioned-image-tag', 'img');
		}
	}

	function findCaptionedImages($editable) {
		return $editable.find('.aloha-captioned-image');
	}

	function initializeImageBlocks($editable) {
		wrapNakedCaptionedImages($editable);
		var $all = findCaptionedImages($editable);
		var $blocks = $();
		var j = $all.length;
		while (j) {
			if (!$all.eq(--j).hasClass('aloha-block')) {
				$blocks = $blocks.add($all[j]);
			}
		}
		$blocks.alohaBlock({
			'aloha-block-type': 'CaptionedImageBlock'
		});
	}

	var CaptionedImageBlock = Block.AbstractBlock.extend({
		title: 'Captioned Image',
		onblur: null,
		onload: null,
		$_image: null,
		$_caption: null,
		init: function ($element, postProcessCallback) {
			if (this._initialized) {
				return;
			}

			var that = this;

			this.onload = function () {
				that.$_caption.css('width', that.$_image.width());
			};
			this.onblur = function () {
				var html = that.$_caption.html();
				if (that.attr('caption') !== html) {
					that.attr('caption', html);
				}
			};

			this.$element.css('float', this.attr('position'));

			render({
				alt: this.attr('alt'),
				src: this.attr('source'),
				width: this.attr('width'),
				height: this.attr('height'),
				caption: this.attr('caption'),
				position: this.attr('position')
			}, function (data) {
				that._processRenderedData(data);
				that.$_image.bind('load', that.onload);
				postProcessCallback();
			}, function (error) {
				if (window.console) {
					console.error(error);
				}
				postProcessCallback();
			});
		},
		update: function ($element, postProcessCallback) {
			this.$_image.unbind('load', this.onload);
			this.$_caption.unbind('blur', this.onblur);
			this.$element.css('float', this.attr('position'));

			var that = this;

			render({
				alt: this.attr('alt'),
				src: this.attr('source'),
				width: this.attr('width'),
				height: this.attr('height'),
				caption: this.attr('caption'),
				position: this.attr('position')
			}, function (data) {
				that._processRenderedData(data);
				postProcessCallback();
			}, function (error) {
				if (window.console) {
					console.error(error);
				}
				postProcessCallback();
			});
		},
		_processRenderedData: function (data) {
			this.$element.html(data.content);
			this.$_image = this.$element.find(data.image);
			this.$_caption = this.$element.find(data.caption);
			this.$_caption.addClass('aloha-editable')
			    .css('width', this.$_image.width())
			    .bind('blur', this.onblur);

			if (this.attr('caption')) {
				this.$element.removeClass('aloha-captioned-image-hidden');
			} else {
				this.$element.addClass('aloha-captioned-image-hidden');
			}
		}
	});

	var CaptionedImage = Plugin.create('captioned-image', {
		init: function () {
			BlockManager.registerBlockType('CaptionedImageBlock', CaptionedImageBlock);
			var j = Aloha.editables.length;
			while (j) {
				initializeImageBlocks(Aloha.editables[--j].obj);
			}
			Aloha.bind('aloha-editable-created', function ($event, editable) {
				initializeImageBlocks(editable.obj);
				editable.obj.delegate('div.aloha-captioned-image', 'click',
					onEditableClick);
			});
			Aloha.bind('aloha-editable-destroy', function ($event, editable) {
				editable.obj.undelegate('div.aloha-captioned-image', 'click',
					onEditableClick);
			});
		},

		makeClean: function ($content) {
			return $content;
		}
	});

	return CaptionedImage;
});
