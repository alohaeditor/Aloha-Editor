define([
	'aloha/core',
	'aloha/jquery'
], function( Aloha, jQuery ) {
	/*
	var $element = jQuery('<div style="\
		width:600px; height:150px; background:red;\
		border: 2px solid black;\
		position: absolute;\
		z-index: 999999">').appendTo('body');
	*/

	var PADDING = 10;
	var ANIMATION_TIME = 150;
	var $window = jQuery( window );

	var getOrientation = function( $element ) {
		var offset = $element.offset();
		return {
			width  : $element.width(),
			height : $element.height(),
			top    : offset.top, 
			left   : offset.left
		};
	};

	var floatAbove = function( $element, position ) {
		$element.animate({
			top: position.top - $element.height() - PADDING,
			left: position.left
		}, ANIMATION_TIME)
	};

	var floatBelow = function ( $element, position ) {
		$element.animate({
			top: position.top + PADDING,
			left: position.left
		}, ANIMATION_TIME);
	};

	var floatSurface = function( surface, editable ) {
		var $element = surface.$element;
		var surfaceOrientation = getOrientation( $element );
		var editableOrientation = getOrientation( editable.obj );
		var scrollTop = $window.scrollTop();
		var availableSpace = editableOrientation.top - scrollTop;
		var left = editableOrientation.left;
		var horizontalOverflow = ( left + $element.width() )
		                       - ( $window.width() - PADDING );

		if ( horizontalOverflow > 0 ) {
			left -= horizontalOverflow;
		}

		if ( availableSpace >= surfaceOrientation.height ) {
			floatAbove( $element, editableOrientation );
		} else if ( availableSpace + $element.height() > editableOrientation.height ) {
			floatBelow( $element, {
				top: editableOrientation.top + editableOrientation.height,
				left: left
			});
		} else {
			floatBelow( $element, {
				top: scrollTop,
				left: left
			});
		}
	};

	return floatSurface;
});
