/**
 * This is a helper module for porting plugins from the old
 * ui-attributefield.js in the aloha core to the new ui-plugin.
 * This interface is obsolete and must not be used for new implementations.
 */
define([
	'jquery',
	'ui/ui',
	'ui/component',
	'ui/context',
	'ui/utils',
	'aloha/repositorymanager',
	'ui/vendor/jquery-ui-autocomplete-html'
], function (
	$,
	Ui,
	Component,
	Context,
	Utils,
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

	/**
	 * @callback AutocompleteOpen
	 * @param {*} event - A jQuery Event wrapping the native Event.
	 * @param {*} ui - Empty object which does nothing.
	 */

	/**
	 * @typedef {Object} AttributeFieldProperties
	 * @property {string} name - The name to register this component under (Ui.adopt(props.name, ...)).
	 * @property {string=} label - Some text that will be displayed alongside the attribute field.
	 * @property {string=} labelClass - A CSS class to identify the label element.
	 * @property {string=} valueField - When using a select/repository items, which property in the items should be used for the item value.
	 * @property {string=} displayField - When using a select/repository items, which property in the items should be used for the display value.
	 * @property {Array.<string>=} objectTypeFilter - When using a select/repository items, which filter to use when getting the items.
	 * @property {string=} placeholder - The placeholder text which is displayed when no value is present.
	 * @property {boolean=} noTargetHighlight - If it should not highlight the target element while editing.
	 * @property {string=} targetHighlightClass - The CSS class which is getting added to the highlighted element.
	 * @property {(string|Array.<string>)=} cls - Additional CSS classes for the {{element}}.
	 * @property {*=} element - The <input> element to use. If not supplied, a new one will be created.
	 * @property {number=} width - The width of the {{element}} in pixel. Should not be used.
	 * @property {*} scope - The scope in which the component should be created.
	 * @property {AutocompleteOpen} open - Callback for when the autocomplete opens.
	 * @property {function} modifyValue - Callback which gets called when the value needs to be updated from a repository item.
	 * @property {function} changeNotify - Callback when the value changes.
	 * @property {function} touchNotify - Callback when the user interacted with the component.
	 */

	/**
	 * Creates a new attribute field
	 * 
	 * @typedef {AttributeField} AttributeField
	 * @param {AttributeFieldProperties} props - The properties to initialize this Component with.
	 *
	 * @property {function} getInputElem - Function to get the input element.
	 * @property {function} hasInputElem -
	 * @property {function} getInputId -
	 * @property {function} hide -
	 * @property {function} show -
	 * @property {function} foreground -
	 * @property {function} focus -
	 * @property {function} getTargetObject -
	 * @property {function} setTargetObject -
	 * @property {function} addAdditionalTargetObject -
	 * @property {function} setAttribute -
	 * @property {function} getItem -
	 * @property {function} setItem -
	 * @property {function} setValue -
	 * @property {function} getValue -
	 * @property {function} addListener -
	 * @property {function} setObjectTypeFilter -
	 * @property {function} setTemplate -
	 * @property {function} setPlaceholder -
	 * @property {function} getInputJQuery -
	 * @property {function} enableInput -
	 * @property {function} disableInput -
	 * @property {function} enable -
	 * @property {function} disable -
	 * @property {function} updateTarget -
	 * @property {function} finishEditing -
	 * @property {function} isValid -
	 * @property {function} touch -
	 * @property {function} untouched -
	 * @property {*} disabled -
	 * @property {*} touched -
	 * @property {*} validationErrors -
	 * 
	 * @returns AttributeField
	 */
	var AttributeField = function (props) {
		var valueField = props.valueField || 'id',
			displayField = props.displayField || 'name',
			objectTypeFilter = props.objectTypeFilter || ['all'],
			placeholder = props.placeholder,
			noTargetHighlight = !!props.noTargetHighlight,
			targetHighlightClass = props.targetHighlightClass,
			element = props.element ? $(props.element) : $('<input id="aloha-attribute-field-' + props.name + '">'),
			component,
			template,
			resourceItem,
			resourceValue,
			targetObject,
			targetAttribute,
			lastAttributeValue,
			additionalTargetObjects = [],
			modifyValue;

		if (props.cls) {
			element.addClass(props.cls);
		}
		if (props.width) {
			element.css("width", props.width + "px");
		}

		component = Ui.adopt(props.name, Component, {
			changeNotify: props.changeNotify,
			touchNotify: props.touchNotify,
			init: function () {

				if (props.element) {
					this.element = element;
				} else {
					if (props.label) {
						this.element = Utils.wrapWithLabel(props.label, element);
						if (props.labelClass) {
							this.element.addClass(props.labelClass);
						}
					} else {
						// Why do we have to wrap the element in a span? It
						// doesn't seem to work otherwise.
						this.element = $('<span>').append(element);
					}
				}

				element.autocomplete({
					'html': true,
					'appendTo': Context.selector,
					'source': function (req, res) {
						RepositoryManager.query({
							queryString: req.term,
							objectTypeFilter: objectTypeFilter
						}, function (data) {
							res($.map(data.items, function (item) {
								return {
									label: parse(template, item),
									value: item.name,
									obj: item
								};
							}));
						});
					},
					"open": props.open,
					"select": onSelect
				});

				if (typeof props.modifyValue === "function") {
					modifyValue = props.modifyValue;
				}
			}
		});

		element
			.on("focus", onFocus)
			.on("blur", onBlur)
			.on("keydown", onKeyDown)
			.on("keyup", onKeyup)
			.on("change", onChange);

		setPlaceholder();

		/**
		 * Update the attribute in the target element
		 */
		function updateTarget() {
			// If this attribute field currently refers to a repository
			// item, and the user edits the contents of the input field,
			// this attribute field seizes to refer to the repository item.
			if (resourceItem && resourceValue !== getValue(false)) {
				resourceItem = null;
				resourceValue = null;
			}

			// This handles attribute updates for non-repository, literal urls typed into the input field.
			// Input values that refer to a repository item are handled via setItem().
			if (!resourceItem) {
				setAttribute(targetAttribute, getValue(true));
			}
		}

		function onSelect(event, ui) {
			if (ui.item) {
				setItem(ui.item.obj);
			}
			finishEditing(true);
		}

		function onBlur() {
			finishEditing(false);
		}

		function onFocus(event, ui) {
			if (!$(event.target).is(':visible')) {
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
			changeTargetBackground();

			// Remove placeholder
			if (getValue() === placeholder) {
				setValue('');
			}
		}

		function onKeyDown(event) {
			// on ENTER or ESC leave the editing
			if (event.keyCode == 13 || event.keyCode == 27) {
				event.preventDefault();
			}
		}

		function onKeyup(event) {
			component.touch();
			updateTarget();

			if ((event.keyCode == 13 || event.keyCode == 27)) {
				finishEditing(true);
			}
		}

		function onChange(event) {
			component.touch();
			updateTarget();
			if (component != null && typeof component.changeNotify === 'function') {
				component.changeNotify(getValue(true));
			}
		}

		function finishEditing(select) {
			restoreTargetBackground();

			if (select) {
				// Move the selection back to the editable.
				var range = Aloha.Selection.getRangeObject();

				// collapse at end
				range.startContainer = range.endContainer;
				range.startOffset = range.endOffset;
				range.select();
			}

			if (!targetObject || lastAttributeValue === $(targetObject).attr(targetAttribute)) {
				return;
			}

			// when no resource item was selected, remove any marking of the target object
			if (!resourceItem) {
				RepositoryManager.markObject(targetObject);
			}

			if (getValue() === '') {
				setPlaceholder();
			}
		}

		/**
		 * Execute a function for every targets this attribute
		 *
		 * fields is pointing to.
		 * @param {Function} fn Function to execute for each target
		 */
		function executeForTargets(fn) {
			var target = $(targetObject);
			fn(target);
			for (var i = 0, len = additionalTargetObjects.length; i < len; i++) {
				fn($(additionalTargetObjects[i]));
			}
		}

		/**
		 * Change target background so the targets are
		 * highlighted
		 */
		function changeTargetBackground() {
			var target = $(targetObject);
			if (targetHighlightClass) {
				executeForTargets(function (target) {
					target.addClass(targetHighlightClass);
				});
			}

			if (noTargetHighlight) {
				return;
			}

			// Make sure that multiple invokations of
			// changeTargetBackground don't set an incorrect
			// data-original-background-color.
			restoreTargetBackground();

			// set background color to give visual feedback which link is modified
			if (target.context && target.context.style &&
				target.context.style['background-color']) {
				executeForTargets(function (target) {
					target.attr('data-original-background-color',
						target.context.style['background-color']);
				});
			}
			executeForTargets(function (target) {
				target.css('background-color', '#80B5F2');
			});
		}

		function restoreTargetBackground() {
			var target = $(targetObject);
			if (targetHighlightClass) {
				executeForTargets(function (target) {
					target.removeClass(targetHighlightClass);
				});
			}
			if (noTargetHighlight) {
				return;
			}
			// Remove the highlighting and restore original color if was set before
			var color = target.attr('data-original-background-color');
			executeForTargets(function (target) {
				target.css('background-color', color || '');
			});
			if (!target.attr('style')) {
				executeForTargets(function (target) {
					target.removeAttr('style');
				});
			}
			executeForTargets(function (target) {
				target.removeAttr('data-original-background-color');
			});
		}

		function parse(template, item) {
			return template.replace(/\{([^}]+)\}/g, function (_, name) {
				return name in item ? item[name] : "";
			});
		}

		function setPlaceholder() {
			if (null === placeholder) {
				return;
			}
			element.css('color', '#AAA');
			element.val(placeholder);
		}

		function setTemplate(tmpl) {
			template = tmpl;
		}

		/**
		 * When at least on objectType is set the value in the Attribute field does a query to all registered repositories.
		 * @param {Array} objectTypeFilter The array of objectTypeFilter to be searched for.
		 * @void
		 */
		function setObjectTypeFilter(objTypeFilter) {
			objectTypeFilter = objTypeFilter;
		}

		/**
		 * Adding a listener to the field
		 * @param {String} eventname The name of the event. Ex. 'keyup'
		 * @param {function} handler The function that should be called when the event happens.
		 */
		function addListener(eventName, handler) {
			element.on(eventName, $.proxy(handler, attrField));
		}

		function getValue(allowModification) {
			var v = element.val();
			if (allowModification && typeof modifyValue === "function") {
				v = modifyValue(v);
			}
			return v;
		}

		function setValue(value) {
			element.val(value);
			element.css('color', 'black');
		}

		function setItem(item) {
			resourceItem = item;

			if (item) {
				// TODO split display field by '.' and get corresponding attribute, because it could be a properties attribute.
				var v = item[displayField], fieldValue = item[valueField];
				// set the value into the field
				setValue(v);
				// store the value to be the "reference" value for the currently selected resource item
				resourceValue = v;

				if (typeof modifyValue === "function") {
					fieldValue = modifyValue(fieldValue);
				}

				setAttribute(targetAttribute, fieldValue);
				RepositoryManager.markObject(targetObject, item);
			} else {
				resourceValue = null;
			}

			element.trigger('item-change');
		}

		function getItem() {
			return resourceItem;
		}

		/**
		 * Sets an attribute optionally based on a regex on reference
		 * @param {String} attr The Attribute name which should be set. Ex. "lang"
		 * @param {String} value The value to set. Ex. "de-AT"
		 * @param {String} regex The regex when the attribute should be set. The regex is applied to the value of refernece.
		 * @param {String} reference The value for the regex.
		 */
		function setAttribute(attr, value, regex, reference) {
			if (targetObject) {
				// check if a reference value is submitted to check against with a regex
				if (typeof reference === 'undefined' || reference.match(new RegExp(regex))) {
					executeForTargets(function (target) {
						target.attr(attr, value);
					});
				} else {
					$(targetObject).removeAttr(attr);
				}
			}
		}

		/**
		 * Sets the target Object of which the Attribute should be modified
		 * @param {jQuery} obj the target object
		 * @param {String} attr Attribute to be modified ex. "href" of a link
		 * @void
		 */
		function setTargetObject(obj, attr) {
			var $obj = $(obj); // Just to be sure, we have a jQuery object.
			targetObject = obj;
			targetAttribute = attr;
			additionalTargetObjects = [];

			if (obj && attr) {
				lastAttributeValue = $obj.attr(attr);
				setValue(lastAttributeValue);

				setItem(null);
			} else {
				setValue('');

				setItem(null);

				return;
			}

			var ignoreAutoValues = $obj.attr('data-ignore-auto-values');

			// check whether a repository item is linked to the object
			RepositoryManager.getObject(obj, function (items) {
				if (items && items.length > 0) {
					var needResetIgnoreAutoValues = false;
					if (ignoreAutoValues && !$obj.attr('data-ignore-auto-values')) {
						$obj.attr('data-ignore-auto-values', ignoreAutoValues);
						needResetIgnoreAutoValues = true;
					}

					setItem(items[0]);

					if (needResetIgnoreAutoValues) {
						$obj.removeAttr('data-ignore-auto-values');
					}
				}
			});
		}

		function addAdditionalTargetObject(targetObj) {
			additionalTargetObjects.push(targetObj);
		}

		function getTargetObject() {
			return targetObject;
		}

		function focus() {
			component.focus();
			element.focus();
		}

		function foreground() {
			component.foreground();
		}

		function show() {
			element.show();
		}

		function hide() {
			element.hide();
		}

		/**
		 * Disables input text, so the text can not be edit.
		 */
		function disableInput() {
			element.attr('disabled', 'disabled');
		}

		/**
		 * Enables input text, so the text can be edit.
		 */
		function enableInput() {
			element.removeAttr('disabled');
		}

		function disable() {
			disableInput();
			component.disable();
		}

		function enable() {
			enableInput();
			component.enable();
		}

		function getInputId() {
			return element.attr("id");
		}

		function hasInputElem() {
			return true;
		}

		function getInputElem() {
			return element[0];
		}

		function getInputJQuery() {
			return element;
		}

		var attrField = {
			getInputElem: getInputElem,
			hasInputElem: hasInputElem,
			getInputId: getInputId,
			hide: hide,
			show: show,
			foreground: foreground,
			focus: focus,
			getTargetObject: getTargetObject,
			setTargetObject: setTargetObject,
			addAdditionalTargetObject: addAdditionalTargetObject,
			setAttribute: setAttribute,
			getItem: getItem,
			setItem: setItem,
			setValue: setValue,
			getValue: getValue,
			addListener: addListener,
			setObjectTypeFilter: setObjectTypeFilter,
			setTemplate: setTemplate,
			setPlaceholder: setPlaceholder,
			getInputJQuery: getInputJQuery,
			enableInput: enableInput,
			disableInput: disableInput,
			enable: enable,
			disable: disable,
			updateTarget: updateTarget,
			finishEditing: finishEditing,
			isValid: function () {
				return component.isValid();
			},
			touch: function () {
				component.touch();
			},
			untouched: function () {
				component.untouched();
			},
		};

		Object.defineProperties(attrField, {
			disabled: {
				get: function () {
					return component.disabled;
				},
				set: function () { },
			},
			touched: {
				get: function () {
					return component.touched;
				},
				set: function () { },
			},
			validationErrors: {
				get: function () {
					return component.validationErrors;
				},
				set: function (errors) {
					component.validationErrors = errors;
				},
			},
		});

		return attrField;
	};

	return AttributeField;
});
