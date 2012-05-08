// Aloha Editor Demo logic

Aloha.ready(function() {
	Aloha.require( ['aloha', 'aloha/jquery' ], function( Aloha, jQuery ) {
		// here jQuery 1.6 from Aloha is used
		//console.log('Aloha jQuery: ' + jQuery().jquery);
		
		// Aloha is fully loaded. hide loading message
		jQuery('#aloha-loading').hide();

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
});
