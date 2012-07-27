// Aloha Editor Demo logic
Aloha.ready(function() {
	// Aloha is fully loaded. hide loading message
	jQuery('#aloha-loading').hide();

	// check system (@todo should only be done once)
	var request = jQuery.ajax({
		url: "app/system-check.php",
		type: "POST",
		data: {
			system : 'check'
		},
		dataType: "html"
	});

	request.done(function(msg) {
		if ( msg != 'OK' ) {
			jQuery(".topbar").append('<div class="alert-message error">' + msg + '</div>');
		}
	});

	request.fail(function(jqXHR, msg) {
		jQuery(".topbar").append('<div class="alert-message error">It was not possible to perform the system check. Please read to the README.txt file.</div>');
	});
	// end system check

	// un-/comment to activate all editables on page load
	//jQuery('.aloha-editor-demo-editable').aloha();
	
	// un-/comment to activate editables with edit-button on the page
	jQuery('#edit-page').show();


	jQuery('#save-page').bind('click', function() {
		//alert('Save the page content. To be done.');
		//console.log('save page');
		
		jQuery('.aloha-editor-demo-editable').mahalo();
		
		jQuery('.aloha-editor-demo-editable').each(function() {
			var content = this.innerHTML;
			var contentId = this.id;
			var pageId = window.location.pathname;

			//console.log(pageId + ' -- ' + contentId + ' content: ' + content);
			var request = jQuery.ajax({
				url: "app/save-to-session.php",
				type: "POST",
				data: {
					content : content,
					contentId : contentId,
					pageId : pageId
				},
				dataType: "html"
			});

			request.done(function(msg) {
				jQuery("#log").html( msg );
			});

			request.fail(function(jqXHR, textStatus) {
				alert( "Request failed: " + textStatus );
			});
			
		});
		
		jQuery('#edit-page').show();
		jQuery('#save-page').hide();
	});

	jQuery('#edit-page').bind('click', function() {
		jQuery('.aloha-editor-demo-editable').aloha();
		
		jQuery('#edit-page').hide();
		jQuery('#save-page').show();
	});
});
