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
		.aloha-captioned-image {\
			text-align: center;\
			margin: 0 1em 1em;\
		}\
		.aloha-captioned-image-float-right {\
			margin-right: 0;\
		}\
		.aloha-captioned-image-float-left {\
			margin-left: 0;\
		}\
		.aloha-captioned-image .caption {\
			padding: 0.5em;\
			font-size: 0.9em;\
			background: rgba(0,0,0,0.8);\
			font-family: Arial;\
			color: #fff;\
			text-align: left;\
			min-width: 100px;\
		}\
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

	var render = Aloha.settings &&
	             Aloha.settings.plugins &&
	             Aloha.settings.plugins.captionedImage &&
	             Aloha.settings.plugins.captionedImage.render;

	if (!render) {
		render = function (properties, callback, error) {
			var $content = $(
				'<div>' +
					'<img src="' + properties.src + '" ' +
					     'alt="' + properties.alt + '"/>' +
					'<div class="caption">' + properties.caption + '</div>' +
				'</div>'
			);

			if (properties.position) {
				$content.css('float', properties.position);
			}

			$content.find('>img:first').css({
				width: properties.width,
				height: properties.height
			});

			 callback({
				content: $content[0].outerHTML,
				image: '>div>img:first',
				caption: '>div>div.caption:first'
			});
		}
	}

	function findBlocks($editable) {
		return $editable.find('.aloha-captioned-image');
	}

	function showComponents() {
		var j = components.length;
		while (j) {
			components[--j].foreground();
		}
	}

	function initImageBlocksInEditable($editable) {
		var $all = findBlocks($editable);
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
		$_image: null,
		$_caption: null,
		init: function ($element, postProcessCallback) {
			if (this._initialized) {
				return;
			}

			var that = this;

			render({
				src: this.attr('source'),
				caption: this.attr('caption'),
				width: this.attr('width'),
				height: this.attr('height'),
				alt: this.attr('alt')
			}, function (data) {
				$element.html(data.content);
				that.$_image = $element.find(data.image);
				that.$_caption = $element.find(data.caption).addClass('aloha-editable');
				that.$_image.load(function () {
					$element.css('width', that.$_image.width());
				});
				that._updateElementFloating(that.attr('position') || 'none');
				postProcessCallback();
			});
		},
		update: function ($element, postProcessCallback) {
			this._renderAttributes();
			postProcessCallback();
		},
		_updateElementFloating: function (floating) {
			this.$element.css('float', floating);
			if ('left' === floating) {
				this.$element
				    .removeClass('aloha-captioned-image-float-right')
				    .addClass('aloha-captioned-image-float-left');
			} else if ('right' === floating) {
				this.$element
				    .removeClass('aloha-captioned-image-float-left')
				    .addClass('aloha-captioned-image-float-right');
			} else {
				this.$element
				    .removeClass('aloha-captioned-image-float-left')
				    .removeClass('aloha-captioned-image-float-right');
			}
		},
		_renderAttributes: function () {
			this.$_image.attr('src', this.attr('source'));
			this.$_caption.html(this.attr('caption'));
			this._updateElementFloating(this.attr('position') || 'none');
		}
	});

	var CaptionedImage = Plugin.create('captioned-image', {
		init: function () {
			BlockManager.registerBlockType('CaptionedImageBlock', CaptionedImageBlock);
			var j = Aloha.editables.length;
			while (j) {
				initImageBlocksInEditable(Aloha.editables[--j].obj);
			}
			Aloha.bind('aloha-editable-created', function ($event, editable) {
				initImageBlocksInEditable(editable.obj);
				editable.obj.delegate('div.aloha-captioned-image', 'click',
					showComponents);
			});
			Aloha.bind('aloha-editable-destroy', function ($event, editable) {
				editable.obj.undelegate('div.aloha-captioned-image', 'click',
					showComponents);
			});
		},

		makeClean: function ($content) {
			return $content;
		}
	});

	return CaptionedImage;
});
