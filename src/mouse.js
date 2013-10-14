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
	 * Publishes messages when a mouse button is up.
	 *
	 * @param {Event} event
	 */
	function onUp(event) {
		pubsub.publish('aloha.mouse.up', {event: event});
	}

	/**
	 * Publishes messages when a mouse button is down.
	 *
	 * @param {Event} event
	 */
	function onDown(event) {
		pubsub.publish('aloha.mouse.down', {event: event});
	}

	/**
	 * Publishes messages when the mouse is moved.
	 *
	 * @param {Event} event
	 */
	function onMove(event) {
		pubsub.publish('aloha.mouse.move', {event: event});
	}

	/**
	 * Subscript to mouse interaction messages.
	 *
	 * @param {String} channel
	 * @param {Function(Object)}
	 */
	function subscribe(channel, callback) {
		pubsub.subscribe('aloha.mouse.' + channel, callback);
	}

	/**
	 * Subscribe to mouse up messages.
	 *
	 * @param {Function(Object)} callback
	 */
	function up(callback) {
		subscribe('up', callback);
	}

	/**
	 * Subscribe to mouse down messages.
	 *
	 * @param {Function(Object)} callback
	 */
	function down(callback) {
		subscribe('down', callback);
	}

	/**
	 * Subscribe to mouse move messages.
	 *
	 * @param {Function(Object)} callback
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
		move : move,
		onUp   : onUp,
		onDown : onDown,
		onMove : onMove
	};

	exports['on']     = exports.on;
	exports['up']     = exports.up;
	exports['down']   = exports.down;
	exports['move']   = exports.move;
	exports['onUp']   = exports.onUp;
	exports['onDown'] = exports.onDown;
	exports['onMove'] = exports.onMove;

	return exports;
});
