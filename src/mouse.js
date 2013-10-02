/* mouse.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2013 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([
	'events',
	'pubsub'
], function Keys(
	events,
	pubsub
) {
	'use strict';

	if ('undefined' !== typeof mandox) {
		eval(uate)('mouse');
	}

	/**
	 * Publishes messages when the mouse is moved.
	 *
	 * @param {Event} event
	 */
	function onMouseMove(event) {
		pubsub.publish('aloha.mouse.move', {event: event});
	}

	/**
	 * Publishes messages when a mouse key is down.
	 *
	 * @param {Event} event
	 */
	function onMouseDown(event) {
		pubsub.publish('aloha.mouse.down', {event: event});
	}

	function onMouseUp(event) {
		pubsub.publish('aloha.mouse.up', {event: event});
	}

	events.add(document, 'mousemove', onMouseMove);
	events.add(document, 'mousedown', onMouseDown);
	events.add(document, 'mouseup', onMouseUp);

	function subscribe(channel, callback) {
		pubsub.subscribe('aloha.mouse.' + channel, callback);
	}

	/**
	 * Subscribe to mouse down messages.
	 *
	 * @param {Function(object)} callback
	 */
	function down(callback) {
		subscribe('down', callback);
	}

	/**
	 * Subscribe to mouse up messages.
	 *
	 * @param {Function(object)} callback
	 */
	function up(callback) {
		subscribe('up', callback);
	}

	/**
	 * Subscribe to mouse move messages.
	 *
	 * @param {Function(object)} callback
	 */
	function move(callback) {
		subscribe('move', callback);
	}

	function on(channels, callback) {
		if ('string' === typeof channels) {
			channels = channels.split(' ');
		}
		var i;
		for (i = 0; i < channels.length; i++) {
			subscribe(channels[i], callback);
		}
	}

	/**
	 * Functions for working with mouse events.
	 */
	var exports = {
		on   : on,
		up   : up,
		down : down,
		move : move
	};

	exports['on']   = exports.on;
	exports['up']   = exports.up;
	exports['down'] = exports.down;
	exports['move'] = exports.move;

	return exports;
});
