require( [ '../unit/testutils' ], function ( TestUtils ) {

'use strict';

Aloha.ready( function() {

	var jQuery = Aloha.jQuery,
	    fillArea = jQuery( '#aloha-markup' ),
	    testArea = jQuery( '#aloha-test' ),
	    viewArea = jQuery( '#aloha-view' ),
	    command = jQuery('#command'),
		applyMarkupOnNextSelection = true,
		engine = Aloha,
		selectionRange,
		supportedCommands = Aloha.querySupportedCommands().sort();
	
	for ( var i=0; i < supportedCommands.length; i++ ) {
		command.append('<option	value="' + supportedCommands[i] +'">' + supportedCommands[i] + '</option>');
	}
	
	jQuery('#aloha-test').aloha();
	
	// mark markup as changed
	fillArea.change( function () {
		applyMarkupOnNextSelection = true;
	});

//	jQuery( document ).bind( 'mouseup keyup', onSelectionChanged );
	jQuery( onSelectionChanged );
	jQuery( document ).bind( 'keyup', onSelectionChanged );
	testArea.bind( 'mouseup', onSelectionChanged );
	command.change( queryCommand );

	fillArea.keypress( function( e ) {
		// linux will use key char code 10 if ctrl+enter is pressed
		if ( e.metaKey && (e.which === 13 || e.which === 10)) {
			applyMarkupOnNextSelection = true;
			onSelectionChanged();
			e.preventDefault();
		}
	});
	
	jQuery( '[name=engine]').change( function() {
		if ( jQuery(this).val() == 'aloha' ) {
			testArea.aloha();
			engine = Aloha;
		} else {
			testArea
				.mahalo()
				.contentEditable(true);
			engine = document;
		}
		queryCommand();
	});
		
	jQuery('#command-execute').click( function() {
		var 
			execCommand,
			range;
		
		execCommand = command.val();
		// "If command has no action, raise an INVALID_ACCESS_ERR exception."
		// exception."
		engine.execCommand( execCommand, false, jQuery('#command-value').val() );
		range = Aloha.getSelection().getRangeAt( 0 );
		TestUtils.addBrackets( range );
		applySelection( testArea );
	});
	
	function queryCommand( ) {
		
		var 
			execCommand = command.val(),
			result;
		
		if ( !selectionRange ) {
			return;
		}
		
		if ( !execCommand ) {
			jQuery('#aloha-query').hide();
			return;
		}

		jQuery('#aloha-query').show();
		jQuery('#aloha-indeterm').show();
		jQuery('#aloha-state').show();
		jQuery('#aloha-value').show();
		
		// select the last range before applying a command
		var range = Aloha.createRange();
		range.setStart( selectionRange.startContainer, selectionRange.startOffset) ;
		range.setEnd( selectionRange.endContainer, selectionRange.endOffset);
		Aloha.getSelection().removeAllRanges();
		Aloha.getSelection().addRange(range);
		
		// "If command has no indeterminacy, raise an INVALID_ACCESS_ERR
		try {
			result = engine.queryCommandIndeterm( execCommand );
		} catch (e)	{
			if ( e === "INVALID_ACCESS_ERR" ) {
				jQuery('#aloha-indeterm').hide();
			} else {
//				throw(e);
			}
		}
		jQuery('#aloha-indeterm-result').html( (result ? 'true' : 'false') );

		// "If command has no state, raise an INVALID_ACCESS_ERR exception."
		try {
			result = engine.queryCommandState( execCommand );
		} catch (e)	{
			if ( e === "INVALID_ACCESS_ERR" ) {
				jQuery('#aloha-state').hide();
			} else {
//				throw(e);
			}
		}
		jQuery('#aloha-state-result').html( (result ? 'true' : 'false') );
		
		// "If command has no value, raise an INVALID_ACCESS_ERR exception."
		try {
			result = engine.queryCommandValue( execCommand );
		} catch (e)	{
			if ( e === "INVALID_ACCESS_ERR" ) {
				jQuery('#aloha-value').hide();
			} else {
//				throw(e);
			}
		}
		jQuery('#aloha-value-result').html( result );
		
	};
	
	/**
	 * If applyMarkupOnNextSelection is true: we will copy the value in
	 * fillArea into the testArea, and applySelection on it.
	 *
	 * Otherwise we will check to see if one of either the start of end
	 * container is within testArea. If so we will add markers on the current
	 * range object, 
	 */
	function onSelectionChanged ( e ) {

		if ( applyMarkupOnNextSelection ) {
			testArea[ 0 ].innerHTML = fillArea.val();
			applySelection( testArea );
			applyMarkupOnNextSelection = false;
			
			// return;
		}
		
		var range = getSelectionRange();
		
		if ( range ) {
			// Check that at least one of either of the end or start containers
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
			// wait for double and triple clicks
			setTimeout( function() {
				TestUtils.addBrackets( range );
				applySelection( testArea );
 			}, 200 );
		}
	};
	
	/**
	 * Catches exceptions caused when invoking getRangeAt, without any ranges
	 * available.
	 *
	 * @return {Object:range}
	 */
	function getSelectionRange () {
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
		
		// Display the current selection in the viewArea
		viewArea.val( testArea.html() );
		// convert html for processing
		var html = jQuery( '<div>' ).text( testArea.html() ).html();

		html = elem.html();
		
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
			selectionRange = range;
			queryCommand();

		} else {
			// if numMarkers is > 2 then we have a problem, and we will remove
			// all markers to create a "clean-sheet"
			stripMarkers( elem );
		}
	 };

} ); // Aloha.ready

} ); // require

