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

/**
 * Returns a textual representation of the message
 * @return textual representation of the message
 * @hide
 */
GENTICS.Aloha.Message.prototype.toString = function () {
  return this.type + ": " + this.message;
};

/**
 * This is the message line
 * @hide
 */
GENTICS.Aloha.MessageLine = function () {
  this.messages = new Array();
};

/**
 * Add a new message to the message line
 * @param message message to add
 * @return void
 * @hide
 */
GENTICS.Aloha.MessageLine.prototype.add = function(message) {
  // dummy implementation to add a message
  this.messages[this.messages.length] = message;
  while(this.messages.length > 4) {
	this.messages.shift();
  }
  jQuery("#gtx_aloha_messageline").html("");
  for ( var i = 0; i < this.messages.length; i++) {
	  jQuery("#gtx_aloha_messageline").append((this.messages[i].toString() + "<br/>"));
  }
};

/**
 * Message Line Object
 * @hide
 */
GENTICS.Aloha.MessageLine = new GENTICS.Aloha.MessageLine();
