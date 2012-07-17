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
			background: whiteSmoke;\
		}\
		.aloha-captioned-image-caption {\
			padding: 1em;\
			font-size: 0.8em;\
		}\
	').appendTo('head:first');

	var components = [];

	components.push(Ui.adopt('imgFloatLeft', Button, {
		tooltip: 'Float image to left',
		text: 'Float left',
		click: function () {
			if (BlockManager) {
				BlockManager._activeBlock.attr('position', 'left');
			}
		}
	}));

	components.push(Ui.adopt('imgFloatRight', Button, {
		tooltip: 'Float image to right',
		text: 'Float right',
		click: function () {
			if (BlockManager) {
				BlockManager._activeBlock.attr('position', 'right');
			}
		}
	}));

	components.push(Ui.adopt('imgFloatClear', Button, {
		tooltip: 'Float image to clear',
		text: 'No floating',
		click: function () {
			if (BlockManager) {
				BlockManager._activeBlock.attr('position', 'none');
			}
		}
	}));

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
		findBlocks($editable).alohaBlock({
			'aloha-block-type': 'CaptionedImageBlock'
		});
	}

	var CaptionedImageBlock = Block.AbstractBlock.extend({
		title: 'Captioned Image',
		$_image: $('<img>'),
		$_caption: $('<div class="aloha-captioned-image-caption aloha-editable">'),
		init: function ($element, postProcessCallback) {
			if (this._initialized) {
				return;
			}
			var $img = this.$_image;
			$img.load(function () {
				$element.css('width', $img.width());
			});
			$element.append(this.$_image).append(this.$_caption);
			this._renderAttributes();
			postProcessCallback();
		},
		update: function ($element, postProcessCallback) {
			this._renderAttributes();
			postProcessCallback();
		},
		_renderAttributes: function () {
			this.$_image.attr('src', this.attr('source'));
			this.$_caption.html(this.attr('caption'));
			this.$element.css('float', this.attr('position') || 'none');
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

	CaptionedImage.blockType = CaptionedImageBlock;

	return CaptionedImage;
});
