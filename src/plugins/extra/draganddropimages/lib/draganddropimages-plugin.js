/*globals window, document, XMLHttpRequest, Aloha, GENTICS, define */
/*jslint devel: true, plusplus: true, unparam: true, todo: true, white: true */
/* dragndropimages.js is part of Aloha Editor project http://aloha-editor.org
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
//(function(window, undefined) {
//    var
//        $ = jQuery = window.alohaQuery || window.jQuery,
//        GENTICS = window.GENTICS,
//        Aloha = GENTICS.Aloha;
define(['aloha', 'jquery', 'aloha/plugin', 'css!draganddropimages/css/draganddropimages.css'], function (Aloha, $, Plugin) {
	'use strict';

	return Plugin.create('DragNDropImgs', {
		defaults: {

			// if you provide a dropHandlerCallback, then uploadHandler is ignored.
			'dropHandlerCallback': function (imgObj) {
				console.log(imgObj);
			},

			// or

			'uploadHandler': {
				'url': null,
				'method': 'post',
				'success': function (data) {
					// handler for success
					console.log(data);
				},
				'error': function (data) {
					// handler for error
					console.log(data);
				}
			},

			'max_img_size': 5000000,
			'max_img_count': 3,
			'accept_mimes': 'image/gif,image/jpeg,image/jpg,image/png'
		},

		init: function () {
			var self = this;

			// add the listener
			self.setDragNDropHandlers();

			// check user settings, or use defaults
			if (self.settings === undefined) {
				self.settings = self.config;
			} else {
				self.settings = $.extend(true, self.config, self.settings);
			}

			// bind our events
			Aloha.bind('aloha-img-dragenter', function (jObjEvent, event) {
				var $target = event ? $(event.target) : null,
					$editable = self.getEditable($target),
					range = new Aloha.Selection.SelectionRange(true);
				// handle any special drop end stuff
				if ($editable && $editable.length && !$editable.hasClass('aloha-dragenter')) {
					$editable.addClass('aloha-dragenter');
				}
			});

			Aloha.bind('aloha-img-dragover', function (jObjEvent, event) {
				var $target = event ? $(event.target) : null,
					$editable = self.getEditable($target);
				// handle any special drop end stuff
				if ($editable && $editable.length && !$editable.hasClass('aloha-dragenter')) {
					$editable.addClass('aloha-dragenter');
				}
			});

			Aloha.bind('aloha-img-dragleave', function (jObjEvent, event) {
				var $target = event ? $(event.target) : null,
					$editable = self.getEditable($target);
				// handle any special drop end stuff
				if ($editable && $editable.length && $editable.hasClass('aloha-dragenter')) {
					$editable.removeClass('aloha-dragenter');
				}
			});

			Aloha.bind('aloha-img-drop-start', function (jObjEvent, event) {
				var $target = event ? $(event.target) : null,
					$editable = self.getEditable($target);
				// handle any special drop start stuff
				if ($editable && $editable.length && !$editable.hasClass('aloha-drop')) {
					$editable.addClass('aloha-drop');
				}
			});

			Aloha.bind('aloha-img-drop-end', function (jObjEvent, event) {
				var $target = event ? $(event.target) : null,
					$editable = self.getEditable($target),
					uploaded = self.uploadedFiles || null,
					range = Aloha.Selection.getRangeObject();

				// handle any special drop end stuff
				if ($editable && $editable.length) {
					$editable.removeClass('aloha-dragenter').removeClass('aloha-drop');
					if ($editable.find('.aloha-temporary-image-placeholder').length) {
						$editable.find('.aloha-temporary-image-placeholder').remove();
					}

					// it's possible that the user drags an image on the editable without
					// it being "active". We test to see if we can perform a select
					// (which only can happen on an active editable), if not then we
					// manually create the range (educated guess of the process)
					// credit: dragndropfiles plugin.
					if ($.isFunction(range.select)) {
						range.select();
					} else {
						range = new Aloha.Selection.SelectionRange(true);
						range.update();
						if ($target.textNodes().length === 0) {
							range.startContainer = $target[0].childNodes[0];
							range.endContainer = $target[0].childNodes[0];
						} else {
							range.startContainer = $target.textNodes()[0];
							range.endContainer = $target.textNodes()[0];
						}
						range.startOffset = 0;
						range.endOffset = 0;
						range.select();
					}


					/*-----------------------------------------------------
					 * START CUSTOMIZABLE
					 */
					// You would customize this to handle what's returned
					// from your custom server handler file. See below for
					// a reference of what I'm returning
					$.each(uploaded, function (a) {
						var data = uploaded[a],
							imgData, $img;

						if (data && !data.error) {
							imgData = data.msg.uploaded;
							if (imgData.isimg) {
								// add our uploaded image.
								$img = $('<img src="' + imgData.path + imgData.filename + '" width="' + imgData.width + '" height="' + imgData.height + '">');
								GENTICS.Utils.Dom.insertIntoDOM($img, range, self.getEditable($target));
								/* TODO: Fix what happens when the user has a range selected.
								if (range.isCollapsed()) {
									// do the normal insert
									GENTICS.Utils.Dom.insertIntoDOM($img, range, self.getEditable($target));
								} else {
									// The user has a range selected, we delete range and insert at begining.
								}
								*/
							}
						}
					});
					/*
					 * END CUSTOMIZABLE
					 ------------------------------------------------------*/

					// remove all file data from our self
					self.uploadedFiles = null;
				}
			});

		},

		/**
		 * Finds and returns our editable
		 */
		getEditable: function ($target) {
			var $editable = null;
			if ($target && $target.length && $target.hasClass('aloha-editable')) {
				$editable = $target;
				$target = $editable.children(':last');
				if ($target.hasClass('aloha-editable')) {
					//nested space is needed in this tag, otherwise select won't success...
					$editable.append('<span> </span>');
					$target = $editable.children(':last');
				}
			} else if ($target && $target.length) {
				$editable = $target.parents('.aloha-editable');
			}
			return $editable;
		},

		/*
		 * Finds the current selection range in our editable
		 */
		getCurrentRange: function (event) {
			var target = jQuery(event.target),
				range = new Aloha.Selection.SelectionRange(true);
			range.update();
			if (target.textNodes().length === 0) {
				range.startContainer = target[0].childNodes[0];
				range.endContainer = target[0].childNodes[0];
			} else {
				range.startContainer = target.textNodes()[0];
				range.endContainer = target.textNodes()[0];
			}
			range.startOffset = 0;
			range.endOffset = 0;
			try {
				range.select();
			} catch (error) {
				Aloha.Log.error(this, error);
			}
			return range;
		},

		/**
		 * Our drop event Handler
		 */
		dropEventHandler: function (event) {
			var self = this,
				config = self.settings.config,
				dataTransfer = null;

			if (event && event.originalEvent) {
				dataTransfer = event.originalEvent.dataTransfer;
			} else if (event && event.dataTransfer) {
				dataTransfer = event.dataTransfer;
			}

			Aloha.trigger('aloha-img-drop-start', event);

			if (!dataTransfer) {

				Aloha.trigger('aloha-img-drop-end', event);
				Aloha.Log.warn(self, 'Error: Could not initialize data transfer.');

			} else if (dataTransfer.files.length > config.max_img_count) {

				Aloha.trigger('aloha-img-drop-end', event);
				Aloha.Log.warn(self, 'Error: Maximum limit of ' + config.max_img_count + ' files dropped exceeded.');

			} else if (dataTransfer.files.length > 0 && dataTransfer.files.length <= config.max_img_count) {

				$.each(dataTransfer.files, function (i, fileObj) {
					var xhr = new XMLHttpRequest(),
						mimes = config.accept_mimes.split(',');

					if (!fileObj) {

						Aloha.trigger('aloha-img-drop-end', event);
						Aloha.Log.warn(self, 'Error: The file could not be uploaded. Could not read file.');

					} else if (fileObj.type.length === 0 || mimes.length === 0 || mimes.indexOf(fileObj.type) === -1) {

						Aloha.trigger('aloha-img-drop-end', event);
						Aloha.Log.warn(self, 'Error: The file could not be uploaded. Wrong MIME type. [' + fileObj.type + ']');

					} else if (fileObj.size > config.max_img_size) {

						Aloha.trigger('aloha-img-drop-end', event);
						Aloha.Log.warn(self, 'Error: The file could not be uploaded. File was too large. [' + fileObj.size + ']');

					} else if ($.isFunction(config.dropHandlerCallback)) {

						// call the user supplied function to handle the upload
						config.dropHandlerCallback.call(self, fileObj, function (data) {
							/*	"data" will contain information about your uploaded file.
								What's returned is based on your server handler file.
								an example of what I'm returning:
								data: {
									error: true|false,
									msg: {
										original: {
											filename	: "NAME_OF_DROPPED_FILE_NAME", 			// e.g. "myfile.png"
											path		: "RELATIVE_PATH_TO_DROPPED_FILE"		// e.g. "/_DROP_PHOTOS/",
											height		: 1000,
											width		: 1000,
										}
										uploaded: {
											filename	: "NAME_OF_CONVERTED_FILE_NAME",		// e.g. "myfile1.jpg"
											height		: 600,
											width		: 600,
											isimg		: true|false,
											ispdf		: true|false,
											path		: "RELATIVE_PATH_TO_CONVERTED_FILE"		// e.g. "/assets/images/"
										},
										// optional thumb #1
										thumb1: {
											filename	: "NAME_OF_CONVERTED_1_FILE_NAME",		// e.g. "myfile_thumb1.jpg"
											height		: 250,
											width		: 250
										},
										// optional thumb #2
										thumb2: {
											filename	: "NAME_OF_CONVERTED_2_FILE_NAME",		// e.g. "myfile_thumb2.jpg"
											height		: 96,
											width		: 96
										},
										success: true|false
									}
								}
							*/

							// add out uploaded file data to self, so the drop-end event can use it.
							if (!self.uploadedFiles) {
								self.uploadedFiles = [];
							}
							// make sure data is valid, before adding to array. (We can get false positives)
							if (data) {
								self.uploadedFiles.push(data);
							}

							Aloha.trigger('aloha-img-drop-end', event);

						});

					} else {

						xhr.onload = function () {
							var result = this,
								data, json;
							try {
								data = $.trim(result.responseText);
								json = $.parseJSON(data);
								if (json && typeof json.error === 'boolean' && json.error === false) {
									if ($.isFunction(config.uploadHandler.success)) {
										config.uploadHandler.success.call(self, json);
									}
								} else if (!json || json.error === undefined || json.error === true) {
									if (json && json.msg) {
										Aloha.Log.warn(self, json.msg);
										if ($.isFunction(config.uploadHandler.error)) {
											config.uploadHandler.error.call(self, json);
										}
									} else {
										Aloha.Log.warn(self, 'There was a problem uploading your file(s). Please contact technical support.');
										if ($.isFunction(config.uploadHandler.error)) {
											config.uploadHandler.error.call(self, json);
										}
									}
								} else {
									Aloha.Log.warn(self, 'There was an unkown problem uploading your file(s).');
									if ($.isFunction(config.uploadHandler.error)) {
										config.uploadHandler.error.call(self, json);
									}
								}
								Aloha.trigger('aloha-img-drop-end', event);
							} catch (err) {
								Aloha.trigger('aloha-img-drop-end', event);
								Aloha.Log.warn(self, 'There was a problem uploading the file. Please make sure that the file format is correct.\nError description: ' + err.message + '\nResponse:' + $.trim(result.responseText) + '\nIf you continue to experience problems, please contact technical support and send them the file you are trying to upload.');
								if ($.isFunction(config.uploadHandler.error)) {
									config.uploadHandler.error.call(self, err);
								}
							}
						};
						xhr.open(config.uploadHandler.method || 'POST', config.uploadHandler.url, true);
						xhr.setRequestHeader('X-File-Name', window.encodeURIComponent(fileObj.name) || window.encodeURIComponent(fileObj.fileName));
						// custom header to pass your own parameters to your server handler file
						xhr.setRequestHeader('X-File-Params', window.encodeURIComponent({
							// you can put whatever you want in here, this is to assist your server handler file...
							// you could do something like this.. or whatever you want..
							'max-width': 1000,
							'max-height': 1000
						}));
						xhr.setRequestHeader('Content-Type', fileObj.type);
						xhr.send(fileObj);

					}
				});

			} else {

				Aloha.trigger('aloha-img-drop-end', event);
				Aloha.Log.warn(self, 'Error: Unkown error.');

			}

			// prevent default
			if (event.preventDefault) {
				event.preventDefault();
			} else {
				event.cancelBubble = true;
			}
			if (event.stopPropagation) {
				event.stopPropagation();
			} else {
				event.returnValue = false;
			}
			return false;

		},

		/*
		 *  Attach drag and drop listeners to document body (Native JS way)
		 *  (Credit: draganddropfiles plugin)
		 *
		 */
		setDragNDropHandlers: function () {
			var self = this;
			if (!document.body.dragNDropImgsInitialized) {
				document.body.dragNDropImgsInitialized = true;
				this.onstr = '';
				this.mydoc = document;
				this.methodName = 'addEventListener';
				// check for MS InternetExplorer
				if ($.browser.msie) {
					this.onstr = 'on';
					this.methodName = 'attachEvent';
					this.mydoc = document.body;
				}
				// sets the default handlers
				this.mydoc[this.methodName](this.onstr + 'dragenter', function (event) {
					Aloha.trigger('aloha-img-dragenter', event);
					if (event.preventDefault) {
						event.preventDefault();
					} else {
						event.cancelBubble = true;
					}
					if (event.stopPropagation) {
						event.stopPropagation();
					} else {
						event.returnValue = false;
					}
					return false;
				}, false);
				this.mydoc[this.methodName](this.onstr + 'dragover', function (event) {
					Aloha.trigger('aloha-img-dragover', event);
					if (event.preventDefault) {
						event.preventDefault();
					} else {
						event.cancelBubble = true;
					}
					if (event.stopPropagation) {
						event.stopPropagation();
					} else {
						event.returnValue = false;
					}
					//return false;
				}, false);
				this.mydoc[this.methodName](this.onstr + 'dragleave', function (event) {
					Aloha.trigger('aloha-img-dragleave', event);
					if (event.preventDefault) {
						event.preventDefault();
					} else {
						event.cancelBubble = true;
					}
					if (event.stopPropagation) {
						event.stopPropagation();
					} else {
						event.returnValue = false;
					}
					return false;
				}, false);
				this.mydoc[this.methodName](this.onstr + 'drop', function (event) {
					self.dropEventHandler(event);
				}, false);
			}
		}
	});
});