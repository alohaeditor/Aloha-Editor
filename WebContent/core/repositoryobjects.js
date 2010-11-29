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
 * Abstract Document suitable for most Objects
 * @namespace GENTICS.Aloha.Repository
 * @class Document
 * @property {String} id unique identifier
 * @property {String} repositoryId unique repository identifier
 */

GENTICS.Aloha.Repository.Document = function(properties) {

	var p = properties;
	
	this.type = 'document';
	
	// Basic error checking for MUST attributes
	if (!p.id || 
		!p.name ||
		!p.repositoryId
	) {
//		GENTICS.Aloha.Log.error(this, "No valid Aloha Object. Missing MUST property");
		return;
	}
	
	GENTICS.Utils.applyProperties(this, properties);
	
	this.baseType = 'document';
};

GENTICS.Aloha.Repository.Folder = function(properties) {

	var p = properties;
	
	this.type = 'folder';
	
	// Basic error checking for MUST attributes
	if (!p.id || 
		!p.name ||
		!p.repositoryId
	) {
//		GENTICS.Aloha.Log.error(this, "No valid Aloha Object. Missing MUST property");
		return;
	}
	
	GENTICS.Utils.applyProperties(this, properties);
	
	this.baseType = 'folder';
};
