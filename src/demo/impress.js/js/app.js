Aloha.ready(function() {
	jQuery('.step').aloha();

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


// We don't need to wait for Aloha in this case;
// Just get the data from our backend database and write the saved HTML into the DOM
// Note: In this Example we don't care about SEO / non JavaScript devices!

$(document).ready(function() {
		
		// get the current page URL / ID and all Aloha Editables for that page
		var backend = 'session', // session, db -- no file backend for reading needed
			pageId = window.location.pathname;

		if ( backend == 'file' ) {
			return false;
		}
		
		// read the data from our database backend
		var request = jQuery.ajax({
			url: "app/read-from-" + backend + ".php",
			type: "POST",
			data: {
				pageId : pageId
			},
			dataType: "json"
		});

		request.done(function(msg) {
			// insert all content into the coresponding html container
			jQuery.each(msg, function() {
				// Aloha is not ready yet so we just alter the DOM 
				jQuery('#'+this.contentId).html(this.content);
			});
		});

		request.fail(function(jqXHR, textStatus) {
			jQuery("#log p").html( "Request failed: " + textStatus );
			alert("Request failed: " + textStatus );
		});

});
