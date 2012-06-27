/**
 * This is a helper module for porting plugins from the old
 * ui-attributefield.js in the aloha core to the new ui-plugin.
 * This interface is obsolete and must not be used for new implementations.
 */
define([
	'jquery',
	'ui/component',
	'aloha/repositorymanager',
	'ui/vendor/jquery-ui-autocomplete-html'
], function (
	jQuery,
	Component,
	RepositoryManager
) {
	'use strict';

	// Main responsibilities implemented by the attribute-field are
	//
	// * setting a target object and attribute and the subsequent change of
	//   that target attribute (example link plugin, table plugin)
	// * background color highlighting of the target object (example link plugin)
	// * a placeholder in the attribute field with a grey foreground color
	//   (example link plugin)
	// * maintain a current repository item to distinguish link plugin
	//   repository items from literal values typed in the attribute field
	//   (example link plugin)
	// * repository manager markObject on the target object if a repository
	//   item was selected (example link plugin)

	var InputField = function (props) {
		this.valueField = props.valueField || 'id';
		this.displayField = props.displayField || 'name';
		this.objectTypeFilter = props.objectTypeFilter || 'all';
		this.placeholder = props.placeholder;
		this.noTargetHighlight = !!props.noTargetHighlight;

		this.template = null;
		this.resourceItem = null;
		this.resourceValue = null;
		this.targetObject = null;
		this.targetAttribute = null;
		this.lastAttributeValue = null;

		this.$element = jQuery('<input id="aloha-attribute-field-' + props.name + '">');

		if (props.cls) {
			this.$element.addClass(props.cls);
		}

		if (props.width) {
			this.$element.width(props.width);
		}

		var that = this;

		this.$element.autocomplete({
			'html': true,
			'select': function (event, ui) {
				that.onSelect(event, ui);
			},
			'source': function (req, res) {
				RepositoryManager.query({
					queryString: req.term,
					objectTypeFilter: that.objectTypeFilter
				}, function (data) {
					res(jQuery.map(data.items, function (item) {
						return {
							label: that.parse(that.template, item),
							value: item.name,
							obj: item
						};
					}));
				});
			}
		});

		this.$element
		    .bind('focus', function (event, ui) { that.onFocus(event, ui); })
		    .bind('blur',  function (event, ui) { that.onBlur(event, ui);  })
		    .bind('keyup', function (event, ui) { that.onKeyup(event, ui); });

		this.setPlaceholder();
	};

	jQuery.extend(InputField.prototype, {

		onSelect: function (event, ui) {
			if (ui.item) {
				this.setItem(ui.item.obj);
			}
			this.finishEditing();
		},

		onBlur: function () {
			this.finishEditing();
		},

		onFocus: function (event, ui) {
			if (!jQuery(event.target).is(':visible')) {
				// The check for visible fixes the bug that the background
				// color of the target element is not restored.
				// Rationale: it's possible for the input to receive the focus event,
				// for example if it was triggered programatically, even if
				// it isn't visible. Problem is, if it's not visible, then
				// it will not really get focused and consequently, there
				// will be no blur event either. However, we must be able to
				// assume that the blur event will be fired so that we can
				// clean up the background color.
				return;
			}

			this.changeTargetBackground();

			// Remove placeholder
			if (this.getValue() === this.placeholder) {
				this.setValue('');
			}
		},

		onKeyup: function () {
			// If this attribute field currently refers to a repository
			// item, and the user edits the contents of the input field,
			// this attribute field seizes to refer to the repository item.
			if (this.resourceItem && this.resourceValue !== this.getValue()) {
				this.resourceItem = null;
				this.resourceValue = null;
			}

			// This handles attribute updates for non-repository, literal urls
			// typed into the input field.  Input values that refer to a
			// repository item are handled via setItem().
			if (!this.resourceItem) {
				this.setAttribute(this.targetAttribute, this.getValue());
			}
		},

		finishEditing: function () {
			this.restoreTargetBackground();

			if (this.lastAttributeValue ===
			    jQuery(this.targetObject).attr(this.targetAttribute)) {
				return;
			}

			// When no resource item was selected, remove any marking of the
			// target object.
			if (!this.resourceItem) {
				RepositoryManager.markObject(this.targetObject);
			}

			if (this.getValue() === '') {
				this.setPlaceholder();
			}
		},

		changeTargetBackground: function () {
			if (this.noTargetHighlight) {
				return;
			}
			// set background color to give visual feedback which link is modified
			var	target = jQuery(this.targetObject);
			if (target && target.context && target.context.style &&
				target.context.style['background-color']) {
				target.attr('data-original-background-color',
					target.context.style['background-color']);
			}
			target.css('background-color', '#80B5F2');
		},

		restoreTargetBackground: function () {
			if (this.noTargetHighlight) {
				return;
			}

			// Remove the highlighting and restore original color if was set before
			var target = jQuery(this.targetObject);
			target.css('background-color', 
				target.attr('data-original-background-color') || '');
			target.removeAttr('data-original-background-color');
		},

		parse: function (template, item) {
			return template.replace(/\{([^}]+)\}/g, function (_, name) {
				return name in item ? item[name] : '';
			});
		},

		setPlaceholder: function () {
			this.$element.css('color', '#AAA');
			this.$element.val(this.placeholder);
		},

		setTemplate: function (tmpl){
			this.template = tmpl;
		},

		/**
		 * When at least on objectType is set the value in the Attribute field
		 * does a query to all registered repositories.  @param {Array}
		 * objectTypeFilter The array of objectTypeFilter to be searched for.
		 * @void
		 */
		setObjectTypeFilter: function (objTypeFilter) {
			this.objectTypeFilter = objTypeFilter;
		},

		/**
		 * Adding a listener to the field
		 * @param {String} eventname The name of the event. Ex. 'keyup'
		 * @param {function} handler The function that should be called when the event happens.
		 */
		addListener: function (eventName, handler) {
			this.$element.bind(eventName, jQuery.proxy(handler, this));
		},

		getValue: function () {
			return this.$element.val();
		},

		setValue: function (value) {
			this.$element.val(value);
			this.$element.css('color', 'black');
		},

		setItem:function (item) {
			this.resourceItem = item;

			if (item) {
				// TODO split display field by '.' and get corresponding attribute, because it could be a properties attribute.
				var v = item[this.displayField];
				// set the value into the field
				this.setValue(v);
				// store the value to be the "reference" value for the currently selected resource item
				this.resourceValue = v;
				this.setAttribute(this.targetAttribute, item[this.valueField]);
				RepositoryManager.markObject(this.targetObject, item);
			} else {
				this.resourceValue = null;
			}
		},

		getItem: function () {
			return this.resourceItem;
		},

		/**
		 * Sets an attribute optionally based on a regex on reference
		 * @param {String} attr The Attribute name which should be set. Ex. "lang"
		 * @param {String} value The value to set. Ex. "de-AT"
		 * @param {String} regex The regex when the attribute should be set. The regex is applied to the value of refernece.
		 * @param {String} reference The value for the regex.
		 */
		setAttribute: function (attr, value, regex, reference) {
			if (this.targetObject) {
				// check if a reference value is submitted to check against with a regex
				var setAttr = true;
				if (typeof reference != 'undefined') {
					var regxp = new RegExp(regex);
					if (!reference.match(regxp)) {
						setAttr = false;
					}
				}

				// if no regex was successful or no reference value
				// was submitted remove the attribute
				if (setAttr) {
					jQuery(this.targetObject).attr(attr, value);
				} else {
					jQuery(this.targetObject).removeAttr(attr);
				}
			}
		},

		/**
		 * Sets the target Object of which the Attribute should be modified
		 * @param {jQuery} obj the target object
		 * @param {String} attr Attribute to be modified ex. "href" of a link
		 * @void
		 */
		setTargetObject: function (obj, attr) {
			this.targetObject = obj;
			this.targetAttribute = attr;
			this.setItem(null);

			if (obj && attr) {
				this.lastAttributeValue = jQuery(obj).attr(attr);
				this.setValue(jQuery(this.targetObject).attr(this.targetAttribute));
			} else {
				this.setValue('');
			}

			var that = this;
			// check whether a repository item is linked to the object
			RepositoryManager.getObject(obj, function (items) {
				if (items && items.length > 0) {
					that.setItem(items[0]);
				}
			});
		},

		getTargetObject: function () {
			return this.targetObject;
		},

		focus: function () {
			this.$element.focus();
		},

		show: function () {
			this.$element.show();
		},

		hide: function () {
			this.$element.hide();
		},

		getInputId: function () {
			return this.$element.attr('id');
		},

		hasInputElem: function () {
			return true;
		},

		getInputElem: function () {
			return this.$element[0];
		},

		/**
		 * @deprecated during jqueryui migration
		 */
		preventAutoSuggestionBoxFromExpanding: function () {
			// No idea if this case needs any special handling or how to handle
			// it in the jqueryui implementation of the attribute field. This
			// probably was a fix for an edge case in the old implementation of
			// the ui attribute field.
		},

		/**
		 * @deprecated during jqueryui migration
		 */
		clearStore: function () {
			// This was a fix for an edge case in the old implementation of the
			// ui attribute field.
		}

	});

	return InputField;
});
