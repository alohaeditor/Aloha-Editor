require( [ '../unit/testutils' ], function ( TestUtils ) {

'use strict';

Aloha.ready( function() {

	var jQuery = Aloha.jQuery,
	    fillArea = jQuery( '#aloha-selection-fill' ),
	    testArea = jQuery( '#aloha-selection-test' ),
	    viewArea = jQuery( '#aloha-selection-view' ),
		applyMarkupOnNextSelection = false;
	
	fillArea.change( function () {
		applyMarkupOnNextSelection = true;
	} );

	jQuery( document ).bind( 'mouseup keyup', onSelectionChanged );
	
	/**
	 * If applyMarkupOnNextSelection is true: we will copy the value in
	 * fillArea into the testArea, and applySelection on it.
	 *
	 * Otherwise we will check to see if one of either the start of end
	 * container is within testArea. If so we will add markers on the current
	 * range object, 
	 */
	function onSelectionChanged () {
		if ( applyMarkupOnNextSelection ) {
			testArea[ 0 ].innerHTML = fillArea.val();
			applySelection( testArea );
			applyMarkupOnNextSelection = false;
			
			// return;
		}
		
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
					 parent.parents( '#' + testArea.attr( 'id' ) )
						.length == 0 ) {
					return;
				}
			}
			
			TestUtils.addBrackets( range );
			
			applySelection( testArea );
		}
	};
	
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
			elem.html( elem.html().replace(
				/\{|\[|(data\-(start|end)\s*=\s*[\"\'][^\"\']*[\"\'])|\}|\]/g,
				''
			) );
		}
	};
	
	/**
	 * If the given element contains one start selection marker and one end
	 * selection marker, then we will attempt to apply the selection on the
	 * element.
	 *
	 * @param {DOMElement} elem - DOM Element whose innerHTML contains
	 *							  selection markers defining the selection that
	 *							  should be applied to it.
	 */
	 function applySelection ( elem ) {
		// convert html for processing
		var html = elem.html();
		var content = jQuery( '<div>' ).text( html ).html();
		
		// Display the current selection in the viewArea
		viewArea.html( content.replace( /([\[\]\{\}])/g, '<b>$1</b>' ) );

		var startMarkers = html.match( /\{|\[|data\-start/g ),
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

