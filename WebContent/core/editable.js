/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * Editable object
 * @namespace GENTICS.Aloha
 * @class Editable
 * @method
 * @constructor
 * @param {Object} obj jQuery object reference to the object
 */
GENTICS.Aloha.Editable = function(obj) {
	// store object reference
	this.obj = obj;

	// the editable is not yet ready
	this.ready = false;

	// finally register the editable with Aloha
	GENTICS.Aloha.registerEditable(this);

	// try to initialize the editable
	this.init();
};

/**
 * True, if this editable is active for editing
 * @property
 * @type boolean
 */
GENTICS.Aloha.Editable.prototype.isActive = false;

/**
 * stores the original content to determine if it has been modified
 * @hide
 */
GENTICS.Aloha.Editable.prototype.originalContent = null;

/**
 * every time a selection is made in the current editable the selection has to
 * be saved for further use
 * @hide
 */
GENTICS.Aloha.Editable.prototype.range = undefined;

/**
 * Initialize the editable
 * @return void
 * @hide
 */
GENTICS.Aloha.Editable.prototype.init = function() {
	// only initialize the editable when Aloha is ready
	if (GENTICS.Aloha.ready) {
		// initialize the object
		this.obj.addClass('GENTICS_editable');
		this.obj.attr('contenteditable', true);
		
		// add focus event to the object to activate
		var that = this;
		
		this.obj.mousedown(function(e) {
			that.activate(e);
			e.stopPropagation();
		});	
		
		this.obj.focus(function(e) {
			that.activate(e);
		});
		
		// find all a tags & apply Ctrl+Click behaviour
		// NOTE: ff will handle ctrl+click correctly by itself
		// ie & chrome don't act accordingly, so opening a new tab has to be implemented
		// anyway, ie won't even trigger the event if you're ctrl+clicking on a link
		// possible workaround: move ALL href's to onClick, which will trigger correctly 
		// in all browsers (incl. ctrl key state), and open a new window :(
		//this.obj.find('a').each(function () {
		//	jQuery(this).click(function (event) {
		//		return that.clickLink(event);
		//	});
		//});

		// by catching the keydown we can prevent the browser from doing its own thing
		// if it does not handle the keyStroke it returns true and therefore all other events (incl. browser's) continue
		this.obj.keydown(function(event) { 
			return GENTICS.Aloha.Markup.preProcessKeyStrokes(event);
		});
		
		// register the onSelectionChange Event with the Editable field
		this.obj.GENTICS_contentEditableSelectionChange(function (event) {
			GENTICS.Aloha.Selection.onChange(that.obj, event);
			return that.obj;
		});
		
		// throw a new event when the editable has been created
		/**
		 * @event editableCreated fires after a new editable has been created, eg. via $('#editme').aloha()
		 * The event is triggered in Aloha's global scope GENTICS.Aloha
		 * @param {Event} e the event object
		 * @param {Array} a an array which contains a reference to the currently created editable on its first position 
		 */
		GENTICS.Aloha.EventRegistry.trigger(
				new GENTICS.Aloha.Event(
						'editableCreated',
						GENTICS.Aloha,
						[ this ]
				)
		);

		// mark the editable as unmodified
		this.setUnmodified();
		
		// now the editable is ready
		this.ready = true;
	}
};

/**
 * marks the editables current state as unmodified. Use this method to inform the editable
 * that it's contents have been saved
 * @method
 */
GENTICS.Aloha.Editable.prototype.setUnmodified = function () {
	this.originalContent = this.getContents();
};

/**
 * check if the editable has been modified during the edit process#
 * @method
 * @return boolean true if the editable has been modified, false otherwise
 */
GENTICS.Aloha.Editable.prototype.isModified = function () {
	if (this.originalContent != this.getContents()) {
		return true;
	} else {
		return false;
	}
};

/**
 * String representation of thie object
 * @method
 * @return GENTICS.Aloha.Editable
 */
GENTICS.Aloha.Editable.prototype.toString = function() {  
	return 'GENTICS.Aloha.Editable';
};

/**
 * activates an Editable for editing
 * disables all other active items
 * @method
 */
GENTICS.Aloha.Editable.prototype.activate = function(e) {
	if (this.isActive) {
		return;
	}

	// blur all editables, which are currently active
	for (var i = 0; i < GENTICS.Aloha.editables.length; i++) {
		if (GENTICS.Aloha.editables[i].isActive) {
			// remember the last editable for the editableActivated event
			var oldActive = GENTICS.Aloha.editables[i]; 
			GENTICS.Aloha.editables[i].blur();
		}
	}
	
	// add active class to current object
	this.obj.addClass('GENTICS_editable_active');
	
	// finally mark this object as active ...
	this.isActive = true;
	GENTICS.Aloha.activeEditable = this;
	
	// ie specific: trigger one mouseup click to update the range-object
	if (document.selection && document.selection.createRange) {
		this.obj.mouseup();
	}
	
	GENTICS.Aloha.FloatingMenu.setScope('GENTICS.Aloha.continuoustext');

	// Set the scope to continuoustext if the editable gets the focus
	// This is necessary to get the correct scope if for example the table plugin was active before
	this.obj.focus(function(){
		GENTICS.Aloha.FloatingMenu.setScope('GENTICS.Aloha.continuoustext');
	});
	
	/**
	 * @event editableActivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in Aloha's global scope GENTICS.Aloha
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to last active editable on its first position, as well
	 * as the currently active editable on it's second position 
	 */
	// trigger a 'general' editableActivated event
	GENTICS.Aloha.EventRegistry.trigger(
		new GENTICS.Aloha.Event('editableActivated', GENTICS.Aloha, {
			'oldActive' : oldActive,
			'editable' : this
		})
	);

	/**
	 * @event editableActivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in the Editable's local scope
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to last active editable on its first position 
	 */
	// and trigger our *finished* event
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('editableActivated', this, {
				'oldActive' : oldActive
			})
	);
};

/**
 * handle the blur event
 * this must not be attached to the blur event, which will trigger far too often
 * eg. when a table within an editable is selected
 * @hide 
 */
GENTICS.Aloha.Editable.prototype.blur = function() {
	// set the current object editable & turn contenteditable off
	this.obj.removeClass('GENTICS_editable_active');
	
	// disable active status
	this.isActive = false;

	/**
	 * @event editableDeactivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in Aloha's global scope GENTICS.Aloha
	 * @param {Event} e the event object
	 * @param {Array} a an array which contains a reference to this editable 
	 */	
	// trigger a 'general' editableDeactivated event
	GENTICS.Aloha.EventRegistry.trigger(
		new GENTICS.Aloha.Event('editableDeactivated', GENTICS.Aloha, {
			'editable' : this
		})
	);

	/**
	 * @event editableDeactivated fires after the editable has been activated by clicking on it.
	 * This event is triggered in the Editable's scope
	 * @param {Event} e the event object
	 */	
	GENTICS.Aloha.EventRegistry.trigger(
			new GENTICS.Aloha.Event('editableDeactivated', this)
	);
};

/**
 * check if the string is empty
 * used for zerowidth check
 * @return true if empty or string is null, false otherwise
 * @hide
 */
GENTICS.Aloha.Editable.prototype.empty = function(str) {
	if (null === str) {
		return true;
	}

	// br is needed for chrome
	return (GENTICS.Aloha.trim(str) == '' || str == '<br>');
};

/**
 * Get the contents of this editable as a HTML string
 * @method
 * @return contents of the editable
 */
GENTICS.Aloha.Editable.prototype.getContents = function() {
	// clone the object
	var clonedObj = this.obj.clone(true);
	GENTICS.Aloha.PluginRegistry.makeClean(clonedObj);
	return clonedObj.html();
};

/**
 * Get the id of this editable
 * @method
 * @return id of this editable
 */
GENTICS.Aloha.Editable.prototype.getId = function() {
	return this.obj.attr('id');
};
