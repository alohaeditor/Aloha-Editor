$ = jQuery = {fn: {jquery: 'Fake jQuery to catch accesses to the global object'}};
define('jquery', function () {
	return "Fake jQuery to catch access to the user's defined jQuery";
});
