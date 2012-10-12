/*!
 * Aloha Editor
 * Author & Copyright (c) 2012 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 *
 * @overview Provides methods to broker publish/subscribe facilities.
 */
define('PubSub', [], function () {
	'use strict';

	/**
	 * A hash of channel names mapped to an array of ids of subscriptions that
	 * are listening on that channel.
	 *
	 * @type {Object<String, Array.<Number>>}
	 */
	var channels = {};

	/**
	 * A hash of subscription tuples (channel, callback), mapped against unique
	 * ids assigned to each subscription.
	 * As subscriptions are removed from this object via `unsub()' this object
	 * will become a sparse array.
	 *
	 * @type {Object<Number, Object>}
	 */
	var subscriptions = {};

	/**
	 * The last used subscription id.  This values is only used and modified in
	 * `sub().'
	 *
	 * @type {number}
	 */
	var sid = 0;

	/**
	 * Returns the channel to which a subscription matching the given sid is
	 * listening on.
	 *
	 * @param {Number} sid Id of subscription.
	 * @return {Array.<Object>} sid Id of subscription.
	 */
	function getSubscriptionChannel(sid) {
		return subscriptions[sid] && channels[subscriptions[sid].channel];
	}

	/**
	 * Publishes a message `message' on the given channel.
	 * All callbacks that have sub()scribed to listen on this channel will be
	 * invoked and receive `message' as their only argument.
	 *
	 * @private
	 * @param {String} channel Name of channel to publish the message on.
	 * @param {*} message Variable to pass to all callbacks listening on the
	 *                    given channel.
	 * @return {Number} The number of subscribed callbacks that were invoked.
	 */
	function pub(channel, message) {
		if (!channels[channel]) {
			return 0;
		}

		if (!message) {
			message = {};
		} else if (typeof message !== 'object') {
			message = {
				data: message
			};
		}

		message.channel = channel;

		// Clone a immutable snapshot of the subscription ids that we can
		// safetly iterate over.
		var sids = channels[channel].slice();

		// NB: It is necessary to read the size of the `sids' array on each
		// iteration, in case the size changes (via unsubscription) between
		// iterations.
		var i;
		for (i = 0; i < sids.length; ++i) {
			subscriptions[sids[i]].callback(message);
		}

		return i;
	}

	var PubSub = {

		/**
		 * Subscribes a callback function to a channel.  Whenever this channel
		 * publishes, this function will be invoked.  The return value is an id
		 * which identifies this subscription (a channel, and callback tuple).
		 * This id can be used to unsubscribe this subscription from the given
		 * channel.
		 *
		 * @param {String} channel Name of channel to listen on.
		 * @param {Function(Object)} callback Function to be invoked when
		 *                                    messages are published on the
		 *                                    given channel.
		 * @return {Number} Positive integer representing the sid of this
		 *                  subscription, that can be used with unsub() if
		 *                  subscription succeeds.  Otherwise the return value
		 *                  is -1;
		 */
		sub: function (channel, callback) {
			if (typeof callback !== 'function') {
				return -1;
			}

			var subscriptionIds = channels[channel];

			if (!subscriptionIds) {
				subscriptionIds = channels[channel] = [];
			}

			subscriptionIds.push(++sid);
			subscriptions[sid] = {
				channel  : channel,
				callback : callback
			};

			return sid;
		},

		/**
		 * Unsubscribes callback using an sid which was returned by sub() when
		 * the callback was subscribed.  Returns true if a subscription for
		 * this sid was found and removed, otherwise returns false.
		 *
		 * @param {Number} sid Id of subscription.
		 * @return {Boolean} True if a a subscription matching this sid was
		 *                   removed.
		 */
		unsub: function (sid) {
			if (-1 === sid || !subscriptions[sid]) {
				return false;
			}

			var subscriptionIds = getSubscriptionChannel(sid);

			// assert(typeof subscriptionIds === 'array')

			delete subscriptions[sid];
			var j = subscriptionIds.length;

			while (j) {
				if (subscriptionIds[--j] === sid) {
					subscriptionIds.splice(j, 1);
					return true;
				}
			}

			return false;
		},

		/**
		 * Publishes a message `message' on all channels that can be derived
		 * from the given channel name.
		 *
		 * @param {String} channel Name of channel to publish the message on.
		 * @param {*} message Variable to pass to all callbacks listening on
		 *                    the given channel.
		 * @return {Number} The number of subscribed callbacks that were
		 *                  invoked.
		 */
		pub: function (channel, message) {
			var segments = channel.split('.');
			var i;
			var len = segments.length;
			var channelName = '';
			var tally = 0;

			for (i = 0; i < len; ++i) {
				channelName += (0 === i ? '' : '.') + segments[i];
				tally += pub(channelName, message);
			}

			return tally;
		}

	};

	return PubSub;
});
