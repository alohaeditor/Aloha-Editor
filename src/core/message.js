/*!
*   This file is part of Aloha Editor
*   Author & Copyright (c) 2010 Gentics Software GmbH, aloha@gentics.com
*   Licensed unter the terms of http://www.aloha-editor.com/license.html
*//*
*	Aloha Editor is free software: you can redistribute it and/or modify
*   it under the terms of the GNU Affero General Public License as published by
*   the Free Software Foundation, either version 3 of the License, or
*   (at your option) any later version.*
*
*   Aloha Editor is distributed in the hope that it will be useful,
*   but WITHOUT ANY WARRANTY; without even the implied warranty of
*   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*   GNU Affero General Public License for more details.
*
*   You should have received a copy of the GNU Affero General Public License
*   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function(window, undefined) {
	var
		$ = jQuery = window.alohaQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

/**
 * Message Object
 * @namespace GENTICS.Aloha
 * @class Message
 * @constructor
 * @param {Object} data object which contains the parts of the message
 *		title: the title
 * 		text: the message text to be displayed
 * 		type: one of GENTICS.Aloha.Message.Type
 * 		callback: callback function, which will be triggered after the message was confirmed, closed or accepted
 */
GENTICS.Aloha.Message = function (data) {
	this.title = data.title;
	this.text = data.text;
	this.type = data.type;
	this.callback = data.callback;
};

/**
 * Message types enum. Contains all allowed types of messages
 * @property
 */
GENTICS.Aloha.Message.Type = {
// reserved for messages
//	SUCCESS : 'success',
//	INFO : 'info',
//	WARN : 'warn',
//	CRITICAL : 'critical',
	CONFIRM : 'confirm', // confirm dialog, like js confirm()
	ALERT : 'alert', // alert dialog like js alert()
	WAIT : 'wait' // wait dialog with loading bar. has to be hidden via GENTICS.Aloha.hideMessage()
};

GENTICS.Aloha.Message.prototype = {
	/**
	 * Returns a textual representation of the message
	 * @return textual representation of the message
	 * @hide
	 */
	toString: function () {
	  return this.type + ': ' + this.message;
	}
};

/**
 * This is the message line
 * @hide
 */
GENTICS.Aloha.MessageLine = function () {
  this.messages = [];
};

/**
 * Add a new message to the message line
 * @param message message to add
 * @return void
 * @hide
 */
GENTICS.Aloha.MessageLine.prototype = {
	add: function(message) {
		var messageline = '',
			messagesLength = this.messages.length;
		// dummy implementation to add a message
		this.messages[messagesLength] = message;
		while(messagesLength > 4) {
			this.messages.shift();
			--messagesLength;
		}

		for ( var i = 0; i < messagesLength; i++) {
			messageline += this.messages[i].toString() + '<br/>';
		}
		jQuery('#gtx_aloha_messageline').html(messageline);
	}
}

/**
 * Message Line Object
 * @hide
 */
GENTICS.Aloha.MessageLine = new GENTICS.Aloha.MessageLine();

})(window);
