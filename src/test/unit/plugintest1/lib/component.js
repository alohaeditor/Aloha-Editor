define(
['./componenttype'], // dependency in the same path
function( componenttype ) {
    "use strict";
 
    var component = new componenttype.extend({
        doOther: function() {
            // haha
        }
    });
    return component;
 
});