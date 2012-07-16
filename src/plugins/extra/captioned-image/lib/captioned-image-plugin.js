define([
	'jquery',
	'aloha/core',
	'aloha/plugin',
	'block/block',
	'block/blockmanager'
], function (
	$,
	Aloha,
	Plugin,
	Block,
	BlockManager
) {
	'use strict';

	var alohaTempAttributes = ['data-aloha-captioned-image-id'];
	var idCounter = 0;

	$('<style type="text/css">').text('\
		.aloha-captioned-image {\
			background: yellow !important;\
		}\
	').appendTo('head:first');

	function findImages ($editable) {
		return $editable.find('img');
	}

	function isImageInitialized($img) {
		return !!$img.attr('data-aloha-captioned-image-id');
	}

	function onEditableActivated (event, data) {
		var $imgs = findImages(data.editable.obj);
		var j = $imgs.length;
		var $blocks = $();
		while (j) {
			if (!isImageInitialized($imgs.eq(--j))) {
				$imgs.eq(j).wrap('<div class="aloha-captioned-image">');
				$blocks = $blocks.add($imgs.eq(j).parent());
			}
		}
		$blocks.alohaBlock({
			'aloha-block-type': 'CaptionedImageBlock'
		});
	}

	var CaptionedImageBlock = Block.AbstractBlock.extend({

		title: 'Captioned Image',

		isInitialized: false,

		init: function ($element, postProcessCallback) {
			if (this.isInitialized) {
				return;
			}
			this.isInitialized = true;
			var $img = $element.find('>img:first').attr('data-aloha-captioned-image-id',
				++idCounter);
			var $caption = $('<div class="aloha-captioned-image-caption aloha-editable">');
			$caption.html($img.attr('data-aloha-image-caption'));
			$element.append($caption).css('width', $img.width());

			postProcessCallback();
		}

	});

	var CaptionedImage = Plugin.create('captioned-image', {
		init: function () {
			BlockManager.registerBlockType('CaptionedImageBlock', CaptionedImageBlock);
			Aloha.bind('aloha-editable-activated', onEditableActivated);
		}
	});

	CaptionedImage.blockType = CaptionedImageBlock;


	return CaptionedImage;
});
