/**
 * metaview.js is part of Aloha Editor project http://www.alohaeditor.org
 *
 * Aloha Editor ● JavaScript Content Editing Library
 * Copyright (c) 2010-2015 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://www.alohaeditor.org/docs/contributing.html
 *
 * @reference: cssminimizer.com
 * @namespace metaview
 */
define(['dom'], function (Dom) {
	'use strict';

	var textlevel = ['a', 'b', 'i', 'u', 's', 'span', 'code', 'pre', 'sup', 'sub'];
	var sectioning = ['p', 'div', 'table', 'ol', 'ul'];
	var heading = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

	function join(list, prefix, suffix) {
		prefix = prefix || '';
		suffix = suffix || '';
		return list.map(function (item) { return prefix + item + suffix; }).join(',');
	}

	var CSS

		// outlines
		= '.✪{outline:5px solid #fce05e;}'
	    + '.✪ *{border:1px solid rgba(0,0,0,0.1)}'
		+ join(sectioning.concat(heading), '.✪ ')
		+ '{border-style:dotted;border-width:2px}'
		+ '.✪ b    {border-color:#f47d43}'
		+ '.✪ i    {border-color:#82b5e0}'
		+ '.✪ u    {border-color:#bb94b7}'
		+ '.✪ s    {border-color:#3b94b7}'
		+ '.✪ span {border-color:#bb94b7}'
		+ '.✪ code {border-color:#999999}'
		+ '.✪ pre  {border-color:#999999}'
		+ '.✪ ul   {border-color:#91c9cf}'
		+ '.✪ ol   {border-color:#91c9cf}'
		+ '.✪ p    {border-color:#bdd74b}'
		+ '.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6 {border-color:#f47d43}'
		+ '.✪ br,.✪ br:after{content:"\\A↵";font-weight:700;font-style:normal}'

		// tagnames
	    + '.✪✪ *{position:relative}'
	    + '.✪✪ *::before{position:absolute;top:-2px;left:-2px;line-height:8px;'
		+ 'font-size:8px;font-weight:bold;font-style:normal;'
		+ 'letter-spacing:0.5px;background:#fff;color:#111;opacity:0.5}'
		+ '.✪✪ td::before{content:"TD"}'
		+ '.✪✪ th::before{content:"TH"}'
		+ '.✪✪ a::before{content:"A"}'
		+ '.✪✪ b::before{content:"B"}'
		+ '.✪✪ i::before{content:"I"}'
		+ '.✪✪ u::before{content:"U"}'
		+ '.✪✪ s::before{content:"S"}'
		+ '.✪✪ p::before{content:"P"}'
		+ '.✪✪ ul::before{content:"UL"}'
		+ '.✪✪ ol::before{content:"OL"}'
		+ '.✪✪ li::before{content:"LI"}'
		+ '.✪✪ h1::before{content:"H1"}'
		+ '.✪✪ h2::before{content:"H2"}'
		+ '.✪✪ h3::before{content:"H3"}'
		+ '.✪✪ h4::before{content:"H4"}'
		+ '.✪✪ h5::before{content:"H5"}'
		+ '.✪✪ h6::before{content:"H6"}'
		+ '.✪✪ div::before{content:"DIV"}'
		+ '.✪✪ sup::before{content:"SUP"}'
		+ '.✪✪ sub::before{content:"SUB"}'
		+ '.✪✪ pre::before{content:"PRE"}'
		+ '.✪✪ span::before{content:"SPAN"}'
		+ '.✪✪ code::before{content:"CODE"}'

		// padding
		+ '.✪✪✪{padding:10px}'
		+ '.✪✪✪ *{padding:2px 4px;margin:2px}'
		+ join(textlevel, '.✪✪✪ ') + '{display:inline-block}';

	/**
	 * Insertes the necessary styles into the given document head.
	 *
	 * @private
	 * @param {!Document} doc
	 */
	function insertStyle(doc) {
		var metaview = doc.createElement('style');
		Dom.setAttr(metaview, 'id', 'aloha-metaview');
		Dom.append(metaview, doc['head']);
		Dom.append(doc.createTextNode(CSS), metaview);
	}

	var OUTLINE_CLASS = '✪';
	var TAGNAME_CLASS = '✪✪';
	var PADDING_CLASS = '✪✪✪';

	/**
	 * Toggles metaview mode.
	 *
	 * @usage:
	 * aloha.metaview.toggle(editable, {
	 *		outline: true,
	 *		tagname: true,
	 *		padding: true
	 * });
	 *
	 * @param {!Element} editable
	 * @param {Object=}  opts
	 * @memberOf metaview
	 */
	function toggle(editable, opts) {
		if (!editable.ownerDocument.querySelector('style#aloha-metaview')) {
			insertStyle(editable.ownerDocument);
		}
		opts = opts || {};
		if (opts['outline']) {
			Dom.addClass(editable, OUTLINE_CLASS);
		} else {
			Dom.removeClass(editable, OUTLINE_CLASS);
		}
		if (opts['tagname']) {
			Dom.addClass(editable, TAGNAME_CLASS);
		} else {
			Dom.removeClass(editable, TAGNAME_CLASS);
		}
		if (opts['padding']) {
			Dom.addClass(editable, PADDING_CLASS);
		} else {
			Dom.removeClass(editable, PADDING_CLASS);
		}
	}

	return { toggle: toggle };
});
