// Ensure Namespace
window.GENTICS = window.GENTICS || {};
window.GENTICS.Utils = window.GENTICS.Utils || {};
window.Aloha = window.Aloha || {};
window.Aloha.settings = window.Aloha.settings || {};
window.Aloha.ui = window.Aloha.ui || {};
window.Aloha_loaded_plugins = window.Aloha_loaded_plugins || [];
window.Aloha_pluginDir = window.Aloha_pluginDir || false;
window.Aloha_base = window.Aloha_base || false;

// Handle
(function(window,undefined) {

	// alohaQuery should always be available
	window.alohaQuery = window.alohaQuery||window.jQuery;

	// Prepare Script Loading
	var
		document = window.document,
		includes = [];

	// Prepare baseUrl
	window.GENTICS_Aloha_base = window.GENTICS_Aloha_base || document.getElementById('aloha-script-include').src.replace(/aloha\.js$/,'').replace(/\/+$/,'');

	// Prepare Plugin Loading
	window.Aloha_loaded_plugins = window.Aloha_loaded_plugins||[];

    /*
	  Script elements are added to the head element one after the other.
	  Because when adding all script elements at once, they may be loaded
	  and executed in ANY ORDER (unlike the behaviour when the script tags
	  were present in the head in the pages source)

	  The scripts are not loaded using jQuery.getScript (or jQuery.ajax),
	  because those scripts would not show up in the debuggers, which is
	  inconvenient for debugging.

	  In order to ensure the execution order of the scripts also for IE,
	  we MUST NOT even generate the script elements before appending the first
	  one to the head, because IE starts loading the scripts when the src attribute
	  of the DOM element is set (although the DOM element is not even appended
	  to the head).

	  Therefore, the only secure way to do this is:
	  1. create the script element for the first script
	  2. append it to the head
	  3. wait until the script is fully loaded (and executed),
		 then proceed with step 1. for the next script
	*/

	// Add all core files and dependencies
