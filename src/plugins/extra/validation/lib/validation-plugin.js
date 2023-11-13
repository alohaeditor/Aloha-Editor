/*global define: true */

/*!
 * Aloha Editor
 * Author & Copyright (c) 2012 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed unter the terms of http://www.aloha-editor.com/license.html
 *
 * @overview
 * Provides validation facilities for Aloha Editables.
 * Also defines a ValidationContentHandler that is used internally.
 *
 * @todo:
 * Consider asynchronous validation.
 */
define([
	'jquery',
	'PubSub',
	'aloha/contenthandlermanager',
	'aloha/plugin',
	'aloha/core'
], function (
	$,
	PubSub,
	Manager,
	Plugin,
	Aloha
) {
	'use strict';

	/**
	 * Wraps a validator that is expressed as a regular expression into a
	 * predicate function.
	 *
	 * @param {RegExp} regexp
	 * @return {function(string):boolean} Validator function.
	 */
	function normalizeRegExp(regexp) {
		return function (content) {
			return regexp.test(content);
		};
	}

	/**
	 * Parses user-defined validators, and normalizes them into functions if
	 * necessary.
	 *
	 * @param {object} config
	 * @return {Array.<function>} An array of validation function predicates.
	 */
	function parseValidators(config) {
		var validators = [];
		var selector;
		var validator;
		var type;
		for (selector in config) {
			if (config.hasOwnProperty(selector)) {
				validator = config[selector];
				type = $.type(validator);
				if ('regexp' === type) {
					validators.push([selector, normalizeRegExp(validator)]);
				} else if ('function' === type) {
					validators.push([selector, validator]);
				} else {
					Aloha.Log.error('validation/validation-plugin',
						'Encountered property "' + validator + '" of type '
						+ type + ' when a RegExp or Function is required.');
				}
			}
		}
		return validators;
	}

	/**
	 * An associative array which maps editable selectors with user specified
	 * validation functions.
	 *
	 * @type {object<string, function(string, Aloha.Editable, jQuery)>:boolean}
	 */
	var predicates;

	/**
	 * An optional callback which, if specified, will be invoked each time
	 * validation on an editable is complete.
	 *
	 * @type {function(Aloha.Editable, boolean, object|function)=}
	 */
	var onValidation;

	/**
	 * Validation content handler for internal use.
	 *
	 * @type {ContentHandler}
	 */
	var ValidationContentHandler = Manager.createHandler({

		/**
		 * Calls all validation predicates that apply to the given editable, or
		 * until one fails.
		 *
		 * Unlike the conventional handleContent() method, this one receives an
		 * out parameter `out_isValid' which will record whether or not
		 * validation failed.
		 *
		 * @override
		 * @param {string} content Contents of the editable, which have been
		 *                         processed by getContent handlers.
		 * @param {object} __options__ Content handler options (unused).
		 * @param {Aloha.Editable} editable The editable that is to be
		 *                                  validated.
		 * @param {function(boolean):boolean} out_isValid Out paramter that
		 *                                                receives a flag
		 *                                                indicating whether
		 *                                                the editable passed
		 *                                                validation or not.
		 * @return {string} Per handleContent() contract.
		 */
		handleContent: function (content, __options__, editable, out_isValid) {
			if (!editable || 0 === predicates.length) {
				return content;
			}
			var id = editable.getId();
			var valid = true;
			var i;
			for (i = 0; i < predicates.length; i++) {
				if (editable.obj.is(predicates[i][0])) {
					if (!predicates[i][1](content, editable, $)) {
						// Because to fail one predicate is to fail all
						// validation.
						valid = false;
						break;
					}
				}
			}
			if (onValidation) {
				onValidation(editable, valid);
			}
			if (out_isValid) {
				out_isValid(valid);
			}
			return content;
		}
	});

	/**
	 * Out parameter.
	 *
	 * Creates a closure around a single variable, and returns a function that
	 * is a getter and setter to that variable.
	 *
	 * @param {*=} value An optional object of any type.
	 * @return {function(*=):*} A getter and setter.
	 */
	function outParameter(value) {
		var _value = value || null;
		var reference = function reference(value) {
			if (Array.prototype.slice.apply(arguments).length) {
				_value = value;
			}
			return _value;
		};
		return reference;
	}

	/**
	 * Validates an editable, or a list of editables.
	 *
	 * If no arguments are given, then all available editables are validated.
	 *
	 * @param {Aloha.Editable|Array.<Aloha.Editable>|null} editables Optional
	 *                                                               editables
	 *                                                               to test.
	 * @return {Array.<Aloha.Editables>} Editables that failed validation.
	 */
	function validate(editables) {
		var type = $.type(editables);
		if ('undefined' === type) {
			editables = Aloha.editables;
		} else if ('array' !== type) {
			editables = [editables];
		}
		var failures = [];
		var valid = outParameter(true);
		var i;
		for (i = 0; i < editables.length; i++) {
			valid(true);
			ValidationContentHandler.handleContent(editables[i].getContents(),
					null, editables[i], valid);
			if (!valid()) {
				failures.push(editables[i]);
			}
		}
		return failures;
	}

	/**
	 * Validate the active editable.
	 */
	function validateActiveEditable() {
		validate(Aloha.activeEditable);
	}

	/**
	 * Registers the active editable to be validated when a message is
	 * published at the given subscriptions.
	 *
	 * @param {Array.<string>} subscriptions
	 */
	function registerSubscriptions(channels) {
		var i;
		for (i = 0; i < channels.length; i++) {
			PubSub.sub(channels[i], validateActiveEditable);
		}
	}

	/**
	 * Registers the active editable to be validated at the given events.
	 *
	 * @param {Array.<string>} events
	 */
	function registerEvents(events) {
		var i;
		for (i = 0; i < events.length; i++) {
			Aloha.bind(events[i], validateActiveEditable);
		}
	}

	/**
	 * Registers the validation content handler into the the given hooks.
	 *
	 * @param {Array.<string>} hooks Content handler hooks.
	 */
	function registerHooks(hooks) {
		var handlers = Aloha.settings.contentHandler;
		var i;
		for (i = 0; i < hooks.length; i++) {
			if (!handlers[hooks[i]]) {
				handlers[hooks[i]] = ['validation'];
			} else {
				handlers[hooks[i]].push('validation');
			}
		}
	}

	/**
	 * @type {Aloha.Plugin}
	 */
	var Validation = Plugin.create('validation', {

		init: function () {
			var settings = Aloha.settings.plugins
			            && Aloha.settings.plugins.validation;

			predicates = settings ? parseValidators(settings.config) : [];
			onValidation = (settings && settings.onValidation) || null;

			if (settings) {
				if (settings.hooks) {
					registerHooks(settings.hooks);
				}
				if (settings.events) {
					registerEvents(settings.events);
				}
				if (settings.channels) {
					registerSubscriptions(settings.channels);
				}
			}

			Manager.register('validation', ValidationContentHandler);
			Aloha.features.validation = true;
		}
	});

	Validation.validate = validate;

	return Validation;
});
