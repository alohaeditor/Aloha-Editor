
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
