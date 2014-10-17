/**
 * metaview.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 *
 * @reference: cssminimizer.com
 * @namespace metaview
 */
define(['dom'], function (Dom) {
	'use strict';

	var CSS

		// outlines
		= '.✪{outline:5px solid #fce05e;}'
		+ '.✪ td,.✪ th,.✪ b,.✪ i,.✪ u,.✪ p,.✪ ul,.✪ ol,.✪ li,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div,.✪ span{border:1px solid rgba(0,0,0,0.1)}'
		+ '.✪ p,.✪ ul,.✪ ol,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div{border-width:2px}'
		+ '.✪ b{border-color:#f47d43}'
		+ '.✪ i{border-color:#82b5e0}'
		+ '.✪ u{border-color:#bb94b7}'
		+ '.✪ span{border-color:#bb94b7}'
		+ '.✪ code{border-color:#999}'
		+ '.✪ pre{border-color:#999}'
		+ '.✪ ul,.✪ ol{border-color:#91c9cf}'
		+ '.✪ p{border-color:#bdd74b}'
		+ '.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6{border-color:#f47d43}'

		// tagnames
		+ '.✪✪ td,.✪✪ th,'
		+ '.✪✪ b,.✪✪ i,.✪✪ u,.✪✪ span,.✪✪ pre,.✪✪ code,'
		+ '.✪✪ ul,.✪✪ ol,.✪✪ li,'
		+ '.✪✪ h1,.✪✪ h2,.✪✪ h3,.✪✪ h4,.✪✪ h5,.✪✪ h6,'
		+ '.✪✪ p,.✪✪ div{position:relative}'
		+ ''
		+ '.✪✪ td::before,.✪✪ th::before,'
		+ '.✪✪ b::before,.✪✪ i::before,.✪✪ u::before,.✪✪ p::before,'
		+ '.✪✪ ul::before,.✪✪ ol::before,.✪✪ li::before,'
		+ '.✪✪ h1::before,.✪✪ h2::before,.✪✪ h3::before,.✪✪ h4::before,.✪✪ h5::before,.✪✪ h6::before,'
		+ '.✪✪ div::before,.✪✪ span::before,.✪✪ pre::before,'
		+ '.✪✪ code::before{position:absolute;top:-2px;left:-2px;line-height:8px;font-size:8px;font-weight:bold;font-style:normal;letter-spacing:0.5px;background:#fff;color:#111;opacity:0.5;}'
		+ '.✪✪ td::before{content:"TD"}'
		+ '.✪✪ th::before{content:"TH"}'
		+ '.✪✪ b::before{content:"B"}'
		+ '.✪✪ i::before{content:"I"}'
		+ '.✪✪ u::before{content:"U"}'
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
		+ '.✪✪ pre::before{content:"PRE"}'
		+ '.✪✪ span::before{content:"SPAN"}'
		+ '.✪✪ code::before{content:"CODE"}'

		// padding
		+ '.✪✪✪{padding:10px}'
		+ '.✪✪✪ td,.✪✪✪ th,.✪✪✪ b,.✪✪✪ i,.✪✪✪ u,.✪✪✪ p,.✪✪✪ /*xul,.✪✪✪ ol,.✪✪✪*/ li,.✪✪✪ h1,.✪✪✪ h2,.✪✪✪ h3,.✪✪✪ h4,.✪✪✪ h5,.✪✪✪ h6,.✪✪✪ div,.✪✪✪ span{padding:2px 4px;margin:2px;}';

	/**
	 * Insertes the necessary styles into the given document head.
	 *
	 * @private
	 * @param {!Document} doc
	 */
	function insertStyle(doc) {
		var metaview = doc.createElement('style');
		Dom.setAttr(metaview, 'id', 'metaview');
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
		if (!editable.ownerDocument.querySelector('style#metaview')) {
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
