define(["aloha/core", "aloha/jquery", "ui/component", "aloha/repositorymanager", 'ui/vendor/jquery-ui-autocomplete-html'], function(Aloha, $, Component, RepositoryManager){

// target attribute
// get/set current item
// placeholder with foreground color
// link background color
// repository manager markObject

var component = Component.extend({
	init: function(){
		this._super();
	}
});

var attributeField = function(props){

	var attrField = $.extend(this, {
		_valueField: props.valueField || "id",
		_displayField: props.displayField || "name",
		_objectTypeFilter: props.objectTypeFilter || "all",
		_placeholder: props.placeholder,
		_element: $("<input>")
	});

	if (props.cls) {
		attrField._element.addClass(props.cls);
	}

	if (props.width) {
		attrField._element.width(props.width);
	}

	var componentInstance = Component.define(props.name, component, {
		element: attrField._element
	});

	attrField._element.autocomplete({
		    "html": true,
			"source": function( req, res ) {
				RepositoryManager.query({
					queryString: req.term,
					objectTypeFilter: attrField._objectTypeFilter
				}, function( data ) {
					res( $.map( data.items, function( item ) {
						return {
							label: parse( attrField._template, item ),
							value: item.name,
							obj: item
						};
					}));
				});
			},
			"select": onSelect
		})
		.bind("focus", onFocus)
	    .bind("blur", onBlur)
	    .bind("keyup", onKeyup);

	this.setPlaceholder();

	function onSelect( event, ui ) {
		if (ui.item) {
			attrField.setItem(ui.item.obj);
		}
		finishEditing();
	}

	function onBlur() {
		finishEditing();
	}

	function onFocus(event, ui) {
		changeTargetBackground();

		// Remove placeholder
		if (attrField.getValue() === attrField._placeholder) {
			attrField.setValue('');
		}
	}

	function onKeyup(){
		// If this attribute field currently refers to a repository
		// item, and the user edits the contents of the input field,
		// this attribute field seizes to refer to the repository item.
		if (attrField._resourceItem && attrField._resourceValue !== attrField.getValue()) {
			attrField._resourceItem = null;
			attrField._resourceValue = null;
		}

		// This handles attribute updates for non-repository, literal urls typed into the input field.
		// Input values that refer to a repository item are handled via setItem().
		if ( ! attrField._resourceItem ) {
			attrField.setAttribute(attrField._targetAttribute, attrField.getValue());
		}
	}

	function finishEditing() {
		restoreTargetBackground();

		if (attrField._lastAttributeValue === $(attrField._targetObject).attr(attrField._targetAttribute)) {
			return;
		}

		// when no resource item was selected, remove any marking of the target object
		if ( ! attrField._resourceItem ) {
			RepositoryManager.markObject( attrField._targetObject );
		}

		if (attrField.getValue() === '') {
			attrField.setPlaceholder();
		}
	}

	function changeTargetBackground() {
		// set background color to give visual feedback which link is modified
		var	target = $(attrField.getTargetObject());
		if (target && target.context && target.context.style &&
			target.context.style['background-color']) {
			target.attr('data-original-background-color',
						target.context.style['background-color']);
		}
		target.css('background-color', '#80B5F2');
	}

	function restoreTargetBackground() {
		var target = $(attrField.getTargetObject()),
            color;
		// Remove the highlighting and restore original color if was set before
		if ( (color = target.attr('data-original-background-color')) ) {
			target.css('background-color', color);
		} else {
			target.css('background-color', '');
		}
		target.removeAttr('data-original-background-color');
	}

	function parse( template, item ) {
		return template.replace( /\{([^}]+)\}/g, function( _, name ) {
			return name in item ? item[ name ] : "";
		});
	}
};

attributeField.prototype.setPlaceholder = function(){
	$(this._element).css('color', '#AAA');
	this._element.val(this._placeholder);
};

attributeField.prototype.setTemplate = function(template){
	this._template = template;
};

/**
 * When at least on objectType is set the value in the Attribute field does a query to all registered repositories.
 * @param {Array} objectTypeFilter The array of objectTypeFilter to be searched for.
 * @void
 */
attributeField.prototype.setObjectTypeFilter = function(objectTypeFilter) {
	this._objectTypeFilter = objectTypeFilter;
};

/**
 * Adding a listener to the field
 * @param {String} eventname The name of the event. Ex. 'keyup'
 * @param {function} handler The function that should be called when the event happens.
 */
attributeField.prototype.addListener = function ( eventName, handler ) {
	this._element.bind(eventName, $.proxy(handler, this));
};

attributeField.prototype.getValue = function() {
	return this._element.val();
};

attributeField.prototype.setValue = function(value) {
	this._element.val(value);
	this._element.css('color', 'black');
};

attributeField.prototype.setItem = function (item) {
	this._resourceItem = item;

	if (item) {
		// TODO split display field by '.' and get corresponding attribute, because it could be a properties attribute.
		var v = item[this._displayField];
		// set the value into the field
		this.setValue(v);
		// store the value to be the "reference" value for the currently selected resource item
		this._resourceValue = v;
		this.setAttribute(this._targetAttribute, item[this._valueField]);
		RepositoryManager.markObject(this._targetObject, item);
	} else {
		this._resourceValue = null;
	}
};

attributeField.prototype.getItem = function () {
	return this._resourceItem;
};

/**
 * Sets an attribute optionally based on a regex on reference
 * @param {String} attr The Attribute name which should be set. Ex. "lang"
 * @param {String} value The value to set. Ex. "de-AT"
 * @param {String} regex The regex when the attribute should be set. The regex is applied to the value of refernece.
 * @param {String} reference The value for the regex.
 */
attributeField.prototype.setAttribute = function ( attr, value, regex, reference ) {
	var setAttr = true, regxp;
	if (this._targetObject) {
		// check if a reference value is submitted to check against with a regex
		if (typeof reference != 'undefined') {
			regxp = new RegExp(regex);
			if ( ! reference.match(regxp) ) {
				setAttr = false;
			}
		}

		// if no regex was successful or no reference value
		// was submitted remove the attribute
		if ( setAttr ) {
			$(this._targetObject).attr(attr, value);
		} else {
			$(this._targetObject).removeAttr(attr);
		}
	}
};

/**
 * Sets the target Object of which the Attribute should be modified
 * @param {jQuery} obj the target object
 * @param {String} attr Attribute to be modified ex. "href" of a link
 * @void
 */
attributeField.prototype.setTargetObject = function ( obj, attr ) {
	this._targetObject = obj;
	this._targetAttribute = attr;

	this.setItem(null);
	
	if (obj && attr) {
	    this._lastAttributeValue = $(obj).attr(attr);
		this.setValue($(this._targetObject).attr(this._targetAttribute));
	} else {
		this.setValue('');
	}

	// check whether a repository item is linked to the object
	var that = this;
	RepositoryManager.getObject( obj, function ( items ) {
		if (items && items.length > 0) {
			that.setItem(items[0]);
		}
	} );
};

attributeField.prototype.getTargetObject = function () {
	return this._targetObject;
};

attributeField.prototype.focus = function() {
	this._element.focus();
};

attributeField.prototype.show = function () {
	this._element.show();
};

attributeField.prototype.hide = function () {
	this._element.hide();
};

attributeField.prototype.getInputId = function(){
	return this._element.attr("id");
};

attributeField.prototype.hasInputElem = function () {
	return true;
};

attributeField.prototype.getInputElem = function () {
	return this._element[0];
};

/**
 * @Deprecated during jqueryui migration
 */
attributeField.prototype.preventAutoSuggestionBoxFromExpanding = function () {
	// No idea if this case needs any special handling or how to handle
	// it in the jqueryui implementation of the attribute field. This
	// probably was a fix for an edge case in the old implementation of
	// the ui attribute field.
};

/**
 * @Deprecated during jqueryui migration
 */
attributeField.prototype.clearStore = function () {
	// This was a fix for an edge case in the old implementation of the
	// ui attribute field.
};

return attributeField;
});
