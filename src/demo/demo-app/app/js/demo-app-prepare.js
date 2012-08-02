$(document).ready(function() {
	// hide the save and edit button on startup
	$('#save-page').hide();
	$('#edit-page').hide();

	// hide the log message container
	$("#log").hide();
	
	// load navigation
	$("#navigation").load("./sitemap.html #sitemap li");
	// and set active navigation item
	setTimeout("setActiveNavItem()",100);
	
	// load title
	$("#brand").load("./sitemap.html #brand a");

	// load footer
	$("#footer").load("./sitemap.html #footer p");
});

function setActiveNavItem() {
	$(".nav li").each(function() {
		if (getFilename($(this).find('a').attr('href')) == getFilename(window.location.pathname)) {
			$(this).addClass( 'active' );
		}
	});
}

function getFilename( path ) {
	var filename = './',
		index = path.lastIndexOf("/");
	
	if ( index ) {
		filename = path.substr( index );
	}
	
	return filename.toLowerCase();
}