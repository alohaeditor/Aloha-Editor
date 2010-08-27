/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * this is an example plugin to demonstrate how to access the aloha edited content and save it to a storage (cms, database, ...) of your choice
 * @author laurin 
 */
if (typeof EXAMPLE == 'undefined' || !EXAMPLE) {
	var EXAMPLE = {};
}

EXAMPLE.DummySavePlugin = new GENTICS.Aloha.Plugin('com.example.aloha.DummySave');

/**
 * Configure the available languages
 */
EXAMPLE.DummySavePlugin.languages = ['en', 'de', 'fi', 'fr', 'it'];

/**
 * Initialize the plugin and set initialize flag on true
 */
EXAMPLE.DummySavePlugin.init = function () {

	// remember refernce to this class for callback
	var that = this;
	
	// create save button to ribbon
	var saveButton = new GENTICS.Aloha.ui.Button({
		label : this.i18n('save'),
		onclick : function() {
			that.save();
		}
	});
		
	// add button to ribbon
	GENTICS.Aloha.Ribbon.addButton(saveButton);

};

/**
 * collect data and save 
 */
EXAMPLE.DummySavePlugin.save = function () {
	var content = "";
	// iterate all dom elements which have been made aloha editable
	jQuery.each(GENTICS.Aloha.editables,function (index, editable) {
		// and get their clean and valid html5 content, and remember it to fake saving 
		content = content + "Editable ID: " + editable.getId() +"\nHTML code: " + editable.getContents() + "\n\n";
	});
	// this fakes the saving of the content to your backend.
	// TODO implement this to save the edited aloha content into your backend
	alert(this.i18n('saveMessage')+"\n\n"+content);
} ;
