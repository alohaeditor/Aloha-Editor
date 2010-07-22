/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
if (typeof GENTICS == 'undefined' || !GENTICS) {
	var GENTICS = {};
}

if (typeof GENTICS.Utils == 'undefined' || !GENTICS) {
	GENTICS.Utils = {};
}

/**
 * Takes over all properties from the 'properties' object to the target object.
 * If a property in 'target' with the same name as a property in 'properties' is already defined it is overridden.
 * 
 * Example:
 * 
 * var o1 = {a : 1, b : 'hello'};
 * var o2 = {a : 3, c : 'world'};
 * 
 * GENTICS.Utils.applyProperties(o1, o2);
 * 
 * Will result in an o1 object like this:
 * 
 * {a : 3, b: 'hello', c: 'world'}
 * 
 * @static
 * @return void
 */
GENTICS.Utils.applyProperties = function (target, properties) {
	var name;
	for (name in properties) {
		if (properties.hasOwnProperty(name)) {
			target[name] = properties[name];
		}
	}
};