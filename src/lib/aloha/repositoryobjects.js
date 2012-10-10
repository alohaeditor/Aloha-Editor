/* repositoryobjects.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor. 
 * Copyright (c) 2010-2012 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php 
 * 
 * Aloha Editor is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or any later version.
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.
 * 
 * As an additional permission to the GNU GPL version 2, you may distribute
 * non-source (e.g., minimized or compacted) forms of the Aloha-Editor
 * source code without the copy of the GNU GPL normally required,
 * provided you include this license notice and a URL through which
 * recipients can access the Corresponding Source.
 */
define([
	'aloha/core',
	'util/class'
], function (
	Aloha,
	Class
) {
	"use strict";

	var	GENTICS = window.GENTICS;

	Aloha.RepositoryObject = function () {};

	/**
	 * @namespace Aloha.Repository
	 * @class Document
	 * @constructor
	 *
	 * Abstract Document suitable for most Objects.<br /><br />
	 *
	 * Example:
	 *
	<pre><code>
	 var item = new Aloha.Repository.Document({
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
	Aloha.RepositoryDocument = Class.extend({
		_constructor: function (properties) {

			var p = properties;

			this.type = 'document';

			// Basic error checking for MUST attributes
			if (!p.id || !p.name || !p.repositoryId) {
				//				Aloha.Log.error(this, "No valid Aloha Object. Missing MUST property");
				return;
			}

			GENTICS.Utils.applyProperties(this, properties);

			this.baseType = 'document';
		}
		//		/**
		//		 * Not implemented method to generate this JS API doc correctly.
		//		 */
		//		,empty = function() }

	});



	/**
	 * @namespace Aloha.Repository
	 * @class Folder
	 * @constructor
	 * Abstract Folder suitable for most strucural Objects.<br /><br />
	 *
	 * Example:
	 *
	<pre><code>
	 var item = new Aloha.Repository.Folder({
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
	Aloha.RepositoryFolder = Class.extend({

		_constructor: function (properties) {

			var p = properties;

			this.type = 'folder';

			// Basic error checking for MUST attributes
			if (!p.id || !p.name || !p.repositoryId) {
				//		Aloha.Log.error(this, "No valid Aloha Object. Missing MUST property");
				return;
			}

			GENTICS.Utils.applyProperties(this, properties);

			this.baseType = 'folder';

		}
		//	/**
		//	* Not implemented method to generate this JS API doc correctly.
		//	*/
		//	,empty = function() {};

	});
});
