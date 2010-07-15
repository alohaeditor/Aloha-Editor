/**
 * This software or sourcecode is provided as is without any expressed
 * or implied warranties and may not be copied, otherwise distributed
 * (especially forwarded to third parties), reproduced and combined with
 * other code without our express prior written consent. The software or
 * source code and the concepts it is based upon are to be kept confidential
 * towards third parties. The software or sourcecode may be used solely
 * for the purpose of evaluating and testing purposes for a time of one
 * month from the first submission of the software or source code. In case
 * no arrangements about further use can be reached, the software or 
 * sourcecode has to be deleted.
 * 
 * Copyright(C) 2010 Gentics Software GmbH
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