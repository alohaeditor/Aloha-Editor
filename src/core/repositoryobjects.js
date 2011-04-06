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
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = GENTICS.Aloha;

GENTICS.Aloha.Repository.Object = function() {};

/**
 * @namespace GENTICS.Aloha.Repository
 * @class Document
 * @constructor
 *
 * Abstract Document suitable for most Objects.<br /><br />
 *
 * Example:
 *
<pre><code>
 var item = new GENTICS.Aloha.Repository.Document({
 	id: 1,
 	repositoryId: 'myrepository',
 	name: 'Aloha Editor - The HTML5 Editor',
 	type: 'website',
 	url:'http://aloha-editor.com',
 });
</code></pre>
 *
 * @param {Object} properties An object with the data.
 * <div class="mdetail-params"><ul>
 * <li><code>id</code> : String <div class="sub-desc">Unique identifier</div></li>
 * <li><code>repositoryId</code> : String <div class="sub-desc">Unique repository identifier</div></li>
 * <li><code>name</code> : String <div class="sub-desc">Name of the object. This name is used to display</div></li>
 * <li><code>type</code> : String <div class="sub-desc">The specific object type</div></li>
 * <li><code>partentId</code> : String (optional) <div class="sub-desc"></div></li>
 * <li><code>mimetype</code> : String (optional) <div class="sub-desc">MIME type of the Content Stream</div></li>
 * <li><code>filename</code> : String (optional) <div class="sub-desc">File name of the Content Stream</div></li>
 * <li><code>length</code> : String (optional) <div class="sub-desc">Length of the content stream (in bytes)</div></li>
 * <li><code>url</code> : String (optional) <div class="sub-desc">URL of the content stream</div></li>
 * <li><code>renditions</code> : Array (optional) <div class="sub-desc">Array of different renditions of this object</div></li>
 * <li><code>localName</code> : String (optional) <div class="sub-desc">Name of the object. This name is used internally</div></li>
 * <li><code>createdBy</code> : String (optional) <div class="sub-desc">User who created the object</div></li>
 * <li><code>creationDate</code> : Date (optional) <div class="sub-desc">DateTime when the object was created</div></li>
 * <li><code>lastModifiedBy</code> : String (optional) <div class="sub-desc">User who last modified the object</div></li>
 * <li><code>lastModificationDate</code> : Date (optional) <div class="sub-desc">DateTime when the object was last modified</div></li>
 * </ul></div>
 *
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

/**
 * Not implemented method to generate this JS API doc correctly.
 */
//GENTICS.Aloha.Repository.Document.prototype.empty = function() {};


/**
 * @namespace GENTICS.Aloha.Repository
 * @class Folder
 * @constructor
 * Abstract Folder suitable for most strucural Objects.<br /><br />
 *
 * Example:
 *
<pre><code>
 var item = new GENTICS.Aloha.Repository.Folder({
 	id: 2,
 	repositoryId: 'myrepository',
 	name: 'images',
 	type: 'directory',
 	parentId:'/www'
 });
</code></pre>
 * @param {Object} properties An object with the data.
 * <div class="mdetail-params"><ul>
 * <li><code>id</code> : String <div class="sub-desc">Unique identifier</div></li>
 * <li><code>repositoryId</code> : String <div class="sub-desc">Unique repository identifier</div></li>
 * <li><code>name</code> : String <div class="sub-desc">Name of the object. This name is used to display</div></li>
 * <li><code>type</code> : String <div class="sub-desc">The specific object type</div></li>
 * <li><code>partentId</code> : String (optional) <div class="sub-desc"></div></li>
 * <li><code>localName</code> : String (optional) <div class="sub-desc">Name of the object. This name is used internally</div></li>
 * <li><code>createdBy</code> : String (optional) <div class="sub-desc">User who created the object</div></li>
 * <li><code>creationDate</code> : Date (optional) <div class="sub-desc">DateTime when the object was created</div></li>
 * <li><code>lastModifiedBy</code> : String (optional) <div class="sub-desc">User who last modified the object</div></li>
 * <li><code>lastModificationDate</code> : Date (optional) <div class="sub-desc">DateTime when the object was last modified</div></li>
 * </ul></div>
 *
 */
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

/**
 * Not implemented method to generate this JS API doc.
 */
//GENTICS.Aloha.Repository.Document.prototype.empty = function() {};

})(window);
