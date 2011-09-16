(function(){
	
	// load jQuery with noConflict (true ) to remove anyway from global namespace
	// a user may add it by its own with var jQuery = $ = Aloha.jQuery;
	var 
		jQuery = window.jQuery.noConflict( true ),
		deferredReady,
		Ext = window.Ext;
	
	// set jQuery to buildin of not otherwise set and delete local var
	// From here on Aloha.jQuery is always available
	Aloha.jQuery = Aloha.jQuery || jQuery;
	
	deferredReady = Aloha.jQuery.Deferred();
	
	// define jquery and ext modules. They need to be available in global namespace
	Aloha.define('aloha/jquery',[], function() { 
		return Aloha.jQuery;
	});
    Aloha.define('aloha/ext',[], function() {
    	
 		Aloha.require([
	        'css!vendor/ext-3.2.1/resources/css/ext-all.css',
	        'css!vendor/ext-3.2.1/resources/css/xtheme-gray.css'
 		]);

 		// Ext seems to have an onClick handler that uses
		// QuickTips, but the handler doesn't initialize
		// QuickTips and therefore causes an error.
		// The bug occurred with the Gentics Content Node
		// integration, but if it's really a bug in Ext, then
		// it's a good idea to always initialize QuickTips here.
 		Ext.QuickTips.init();
 		
    	return Ext; 
    });
    
	// create promise for 'aloha-ready' when Aloha is not yet ready
    // and fire later when 'aloha-ready' is triggered all other events bind
    Aloha.bind = function( type, fn ) {
    	if ( type == 'aloha-ready' ) {
    		if ( Aloha.stage != 'alohaReady' ) {
    			deferredReady.done( fn );
    		} else {
    			fn();
    		}
    	} else {
    		Aloha.jQuery( Aloha, 'body' ).bind( type, fn );
    	}
    	return this;
    };
	
    Aloha.trigger = function( type, data ) {
    	if ( type == 'aloha-ready' ) {
    		// resolve all deferred events on dom ready and delete local var
    		Aloha.jQuery( deferredReady.resolve );
    	}
    	Aloha.jQuery( Aloha, 'body' ).trigger( type, data );
    	return this;
    };
    
	Aloha.ready = function( fn ) {
    	this.bind('aloha-ready', fn);
    	return this;
};
    
    
})();

//load Aloha core with correct namespace and locale settings
Aloha.require( [ 'aloha/main' ] );