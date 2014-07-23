/**
 * metaview.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define(['dom'], function (Dom) {
	'use strict';

	// cssminimizer.com
	var METAVIEW_OUTLINES
		= '.✪{outline:5px solid #fce05e;}'
		+ '.✪ td,.✪ th,.✪ b,.✪ i,.✪ u,.✪ p,.✪ ul,.✪ ol,.✪ li,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div{border:1px solid rgba(0,0,0,0.1)}'
		+ '.✪ p,.✪ ul,.✪ ol,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div{border-width:2px}'
		+ '.✪ b{border-color:#f47d43}'
		+ '.✪ i{border-color:#82b5e0}'
		+ '.✪ u{border-color:#bb94b7}'
		+ '.✪ span{border-color:#bb94b7}'
		+ '.✪ ul,.✪ ol{border-color:#91c9cf}'
		+ '.✪ p{border-color:#bdd74b}'
		+ '.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6{border-color:#f47d43}';

	var METAVIEW_TAGNAMES
		= '.✪ td,.✪ th,.✪ b,.✪ i,.✪ u,.✪ p,.✪ ul,.✪ ol,.✪ li,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div,.✪ span{position:relative}'
		+ '.✪ td::before,.✪ th::before,.✪ b::before,.✪ i::before,.✪ u::before,.✪ p::before,.✪ ul::before,.✪ ol::before,.✪ li::before,.✪ h1::before,.✪ h2::before,.✪ h3::before,.✪ h4::before,.✪ h5::before,.✪ h6::before,.✪ div::before,.✪ span::before{position:absolute;top:-2px;left:-2px;line-height:8px;font-size:8px;font-weight:bold;font-style:normal;letter-spacing:0.5px;background:#fff;color:#111}.✪ td::before{content:"TD"}.✪ th::before{content:"TH"}.✪ b::before{content:"B"}.✪ i::before{content:"I"}.✪ u::before{content:"U"}.✪ p::before{content:"P"}.✪ ul::before{content:"UL"}.✪ ol::before{content:"OL"}.✪ li::before{content:"LI"}.✪ h1::before{content:"H1"}.✪ h2::before{content:"H2"}.✪ h3::before{content:"H3"}.✪ h4::before{content:"H4"}.✪ h5::before{content:"H5"}.✪ h6::before{content:"H6"}.✪ div::before{content:"DIV"}.✪ span::before{content:"SPAN"}';

	var METAVIEW_PADDING
		= '.✪{padding:10px}'
		+ '.✪ td,.✪ th,.✪ b,.✪ i,.✪ u,.✪ p,.✪ ul,.✪ ol,.✪ li,.✪ h1,.✪ h2,.✪ h3,.✪ h4,.✪ h5,.✪ h6,.✪ div,.✪ span{padding:2px 4px;margin:2px;}';

	/**
	 * Toggles metaview mode.
	 *
	 * @param {Element} editable
	 * @param {Object}  opts
	 */
	function toggle(editable, opts) {
		var doc = editable.ownerDocument;
		var metaview = doc.querySelector('style#metaview');
		if (!metaview) {
			metaview = doc.createElement('style');
			Dom.setAttr(metaview, 'id', 'metaview');
			Dom.append(metaview, doc['head']);
		}
		opts = opts || {};
		var css = (opts['outline'] ? METAVIEW_OUTLINES : '')
		        + (opts['tagname'] ? METAVIEW_TAGNAMES : '')
		        + (opts['padding'] ? METAVIEW_PADDING  : '');
		metaview.innerHTML = '';
		Dom.append(doc.createTextNode(css), metaview);
	}

	return { toggle: toggle };
});
