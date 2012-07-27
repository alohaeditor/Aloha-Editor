define([ 'aloha/plugin', 'plugins/math' ], function(plugin) 
{
    "use strict";
    return plugin.create( 'some-plugin', {
        defaults: 
        {
            value: 10
        },
        init: function() 
        {
            console.log('something very interesting happening');
            
        }
    });
});