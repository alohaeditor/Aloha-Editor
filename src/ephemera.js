/**
 * ephemera.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * TODO: currently only simple transformations are suppored, like
 *       marking classes, attributes and elements as ephemeral and removing
 *       them during the pruning process.
 *       In the future, support for the block-plugin and custom pruning
 *       functions should be added. This may be done by letting implementations
 *       completely control the pruning of a DOM element through a
 *       function that takes the content+ephemeral-data and returns only
 *       content - similar to make clean, but for single elements to reduce
 *       overhead.
 */
define([
	'strings',
	'arrays',
	'maps',
	'dom',
	'misc',
	'browsers'
], function (
	strings,
	arrays,
	maps,
	dom,
	misc,
	Browsers
) {
	'use strict';

	var ephemeraMap = {
		classMap: {
			'aloha-ephemera-wrapper': true,
			'aloha-ephemera-filler': true,
			'aloha-ephemera-attr': true,
			'aloha-ephemera': true,
			// aloha-cleanme is the same as aloha-ephemera.
			// TODO: should be replaced with aloha-ephemera throughout the
			//       codebase and removed here.
			'aloha-cleanme': true
		},
		attrMap: {
			'hidefocus': true,
			'hideFocus': true,
			'tabindex': true,
			'tabIndex': true,
			'contenteditable': ['TABLE'],
			'contentEditable': ['TABLE']
		},
		attrRxs: [/^(?:nodeIndex|sizcache|sizset|jquery)[\w\d]*$/i],
		pruneFns: []
	};

	var commonClsSubstr = 'aloha-';

	/**
	 * Checks whether the given classes contain the substring common to all
	 * ephemeral classes. If the check fails, an warning will be logged and the
	 * substring will be set to the empty string which voids the performance
	 * improvement the common substring would otherwise have gained.
	 */
	function checkCommonSubstr(clss) {
		var i, len;
		for (i = 0, len = clss.length; i < len; i++) {
			if (-1 === clss[i].indexOf(commonClsSubstr)) {
				console.warn(
					'Class "' + clss[i] + '" was set to be ephemeral,'
					+ 'which hurts peformance. Add the common substring "'
					+ commonClsSubstr + '" to the class to fix this problem.'
				);
				commonClsSubstr = '';
			}
		}
	}

	/**
	 * Registers ephemeral classes.
	 *
	 * An ephemeral class is a non-content class that will be pruned from the
	 * from the result of editable.getContents().
	 *
	 * The given classes should contain the string 'aloha-' to get the benefit
	 * of a performance optimization.
	 *
	 * Returns a map that contains all classes that were ever registered with
	 * this function.
	 *
	 * Multiple classes may be specified. If none are specified, just returns
	 * the current ephemeral classes map without modifying it.
	 *
	 * Also see ephemera().
	 */
	function classes() {
		var clss = Array.prototype.slice.call(arguments);
		maps.fillKeys(ephemeraMap.classMap, clss, true);
		checkCommonSubstr(clss);
		/*
		Pubsub.pub('aloha.ephemera.classes', {
			ephemera: ephemeraMap,
			newClasses: clss
		});
		*/
	}

	/**
	 * Registers ephemeral attributes by attribute name.
	 *
	 * Similar to classes() except applies to entire attributes instead of
	 * individual classes in the class attribute.
	 */
	function attributes() {
		var attrs = Array.prototype.slice.call(arguments);
		maps.fillKeys(ephemeraMap.attrMap, attrs, true);
		/*
		Pubsub.pub('aloha.ephemera.attributes', {
			ephemera: ephemeraMap,
			newAttributes: attrs
		});
		*/
	}

	/**
	 * Provides access to the global ephemera registry.
	 *
	 * If the given argument is not null, sets the global ephemera registry to
	 * the given value and returns it. Otherwise, just returns the global
	 * registry.
	 *
	 * The given/returned value has the following properties:
	 *
	 * The given map may have the following entries
	 *
	 * classMap - a map from class name to the value true.
	 *            all classes must have a "aloha-" prefix.
	 *            Use Ehpemera.attributes() to set classes without "aloha-" prefix.
	 *
	 * attrMap  - a map from attribute name to the value true or to an array of
	 *            element names. If an array of elements is specified, the
	 *            attribute will only be considered ephemeral if it is found on
	 *            an element in the array.
	 *
	 * attrRxs  - an array of regexes (in object - not string - form: /[a-z].../)
	 *
	 * pruneFns - an array of functions that will be called at each pruning step.
	 *
	 * When a DOM tree is pruned with prune(elem) without an emap argument, the
	 * global registry maintained with classes() attributes() and ephemera() is
	 * used as a default map. If an emap argument is specified, the global
	 * registry will be ignored and the emap argument will be used instead.
	 *
	 * When a DOM tree is pruned with prune()
	 * - classes specified by classMap will be removed
	 * - attributes specified by attrMap or attrRxs will be removed
	 * - functions specified by pruneFns will be called as the DOM tree is
	 *   descended into (pre-order), with each node (element, text, etc.) as a
	 *   single argument. The function is free to modify the element and return
	 *   it, or return a new element which will replace the given element in the
	 *   pruned tree. If null or undefined is returned, the element will be
	 *   removed from the tree. As per contract of maps.walkDomInplace, it is
	 *   allowed to insert/remove children in the parent node as long as the
	 *   given node is not removed.
	 *
	 * Also see classes() and attributes().
	 *
	 * Note that removal of attributes doesn't always work on IE7 (in rare
	 * special cases). The dom-to-xhtml plugin can reliably remove ephemeral
	 * attributes during the serialization step.
	 */
	function ephemera(emap) {
		if (emap) {
			ephemeraMap = emap;
			/*
			Pubsub.pub('aloha.ephemera', {
				ephemera: ephemeraMap
			});
			*/
		}
		return ephemeraMap;
	}

	/**
	 * Marks an element as ephemeral.
	 *
	 * The element will be completely removed when the prune function is called
	 * on it.
	 *
	 * Adds the class 'aloha-ephemera' to the given element.
	 *
	 * The class 'aloha-ephemera' can also be added directly without recurse to
	 * this function, if that is more convenient.
	 */
	function markElement(elem) {
		dom.addClass(elem, 'aloha-ephemera');
	}

	/**
	 * Marks the attribute of an element as ephemeral.
	 *
	 * The attribute will be removed from the element when the prune function is
	 * called on it.
	 *
	 * Multiple attributes can be passed at the same time be separating them
	 * with a space.
	 *
	 * Adds the class 'aloha-ephemera-attr' to the given element. Also adds or
	 * modifies the 'data-aloha-ephemera-attr' attribute, and adds to it the
	 * name of the given attribute.
	 *
	 * These modifications can be made directly without recurse to this
	 * function, if that is more convenient.
	 */
	function markAttr(elem, attr) {
		var data = elem.getAttribute('data-aloha-ephemera-attr');
		if (null == data || '' === data) {
			data = attr;
		} else if (-1 === strings.words(data).indexOf(attr)) {
			data += ' ' + attr;
		}
		elem.setAttribute('data-aloha-ephemera-attr', data);
		dom.addClass(elem, 'aloha-ephemera-attr');
	}

	/**
	 * Marks an element as a ephemeral, excluding subnodes.
	 *
	 * The element will be removed when the prune function is called on it, but
	 * any children of the wrapper element will remain in its place.
	 *
	 * A wrapper is an element that wraps a single non-ephemeral element. A
	 * filler is an element that is wrapped by a single non-ephemeral element.
	 * This distinction is not important for the prune function, which behave
	 * the same for both wrappers and fillers, but it makes it easier to build
	 * more advanced content inspection algorithms (also see note at the header
	 * of ephemeral.js).
	 *
	 * Adds the class 'aloha-ephemera-wrapper' to the given element.
	 *
	 * The class 'aloha-ephemera-wrapper' may also be added directly, without
	 * recurse to this function, if that is more convenient.
	 *
	 * NB: a wrapper element must not wrap a filler element. Wrappers and
	 *     fillers are ephermeral. A wrapper must always wrap a single
	 *     _non-ephemeral_ element, and a filler must always fill a single
	 *     _non-ephemeral_ element.
	 */
	function markWrapper(elem) {
		dom.addClass(elem, 'aloha-ephemera-wrapper');
	}

	/**
	 * Marks an element as ephemeral, excluding subnodes.
	 *
	 * Adds the class 'aloha-ephemera-filler' to the given element.
	 *
	 * The class 'aloha-ephemera-filler' may also be added directly,
	 * without recurse to this function, if that is more convenient.
	 *
	 * See wrapper()
	 */
	function markFiller(elem) {
		dom.addClass(elem, 'aloha-ephemera-filler');
	}

	/**
	 * Prunes attributes marked as ephemeral with Ephemera.attributes() from the
	 * given element.
	 */
	function pruneMarkedAttrs(elem) {
		var data = elem.getAttribute('data-aloha-ephemera-attr');
		var i;
		var attrs;
		// Because IE7 crashes if we remove this attribute. If the dom-to-xhtml
		// plugin is turned on, it will handle the removal of this attribute
		// during serialization.
		if (!Browsers.ie7) {
			elem.removeAttribute('data-aloha-ephemera-attr');
		}
		if (typeof data === 'string') {
			attrs = strings.words(data);
			for (i = 0; i < attrs.length; i++) {
				elem.removeAttribute(attrs[i]);
			}
		}
	}

	/**
	 * Determines whether the given attribute of the given element is ephemeral
	 * according to the given emap.
	 *
	 * See Ephemera.ephemera() for an explanation of attrMap and attrRxs.
	 */
	function isAttrEphemeral(elem, attrName, attrMap, attrRxs) {
		var mapped = attrMap[attrName];
		if (mapped) {
			// The attrMap may either contain boolean true or an array of element names.
			if (true === mapped) {
				return true;
			}
			if (-1 !== mapped.indexOf(elem.nodeName)) {
				return true;
			}
		}
		return misc.anyRx(attrRxs, attrName);
	}

	/**
	 * Prunes attributes specified with either emap.attrMap or emap.attrRxs.
	 * See ephemera().
	 */
	function pruneEmapAttrs(elem, emap) {
		maps.forEach(dom.attrs(elem), function (value, name) {
			if (isAttrEphemeral(elem, name, emap.attrMap, emap.attrRxs)) {
				elem.removeAttribute(name);
			}
		});
	}

	/**
	 * Prunes an element of attributes and classes or removes the element by
	 * returning false.
	 *
	 * Elements attributes and classes can either be marked as ephemeral, in
	 * which case the element itself will contain the prune-info, or they can be
	 * specified as ephemeral with the given emap.
	 *
	 * See ephemera() for an explanation of the emap argument.
	 */
	function pruneElem(elem, emap) {
		var className = elem.className;
		if (className && -1 !== className.indexOf(commonClsSubstr)) {
			var classes = strings.words(className);

			// Ephemera.markElement()
			if (-1 !== classes.indexOf('aloha-cleanme') || -1 !== classes.indexOf('aloha-ephemera')) {
				return false; // removes the element
			}

			// Ephemera.markWrapper() and Ephemera.markFiller()
			if (-1 !== classes.indexOf('aloha-ephemera-wrapper')
					|| -1 !== classes.indexOf('aloha-ephemera-filler')) {
				dom.moveNextAll(elem.parentNode, elem.firstChild, elem.nextSibling);
				return false;
			}

			// Ephemera.markAttr()
			if (-1 !== classes.indexOf('aloha-ephemera-attr')) {
				pruneMarkedAttrs(elem);
			}

			// Ephemera.classes() and Ehpemera.ephemera({ classMap: {} })
			var persistentClasses = classes.filter(function (cls) {
				return !emap.classMap[cls];
			});
			if (persistentClasses.length !== classes.length) {
				if (0 === persistentClasses.length) {
					elem.removeAttribute('class');
				} else {
					elem.className = persistentClasses.join(' ');
				}
			}
		}

		// Ephemera.attributes() and Ephemera.ephemera({ attrMap: {}, attrRxs: {} })
		pruneEmapAttrs(elem, emap);

		return true;
	}

	/**
	 * Prunes the given element of all ephemeral data.
	 *
	 * Elements marked with Ephemera.markElement() will be removed.
	 * Attributes marked with Ephemera.markAttr() will be removed.
	 * Elements marked with Ephemera.markWrapper() or Ephemera.markFiller() will
	 * be replaced with their children.
	 *
	 * See ephemera() for an explanation of the emap argument.
	 *
	 * All properties of emap, if specified, are required, but may be empty.
	 *
	 * The element is modified in-place and returned.
	 */
	function prune(elem, emap) {
		emap = emap || ephemeraMap;
		// TODO
	}

	return {
		ephemera        : ephemera,
		classes         : classes,
		attributes      : attributes,
		markElement     : markElement,
		markAttr        : markAttr,
		markWrapper     : markWrapper,
		markFiller      : markFiller,
		prune           : prune,
		isAttrEphemeral : isAttrEphemeral
	};
});
