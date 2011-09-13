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
    	return Ext; 
    });
    
	// create promise for 'aloha-ready' when Aloha is not yet ready
    // and fire later when 'aloha-ready' is triggered all other events bind
    Aloha.bind = function( type, fn ) {
    	if ( type === 'aloha-ready' ) {
    		if ( Aloha.stage !== 'alohaReady' ) {
    			deferredReady.done( fn );
    		} else {
    			fn();
    		}
    	} else {
    		Aloha.jQuery( Aloha ).bind( type, fn );
    	}
    };
	
    Aloha.trigger = function( type, data ) {
    	if ( type === 'aloha-ready' ) {
    		// resolve all deferred events on dom ready and delete local var
    		Aloha.jQuery( deferredReady.resolve );
    		delete deferredReady;
    	}
    	Aloha.jQuery( Aloha ).trigger( type, data );
    };
    
	Aloha.ready = function( fn ) {
    	this.bind('aloha-ready', fn);
	};
    
    
})();

//load Aloha core with correct namespace and locale settings
Aloha.require( [ 'aloha/main' ] );