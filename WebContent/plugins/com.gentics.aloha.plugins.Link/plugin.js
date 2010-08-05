/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * register the plugin with unique name
 */
GENTICS.Aloha.Link = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.Link');

/**
 * Configure the available languages
 */
GENTICS.Aloha.Link.languages = ['en', 'de'];

/**
 * Default configuration allows links everywhere
 */
GENTICS.Aloha.Link.config = ['a'];

/**
 * Initialize the plugin
 */
GENTICS.Aloha.Link.init = function () {
	this.initButtons();
	this.subscribeEvents();
};

/**
 * Initialize the buttons
 */
GENTICS.Aloha.Link.initButtons = function () {
	var that = this;

	this.addLinkButton = new GENTICS.Aloha.ui.Button({
		'iconClass' : 'GENTICS_button GENTICS_button_a',
		'size' : 'small',
		'onclick' : function () {
			if (GENTICS.Aloha.activeEditable) {
				var range = GENTICS.Aloha.Selection.getRangeObject();
				var foundMarkup = range.findMarkup(function() {
					return this.nodeName.toLowerCase() == 'a';
				}, jQuery(GENTICS.Aloha.activeEditable.obj));
				if (foundMarkup) {
					// remove the link
					GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
					// set focus back to editable
					GENTICS.Aloha.activeEditable.obj[0].focus();
					// select the (possibly modified) range
					range.select();
				} else {
					that.insertLink();
				}
			}
		},
		'tooltip' : this.i18n('button.addlink.tooltip'),
		'toggle' : true
	});

	GENTICS.Aloha.FloatingMenu.addButton(
		'GENTICS.Aloha.continuoustext',
		this.addLinkButton,
		GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.format'),
		1
	);

	// add the new scope for links
	GENTICS.Aloha.FloatingMenu.createScope(this.getUID('link'), 'GENTICS.Aloha.continuoustext');

	this.srcFieldButton = new GENTICS.Aloha.Link.SrcField();
	// add the input field for links
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('link'),
		this.srcFieldButton,
		this.i18n('floatingmenu.tab.link'),
		1
	);

	// add a button for removing the currently set link
	GENTICS.Aloha.FloatingMenu.addButton(
		this.getUID('link'),
		new GENTICS.Aloha.ui.Button({
			// TODO use another icon here
			'iconClass' : 'GENTICS_button GENTICS_button_a',
			'size' : 'small',
			'onclick' : function () {
				var range = GENTICS.Aloha.Selection.getRangeObject();
				var foundMarkup = range.findMarkup(function() {
					return this.nodeName.toLowerCase() == 'a';
				}, jQuery(GENTICS.Aloha.activeEditable.obj));
				if (foundMarkup) {
					// remove the link
					GENTICS.Utils.Dom.removeFromDOM(foundMarkup, range, true);
					// set focus back to editable
					GENTICS.Aloha.activeEditable.obj[0].focus();
					// select the (possibly modified) range
					range.select();
				}
			},
			'tooltip' : this.i18n('button.removelink.tooltip')
		}),
		this.i18n('floatingmenu.tab.link'),
		1
	);
};

/**
 * Subscribe for events
 */
GENTICS.Aloha.Link.subscribeEvents = function () {
	var that = this;

	// add the event handler for selection change
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, 'selectionChanged', function(event, rangeObject) {
		
		// show/hide the button according to the configuration
		var config = that.getEditableConfig(GENTICS.Aloha.activeEditable.obj);

		if ( jQuery.inArray('a', config) != -1) {
			that.addLinkButton.show();
		} else {
			that.addLinkButton.hide();
		}
		
		// check whether the markup contains a link
		var foundMarkup = rangeObject.findMarkup(function () {
			return this.nodeName.toLowerCase() == 'a';
		}, jQuery(GENTICS.Aloha.activeEditable.obj));

		if (foundMarkup) {
			// link found
			that.addLinkButton.setPressed(true);
			GENTICS.Aloha.FloatingMenu.setScope(that.getUID('link'));
			that.srcFieldButton.setAnchor(foundMarkup);
		} else {
			// no link found
			that.addLinkButton.setPressed(false);
			// GENTICS.Aloha.FloatingMenu.setScope('GENTICS.Aloha.continuoustext');
			that.srcFieldButton.setAnchor(null);
		}

		// TODO this should not be necessary here!
		GENTICS.Aloha.FloatingMenu.doLayout();
	});
};

/**
 * Insert a new link at the current selection. When the selection is collapsed,
 * the link will have a default link text, otherwise the selected text will be
 * the link text.
 */
GENTICS.Aloha.Link.insertLink = function () {
	var range = GENTICS.Aloha.Selection.getRangeObject();
	GENTICS.Aloha.FloatingMenu.userActivatedTab = this.i18n('floatingmenu.tab.link');

	if (range.isCollapsed()) {
		GENTICS.Utils.Dom.extendToWord(range);
	}

	if (range.isCollapsed()) {
		// insert a link with text here
		var linkText = this.i18n('newlink.defaulttext');
		var newLink = jQuery('<a href="#">' + linkText + '</a>');
		GENTICS.Utils.Dom.insertIntoDOM(newLink, range, jQuery(GENTICS.Aloha.activeEditable.obj));
		range.startContainer = range.endContainer = newLink.contents().get(0);
		range.startOffset = 0;
		range.endOffset = linkText.length;
		range.select();

		this.srcFieldButton.focus();
	} else {
		GENTICS.Utils.Dom.addMarkup(range, jQuery('<a href="#"></a>'), false);
		range.select();

		this.srcFieldButton.focus();
	}
};

/**
 * For now, we create our own extJS button implementation
 * TODO: move this into a 'generic' button in ui.js and use this generic button here to make the plugin independent from extJS
 */
Ext.ux.LinkSrcButton = Ext.extend(Ext.Component, {
	/**
	 * the jQuery object of the dom element of this button
	 */
	wrapper : null,

	/**
	 * the input field
	 */
	input : null,

	/**
	 * the anchor DOM object which is currently modified
	 */
	anchor : null,

	/**
	 * The onrender function renders a simple input field
	 */
	onRender : function () {
		var that = this;
		Ext.ux.LinkSrcButton.superclass.onRender.apply(this, arguments);
		this.wrapper = jQuery(this.el.dom);
		this.input = jQuery('<input type="text" style="width:300px">');

		// add the blur handler which stores back the entered url to the anchor
		this.input.blur(function (event) {
			if (that.anchor) {
				that.input.val(jQuery.trim(that.input.val()));
				if (that.input.val().length == 0) {
					that.input.val('#');
				}
				jQuery(that.anchor).attr('href', that.input.val());
			}
		});

		// add a key handler for enter key to blur the field (will store back
		// the url) and set the focus back to the editable
		this.input.keyup(function (event) {
			if (event.keyCode == 13) {
				that.input.blur();
				GENTICS.Aloha.activeEditable.obj[0].focus();
				GENTICS.Aloha.Selection.getRangeObject().select();
			}
		});
		this.wrapper.append(this.input);
		if (this.anchor) {
			this.input.val(jQuery(this.anchor).attr('href'));
		}
		if (this.getFocus) {
			this.getFocus = undefined;
			this.input.select();
			this.input.focus();
		}
	},

	/**
	 * Set the anchor
	 */
	setAnchor : function (anchor) {
		this.anchor = anchor;
		if (this.input) {
			if (this.anchor) {
				this.input.val(jQuery(this.anchor).attr('href'));
			} else {
				this.input.val('');
			}
		}
	},

	/**
	 * focus the input field
	 */
	focus : function () {
		if (this.input) {
			this.input.select();
			this.input.focus();
		} else {
			this.getFocus = true;
		}
	}
});
/**
 * Register the button
 */
Ext.reg('linksrcbutton', Ext.ux.LinkSrcButton);

/**
 * This class extends the Button
 */
GENTICS.Aloha.Link.SrcField = function () {
	GENTICS.Aloha.ui.Button.apply(this, arguments);
};

//Inherit all methods and properties from GENTICS.Aloha.ui.Button
GENTICS.Aloha.Link.SrcField.prototype = new GENTICS.Aloha.ui.Button();

/**
 * Create a linksrcbutton
 */
GENTICS.Aloha.Link.SrcField.prototype.getExtConfigProperties = function() {
	return {
		xtype : 'linksrcbutton',
		id : this.id
	};
};

/**
 * Wrapper for setting the anchor
 */
GENTICS.Aloha.Link.SrcField.prototype.setAnchor = function (anchor) {
	if (this.extButton) {
		this.extButton.setAnchor(anchor);
	}
};

/**
 * Wrapper for setting the focus
 */
GENTICS.Aloha.Link.SrcField.prototype.focus = function () {
	if (this.extButton) {
		this.extButton.focus();
	}
};
