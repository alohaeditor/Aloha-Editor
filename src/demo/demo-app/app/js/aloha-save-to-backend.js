
// Aloha is ready; 
// Listen to the 'aloha-editable-deactivated' event and save the data to our backend

Aloha.ready(function() {
	Aloha.require( ['aloha', 'jquery'], function( Aloha, jQuery) {

		// start: save content on deactivation of an Aloha Editable
		Aloha.bind('aloha-editable-deactivated', function() {
			var backend = 'session', // session, db, file
				content = Aloha.activeEditable.getContents(), // this is the cleaned content of the last active editable
				contentId = Aloha.activeEditable.getId(), // this HTML ID of the DOM element
				pageId = window.location.pathname; // page URL / ID

			// textarea handling -- html id is "xy" and will be "xy-aloha" for the aloha editable
			if ( contentId.match(/-aloha$/gi) ) {
				contentId = contentId.replace( /-aloha/gi, '' );
			}

			// send the data to our save.php backend script
			var request = jQuery.ajax({
				url: "app/save-to-" + backend + ".php",
				type: "POST",
				data: {
					content : content,
					contentId : contentId,
					pageId : pageId
				},
				dataType: "html"
			});

			request.done(function(msg) {
				// everything was fine; content saved
				jQuery("#log p").html( msg );
			});

			request.fail(function(jqXHR, textStatus) {
				// there was a problem; content not saved
				jQuery("#log p").html( "Request failed: " + textStatus );
			});
		});
		// end: save content on deactivation of an Aloha Editable

	});
});
