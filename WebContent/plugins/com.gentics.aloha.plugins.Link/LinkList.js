
/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/

/**
 * Create the Resources object. Namespace for Resources
 * @hide
 */
if ( !GENTICS.Aloha.Resources ) GENTICS.Aloha.Resources = {};

/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Resources.LinkList = new GENTICS.Aloha.Resource('com.gentics.aloha.resources.LinkList');

/**
 * configure data as array with following format:
 * 
 * [{ id: 2, name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', resourceObjectType:'website' }];	

 * @property
 * @cfg
 */
GENTICS.Aloha.Resources.LinkList.settings.data = [
	{ id: 2, name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', resourceObjectType:'website' }
];

/**
 * Searches a resource for resource items matching query if resourceObjectTypes.
 * If none found it returns null.
 */
GENTICS.Aloha.Resources.LinkList.query = function(searchText, resourceObjectTypes, callback) {
	var d = this.settings.data.filter(function(e, i, a) {
		var r = new RegExp(searchText, 'i'); 
		return (
			jQuery.inArray(e.resourceObjectType, resourceObjectTypes) > -1 &&
			( e.name.match(r) || e.url.match(r) ) 
		);
	});
	callback.call( this, d);
};