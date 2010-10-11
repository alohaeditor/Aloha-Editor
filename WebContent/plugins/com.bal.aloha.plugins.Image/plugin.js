/*
	Aloha Image Plugin - Allow image manipulation in Aloha Editor
	Copyright (C) 2010 by TaPo-IT OG (Developed by Herbert Poul) - http://tapo-it.at
	Copyright (C) 2010 by Benjamin Athur Lupton - http://www.balupton.com

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
(function(window,undefined){
	
	// Extract
	var	GENETICS = window.GENTICS,
		jQuery = window.jQuery;
	
	// Prototypes
	String.prototype.toInteger = String.prototype.toInteger || function(){
		return parseInt(String(this).replace(/px$/,'')||0,10);
	};
	String.prototype.toFloat = String.prototype.toInteger || function(){
		return parseFloat(String(this).replace(/px$/,'')||0,10);
	};
	Number.prototype.toInteger = Number.prototype.toInteger || String.prototype.toInteger;
	Number.prototype.toFloat = Number.prototype.toFloat || String.prototype.toFloat;
	
	// jQuery
	jQuery.fn.increase = jQuery.fn.increase || function(attr){
		var	obj = jQuery(this),
			value = obj.css(attr).toFloat(),
			newValue = Math.round((value||3)*1.2);
		// Apply
		obj.css(attr,newValue);
		// Chain
		return obj;
	}
	jQuery.fn.decrease = jQuery.fn.decrease || function(attr){
		var	obj = jQuery(this),
			value = obj.css(attr).toFloat(),
			newValue = Math.round((value||0)*0.8);
		// Apply
		obj.css(attr,newValue);
		// Chain
		return obj;
	}
	
	// Create
	GENTICS.Aloha.Image = new GENTICS.Aloha.Plugin('com.bal.aloha.plugins.Image');
	
	// Extend
	jQuery.extend(GENTICS.Aloha.Image,{
		scope: 'image',
		languages: ['en','de'],
		Buttons: null,
		Events: null,
		getButton: function(name){
			return this.Buttons[name]||undefined;
		},
		getButtons: function(){
			return this.Buttons || (this.Buttons = {
				alignLeft: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_align_left',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage();
						// Apply
						jQuery(image).css('float', 'left');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'align.left'),
					group: 1
				}),
				alignRight: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_align_right',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage();
						// Apply
						jQuery(image).css('float', 'right');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'align.right'),
					group: 1
				}),
		 		alignNone: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_align_none',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage();
						// Apply
						jQuery(image).css('float', '');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'align.none'),
					group: 1
				}),
				paddingIncrease: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_padding_increase',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage(),
							Image = jQuery(image);
						// Apply
						Image.increase('padding');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'padding.increase'),
					group: 2
				}),
				paddingDecrease: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_padding_decrease',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage(),
							Image = jQuery(image);
						// Apply
						Image.decrease('padding');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'padding.decrease'),
					group: 2
				}),
				sizeIncrease: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_size_increase',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage(),
							Image = jQuery(image);
						// Apply
						Image.increase('height').increase('width');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'size.increase'),
					group: 2
				}),
				sizeDecrease: new GENTICS.Aloha.ui.Button({
					iconClass: 'GENTICS_button BAL_image_size_decrease',
					size: 'small',
					onclick: function() {
						var image = GENTICS.Aloha.Image.getImage(),
							Image = jQuery(image);
						// Apply
						Image.decrease('height').decrease('width');
					},
					tooltip: GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'size.decrease'),
					group: 2
				})
			});
		},
		getEvent: function(name){
			return this.Events[name];
		},
		getEvents: function(){
			return this.Events || (this.Events = {
				// Image Selected
				selectionChanged: function(event, rangeObject) {
            		var	image = GENTICS.Aloha.Image.getImage();
            		if ( image ) {
						// A image is selected, so tell Aloha that we are within our plugins scope
                		GENTICS.Aloha.FloatingMenu.setScope('image');
					}
					GENTICS.Aloha.FloatingMenu.doLayout();
					return true;
				},
			
				// Image Dropped
				editableCreated: function(event, editable) {
					jQuery(editable.obj).bind('drop',function(event){
						var	e = event.originalEvent,
							Files = e.dataTransfer.files;

						// if no files where dropped, use default handler
						if ( files.length < 1) {
							return true;
						}
						
						// Cycle
						jQuery.each(Files,function(i,File){
							console.debug('File: ',File);
							var Reader = new FileReader();
							Reader.onloadend = function(readEvent) {
								var Image = jQuery('<img/>', {
									src: readEvent.target.result,
									alt: readEvent.target.result.replace(/^.+?\/([^\/]+)$/,'$1')
								});
								GENTICS.Utils.Dom.insertIntoDOM(
									Image,
									GENTICS.Aloha.Selection.getRangeObject(),
									jQuery(GENTICS.Aloha.activeEditable.obj));
							};
							Reader.readAsDataURL(File);
						});
						
						// Return false
						return false;
					});
					
					// Return true
					return true;
				}
			});
		},
		getImage: function() {
			var range = GENTICS.Aloha.Selection.getRangeObject();
			var rangeTree = range.getRangeTree();
			for (var i = 0 ; i < rangeTree.length ; i++) {
				if (rangeTree[i].type == 'full' && rangeTree[i].domobj.nodeName.toLowerCase() == 'img') {
					return rangeTree[i].domobj;
				}
			}
			return undefined;
		},
		init: function(){
			// Fetch
			var	Buttons = GENTICS.Aloha.Image.getButtons(),
				Events = GENTICS.Aloha.Image.getEvents();
				scope = GENTICS.Aloha.Image.scope;
			
			// Init
			GENTICS.Aloha.FloatingMenu.createScope(scope);
	
			// Apply Buttons
			jQuery.each(Buttons,function(button,Button){
				GENTICS.Aloha.FloatingMenu.addButton(
					'image',
					Button,
					GENTICS.Aloha.i18n(GENTICS.Aloha.Image, 'floatingmenu.tab.image'),
					Button.group
				);
			});
	
			// Apply Events
			jQuery.each(Events,function(event,Event){
				GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, event, Event);
			});
		}
	});
	
})(window);
