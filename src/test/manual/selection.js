require( [ '../unit/testutils' ], function ( TestUtils ) {

'use strict';

Aloha.ready( function() {

	var jQuery = Aloha.jQuery,
	    fillArea = jQuery( '#aloha-selection-fill' ),
	    testArea = jQuery( '#aloha-selection-test' ),
	    viewArea = jQuery( '#aloha-selection-view' );

	fillArea.change( function () {
		testArea[ 0 ].innerHTML = fillArea.val();
		testArea.trigger( 'keyup' );
		applySelection( testArea );
	} );

	jQuery( document ).bind( 'mouseup keyup', function ( ev ) {
		var range = getRange();
		
		if ( range ) {
			// Check that atleast one of either of the end or start containers
			// is within the "selectable" testArea
			var containers = jQuery( [ range.startContainer,
				range.endContainer ] );
			
			if ( containers.length == 0 ) {
				return;
			}
			
			if ( !containers.is( testArea ) ) {
				var parent = containers.parent();
				if ( !parent.is( testArea ) &&
					 parent.parent( '#' + testArea.attr( 'id' ) )
						.length == 0 ) {
					return;
				}
			}
			
			TestUtils.addBrackets( range );
			
			var html = jQuery( '<div>' ).text( testArea.html() ).html();
			html = html.replace( /([\[\]\{\}])/g, '<b>$1</b>' );
			
			viewArea.html( html );
			
			applySelection( testArea );
		}
	} );
	
	/**
	 * Catches exceptions caused when invoking getRangeAt, without any ranges
	 * available.
	 * Unfortunately Aloha.getSelection().ranges is always empty, even if there
	 * is a range object. This means that we cannot do any useful bound checks
	 * before invoking the getRangeAt method.
	 *
	 * @return {Object:range}
	 */
	function getRange () {
		try {
			return Aloha.getSelection().getRangeAt( 0 );
		} catch ( ex ) {
			return null;
		}
	};
	
	/**
	 * Remove all occurances of the following selection marker delimiters from
	 * the given element: {, }, [, ], data-start, data-end
	 *
	 * @param {DOMElement}
	 */
	function stripMarkers ( elem ) {
		if ( elem && elem.length ) {
			var html = elem.html();
			elem.html( html.replace(
				/\{|\[|(data\-(start|end)\s*=\s*[\"\'][^\"\']*[\"\'])|\}|\]/g,
				''
			) );
		}
	};
	
	/**
	 * If we find one start selection marker and one end selection marker, then
	 * we will attempt to applythe selection
	 */
	 function applySelection ( elem ) {
		var html = elem.html(),
		    startMarkers = html.match( /\{|\[|data\-start/g ),
		    endMarkers = html.match( /\}|\]|data\-end/g ),
			numMarkers = 0;
		
		if ( startMarkers && startMarkers.length ) {
			numMarkers += startMarkers.length;
		}
		
		if ( endMarkers && endMarkers.length ) {
			numMarkers += endMarkers.length;
		}
		
		if ( numMarkers == 1 ) {
			Aloha.Console.warn( 'Collapsed selection at end of node: ' );
			Aloha.Console.warn( getRange() );
			stripMarkers( elem );
		} else if ( numMarkers == 2 ) {
			var range = TestUtils.addRange( elem ),
			    selection = Aloha.getSelection();
			
			selection.removeAllRanges();
			selection.addRange( range );
		} else {
			// if numMarkers is > 2 then we have a problem, and we will remove
			// all markers to create a "clean-sheet"
			stripMarkers( elem );
		}
	 };

} ); // Aloha.ready

} ); // require

