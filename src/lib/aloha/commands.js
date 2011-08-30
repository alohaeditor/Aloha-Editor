/*!
* This file is part of Aloha Editor Project http://aloha-editor.org
* Copyright (c) 2010-2011 Gentics Software GmbH, aloha@gentics.com
* Contributors http://aloha-editor.org/contribution.php 
* Licensed unter the terms of http://www.aloha-editor.org/license.html
*//*
* Aloha Editor is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.*
*
* Aloha Editor is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <http://www.gnu.org/licenses/>.
*/
"use strict";
define( ['require', 'exports', 'aloha/selection'],
function( require, exports, Selection ) {

	// Implementation initially done by Aryeh Gregor.
	// http://aryeh.name/spec/editing/editing.html#commands
	var 
		commands = [],
		
//			Action: What the command does when executed via execCommand(). Every command defined
//			in this specification has an action defined for it in the relevant section. For example, 
//			the bold command's action generally makes the current selection bold, or removes bold if 
//			the selection is already bold. An editing toolbar might provide buttons that execute the
//			action for a command if clicked, or a script might run an action without user interaction
//			to achieve some particular effect.
//			
//			Indeterminate: A boolean value returned by queryCommandIndeterm(), depending on the
//			current state of the document. Generally, a command that has a state defined will be 
//			indeterminate if the state is true for part but not all of the current selection, and a
//			command that has a value defined will be indeterminate if different parts of the 
//			selection have different values. An editing toolbar might display a button or control
//			in a special way if the command is indeterminate, like showing a "bold" button as 
//			partially depressed, or leaving a font size selector blank instead of showing the font
//			size of the current selection. As a rule, a command can only be indeterminate if its
//			state is false, supposing it has a state.
//			
//			State: A boolean value returned by queryCommandState(), depending on the current state
//			of the document. The state of a command is true if it is already in effect, in some 
//			sense specific to the command. Most commands that have a state defined will take opposite
//			actions depending on whether the state is true or false, such as making the selection
//			bold if the state is false and removing bold if the state is true. Others will just 
//			have no effect if the state is true, like the justifyCenter command. Still others will 
//			have the same effect regardless, like the styleWithCss command. An editing toolbar might
//			display a button or control differently depending on the state and indeterminacy of the
//			command.
//			
//			Value: A string returned by queryCommandValue(), depending on the current state of the 
//			document. A command usually has a value instead of a state if the property it modifies 
//			can take more than two different values, like the foreColor command. If the command is 
//			indeterminate, its value is generally based on the start of the selection. Otherwise, 
//			in most cases the value holds true for the entire selection, but see the justifyCenter 
//			command and its three companions for an exception. An editing toolbar might display the
//			value of a command as selected in a drop-down or filled in in a text box, if the command
//			isn't indeterminate.
//			
//			Relevant CSS property: This is defined for certain inline formatting commands, and 
//			is used in algorithms specific to those commands. It is an implementation detail, and 
//			is not exposed to authors. If a command does not have a relevant CSS property 
//			specified, it defaults to null.

		registerCommand = function( name, command ) {
			
			commands[name.toLowerCase()] = command;
		},
	
		execCommand = function( command, showUi, value, range ) {
			
			// "All of these methods must treat their command argument ASCII
			// case-insensitively."
			command = command.toLowerCase();

			// "If only one argument was provided, let show UI be false."
			// If range was passed, I can't actually detect how many args were passed
			if ( arguments.length == 1
			|| ( arguments.length >=4 && typeof showUi === 'undefined' )) {
				showUi = false;
			}
			
			// "If only one or two arguments were provided, let value be the empty
			// string."
			if (arguments.length <= 2
			|| (arguments.length >=4 && typeof value === 'undefined' )) {
				value = "";
			}
			
			// "If command is not supported, raise a NOT_SUPPORTED_ERR exception."
			// We can't throw a real one, but a string will do for our purposes.
			if (!(command in commands)) {
				throw "NOT_SUPPORTED_ERR";
			}

			// "If command has no action, raise an INVALID_ACCESS_ERR exception."
			if (!('action' in commands[command])) {
				throw "INVALID_ACCESS_ERR";
			}

			if (!queryCommandEnabled(command)) {
				return false;
			}
			
			// Take current selection if not passed
			if ( !range ) {
				range = Selection.getRangeObject();
			}
			
			commands[command].action(value, range);
		},

		
		// If command is available and not dissables or the active range is not null 
		// the command is enables
		queryCommandEnabled = function( command, range ) {

			// "All of these methods must treat their command argument ASCII
			// case-insensitively."
			command = command.toLowerCase();

			// Take current selection if not passed
			if ( !range ) {
				range = Selection.getRangeObject();
			}
			
			return ( 'enabled' in commands[command] && commands[command].enabled !== false )
			|| range !== null;
		},
		

		// "Return true if command is indeterminate, otherwise false."
		queryCommandIndeterm = function( command ) {
			
			// "All of these methods must treat their command argument ASCII
			// case-insensitively."
			command = command.toLowerCase();

			// Take current selection if not passed
			if ( !range ) {
				range = Selection.getRangeObject();
			}

			// "If command is not enabled, return false."
			if (!queryCommandEnabled(command)) {
				return false;
			}
			
			if (!('indeterm' in commands[command])) {
				throw "INVALID_ACCESS_ERR";
			}

			// "Return true if command is indeterminate, otherwise false."
			return commands[command].indeterm();
		},
		
		
		queryCommandState = function( command ) {

			throw "NOT_IMPLEMENTED_ERR";
		},
		
		// "When the queryCommandSupported(command) method on the HTMLDocument
		// interface is invoked, the user agent must return true if command is
		// supported, and false otherwise."
		queryCommandSupported = function( command ) {
			
			// "All of these methods must treat their command argument ASCII
			// case-insensitively."
			command = command.toLowerCase();

			return command in commands;		
		},
		
		
		queryCommandValue  = function( command ) {
			
			throw "NOT_IMPLEMENTED_ERR";
		};
	
	// export defined API
	return {
			registerCommand: registerCommand,
			execCommand: execCommand,
			queryCommandEnabled: queryCommandEnabled,
			queryCommandIndeterm: queryCommandIndeterm,
			queryCommandState: queryCommandState,
			queryCommandSupported: queryCommandSupported,
			queryCommandValue: queryCommandValue
	};
	
});
