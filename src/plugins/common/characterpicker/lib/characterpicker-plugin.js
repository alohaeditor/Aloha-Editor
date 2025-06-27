/** @typedef {import('./symbol-grid').SymbolGridItem} SymbolGridItem */
/** @typedef {import('../../ui/lib/contextButton').ContextButton} ContextButton */
/* characterpicker-plugin.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 *
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */

define([
	'aloha',
	'aloha/plugin',
	'PubSub',
	'ui/ui',
	'ui/contextButton',
	'ui/dynamicForm',
	'ui/icons',
	'characterpicker/symbol-grid',
	'characterpicker/symbol-search-grid',
	'i18n!characterpicker/nls/i18n'
], function (
	Aloha,
	Plugin,
	PubSub,
	Ui,
	ContextButton,
	DynamicForm,
	Icons,
	SymbolGrid,
	SymbolSearchGrid,
	i18n
) {
	'use strict';

	/**
	 * Tracks the range at the point at which the editor opens the character
	 * picker.
	 *
	 * @type {Range}
	 */
	var rangeAtOpen;

	/**
	 * Inserts the selected character, at the editor's selection.
	 *
	 * @param {SymbolGridItem} item
	 */
	function onSelectCharacter(item) {
		if (Aloha.activeEditable) {
			rangeAtOpen.select();
			Aloha.execCommand('insertHTML', false, item.symbol);

			// Because after the character was inserted, move the selection
			// forward.
			rangeAtOpen.endContainer = rangeAtOpen.startContainer;
			rangeAtOpen.endOffset = ++rangeAtOpen.startOffset;
			rangeAtOpen.select();
		}
	}

	function createSymbolGridFromConfig(
		config,
		name,
		applyChanges,
		validateFn,
		onChangeFn,
		onTouchFn
	) {
		var tmpOptions = config.options || {};
		var component = Ui.adopt(name, SymbolGrid, {
			symbols: tmpOptions.symbols,

			changeNotify: function (value) {
				applyChanges(value);
				validateFn(value);
				onChangeFn(value);
			},
			touchNotify: function () {
				onTouchFn();
			},
		});
		return component;
	}

	function createSymbolSearchGridFromConfig(
		config,
		name,
		applyChanges,
		validateFn,
		onChangeFn,
		onTouchFn
	) {
		var tmpOptions = config.options || {};
		var component = Ui.adopt(name, SymbolSearchGrid, {
			symbols: tmpOptions.symbols,
			searchLabel: tmpOptions.searchLabel,

			changeNotify: function (value) {
				applyChanges(value);
				validateFn(value);
				onChangeFn(value);
			},
			touchNotify: function () {
				onTouchFn();
			},
		});
		return component;
	}

	var CharacterPickerPlugin = {

		settings: {},

		config: [
			{
				'label': 'Ampersand',
				'symbol': '&#38',
				'keywords': ['and', 'amp']
			},
			{
				'label': 'Quotation mark',
				'symbol': '&#34',
				'keywords': ['quote']
			},
			{
				'label': 'Cent sign',
				'symbol': '&#162',
				'keywords': ['cent', 'currency']
			},
			{
				'label': 'Euro sign',
				'symbol': '&#8364',
				'keywords': ['euro', 'currency']
			},
			{
				'label': 'Pound sign',
				'symbol': '&#163',
				'keywords': ['euro', 'currency']
			},
			{
				'label': 'Yen sign',
				'symbol': '&#165',
				'keywords': ['yen', 'currency']
			},
			{
				'label': 'Copyright sign',
				'symbol': '&#169',
				'keywords': ['copyright']
			},
			{
				'label': 'Registered sign',
				'symbol': '&#174',
				'keywords': ['registered']
			},
			{
				'label': 'Trade mark sign',
				'symbol': '&#8364',
				'keywords': ['trade', 'trademark']
			},
			{
				'label': 'Per mille sign',
				'symbol': '&#8240',
				'keywords': ['permille', 'math']
			},
			{
				'label': 'Micro sign',
				'symbol': '&#181',
				'keywords': ['micro']
			},
			{
				'label': 'Middle dot',
				'symbol': '&#183',
				'keywords': ['middledot', 'dot', 'math']
			},
			{
				'label': 'Bullet',
				'symbol': '&#8364',
				'keywords': ['bullet', 'dot', 'list']
			},
			{
				'label': 'Horizontal ellipsis',
				'symbol': '&#8230',
				'keywords': ['ellipsis', 'punctuation']
			},
			{
				'label': 'Prime',
				'symbol': '&#8242',
				'keywords': ['prime', 'math']
			},
			{
				'label': 'Double prime',
				'symbol': '&#8243',
				'keywords': ['doubleprime', 'prime', 'math']
			},
			{
				'label': 'Section sign',
				'symbol': '&#167',
				'keywords': ['section', 'paragraph']
			},
			{
				'label': 'Pilcrow sign',
				'symbol': '&#182',
				'keywords': ['pilcrow', 'paragraph']
			},
			{
				'label': 'Small sharp S',
				'symbol': '&#223',
				'keywords': ['s', 'sharp', 'sz', 'ligature']
			},
			{
				'label': 'Left angle quotation mark',
				'symbol': '&#8249',
				'keywords': ['left', 'angle', 'quot']
			},
			{
				'label': 'Right angle quotation mark',
				'symbol': '&#8250',
				'keywords': ['right', 'angle', 'quot']
			},
			{
				'label': 'Left double angle quotation mark',
				'symbol': '&#171',
				'keywords': ['left', 'angle', 'quot', 'double']
			},
			{
				'label': 'Right double angle quotation mark',
				'symbol': '&#187',
				'keywords': ['right', 'angle', 'quot', 'double']
			},
			{
				'label': 'Left single quotation mark',
				'symbol': '&#8216',
				'keywords': ['left', 'quot']
			},
			{
				'label': 'Right single quotation mark',
				'symbol': '&#8217',
				'keywords': ['right', 'quot']
			},
			{
				'label': 'Left double quotation mark',
				'symbol': '&#8220',
				'keywords': ['left', 'quot', 'double']
			},
			{
				'label': 'Right double quotation mark',
				'symbol': '&#8221',
				'keywords': ['right', 'quot', 'double']
			},
			{
				'label': 'Single low quotation mark',
				'symbol': '&#8218',
				'keywords': ['quot']
			},
			{
				'label': 'Double low quotation mark',
				'symbol': '&#8222',
				'keywords': ['quot', 'double']
			},
			{
				'label': 'Less-Than sign',
				'symbol': '&#60',
				'keywords': ['less', 'math', 'compare']
			},
			{
				'label': 'Greater-Than sign',
				'symbol': '&#62',
				'keywords': ['greater', 'math', 'compare']
			},
			{
				'label': 'Less-Than or equal',
				'symbol': '&#8804',
				'keywords': ['less', 'equal', 'math', 'compare']
			},
			{
				'label': 'Greater-Than or equal',
				'symbol': '&#8805',
				'keywords': ['greater', 'equal', 'math', 'compare']
			},
			{
				'label': 'En dash',
				'symbol': '&#811',
				'keywords': ['en', 'dash', 'punctuation']
			},
			{
				'label': 'Em dash',
				'symbol': '&#811',
				'keywords': ['em', 'dash', 'punctuation']
			},
			{
				'label': 'Overline',
				'symbol': '&#8254',
				'keywords': ['overline']
			},
			{
				'label': 'Currency sign',
				'symbol': '&#164',
				'keywords': ['currency']
			},
			{
				'label': 'Broken bar',
				'symbol': '&#166',
				'keywords': ['bar']
			},
			{
				'label': 'Diaeresis',
				'symbol': '&#168',
				'keywords': ['diaeresis']
			},
			{
				'label': 'Inverted exclamation mark',
				'symbol': '&#161',
				'keywords': ['inverted', 'exclamation']
			},
			{
				'label': 'Inverted question mark',
				'symbol': '&#191',
				'keywords': ['inverted', 'question']
			},
			{
				'label': 'Accent circumflex',
				'symbol': '&#710',
				'keywords': ['accent', 'cicrumflex']
			},
			{
				'label': 'Tilde',
				'symbol': '&#732',
				'keywords': ['tilde']
			},
			{
				'label': 'Degree sign',
				'symbol': '&#176',
				'keywords': ['degree', 'math']
			},
			{
				'label': 'Minus sign',
				'symbol': '&#8722',
				'keywords': ['minus', 'math']
			},
			{
				'label': 'Plus-Minus sign',
				'symbol': '&#177',
				'keywords': ['plus', 'minus', 'math']
			},
			{
				'label': 'Division sign',
				'symbol': '&#247',
				'keywords': ['division', 'divide', 'fraction', 'math']
			},
			{
				'label': 'Fraction sign',
				'symbol': '&#8260',
				'keywords': ['division', 'divide', 'fraction', 'math']
			},
			{
				'label': 'Multiplication sign',
				'symbol': '&#215',
				'keywords': ['mult', 'multiplication', 'math']
			},
			{
				'label': 'Superscript One',
				'symbol': '&#185',
				'keywords': ['superscript', 'power', 'one']
			},
			{
				'label': 'Superscript Two',
				'symbol': '&#178',
				'keywords': ['superscript', 'power', 'two']
			},
			{
				'label': 'Superscript Three',
				'symbol': '&#179',
				'keywords': ['superscript', 'power', 'three']
			},
			{
				'label': 'One quarter',
				'symbol': '&#188',
				'keywords': ['quarter', 'fraction', 'math']
			},
			{
				'label': 'One half',
				'symbol': '&#189',
				'keywords': ['half', 'fraction', 'math']
			},
			{
				'label': 'Three quarters',
				'symbol': '&#190',
				'keywords': ['three', 'quarter', 'fraction', 'math']
			},
			{
				'label': 'Small F with hook',
				'symbol': '&#402',
				'keywords': ['f']
			},
			{
				'label': 'Integral',
				'symbol': '&#8747',
				'keywords': ['integral', 'math']
			},
			{
				'label': 'Summation',
				'symbol': '&#8721',
				'keywords': ['sum', 'summation', 'math']
			},
			{
				'label': 'Infinity',
				'symbol': '&#8734',
				'keywords': ['infinity', 'math']
			},
			{
				'label': 'Square root',
				'symbol': '&#8730',
				'keywords': ['square', 'root', 'math']
			},
			{
				'label': 'Tilde operator',
				'symbol': '&#8764',
				'keywords': ['tilde', 'math']
			},
			{
				'label': 'Approximately equal to',
				'symbol': '&#8773',
				'keywords': ['approx', 'equal', 'math', 'compare']
			},
			{
				'label': 'Almost equal to',
				'symbol': '&#8776',
				'keywords': ['almost', 'equal', 'math', 'compare']
			},
			{
				'label': 'Not equal to',
				'symbol': '&#8800',
				'keywords': ['not', 'equal', 'math', 'compare']
			},
			{
				'label': 'Identical to',
				'symbol': '&#8801',
				'keywords': ['ident', 'equal', 'math', 'compare']
			},
			{
				'label': 'Element of',
				'symbol': '&#8712',
				'keywords': ['element', 'set', 'math', 'compare']
			},
			{
				'label': 'Not element of',
				'symbol': '&#8713',
				'keywords': ['not', 'element', 'set', 'math', 'compare']
			},
			{
				'label': 'Contains as member',
				'symbol': '&#8715',
				'keywords': ['element', 'set', 'member', 'math', 'compare']
			},
			{
				'label': 'Product',
				'symbol': '&#8719',
				'keywords': ['product', 'math']
			},
			{
				'label': 'Logical and',
				'symbol': '&#8743',
				'keywords': ['and', 'logic', 'math']
			},
			{
				'label': 'Logical or',
				'symbol': '&#8744',
				'keywords': ['or', 'logic', 'math']
			},
			{
				'label': 'Not sign',
				'symbol': '&#172',
				'keywords': ['not', 'logic', 'math']
			},
			{
				'label': 'Intersection',
				'symbol': '&#8745',
				'keywords': ['intersect', 'set', 'math', 'logic']
			},
			{
				'label': 'Union',
				'symbol': '&#8746',
				'keywords': ['union', 'set', 'math', 'logic']
			},
			{
				'label': 'Partial differential',
				'symbol': '&#8706',
				'keywords': ['partial', 'differential', 'math']
			},
			{
				'label': 'For all',
				'symbol': '&#8704',
				'keywords': ['all', 'math', 'logic']
			},
			{
				'label': 'Exists',
				'symbol': '&#8707',
				'keywords': ['exists', 'math', 'logic']
			},
			{
				'label': 'Empty set',
				'symbol': '&#8709',
				'keywords': ['empty', 'set', 'math', 'logic']
			},
			{
				'label': 'Nabla',
				'symbol': '&#8711',
				'keywords': ['nabla', 'math']
			},
			{
				'label': 'Asteristk',
				'symbol': '&#8727',
				'keywords': ['asterist', 'star', 'math']
			},
			{
				'label': 'Proportional to',
				'symbol': '&#8733',
				'keywords': ['proportional', 'math']
			},
			{
				'label': 'Angle',
				'symbol': '&#8736',
				'keywords': ['angle', 'math']
			},
			{
				'label': 'Accent acute',
				'symbol': '&#180',
				'keywords': ['accent', 'acute']
			},
			{
				'label': 'Cedilla',
				'symbol': '&#184',
				'keywords': ['accent', 'cedilla']
			},
			{
				'label': 'Feminine ordinal indicator',
				'symbol': '&#170',
				'keywords': ['feminine', 'ordinal']
			},
			{
				'label': 'Masculine ordinal indicator',
				'symbol': '&#186',
				'keywords': ['masculine', 'ordinal']
			},
			{
				'label': 'Dagger',
				'symbol': '&#8224',
				'keywords': ['dagger', 'footnote']
			},
			{
				'label': 'Double dagger',
				'symbol': '&#8225',
				'keywords': ['double', 'dagger', 'footnote']
			},
			{
				'label': 'Capital A with grave',
				'symbol': '&#192',
				'keywords': ['a', 'grave']
			},
			{
				'label': 'Capital A with acute',
				'symbol': '&#193',
				'keywords': ['a', 'acute']
			},
			{
				'label': 'Capital A with circumflex',
				'symbol': '&#194',
				'keywords': ['a', 'circumflex']
			},
			{
				'label': 'Capital A with tilde',
				'symbol': '&#195',
				'keywords': ['a', 'tilde']
			},
			{
				'label': 'Capital A with diaeresis',
				'symbol': '&#196',
				'keywords': ['a', 'ae', 'diaeresis']
			},
			{
				'label': 'Capital A with ring',
				'symbol': '&#197',
				'keywords': ['a', 'ring']
			},
			{
				'label': 'Capital AE',
				'symbol': '&#198',
				'keywords': ['ae', 'ligature']
			},
			{
				'label': 'Capital C with cedilla',
				'symbol': '&#199',
				'keywords': ['c', 'cedilla']
			},
			{
				'label': 'Capital E with grave',
				'symbol': '&#200',
				'keywords': ['e', 'grave']
			},
			{
				'label': 'Capital E with acute',
				'symbol': '&#201',
				'keywords': ['e', 'acute']
			},
			{
				'label': 'Capital E with circumflex',
				'symbol': '&#202',
				'keywords': ['e', 'circumflex']
			},
			{
				'label': 'Capital E with diaeresis',
				'symbol': '&#203',
				'keywords': ['e', 'diaeresis']
			},
			{
				'label': 'Capital I with grave',
				'symbol': '&#204',
				'keywords': ['i', 'grave']
			},
			{
				'label': 'Capital I with acute',
				'symbol': '&#205',
				'keywords': ['i', 'acute']
			},
			{
				'label': 'Capital I with circumflex',
				'symbol': '&#206',
				'keywords': ['i', 'circumflex']
			},
			{
				'label': 'Capital I with diaeresis',
				'symbol': '&#207',
				'keywords': ['i', 'diaeresis']
			},
			{
				'label': 'Capital Eth',
				'symbol': '&#208',
				'keywords': ['eth']
			},
			{
				'label': 'Capital N with tilde',
				'symbol': '&#209',
				'keywords': ['n', 'tilde']
			},
			{
				'label': 'Capital O with grave',
				'symbol': '&#210',
				'keywords': ['o', 'grave']
			},
			{
				'label': 'Capital O with acute',
				'symbol': '&#211',
				'keywords': ['o', 'acute']
			},
			{
				'label': 'Capital O with circumflex',
				'symbol': '&#212',
				'keywords': ['o', 'circumflex']
			},
			{
				'label': 'Capital O with tilde',
				'symbol': '&#213',
				'keywords': ['o', 'tilde']
			},
			{
				'label': 'Capital O with diaeresis',
				'symbol': '&#214',
				'keywords': ['o', 'oe', 'diaeresis']
			},
			{
				'label': 'Capital O with stroke',
				'symbol': '&#216',
				'keywords': ['o', 'stroke']
			},
			{
				'label': 'Capital OE',
				'symbol': '&#338',
				'keywords': ['oe', 'ligature']
			},
			{
				'label': 'Capital S with Caron',
				'symbol': '&#352',
				'keywords': ['s', 'caron']
			},
			{
				'label': 'Capital U with grave',
				'symbol': '&#217',
				'keywords': ['u', 'grave']
			},
			{
				'label': 'Capital U with acute',
				'symbol': '&#218',
				'keywords': ['u', 'acute']
			},
			{
				'label': 'Capital U with circumflex',
				'symbol': '&#219',
				'keywords': ['u', 'circumflex']
			},
			{
				'label': 'Capital U with diaeresis',
				'symbol': '&#220',
				'keywords': ['u', 'diaeresis']
			},
			{
				'label': 'Capital Y with acute',
				'symbol': '&#221',
				'keywords': ['y', 'acute']
			},
			{
				'label': 'Capital Y with diaeresis',
				'symbol': '&#376',
				'keywords': ['y', 'diaeresis']
			},
			{
				'label': 'Thorn',
				'symbol': '&#222',
				'keywords': ['thorn']
			},
			{
				'label': 'Small a with grave',
				'symbol': '&#224',
				'keywords': ['a', 'grave']
			},
			{
				'label': 'Small a with acute',
				'symbol': '&#225',
				'keywords': ['a', 'acute']
			},
			{
				'label': 'Small a with circumflex',
				'symbol': '&#226',
				'keywords': ['a', 'circumflex']
			},
			{
				'label': 'Small a with tilde',
				'symbol': '&#227',
				'keywords': ['a', 'tilde']
			},
			{
				'label': 'Small a with diaeresis',
				'symbol': '&#228',
				'keywords': ['a', 'ae', 'diaeresis']
			},
			{
				'label': 'Small a with ring',
				'symbol': '&#229',
				'keywords': ['a', 'ring']
			},
			{
				'label': 'Small ae',
				'symbol': '&#230',
				'keywords': ['ae', 'ligature']
			},
			{
				'label': 'Small c with cedilla',
				'symbol': '&#231',
				'keywords': ['c', 'cedilla']
			},
			{
				'label': 'Small e with grave',
				'symbol': '&#232',
				'keywords': ['e', 'grave']
			},
			{
				'label': 'Small e with acute',
				'symbol': '&#233',
				'keywords': ['e', 'acute']
			},
			{
				'label': 'Small e with circumflex',
				'symbol': '&#234',
				'keywords': ['e', 'circumflex']
			},
			{
				'label': 'Small e with diaeresis',
				'symbol': '&#235',
				'keywords': ['e', 'diaeresis']
			},
			{
				'label': 'Small i with grave',
				'symbol': '&#236',
				'keywords': ['i', 'grave']
			},
			{
				'label': 'Small i with acute',
				'symbol': '&#237',
				'keywords': ['i', 'acute']
			},
			{
				'label': 'Small i with circumflex',
				'symbol': '&#238',
				'keywords': ['i', 'circumflex']
			},
			{
				'label': 'Small i with diaeresis',
				'symbol': '&#239',
				'keywords': ['i', 'diaeresis']
			},
			{
				'label': 'Small eth',
				'symbol': '&#240',
				'keywords': ['eth']
			},
			{
				'label': 'Small n with tilde',
				'symbol': '&#241',
				'keywords': ['n', 'tilde']
			},
			{
				'label': 'Small o with grave',
				'symbol': '&#242',
				'keywords': ['o', 'grave']
			},
			{
				'label': 'Small o with acute',
				'symbol': '&#243',
				'keywords': ['o', 'acute']
			},
			{
				'label': 'Small o with circumflex',
				'symbol': '&#244',
				'keywords': ['o', 'circumflex']
			},
			{
				'label': 'Small o with tilde',
				'symbol': '&#245',
				'keywords': ['o', 'tilde']
			},
			{
				'label': 'Small o with diaeresis',
				'symbol': '&#246',
				'keywords': ['o', 'oe', 'diaeresis']
			},
			{
				'label': 'Small o with stroke',
				'symbol': '&#248',
				'keywords': ['o', 'stroke']
			},
			{
				'label': 'Small oe',
				'symbol': '&#339',
				'keywords': ['oe', 'ligature']
			},
			{
				'label': 'Small s with caron',
				'symbol': '&#353',
				'keywords': ['s', 'caron']
			},
			{
				'label': 'Small u with grave',
				'symbol': '&#249',
				'keywords': ['u', 'grave']
			},
			{
				'label': 'Small u with acute',
				'symbol': '&#250',
				'keywords': ['u', 'acute']
			},
			{
				'label': 'Small u with circumflex',
				'symbol': '&#251',
				'keywords': ['u', 'circumflex']
			},
			{
				'label': 'Small u with diaeresis',
				'symbol': '&#252',
				'keywords': ['u', 'ue', 'diaeresis']
			},
			{
				'label': 'Small y with acute',
				'symbol': '&#253',
				'keywords': ['y', 'acute']
			},
			{
				'label': 'Small thorn',
				'symbol': '&#254',
				'keywords': ['thorn']
			},
			{
				'label': 'Small y with diaeresis',
				'symbol': '&#255',
				'keywords': ['y', 'diaeresis']
			},
			{
				'label': 'Capital Alpha',
				'symbol': '&#913',
				'keywords': ['alpha']
			},
			{
				'label': 'Capital Beta',
				'symbol': '&#914',
				'keywords': ['beta']
			},
			{
				'label': 'Capital Gamma',
				'symbol': '&#915',
				'keywords': ['gamma']
			},
			{
				'label': 'Capital Delta',
				'symbol': '&#916',
				'keywords': ['delta']
			},
			{
				'label': 'Capital Epsilon',
				'symbol': '&#917',
				'keywords': ['epsilon']
			},
			{
				'label': 'Capital Zeta',
				'symbol': '&#918',
				'keywords': ['zeta']
			},
			{
				'label': 'Capital Eta',
				'symbol': '&#919',
				'keywords': ['eta']
			},
			{
				'label': 'Capital Theta',
				'symbol': '&#920',
				'keywords': ['theta']
			},
			{
				'label': 'Capital Iota',
				'symbol': '&#921',
				'keywords': ['iota']
			},
			{
				'label': 'Capital Kappa',
				'symbol': '&#922',
				'keywords': ['kappa']
			},
			{
				'label': 'Capital Lamda',
				'symbol': '&#923',
				'keywords': ['lamda']
			},
			{
				'label': 'Capital Mu',
				'symbol': '&#924',
				'keywords': ['mu']
			},
			{
				'label': 'Capital Nu',
				'symbol': '&#925',
				'keywords': ['nu']
			},
			{
				'label': 'Capital Xi',
				'symbol': '&#926',
				'keywords': ['xi']
			},
			{
				'label': 'Capital Omicron',
				'symbol': '&#927',
				'keywords': ['omikron']
			},
			{
				'label': 'Capital Pi',
				'symbol': '&#928',
				'keywords': ['pi']
			},
			{
				'label': 'Capital Rho',
				'symbol': '&#929',
				'keywords': ['rho']
			},
			{
				'label': 'Capital Sigma',
				'symbol': '&#931',
				'keywords': ['sigma']
			},
			{
				'label': 'Capital Tau',
				'symbol': '&#932',
				'keywords': ['tau']
			},
			{
				'label': 'Capital Upsilon',
				'symbol': '&#933',
				'keywords': ['upsilon']
			},
			{
				'label': 'Capital Phi',
				'symbol': '&#934',
				'keywords': ['phi']
			},
			{
				'label': 'Capital Chi',
				'symbol': '&#935',
				'keywords': ['chi']
			},
			{
				'label': 'Capital Psi',
				'symbol': '&#936',
				'keywords': ['psi']
			},
			{
				'label': 'Capital Omega',
				'symbol': '&#937',
				'keywords': ['omega']
			},
			{
				'label': 'Small alpha',
				'symbol': '&#945',
				'keywords': ['alpha']
			},
			{
				'label': 'Small beta',
				'symbol': '&#946',
				'keywords': ['beta']
			},
			{
				'label': 'Small gamma',
				'symbol': '&#947',
				'keywords': ['gamma']
			},
			{
				'label': 'Small delta',
				'symbol': '&#948',
				'keywords': ['delta']
			},
			{
				'label': 'Small epsilon',
				'symbol': '&#949',
				'keywords': ['epsilon']
			},
			{
				'label': 'Small zeta',
				'symbol': '&#950',
				'keywords': ['zeta']
			},
			{
				'label': 'Small eta',
				'symbol': '&#951',
				'keywords': ['eta']
			},
			{
				'label': 'Small theta',
				'symbol': '&#952',
				'keywords': ['theta']
			},
			{
				'label': 'Small iota',
				'symbol': '&#953',
				'keywords': ['iota']
			},
			{
				'label': 'Small kappa',
				'symbol': '&#954',
				'keywords': ['kappa']
			},
			{
				'label': 'Small lamda',
				'symbol': '&#955',
				'keywords': ['lamda']
			},
			{
				'label': 'Small mu',
				'symbol': '&#956',
				'keywords': ['mu']
			},
			{
				'label': 'Small nu',
				'symbol': '&#957',
				'keywords': ['nu']
			},
			{
				'label': 'Small xi',
				'symbol': '&#958',
				'keywords': ['xi']
			},
			{
				'label': 'Small omicron',
				'symbol': '&#959',
				'keywords': ['omicron']
			},
			{
				'label': 'Small pi',
				'symbol': '&#960',
				'keywords': ['pi']
			},
			{
				'label': 'Small rho',
				'symbol': '&#961',
				'keywords': ['rho']
			},
			{
				'label': 'Small final sigma',
				'symbol': '&#962',
				'keywords': ['final', 'sigma']
			},
			{
				'label': 'Small sigma',
				'symbol': '&#963',
				'keywords': ['sigma']
			},
			{
				'label': 'Small tau',
				'symbol': '&#964',
				'keywords': ['tau']
			},
			{
				'label': 'Small upsilon',
				'symbol': '&#965',
				'keywords': ['upsilon']
			},
			{
				'label': 'Small phi',
				'symbol': '&#966',
				'keywords': ['phi']
			},
			{
				'label': 'Small chi',
				'symbol': '&#967',
				'keywords': ['chi']
			},
			{
				'label': 'Small psi',
				'symbol': '&#968',
				'keywords': ['psi']
			},
			{
				'label': 'Small omega',
				'symbol': '&#969',
				'keywords': ['omega']
			},
			{
				'label': 'Alef',
				'symbol': '&#8501',
				'keywords': ['alef']
			},
			{
				'label': 'Pi symbol',
				'symbol': '&#982',
				'keywords': ['pi']
			},
			{
				'label': 'Black-Letter Capital R',
				'symbol': '&#8476',
				'keywords': ['r', 'black']
			},
			{
				'label': 'Theta symbol',
				'symbol': '&#977',
				'keywords': ['theta']
			},
			{
				'label': 'Upsilon symbol with hook',
				'symbol': '&#978',
				'keywords': ['upsilon', 'hook']
			},
			{
				'label': 'Script capital P',
				'symbol': '&#8472',
				'keywords': ['p', 'script']
			},
			{
				'label': 'Black-Letter capital I',
				'symbol': '&#8465',
				'keywords': ['i', 'black']
			},
			{
				'label': 'Leftwards arrow',
				'symbol': '&#8592',
				'keywords': ['left', 'arrow']
			},
			{
				'label': 'Upwards arrow',
				'symbol': '&#8593',
				'keywords': ['up', 'arrow']
			},
			{
				'label': 'Rightwards arrow',
				'symbol': '&#8594',
				'keywords': ['right', 'arrow']
			},
			{
				'label': 'Downwards arrow',
				'symbol': '&#8595',
				'keywords': ['down', 'arrow']
			},
			{
				'label': 'Left right arrow',
				'symbol': '&#8596',
				'keywords': ['left', 'right', 'arrow']
			},
			{
				'label': 'Downwards arrow with leftward corner',
				'symbol': '&#8629',
				'keywords': ['down', 'left', 'corner', 'arrow']
			},
			{
				'label': 'Leftwards double arrow',
				'symbol': '&#8656',
				'keywords': ['left', 'double', 'arrow']
			},
			{
				'label': 'Upwards double arrow',
				'symbol': '&#8657',
				'keywords': ['up', 'double', 'arrow']
			},
			{
				'label': 'Rightwards duble arrow',
				'symbol': '&#8658',
				'keywords': ['right', 'double', 'arrow']
			},
			{
				'label': 'Downwards double arrow',
				'symbol': '&#8659',
				'keywords': ['down', 'double', 'arrow']
			},
			{
				'label': 'Left right double arrow',
				'symbol': '&#8660',
				'keywords': ['left', 'right', 'double', 'arrow']
			},
			{
				'label': 'Therefore',
				'symbol': '&#8756',
				'keywords': ['therefore', 'math']
			},
			{
				'label': 'Subset of',
				'symbol': '&#8834',
				'keywords': ['subset', 'set', 'math', 'compare']
			},
			{
				'label': 'Superset of',
				'symbol': '&#8835',
				'keywords': ['superset', 'set', 'math', 'compare']
			},
			{
				'label': 'Not subset of',
				'symbol': '&#8836',
				'keywords': ['not', 'subset', 'set', 'math', 'compare']
			},
			{
				'label': 'Subset of or equal to',
				'symbol': '&#8838',
				'keywords': ['subset', 'set', 'equal', 'math', 'compare']
			},
			{
				'label': 'Superset of or equal to',
				'symbol': '&#8839',
				'keywords': ['superset', 'set', 'equal', 'math', 'compare']
			},
			{
				'label': 'Circled plus',
				'symbol': '&#8853',
				'keywords': ['plus', 'circle', 'math']
			},
			{
				'label': 'Circled times',
				'symbol': '&#8855',
				'keywords': ['times', 'multiplication', 'circle', 'math']
			},
			{
				'label': 'Up tack',
				'symbol': '&#8869',
				'keywords': ['up', 'tack', 'bottom', 'bot', 'logic', 'math']
			},
			{
				'label': 'Dot',
				'symbol': '&#8901',
				'keywords': ['dot', 'math']
			},
			{
				'label': 'Left ceiling',
				'symbol': '&#8968',
				'keywords': ['left', 'ceiling', 'ceil', 'math']
			},
			{
				'label': 'Right ceiling',
				'symbol': '&#8969',
				'keywords': ['right', 'ceiling', 'ceil', 'math']
			},
			{
				'label': 'Left floor',
				'symbol': '&#8970',
				'keywords': ['left', 'floor', 'math']
			},
			{
				'label': 'Right floor',
				'symbol': '&#8971',
				'keywords': ['right', 'flot', 'math']
			},
			{
				'label': 'Left angle bracket',
				'symbol': '&#9001',
				'keywords': ['left', 'angle', 'bracket', 'math']
			},
			{
				'label': 'Right angle bracket',
				'symbol': '&#9002',
				'keywords': ['right', 'angle', 'bracket', 'math']
			},
			{
				'label': 'Lozenge',
				'symbol': '&#9674',
				'keywords': ['lozenge']
			},
			{
				'label': 'Spade',
				'symbol': '&#9824',
				'keywords': ['spade', 'suit']
			},
			{
				'label': 'Club',
				'symbol': '&#9827',
				'keywords': ['club', 'suit']
			},
			{
				'label': 'Heart',
				'symbol': '&#9829',
				'keywords': ['heart', 'suit']
			},
			{
				'label': 'Diamond',
				'symbol': '&#9830',
				'keywords': ['diamond', 'suit']
			},
		],

		/** @type {ContextButton<SymbolGridItem>} */
		_pickerButton: null,

		init: function () {
			DynamicForm.componentFactoryRegistry['symbol-grid'] = createSymbolGridFromConfig;
			DynamicForm.componentFactoryRegistry['symbol-search-grid'] = createSymbolSearchGridFromConfig;

			CharacterPickerPlugin._pickerButton = Ui.adopt('characterPicker', ContextButton, {
				tooltip: i18n.t('button.addcharacter.tooltip'),
				icon: Icons.CHARACTER_PICKER,

				contextType: 'dropdown',
				context: function () {
					// Can't open/insert a character without an editable to place it in
					if (Aloha.activeEditable == null || Aloha.activeEditable.obj == null) {
						return null;
					}

					rangeAtOpen = Aloha.Selection.rangeObject;

					return {
						type: 'symbol-search-grid',
						options: {
							symbols: CharacterPickerPlugin.getNormalizedSymbols(),
						},
					}
				},

				contextResolve: function (symbol) {
					onSelectCharacter(symbol);
				},
			});

			// Set the button visible if it's enabled via the config
			PubSub.sub('aloha.editable.activated', function (message) {
				var editable = message.editable;
				CharacterPickerPlugin.checkVisibility(editable);
			});

			// Reset and hide the button when leaving an editable
			PubSub.sub('aloha.editable.deactivated', function () {
				CharacterPickerPlugin._pickerButton.hide();
			});

			CharacterPickerPlugin.checkVisibility(Aloha.activeEditable);
		},

		checkVisibility: function (editable) {
			// If we have no editable, then we don't want to show the button
			if (editable == null) {
				CharacterPickerPlugin._pickerButton.hide();
				return;
			}

			var symbols = CharacterPickerPlugin.getNormalizedSymbols();

			if (symbols.length > 0) {
				CharacterPickerPlugin._pickerButton.show();
			} else {
				CharacterPickerPlugin._pickerButton.hide();
			}
		},

		/**
		 * 
		 * @returns {Array.<string>}
		 */
		getNormalizedSymbols: function () {
			if (!Aloha.activeEditable || !Aloha.activeEditable.obj) {
				return [];
			}

			var symbols = [];
			var config = CharacterPickerPlugin.getEditableConfig(Aloha.activeEditable.obj);

			if (typeof config === 'string') {
				symbols = config.split(' ').map(function (symbol) {
					return {
						label: symbol,
						symbol: symbol,
					};
				});
			} else if (Array.isArray(config)) {
				symbols = config;
			}

			return symbols;
		},
	};

	CharacterPickerPlugin = Plugin.create('characterpicker', CharacterPickerPlugin);

	return CharacterPickerPlugin;
});
