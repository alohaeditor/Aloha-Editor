/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/
/**
 * create and register the GCN plugin
 */
GENTICS.Aloha.GCN = new GENTICS.Aloha.Plugin('com.gentics.aloha.plugins.GCN');

/**
 * Configure the available languages
 */
GENTICS.Aloha.GCN.languages = ['en', 'de', 'fr', 'eo', 'fi', 'it'];

/**
 * True if Aloha has been maximized in GCN
 */
GENTICS.Aloha.GCN.maximized = false;

/**
 * this stores references to GENTICS.Aloha.ui.Buttons, which are needed to update pressed states etc.
 */
GENTICS.Aloha.GCN.buttons = {};

/**
 * this stores the last active editable since we disable all editables when a lightbox opens. We can use this property to reactivate the last active editable 
 */
GENTICS.Aloha.GCN.lastActiveEditable = undefined;

/**
 * base url for the GCN backend
 */
GENTICS.Aloha.GCN.backendUrl = '../CNPortletapp';

/**
 * base url for the REST API
 */
GENTICS.Aloha.GCN.restUrl = GENTICS.Aloha.GCN.backendUrl + '/rest';

/**
 * allows you to specify an error handler function by setting
 * GENTICS.Aloha.settings.plugins["com.gentics.aloha.plugins.GCN"].errorHandler = function () { whatever... };
 * 
 * The error handler will be called in any case of error that is handled by the GCNIntegrationPlugin, before
 * the plugin will execute it's own error behaviour. Use the following parameters and return values
 * 
 * An example implementation of your error handler could be:
 * 
 * GENTICS.Aloha.settings.plugins["com.gentics.aloha.plugins.GCN"].errorHandler = function (id, data) {
 *   alert(id); // alert the error id that occured
 * };
 * 
 * @param {String} errorId an id for the error. Currently, those are the possible ids you might encounter:
 * 		"welcomemessages" : an error occured, when the page was loaded - e.g. it could be locked by another user
 * 		"restcall.cancelpage" : an error occured, when canceling the edit process on the server. the page will not be unlocked
 * 		"restcall.savepage" : an error occured while saving the page
 * 		"restcall.createtag" : an error occurred while creating a new contenttag
 * 		"restcall.reloadtag" : an error occured while reloading an existing contenttag from the server
 *		"restcall.livepreview" : error while rendering the page's live preview
 *		"restcall.publishpage" : error while publishing the page
 *		"restcall.publishpageat" : error while publishing the page at a certain timeframe
 *		"restcall.renderblock" : error while rendering a contenttag or block
 * @param {Object} data additional information regarding the error
 * @return true the have the GCNIntegrationPlugin continue with it's own error handling process, or false to prevent default error handling
 */
GENTICS.Aloha.GCN.errorHandler = function (errorId, data) { return true; };

/**
 * Closes a current active lightbox
 */
GENTICS.Aloha.GCN.closeLightbox = function() {
	
	// close lightbox and show ribbon 
	jQuery.prettyPhoto.close();

	// restore the aloha elements
	this.restoreAlohaElements();
};

/**
 * Initializes the GCN plugin which creates all editables
 */
GENTICS.Aloha.GCN.init = function () {
	var that = this;
 
	// set custom error handler
	if (typeof this.settings.errorHandler === 'function') {
		this.errorHandler = this.settings.errorHandler;
	}
	
	// intiate prettyphoto with facebook style 
	jQuery().prettyPhoto({
		theme:'light_square',
		opacity: 0.4,
		markup: '<div class="pp_pic_holder"> \
			<div class="pp_top"> \
				<div class="pp_left"></div> \
				<div class="pp_middle"></div> \
				<div class="pp_right"></div> \
			</div> \
			<div class="pp_content_container"> \
				<div class="pp_left"> \
				<div class="pp_right"> \
					<div class="pp_content"> \
						<div class="pp_fade"> \
							<a href="#" class="pp_expand" title="Expand the image">Expand</a> \
							<div class="pp_loaderIcon"></div> \
							<div class="pp_hoverContainer"> \
								<a class="pp_next" href="#">next</a> \
								<a class="pp_previous" href="#">previous</a> \
							</div> \
							<div id="pp_full_res"></div> \
							<div class="pp_details"> \
							</div> \
						</div> \
					</div> \
				</div> \
				</div> \
			</div> \
			<div class="pp_bottom"> \
				<div class="pp_left"></div> \
				<div class="pp_middle"></div> \
				<div class="pp_right"></div> \
			</div> \
		</div> \
		<div class="pp_overlay"></div> \
		<div class="ppt"></div>'
	
	
	});
			
	/**
	 * stores the maximize options which contains the frameset settings from the GCN frameset
	 */
	var maximizeOptions = null;
	
	if (this.getAssistantFrame()) {
		// we want to hide the ribbon
		GENTICS.Aloha.settings.ribbon = false;

		// add stylesheet reference for the submenu
		jQuery('head').append('<link type="text/css" href="' +
				this.createGCNURL({
					'url' : that.settings.stag_prefix,
					params : {
					'do' : 20,
					'url' : 'lib/css/gui.css'
				}
				}) +
		'" rel="stylesheet">');
		
		// load the old GCN top menu
		// menu div
		jQuery('body').append('<div style="z-index: 999999; position: absolute; visibility: hidden"' + 
				' class="gentics_submenu" id="nodesubmenu1"> </div>');
		
		// menu js
		jQuery('head').append('<script type="text/javascript" src="' + 
				this.createGCNURL({
					'url' : this.settings.stag_prefix,
					'params' : {
						'do' : 20,
						'url' : 'lib/js/layer.js'
					}
				}) + '"></script>');
		jQuery('head').append('<script type="text/javascript" src="' + 
				this.createGCNURL({
					'url' : this.settings.stag_prefix,
					'params' : {
						'do' : 20,
						'url' : 'lib/js/tools.js'
					}
				}) + '"></script>');
		jQuery('head').append('<script type="text/javascript" src="' + 
				this.createGCNURL({
					'url' : this.settings.stag_prefix,
					'params' : {
						'do' : 20,
						'url' : 'lib/js/menu1.js'
					}
				}) + '"></script>');
	
		// update the top menu
		if (top.menu && top.menu.location.href.indexOf('do=14104') < 0 && top.menu.location.href.indexOf('aloha=true') < 0 ) {
			top.menu.location.href = this.createGCNURL({
				'url' : this.settings.stag_prefix,
				'params' : {
					'do' : 14004,
					'MENU_LAYER' : 0,
					'ass_pre_flapped' : 0,
					'aloha' : true,
					//passing the page id when loading the menu ensures
					//that the menu-actions will operate on the correct
					//page.
					'PAGE_ID' : that.settings.id,
				},
				'noCache': true
			});
		}
		
		// hide the menu on html/body click
		jQuery('html').click(function () {
			hide_layer(get_layer('nodesubmenu1'));
			if (top.menu) {
				top.menu.nodesubmenu1_clicked = false;
			}
		});

		// minimize tree if not pinned
		jQuery('html').mouseover(function () {
			if (top.tree && top.tree.frame_small) {
				top.tree.frame_small();
			}
		});
	}
	
	// Update the frame UI of GCN
	GENTICS.Aloha.GCN.updateFrameUI();
	
	jQuery(window).unload(function(){
		// Restore the frame UI if the page is left
		that.restoreFrameUI();

		// check if something needs to be saved
		if (GENTICS.Aloha.isModified()) {
			// if an editable has been modified, the user can confirm if he wants the page to be saved
			if (confirm(that.i18n('confirm.editable.modified'))) {
				that.savePage({silent : true, async : false});
				return false;
			}
		}
	});

	// Activate editables
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, "ready", function () {
		that.alohaEditables(that.settings.editables);
	});

	// Make blocks not editable
	this.alohaBlocks(this.settings.blocks);

	// Display welcome messages - simple alerts for testing
	if (this.settings.welcomeMessages) {
		// invoke error handler first
		if (this.errorHandler('welcomemessages', this.settings.welcomeMessages) !== false) {
			jQuery.each(this.settings.welcomeMessages, function (index, message) {
				GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
					title : 'Gentics Content.Node',
					text : message.message,
					type : GENTICS.Aloha.Message.Type.ALERT
				}));
			});
		}
	}

	// log rendermessages in console
	if (this.settings.renderMessages) {
		jQuery.each(this.settings.renderMessages, function (index, message) {
			if (message.level && GENTICS.Aloha.Log.isLogLevelEnabled(message.level.toLowerCase())) {
				GENTICS.Aloha.Log.log(message.level.toLowerCase(), this, message.message);
			}
		});
	}

	if (GENTICS.Aloha.Log.isDebugEnabled()) {
		var editables = 0;
		var blocks = 0;
		
		if (this.settings.editables) {
			editables = this.settings.editables.length;
		}
		if (this.settings.blocks) {
			blocks = this.settings.blocks.length;
		}
		
		GENTICS.Aloha.Log.debug(this, "Loaded page with id { " + this.settings.id + " }.");
		GENTICS.Aloha.Log.debug(this, "Found " + editables + " editables and " + blocks + " blocks.");
	}

	var pageMenu = new Array();

	// menu button for the preview
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.preview'),
		onclick : function() {
			that.previewPage();
		}
	}));

	// menu button for editing
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.edit'),
		onclick : function() {
			that.editPage();
		}
	}));

	// menu button for the live preview
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.livepreview'),
		onclick : function() {
			that.savePage({
				onsuccess : function () {
					that.openGCNURL({
						url : that.settings.stag_prefix,
						popup : true,
						params : {
							live : that.settings.id,
							'do' : 14001
						},
						'noCache': true
					});
				},
				onfailure : function ()  {
					// invoke error handler
					if (GENTICS.Aloha.GCN.errorHandler('restcall.livepreview', data) === false) {
						return;
					}
				},
				silent : true
			});
		}
	}));

	// this is a very ugly hack. When opened the editor in wiki mode (outside of
	// the GCN frames), we need to provide a serialized PHP array as back
	// parameter to the call to page properties, so that the dialog will lead us back to the wiki mode
	var propsBackParam = this.getAssistantFrame() ? '' : 'a:3:{s:4:"REDO";s:5:"14012";s:6:"realid";s:'+String(this.settings.id).length+':"'+this.settings.id+'";s:4:"real";s:4:"edit";}';

	// menu button for the page properties
	pageMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.properties'),
		onclick : function() {
			that.openGCNURL({
				url : that.settings.stag_prefix,
				params : {
					'do' : 14000,
					PAGE_ID : that.settings.id,
					FOLDER_ID : that.settings.folderId,
					back : propsBackParam
				},
				'noCache': true
			});
		}
	}));

	// menu button for the object properties (only if opened within GCN frames)
//	if (this.getAssistantFrame()) {
//		pageMenu.push(new GENTICS.Aloha.ui.Button({
//			label : this.i18n('button.objectproperties'),
//			onclick : function() {
//				that.openGCNURL({
//					url : that.settings.stag_prefix,
//					params : {
//						'do' : 10010,
//						type : 10007,
//						PAGE_ID : that.settings.id,
//						FOLDER_ID : that.settings.folderId
//					}
//				});
//			}
//		}));
//
//		// menu button for the time management (only if opened within GCN frames)
//		pageMenu.push(new GENTICS.Aloha.ui.Button({
//			label : this.i18n('button.timemanagement'),
//			onclick : function() {
//				that.openGCNURL({
//					url : that.settings.stag_prefix,
//					params : {
//						'do' : 14006,
//						PAGE_ID : that.settings.id
//					}
//				});
//			}
//		}));
//	}

	// Add the page button
	var pageButton = new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.page'),
		menu : pageMenu
	});
	
	GENTICS.Aloha.Ribbon.addButton(pageButton);
	
	// Add the language button and menu
	if (this.settings.languageMenu && this.settings.languageMenu.length > 0) {
		// menu for the language button
		var menu = Array();
		jQuery.each(this.settings.languageMenu, function(index, language){
			menu.push(new GENTICS.Aloha.ui.Button({
				label : language.name,
				icon : that.createGCNURL({
					'url' : that.settings.stag_prefix,
					params : {
						'do' : 14203,
						'base' : 'doc_hi.png',
						'lang' : language.code,
						'module' : 'content'
					}
				}),
				onclick : function() {
					that.openGCNURL({
						url : that.settings.stag_prefix,
						params : {
							'do' : 14015,
							't_type' : 10007,
							'redo' : 14001,
							'CONTENTGROUP_ID' : language.id
						},
						'noCache': true
					});
				}
			}));
		});
	
		// add the language button
		GENTICS.Aloha.Ribbon.addButton(new GENTICS.Aloha.ui.Button({
			label : this.i18n('button.language'),
			menu : menu
		}));
	}

	// parameters to the 'publish' url depend on whether we are in the GCN frame or in wiki mode
	var publishParams = this.getAssistantFrame() ? {'do' : 14003, 'cmd' : 'pub'} : {'do' : 14012, 'realid' : this.settings.id, 'real' : 'pub'};
	var publishAtParams = this.getAssistantFrame() ? {'do' : 14021} : {'do' : 14021, 'PAGE_ID' : this.settings.id, 'FOLDER_ID' : this.settings.folderId, 'back' : propsBackParam};

	var saveButtonMenu = Array();
	saveButtonMenu.push(new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.publish'),
		onclick : function() {
			that.openGCNURL({
				url : that.settings.stag_prefix,
				params : publishParams,
				noCache : true
			});
		}
	}));

	if (this.getAssistantFrame()) {
		saveButtonMenu.push(new GENTICS.Aloha.ui.Button({
			label : this.i18n('button.publishat'),
			onclick : function() {
				that.openGCNURL({
					url : that.settings.stag_prefix,
					params : publishAtParams,
					noCache : true
				});
			}
		}));
	}

	// add the Save Button
	var saveButton = new GENTICS.Aloha.ui.Button({
		label : this.i18n('button.save'),
		onclick : function() {
			that.savePage();
		},
		menu : saveButtonMenu
	});
	GENTICS.Aloha.Ribbon.addButton(saveButton);

	// add the Cancel button
	if (GENTICS.Aloha.settings.readonly) {
		GENTICS.Aloha.Ribbon.addButton(
			new GENTICS.Aloha.ui.Button({
				label : this.i18n('button.quit'),
				onclick : function() {
					that.quitEdit();
				}
			})
		);
	} else {
		var cancelButton = new GENTICS.Aloha.ui.Button({
			label : this.i18n('button.cancel'),
			onclick : function() {
				that.cancelEdit(function () {that.previewPage();});
			},
			menu : [
				new GENTICS.Aloha.ui.Button({
					label : this.i18n('button.quit'),
					onclick : function() {
						that.quitEdit();
					}
			    })
	        ]
		});
		GENTICS.Aloha.Ribbon.addButton(cancelButton);
	}

	if (this.getAssistantFrame() || this.isFrontend() ) {
		// Add a separator before the rest of the buttons
//		GENTICS.Aloha.Ribbon.addSeparator();
//		
//		this.buttons.maximizeButton = new GENTICS.Aloha.ui.Button({
//			iconClass : 'GENTICS_maximize',
//			toggle : true,
//			onclick : function () {
//				that.toggleEditFrame();
//			}
//		});
//		
//		// set the maximize button's initial status
//		if (this.isEditFrameMaximized()) {
//			this.buttons.maximizeButton.setPressed(true);
//		}
//		
//		// Add the maximize button
//		GENTICS.Aloha.Ribbon.addButton(this.buttons.maximizeButton);
		
		
		// first of all hide the ribbon, as it's not needed in GCN frame mode
		GENTICS.Aloha.Ribbon.hide();
		
	}
	
	if (this.getAssistantFrame()) {
		// add assistant history information
		top.main.ass.GTXHistory.add({
			id: GENTICS.Aloha.settings.plugins['com.gentics.aloha.plugins.GCN'].id,
			type: 'page',
			name: GENTICS.Aloha.settings.plugins['com.gentics.aloha.plugins.GCN'].name,
			href: '/CNPortletapp/alohapage?realid=' + GENTICS.Aloha.settings.plugins['com.gentics.aloha.plugins.GCN'].id +	
			'&language=' + GENTICS.Aloha.settings.plugins['com.gentics.aloha.plugins.GCN'].languageid + 
			'&sid=' + GENTICS.Aloha.settings.plugins['com.gentics.aloha.plugins.GCN'].sid +
			'&real=' + (GENTICS.Aloha.settings.readonly ? 'view' : 'edit'),
			icon: (GENTICS.Aloha.settings.readonly ? '?do=11&module=content&img=doc.gif' : '?do=11&module=system&img=edit.png'),
			aloha: true
		});
	}
	
	// Set the icon in the ribbon
	GENTICS.Aloha.Ribbon.setIcon('GENTICS_logo');
	
	// add insert contenttag menu to the floating menu
	var contentTagsMenu = new Array();
	var constructs = new Array();
	var constructButtons = new Array();

	if (this.settings.constructCategories) {
		// iterate over all construct categories
		for (var i=0; i<this.settings.constructCategories.length; i++) {
			constructs = new Array();

			// constructs without category will be added as buttons directly to the floating menu
			var emptyCategory = (this.settings.constructCategories[i].name == "");

			// iterate over all constructs
			for (var j=0; j < this.settings.constructCategories[i].constructs.length; j++) {
				// create a button for the construct
				var constructButton = new GENTICS.Aloha.ui.Button({
					icon : this.createGCNURL({
						'url' : that.settings.stag_prefix,
						params : {
							'do' : 11,
							'img' : 'constr/' + this.settings.constructCategories[i].constructs[j].icon,
							'module' : 'content'
						}
					}),
					constructId : this.settings.constructCategories[i].constructs[j].id,
					onclick : function() {
						that.createTag(this.constructId);
					},
					size : 'small'
				});
				if (emptyCategory) {
					// use construct name as tooltip
					constructButton.tooltip = this.settings.constructCategories[i].constructs[j].name;

					// directly add the button to the floating menu
					constructButtons.push(constructButton);
				} else {
					// use construct name as label
					constructButton.label = this.settings.constructCategories[i].constructs[j].name;

					// add the button to the list
					constructs.push(constructButton);
				}
			}

			if (!emptyCategory) {
				contentTagsMenu.push(new GENTICS.Aloha.ui.Button({
					label : this.settings.constructCategories[i].name,
					icon : this.createGCNURL({
						'url' : that.settings.stag_prefix,
						params : {
						'do' : 11,
						'img' : 'constructopen.gif',
						'module' : 'content'
					}
					}),
					menu : constructs,
					onclick : function () {} // nothing to do here
				}));
			}
		}

		if (contentTagsMenu.length > 0) {
			// add the insert tag button
			GENTICS.Aloha.FloatingMenu.addButton(
				'GENTICS.Aloha.continuoustext',
				new GENTICS.Aloha.ui.Button({
					tooltip : this.i18n('insert_tag'),
					icon : this.createGCNURL({
						'url' : that.settings.stag_prefix,
						params : {
							'do' : 11,
							'img' : 'constructopen.gif',
							'module' : 'content'
						}
					}),
					menu : contentTagsMenu,
					size : 'medium'
				}),
				GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
				2
			);
		}

		if (constructButtons.length > 0) {
			// add constructs without category directly to the floating menu
			for (var i = 0; i < constructButtons.length; ++i) {
				GENTICS.Aloha.FloatingMenu.addButton(
					'GENTICS.Aloha.continuoustext',
					constructButtons[i],
					GENTICS.Aloha.i18n(GENTICS.Aloha, 'floatingmenu.tab.insert'),
					2
				);
			}
		}
	}
	
	// now add highlighting functionality for the blocks
	GENTICS.Utils.Position.addMouseMoveCallback(function () {
		if (GENTICS.Aloha.activeEditable) {
			jQuery('.GENTICS_editable_active .GENTICS_editicon:not(.GENTICS_editicon_hover)').fadeIn('fast');
		} else {
			jQuery('.GENTICS_editicon:not(.GENTICS_editicon_hover)').show();
		}
	});
	GENTICS.Utils.Position.addMouseStopCallback(function () {
		if (GENTICS.Aloha.activeEditable) {
			jQuery('.GENTICS_editable_active .GENTICS_editicon:not(.GENTICS_editicon_hover)').fadeOut('normal');
		} else {
			jQuery('.GENTICS_editicon:not(.GENTICS_editicon_hover)').fadeOut('normal');
		}
	});
	
	// if an editable is activated all block icons have to be hidden
	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, "editableActivated", function () {
		jQuery('.GENTICS_editicon').fadeOut('normal');
	});

	GENTICS.Aloha.EventRegistry.subscribe(GENTICS.Aloha, "ready", function () {
		// register CropNResize callbacks if the extension is available
		if (typeof GENTICS.Aloha.CropNResize == "object") {
			GENTICS.Aloha.CropNResize.onResized = function (image) {
				that.cnrOnResized(image);
			};
			GENTICS.Aloha.CropNResize.onCropped = function (image, props) {
				that.cnrOnCropped(image, props);
			};
			GENTICS.Aloha.CropNResize.onReset = function (image) {
				that.cnrOnReset(image);
			};
		}
	});

};

/**
 * Initialize the editables, by 'aloha'ing them
 * @param editables
 */
GENTICS.Aloha.GCN.alohaEditables = function (editables) {
	if (editables) {
		jQuery.each(editables, function(index, editable) {
			jQuery("#" + editable.id).aloha();
			if (editable.readonly) {
				// disable readonly editables
				GENTICS.Aloha.editables[(GENTICS.Aloha.editables.length - 1)].disable();
			}
		});
	}
};

/**
 * Initialize the blocks by 'aloha'ing them
 * @param blocks
 */
GENTICS.Aloha.GCN.alohaBlocks = function (blocks) {
	var that = this;
	if (blocks) {
		jQuery.each(blocks, function(index, block) {
			if (!that.isMagicLinkBlock(block)) {
				jQuery('#' + block.id).addClass('GENTICS_block').attr(
						'contentEditable', false);

				// add the edit icon for the block
				if (!GENTICS.Aloha.settings.readonly) {
					var imgTag = jQuery('<img>');
					imgTag.attr('border', 0);
					imgTag.attr('src', block.iconurl);
					var buttonTag = jQuery('<button>');
					buttonTag.click(function(e) {
						GENTICS.Aloha.GCN.openTagFill(block.tagid);
						// return false is VERY important here as editing <a>-tags will follow
						// the link as soon as you click on the button
						// eg. <a href=""><button class="GENTICS_editicon" ...></a> will cause
						// this situation
						return false;
					});
					buttonTag.attr('alt', block.icontitle).attr('title',
							block.icontitle).addClass('GENTICS_editicon')
						.mouseover(
							function() {
								jQuery(this).addClass(
										'GENTICS_editicon_hover');
							})
						.mouseout(
							function() {
								jQuery(this).removeClass(
										'GENTICS_editicon_hover');
							})
						.prepend(imgTag);
					jQuery('#' + block.id).prepend(buttonTag);
				}
			}
		});
	}
};

/**
 * Check whether the given block is the magic link block (by checking the
 * tagname)
 * 
 * @param block
 *            block to check
 * @return true if the block is a magic link block, false if not
 */
GENTICS.Aloha.GCN.isMagicLinkBlock = function(block) {
	return block.tagname.substring(0, 16) == "gtxalohapagelink";
};

/**
 * Check whether the given block is a magic image block. "magic"
 * refers to being able to resize and crop 
 * 
 * @param block
 *            block to check
 * @return true if the block is a magic image block, false if not
 */
GENTICS.Aloha.GCN.isMagicImageBlock = function(block) {
	return block.tagname.substring(0, 13) == "gtxalohaimage";
};

/**
 * stores frameset informations for normalizing the GCN edit frame used by
 * normalizeEditFrame() and written by maximizeEditFrame()
 * 
 * the object is prefilled with basic fallback options, which are assumed to
 * generate a consistent frame layout
 */
GENTICS.Aloha.GCN.maximizeOptions = {
		fsContent_cols : '0,*,0',
		frameset0_cols : '315,*',
		frameset2_rows : '101,*'
};

/**
 * normalize or maximize the GCN edit frame for Aloha
 * @return void
 */
GENTICS.Aloha.GCN.toggleEditFrame = function() {
	if (!top.main) {
		// seems we're outside of gcn
		return;
	}

	if (this.isEditFrameMaximized()) {
		this.normalizeEditFrame();
	} else {
		this.maximizeEditFrame();
	}
};

/**
 * normalize the GCN edit frame
 * @return void 
 */
GENTICS.Aloha.GCN.normalizeEditFrame = function() {
	// restore settings from maximized options
	top.main.document.getElementById('fsContent').cols = this.maximizeOptions.fsContent_cols;
	top.document.getElementsByTagName('frameset')[0].cols = this.maximizeOptions.frameset0_cols;
	top.document.getElementsByTagName('frameset')[2].rows = this.maximizeOptions.frameset2_rows;
	
	this.buttons.maximizeButton.setPressed(false);
};

/**
 * maximize the GCN edit frame
 * @return void 
 */
GENTICS.Aloha.GCN.maximizeEditFrame = function() {
	// remember old fs settings
	this.maximizeOptions.fsContent_cols = top.main.document.getElementById('fsContent').cols;
	this.maximizeOptions.frameset0_cols = top.document.getElementsByTagName('frameset')[0].cols;
	this.maximizeOptions.frameset2_rows = top.document.getElementsByTagName('frameset')[2].rows;
	
	// now change the frameset settings
	top.main.document.getElementById('fsContent').cols = '0,*,0';		
	top.document.getElementsByTagName('frameset')[0].cols = '0,*';
	top.document.getElementsByTagName('frameset')[2].rows = '0,*';
	
	this.buttons.maximizeButton.setPressed(true);
};

/**
 * check if the edit frame is maximized right now
 * check is based on the .cols attribute of the frameset[0] frameset
 * fsContent is not reliable for this check, as it is hidden by aloha by default
 * @return true if the edit frame is maximized, false otherwise
 */
GENTICS.Aloha.GCN.isEditFrameMaximized = function () {
	if (!this.getAssistantFrame()) {
		return false;
	}
	if (top.document.getElementsByTagName('frameset')[0].cols == '0,*') {
		return true;
	} else {
		return false;
	}
};

/**
 * Check if we are in the frontend environment.
 * 
 * @return true if we are in frontend mode, otherwise false.
 */
GENTICS.Aloha.GCN.isFrontend = function() {
  if((typeof this.settings.links) !== undefined && this.settings.links == 'frontend') {
     return true;
  } else {
     return false;
  }
};

/**
 * Get the assistant frame as jQuery object (if editor is opened in the GCN Frameset). Otherwise returns false.
 * @return assistant frame as jQuery object or false
 */
GENTICS.Aloha.GCN.getAssistantFrame = function() {
	// only get the assistant frame once
	if (this.assistantFrame !== undefined) {
		return this.assistantFrame;
	}
	if (!window.parent) {
		return false;
	}
	// check for the vertical assistant
	var assistant = jQuery('frame', window.parent.document).eq(0);
	if (assistant.attr('name') === 'ass') {
		this.assistantFrame = assistant;
		return assistant;
	}
	// check for the horizontal assistant
	assistant = jQuery('frame', window.parent.document).eq(2);
	if (assistant.attr('name') === 'ass') {
		this.assistantFrame = assistant;
		return assistant;
	}

	// we could also be in an iframe, so check further
	if (!window.parent.parent) {
		return false;
	}
	// check for the vertical assistant
	var assistant = jQuery('frame', window.parent.parent.document).eq(0);
	if (assistant.attr('name') === 'ass') {
		this.assistantFrame = assistant;
		return assistant;
	}
	// check for the horizontal assistant
	assistant = jQuery('frame', window.parent.parent.document).eq(2);
	if (assistant.attr('name') === 'ass') {
		this.assistantFrame = assistant;
		return assistant;
	}

	return false; 
};

/**
 * Removes the GCN assistant frame and removes the content from the main menu frame.
 * This function also stops the GCN loading bar.
 * 
 * It's save to call this function even when not running inside the GCN frame.
 * In this case the function will do nothing.
 * 
 * @return void
 */
GENTICS.Aloha.GCN.updateFrameUI = function () {
	var assistantFrame = this.getAssistantFrame();
	if (assistantFrame) {
		var assistantFrameset = assistantFrame.parent();
		this.originalColumns = assistantFrameset.attr('cols');
		this.originalRows = assistantFrameset.attr('rows');
		if (this.originalColumns) {
			assistantFrameset.attr('cols', '0,*,0');
		}
		if (this.originalRows) {
			assistantFrameset.attr('rows', '*,0,0');
		}

		var menuFrame = jQuery(window.parent.parent.frames[2].document);
		// hide the progress bar
		menuFrame.find('#ProgressStatusInfo_0').hide();
	}
};

/**
 * Restores the GCN UI so that it can be used like before.
 * 
 * It's save to call this function even when not running inside the GCN frame.
 * In this case the function will do nothing.
 * 
 * @return void
 */
GENTICS.Aloha.GCN.restoreFrameUI = function () {
	var assistant = this.getAssistantFrame();
	if (assistant) {
		var assistantFrameset = assistant.parent();
		if (this.originalColumns) {
			assistantFrameset.attr('cols', this.originalColumns);
		}
		if (this.originalRows) {
			assistantFrameset.attr('rows', this.originalRows);
		}
	}
};

/**
 * Cancel editing of the current page and call the callback function afterwards
 * @param callback callback function after editing was successfully cancelled
 */
GENTICS.Aloha.GCN.cancelEdit = function (callback) {
	var that = this;

	for (var i in GENTICS.Aloha.editables) {
		if (GENTICS.Aloha.editables[i].setUnmodified) {
			GENTICS.Aloha.editables[i].setUnmodified();
		}
	}

	this.performRESTRequest({
		'url' : this.settings.stag_prefix + this.restUrl + '/page/cancel/' + this.settings.id,
		'description' : 'restcall.cancelpage',
		'success' : callback,
		'error' : function(data) {
			// invoke error handler
			if (this.errorHandler('restcall.cancelpage', data) === false) {
				return;
			}
			
			GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
				title : 'Gentics Content.Node',
				text : that.i18n('restcall.cancelpage.error'),
				type : GENTICS.Aloha.Message.Type.ALERT
			}));
		}
 	});
};

/**
 * Quit editing of current page. Unlock the page and go back to page list or website (when opened in wiki mode)
 */
GENTICS.Aloha.GCN.quitEdit = function() {
	var that = this;

	if (this.isEditFrameMaximized()) {
		this.normalizeEditFrame();
	}
	
	this.cancelEdit(function() {
		if (that.settings.backurl) {
			document.location.href = that.settings.backurl;
		} else if (that.getAssistantFrame()) {
			that.openGCNURL({
				'url' : that.settings.stag_prefix,
				'params' : {
					'do' : 13011
				},
				'noCache' : true
			});
		} else {
                        top.window.close();
		}
	});
};

/**
 * Show current page in preview mode
 */
GENTICS.Aloha.GCN.previewPage = function () {
	var that = this;

	this.openGCNURL({
		url : this.settings.stag_prefix + this.backendUrl + '/alohapage',
		params : {
			realid : that.settings.id,
			language : that.settings.languageid,
			real : 'view',
			links : that.settings.links
		},
		noCache : true
	});
};

/**
 * Show current page in edit mode
 */
GENTICS.Aloha.GCN.editPage = function () {
	var that = this;

	this.openGCNURL({
		url : this.settings.stag_prefix + this.backendUrl + '/alohapage',
		params : {
			realid : that.settings.id,
			language : that.settings.languageid,
			real : 'edit',
			links : that.settings.links
		},
		noCache : true
	});
};

/**
 * Save the current page back to GCN
 * @param data might contain the following settings
 * - unlock: whether the page shall be unlocked (defaults to false)
 * - onsuccess: handler function for saving success (defaults to just showing a message)
 * - onfailure: handler function for saving failure (defaults to just showing a message)
 * - silent: do not display any messages when saving was successful
 * - async: whether the page saving shall be done asyncronously (true), which is the defaults
 */
GENTICS.Aloha.GCN.savePage = function (data) {
	var that = this;
	if (typeof data == 'undefined') {
		data = {};
	}

	if (data.asksynctrans && this.settings.translation_master) {
		// check whether the page was translated from another page
		var confirmSyncTrans = new GENTICS.Aloha.Message({
			title : 'Gentics Content.Node',
			text : GENTICS.Aloha.i18n(that, 'save.synctrans.confirm'),
			type : GENTICS.Aloha.Message.Type.CONFIRM,
			callback : function (btn, text) {
				if (btn == 'yes') {
					data.synctrans = true;
				}
				that._savePage(data);
			}
		});
		GENTICS.Aloha.showMessage(confirmSyncTrans);
	} else {
		this._savePage(data);
	}
};

/**
 * Internal method to save the page
 */
GENTICS.Aloha.GCN._savePage = function(data) {
	var that = this;
	if (typeof data == 'undefined') {
		data = {};
	}

	if (typeof data.async == 'undefined') {
		data.async = true;
	}

	// if the saving is done synchronously, we show a progress dialog
	if (!data.async) {
		var saveProgress = new GENTICS.Aloha.Message({
			title : 'Gentics Content.Node',
			text : GENTICS.Aloha.i18n(that, 'save.progress'),
			type : GENTICS.Aloha.Message.Type.WAIT
		});
		GENTICS.Aloha.showMessage(saveProgress);
	}

	// construct the save request object, first with the meta information
	var requestBody = {
		'unlock' : data.unlock ? true : false,
		'page' : {
			'id' : this.settings.id,
			'templateId' : this.settings.templateId,
			'folderId' : this.settings.folderId,
			'name' : this.settings.name,
			'fileName' : this.settings.fileName,
			'description' : this.settings.description,
			'priority' : this.settings.priority
		}
	};

	// propably set synchronization with the translation master
	if (data.synctrans && this.settings.translation_master) {
		requestBody.page.translationStatus = {
				'pageId' : this.settings.translation_master
		};
		if (this.settings.translation_version) {
			requestBody.page.translationStatus['versionTimestamp'] = this.settings.translation_version;
		}
	}

	// first of all, get all a-Tags which contain a link to the GCN pages repository, but have no tag
	if (this.settings.magiclinkconstruct) {
		jQuery('a[data-GENTICS-aloha-repository="com.gentics.aloha.GCN.Page"]').each(function(index, anchor) {
			var jqAnchor = jQuery(anchor);
			var block = that.getBlockById(jqAnchor.attr('id'));
			
			if (!block) {
				// no block exists for this anchor, so create one
				that.createTag(that.settings.magiclinkconstruct, false, function(data) {
					that.handleBlock(data, false);
					var jqRenderedTag = jQuery(data.content);
					jqAnchor.attr('id', jqRenderedTag.attr('id'));
				});
			}
		});
	}

	// now add the editables as tags
	requestBody.page.tags = {};
	for( var i = 0; i < GENTICS.Aloha.editables.length; ++i) {
		var editable = GENTICS.Aloha.editables[i];
		var gcnEditable = this.findLoadedEditable(editable.getId());
		if (gcnEditable) {
			// get the contents of the editable (blocks will already be replaced by <span> tags
			var content = editable.getContents();
			// now replace the <span> tags to <node> tags
			content = content.replace(/<span id=\"?GENTICS_block_(\w+)\"?>x<\/span>/gi, '<node $1>');
			// handle editables of meta attributes like page.name
			if (gcnEditable.metaproperty) {
				// only page properties are supportet at this time
				if (gcnEditable.metaproperty.indexOf("page.") != 0) {
					continue;
				}
				var prop = gcnEditable.metaproperty.replace(/^page\./,"");
				requestBody.page[prop] = content;
			} else {
				var properties = {};
				if (!requestBody.page.tags[gcnEditable.tagname]) {
					// create the tag entry
					requestBody.page.tags[gcnEditable.tagname] = {
						'name' : gcnEditable.tagname,
						'active' : true,
						'properties' : {}
					};
				}
	
				requestBody.page.tags[gcnEditable.tagname].properties[gcnEditable.partname] = {
					'type' : 'RICHTEXT',
					'stringValue' : content
				};
			}
		} else {
			// TODO we did not find the editable, what now?
		}
	}

	// save request
	if (this.settings.blocks) {
		// go through all blocks, find the magic link blocks and add as tags to the
		jQuery.each(this.settings.blocks, function(index, block) {
			if (that.isMagicLinkBlock(block)) {
				
				// Use fileId 0 if the block.data.url / fileurl value is invalid
				var pageId = block.data.url === "" ? 0 : block.data.url ; 
				var fileId = block.data.fileurl === "" ? 0 : block.data.fileurl;
				
				requestBody.page.tags[block.tagname] = {
					'name' : block.tagname,
					'active' : true,
					'properties' : {
						'url' : {
							'type' : 'PAGE',
							'pageId' : pageId
						},
						'fileurl' : {
							'type' : 'FILE',
							'fileId' : fileId
						},
						'text' : {
							'type' : 'STRING',
							'stringValue' : block.data.text
						},
						'class' : {
							'type' : 'STRING',
							'stringValue' : block.data['class']
						}
					}
				};
			}
			
			// also check for magic images (resizable ones)
			if (that.isMagicImageBlock(block)) {
				var info = that.cnrAnalyzeImage(
						jQuery('#' + block.id + ' img[data-gentics-aloha-repository]')
						.first());
				if (info) {
					info.src = ''; // overwrite src so we can generate a gis-url for the gisprefix
					requestBody.page.tags[block.tagname] = {
						'name' : block.tagname,
						'active' : true,
						'properties' : {
							'url' : {
								'type' : 'IMAGE',
								'imageId' : info.id
							},
							'gisprefix' : {
								'type' : 'STRING',
								'stringValue' : that.cnrURL(info)
							}
						}
					};
				}
			}
		});
		
		// also add ImageStoreImages to the request
//		jQuery('img[data-gentics-aloha-repository="com.gentics.aloha.GCN.Image"]').each(function() {
//			var img = jQuery(this);
//			var info = that.analyzeImage(img);
//			//requestBody.page.tags
//		});
	}

	var onsuccess = data ? data.onsuccess : undefined;

	var onfailure = data ? data.onfailure : undefined;
	if (typeof onfailure != 'function') {
		onfailure = function(data) {
			// invoke error handler
			if (this.errorHandler('restcall.savepage', data) === false) {
				return;
			}
			
			GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
				title : 'Gentics Content.Node',
				text : that.i18n('restcall.savepage.error'),
				type : GENTICS.Aloha.Message.Type.ALERT
			}));
		};
	}

	// if data.silent was set to true, we don't show success messages
	var showMessages = data && data.silent ? false : true;

	// make an API call to the REST API for storing the page
	this.performRESTRequest({
		'url' : this.settings.stag_prefix + this.restUrl + '/page/save/' + this.settings.id,
		'body' : requestBody,
		'description' : 'restcall.savepage',
		'success' : function (data) {
			// set editables unmodified after successful save
			for (var i in GENTICS.Aloha.editables) {
				if (GENTICS.Aloha.editables[i].setUnmodified) {
					GENTICS.Aloha.editables[i].setUnmodified();
				}
			}

			// hide the progress message (if any)
			if (typeof saveProgress != 'undefined') {
				GENTICS.Aloha.hideMessage(saveProgress);
			}

			// do our generic onsuccess handling
			if (showMessages && data.messages) {
				jQuery.each(data.messages, function (index, message) {
					GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
						title : 'Gentics Content.Node',
						text : message.message,
						type : GENTICS.Aloha.Message.Type.ALERT
					}));
				});
			}

			// if an onsuccess handler has been defined it will be called here
			if (onsuccess) {
				onsuccess(data);
			}
		},
		'error' : function (data) {
			// hide the progress message (if any)
			if (typeof saveProgress != 'undefined') {
				GENTICS.Aloha.hideMessage(saveProgress);
			}

			if (onfailure) {
				onfailure(data);
			}
		},
		'async' : data.async
 	});
};

/**
 * Deletes the current page
 * @param data might contain the following settings
 * - onsuccess: handler function for deletion success
 * - onfailure: handler function for deletion failure
 * @param confirmed OPTIONAL wheter the user has confirmed deletion. 
 * will trigger a confirmation dialog if undefined or false
 */
GENTICS.Aloha.GCN.deletePage = function (data, confirmed) {
	if (!confirmed) {
		var that = this;
		GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
			title : GENTICS.Aloha.i18n(that, 'confirm.delete.title'),
			text : GENTICS.Aloha.i18n(that, 'confirm.delete'),
			type : GENTICS.Aloha.Message.Type.CONFIRM,
			callback : function (confirm) {
				if (confirm == "yes") {
					that.deletePage(data, true);
				}
			}
		}));
		return;
	}
	
	if (typeof data.onsuccess == 'undefined') {
		data.onsuccess = function () {};
	}
	if (typeof data.onfailure == 'undefined') {
		data.onfailure = function () {};
	}
	// make an API call to the REST API for deleting the page
	this.performRESTRequest({
		'url' : this.settings.stag_prefix + this.restUrl + '/page/delete/' + this.settings.id,
		'success' : data.onsuccess,
		'error' : data.onfailure
 	});
};

/**
 * creates a folder
 */
GENTICS.Aloha.GCN.createFolder = function (data) {
	if (typeof data.success == 'undefined') {
		data.success = function () {};
	}
	if (typeof data.failure == 'undefined') {
		data.failure = function () {};
	}
	
	data.url = this.settings.stag_prefix + this.restUrl + '/folder/create/';
	this.performRESTRequest(data);
};

/**
 * Deletes a folder 
 * @param data might contain the following settings
 * - id: folder id
 * - onsuccess (optional): handler function for deletion success
 * - onfailure (optional): handler function for deletion failure
 * @param confirmed OPTIONAL wheter the user has confirmed deletion. 
 * will trigger a confirmation dialog if undefined or false
 */
GENTICS.Aloha.GCN.deleteFolder = function (data, confirmed) {
	if (!data.id) {
		return false;
	}
	if (!confirmed) {
		var that = this;
		GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
			title : GENTICS.Aloha.i18n(that, 'confirm.delete.title'),
			text : GENTICS.Aloha.i18n(that, 'confirm.deletefolder'),
			type : GENTICS.Aloha.Message.Type.CONFIRM,
			callback : function (confirm) {
				if (confirm == "yes") {
					that.deleteFolder(data, true);
				}
			}
		}));
		return false;
	}
	
	if (typeof data.onsuccess == 'undefined') {
		data.onsuccess = function () {};
	}
	if (typeof data.onfailure == 'undefined') {
		data.onfailure = function () {};
	}
	// delete the folder
	this.performRESTRequest({
		'url' : this.settings.stag_prefix + this.restUrl + '/folder/delete/' + data.id,
		'success' : data.onsuccess,
		'error' : data.onfailure
 	});
};

/**
 * publishes the current page
 * @param success success handler, if none given, the publish request will not be done as AJAX request
 * @return void
 */
GENTICS.Aloha.GCN.publishPage = function (success) {
	var that = this;
	this.savePage({
		onsuccess : function () {
			var publishParams = success ? {'do' : 14023, 'page_id' : that.settings.id} : (that.getAssistantFrame() ? {'do' : 14003, 'cmd' : 'pub', 'PAGE_ID' : that.settings.id} : {'do' : 14012, 'realid' : that.settings.id, 'real' : 'pub'});
			if (success) {
				that.performRESTRequest({
					url : that.settings.stag_prefix,
					params : publishParams,
					success : function () {
						success.apply();
					}
				});
			} else {
				var where = undefined;
				// detect the location of the "list" frame
				if (top && top.main && top.main.list && parent && parent == top.main.list) {
					where = 'parent';
				}
				that.openURL(that.createGCNURL({
					url : that.settings.stag_prefix,
					params : publishParams,
					noCache : true
				}), where);
			}
		},
		onfailure : function (data)  {
			// invoke error handler
			if (GENTICS.Aloha.GCN.errorHandler('restcall.publishpage', data) === false) {
				return;
			}
		},
		silent : success ? true : false,
		asksynctrans : true
	});
};

/**
 * publishes the current page at a specific time
 * @return void
 */
GENTICS.Aloha.GCN.publishPageAt = function () {
	var that = this;
	this.savePage({
		onsuccess : function () {
			var propsBackParam = that.getAssistantFrame() ? '' : 'a:3:{s:4:"REDO";s:5:"14012";s:6:"realid";s:'+String(that.settings.id).length+':"'+that.settings.id+'";s:4:"real";s:4:"edit";}';	
			var publishAtParams = that.getAssistantFrame() ? {'do' : 14021} : {'do' : 14021, 'PAGE_ID' : that.settings.id, 'FOLDER_ID' : that.settings.folderId, 'back' : propsBackParam};
			var where = undefined;
			// detect the location of the "list" frame
			if (top && top.main && top.main.list && parent && parent == top.main.list) {
				where = 'parent';
			}
			that.openURL(that.createGCNURL({
				url : that.settings.stag_prefix,
				params : publishParams,
				noCache : true
			}), where);
		},
		onfailure : function ()  {
			// invoke error handler
			if (GENTICS.Aloha.GCN.errorHandler('restcall.publishpageat', data) === false) {
				return;
			}
		},
		asksynctrans : true
	});
};


/**
 * Get the loaded editable with given id.
 * @param id Aloha editable id
 * @return the loaded editable from the settings with this id (if found)
 */
GENTICS.Aloha.GCN.findLoadedEditable = function (id) {
	if (this.settings.editables) {
		for (var i = 0; i < this.settings.editables.length; ++i) {
			if (this.settings.editables[i].id == id) {
				return this.settings.editables[i];
			}
		}
	}
};

/**
 * Make the given jQuery object (representing an editable) clean for saving
 * Find all tables and deactivate them
 * @param obj jQuery object to make clean
 * @return void
 */
GENTICS.Aloha.GCN.makeClean = function (obj) {
	var that = this;

	// Remove sizset and sizecache attributes that are set by sizzle and not removed when using ie.
	obj.find("[sizset]").removeAttr("sizset");
	obj.find("[sizcache]").removeAttr("sizcache");
	
	// find all a-Tags with data-GENTICS-aloha-repository set to the GCN pages
	// repository
	obj.find('a[data-GENTICS-aloha-repository="com.gentics.aloha.GCN.Page"]')
		.each(function(index, anchor) {
			var jqAnchor = jQuery(anchor);
			var block = that.getBlockById(jqAnchor.attr('id'));

			// get the link data and store in the block
			if (block) {
				
				//check the type of the link
				//and set the according tagpart
				var contentid = jqAnchor.attr(
				'data-GENTICS-aloha-object-id');
				var idArray = contentid.split('.');
				if (idArray[0] == '10007') {
					block.data = {
							'url' : idArray[1],
							'fileurl' : 0,
							'text' : jqAnchor.text(),
							'class' : jqAnchor.attr('class')
						};
				} else if (idArray[0] == '10008') {
					block.data = {
							'fileurl' : idArray[1],
							'url' : 0,
							'text' : jqAnchor.text(),
							'class' : jqAnchor.attr('class')
						};
				}
				
			}
	});

	// find all blocks and replace by <span> tags, which we can find later and
	// replace by <node tags>
	if (this.settings.blocks) {
		jQuery.each(this.settings.blocks, function(index, block) {
			obj.find('#' + block.id).replaceWith('<span id="GENTICS_block_' + block.tagname + '">x</span>');
		});
	}
};

/**
 * Perform a REST request to the GCN backend REST Service.
 * The method will automatically add the sid as request parameters, additional parameters may be given.
 * The data may contain the following properties:
 * - url: URL for the specific request, must start with / and must not contain request parameters
 * - params: additional request parameters
 * - body: request body as object, will be transformed into JSON and sent to the server
 * - success: callback method for successful requests
 * - error: callback method for errors
 * - async: whether the request shall be done asynchronously (true by default)
 * - description: i18n key of the readable description of this request (for display of end user messages in case of an error)
 * - type: POST or GET (defaults to POST)
 * @param data data of the REST request
 * @return void
 */
GENTICS.Aloha.GCN.performRESTRequest = function (data) {
	var that = this;

	if (!data.type) {
		data.type = 'POST';
	}

	var ajaxObject = {
		'type' : data.type,
		'dataType': 'json',
		'timeout' : 10000,
		'contentType': 'application/json; charset=utf-8',
		'data' : jQuery.toJSON(data.body)
	};

	ajaxObject.url = data.url + '?sid=' + this.settings.sid + '&time=' + (new Date()).getTime();

	// add requestParams if given
	if (data.params) {
		for (var paramName in data.params) {
			ajaxObject.url += '&' + paramName + '=' + encodeURI(data.params[paramName]);
		}
	}

	// do the request asynchronously or not
	if (typeof data.async != 'undefined') {
		ajaxObject.async = data.async;
	}

	// add the success handler
	if (data.success) {
		ajaxObject.success = data.success;
	}

	// add the error handler
	if (data.error) {
		ajaxObject.error = data.error;
	}

	// do the request
	jQuery.ajax(ajaxObject);
};

/**
 * Creates an URL for GCN.
 * 
 * The method will automatically add the sid as request parameters, additional parameters may be given.
 * The data may contain the following properties:
 * - url: part of the URL for the specific request after /CNPortletapp/rest, must start with / and must not contain request parameters
 * - params: additional request parameters
 * - noCache: forces the browser to re-fetch the URL,
 *     irrespective of any caching headers sent with an earlier response
 *     for the same URL. This is achived by appending a timestamp. Note: a
 *     timestamp has millisecond granularty which may not be enough.
 *     This parameter is a hack and should not be used. Instead, the headers
 *     of the response should indicate whether a resource can be cached or not.
 * @param data data of the new GCN URL
 * @return The created GCN URL as String
 */
GENTICS.Aloha.GCN.createGCNURL = function (data) {
	var url = data.url + '?sid=' + this.settings.sid;
	if (data.noCache) {
		url += '&time=' + (new Date()).getTime();
	}
	for (var paramName in data.params) {
		url += '&' + paramName + '=' + encodeURI(data.params[paramName]);
	}
	return url;
};

/**
 * Perform a redirect to another GCN URL.
 * 
 * The method will automatically add the sid as request parameters, additional parameters may be given.
 * The data may contain the following properties:
 * - url: part of the URL for the specific request after /CNPortletapp/rest, must start with / and must not contain request parameters
 * - params: additional request parameters
 * - noCache: see createGCNURL.
 * - popup: true when the URL shall be opened in a popup, false if not (default)
 * @param data data of the new GCN URL
 * @return void
 */
GENTICS.Aloha.GCN.openGCNURL = function (data) {
	var url = this.createGCNURL(data);
	var popup = data.popup;

	// TODO remove this? (we do not maximize right now)
	if (this.isEditFrameMaximized()) {
		this.normalizeEditFrame();
	}

	this.openURL(url, popup ? 'popup' : undefined);
};

/**
 * Open the given URL in the editor frame or a popup. Check for modifications
 * first, and if found, save the page first
 * 
 * @param url
 *            url to be opened
 * @param where
 *            defines, where the url shall be opened. possible values: 'popup'
 *            when the url shall be opened in a popup or 'parent' when the url
 *            shall be opened in the parent. If not given, the url is opened in
 *            the current frame
 */
GENTICS.Aloha.GCN.openURL = function (url, where) {
	// check whether something was changed, if yes
	if (GENTICS.Aloha.isModified()) {
		this.savePage({
			'unlock' : false,
			'onsuccess' : function () {
				if (GENTICS.Aloha.Log.isDebugEnabled()) {
					this.log('debug', 'opening url: ' + url);
				}

				if (where == 'popup') {
					window.open(url);
				} else if (where == 'parent' && parent) {
					parent.location.href = url;
				} else {
					document.location.href = url;
				}
			},
			'silent' : true,
			'async' : false
		});
	} else {
		if (GENTICS.Aloha.Log.isDebugEnabled()) {
			this.log('debug', 'opening url: ' + url);
		}
		if (where == 'popup') {
			window.open(url);
		} else if (where == 'parent' && parent) {
			parent.location.href = url;
		} else {
			document.location.href = url;
		}
	}
};

/**
 * Save the page and open the tagfill dialog for the given tag in a new window
 * @param tagid id of the tag
 */
GENTICS.Aloha.GCN.openTagFill = function(tagid) {
	var that = this;

	var editdo = 10008;
	var block = this.getBockByTagId(tagid);
	if (block && block.editdo) {
		editdo = block.editdo;
	}

	// value of the backParam parameter for call to tag_fill (do 10008)
	var tagfillBackParam = this.getAssistantFrame() ? '' : 'realid|' + this.settings.id;

	var editLink = this.createGCNURL({
		'url' : this.settings.stag_prefix,
		'params' : {
			'do' : editdo,
			'id' : tagid,
			'type' : 'page',
			'keepsid' : 1,
			'backparam' : tagfillBackParam,
			'FOLDER_ID' : this.settings.folderId
		},
		'noCache': true
	});

	// check whether the page is modified
	if (GENTICS.Aloha.isModified()) {
		// save the page and open the tagfill popup afterwards
		this.savePage({
			'onsuccess' : function() {

				// Hide all aloha elements
				that.hideAlohaElements();

				// open the tagfill window within lightbox
				jQuery.prettyPhoto.open(new Array(editLink+'&iframe=true&width=100%&height=100%'));
			},
			'unlock' : false,
			'silent' : true,
			'async' : false,
			'onfailure' : function() {
  			 // invoke error handler
  			if (GENTICS.Aloha.GCN.errorHandler('restcall.savepage', data) === false) {
  				return;
  			}
      }
		});
	} else {
		// Hide all aloha elements
		that.hideAlohaElements();
		jQuery.prettyPhoto.open(new Array(editLink+'&iframe=true&width=100%&height=100%'));
	}
};

/**
 * Create a new tag in the page
 * 
 * @param constructId
 *            construct id
 * @param async
 *            true if the call shall be made asynchronously (default), false for
 *            synchronous call
 * @param success
 *            callback function to be called, when the tag was created, if not
 *            set, the tag will be inserted into the page
 * @return void
 */
GENTICS.Aloha.GCN.createTag = function(constructId, async, success) {
	var that = this;

	if (typeof async == 'undefined') {
		async = true;
	}

	// get the current selection
	var selection = GENTICS.Aloha.Selection.getRangeObject();

	// make an API call to the REST API for creating a new tag
	this.performRESTRequest( {
		'url' : this.settings.stag_prefix + this.restUrl + '/page/newtag/'
				+ this.settings.id,
		'params' : {
			'constructId' : constructId
		},
		'body' : {
			magicValue : selection.getText()
		},
		'description' : 'restcall.createtag',
		'success' : function (data) {
			that.performRESTRequest({
				'url' : that.settings.stag_prefix + that.backendUrl + '/alohatag',
				'type' : 'GET',
				'params' : {
					'realid' : that.settings.id,
					'real' : 'edit',
					'template' : '<node ' + data.tag.name + '>',
					'language' : that.settings.languageid,
					'links' : that.settings.links
				},
				'success' : success ? success : function(data) {
					that.handleBlock(data, true);
				},
				'error' : function (data) {
					// invoke error handler
					if (this.errorHandler('restcall.createtag', data) === false) {
						return;
					}
					
					GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
						title : 'Gentics Content.Node',
						text : GENTICS.Aloha.i18n(that, 'restcall.createtag.error'),
						type : GENTICS.Aloha.Message.Type.ALERT
					}));
				},
				'async' : async
			});
		},
		'async' : async
	});
};

/**
 * Get the block with given tagid
 * @param tagid id of the tag
 * @return block information or false if not found
 */
GENTICS.Aloha.GCN.getBockByTagId = function(tagid) {
	if (!this.settings.blocks) {
		return false;
	}
	for (var i = 0; i < this.settings.blocks.length; ++i) {
		if (this.settings.blocks[i].tagid == tagid) {
			return this.settings.blocks[i];
		}
	}

	return false;
};

/**
 * Get the block with given id
 * 
 * @param id
 *            id of the block
 * @return block information or false if not found
 */
GENTICS.Aloha.GCN.getBlockById = function(id) {
	if (!this.settings.blocks) {
		return false;
	}
	for ( var i = 0; i < this.settings.blocks.length; ++i) {
		if (this.settings.blocks[i].id == id) {
			return this.settings.blocks[i];
		}
	}

	return false;
};

/**
 * Reload the block with given tagid
 * @param tagid id of the tag
 */
GENTICS.Aloha.GCN.reloadBlock = function(tagid) {
	// first get the block
	var block = this.getBockByTagId(tagid);
	var that = this;

	if (!block) {
		return;
	}

	// render the tag
	this.performRESTRequest({
		'url' : this.settings.stag_prefix + this.backendUrl + '/alohatag',
		'type' : 'GET',
		'params' : {
			'realid' : that.settings.id,
			'real' : 'edit',
			'template' : '<node ' + block.tagname + '>',
			'language' : that.settings.languageid,
			'links' : that.settings.links
		},
		'success' : function (data) {
			that.handleBlock(data, false);
		},
		'error' : function (data) {
			// invoke error handler
			if (this.errorHandler('restcall.reloadtag', data) === false) {
				return;
			}
			
			GENTICS.Aloha.showMessage(new GENTICS.Aloha.Message({
				title : 'Gentics Content.Node',
				text : GENTICS.Aloha.i18n(that, 'restcall.reloadtag.error'),
				type : GENTICS.Aloha.Message.Type.ALERT
			}));
		}
	});
};

/**
 * Insert a new block at the given selection
 * @param data data with the following properties
 * - content: HTML content of the block
 * - editables: array of editables contained in the tag
 * - blocks: array of blocks contained in the tag (including the tag itself)
 * @param insert true, when the block shall be inserted at the current selection, false if not
 * @return void
 */
GENTICS.Aloha.GCN.handleBlock = function(data, insert) {
	// if we have an URL to render the block content, we do this now
	if (this.settings.renderBlockContentURL) {
		data.content = this.renderBlockContent(data.content);
	}

	var blockObj = jQuery(data.content);

	// find occurrances of the block and replace the html code
	jQuery('#' + blockObj.attr('id')).replaceWith( data.content );

	// re-attach cropnresize functions
	if (GENTICS.Aloha.CropNResize) {
		GENTICS.Aloha.CropNResize.attach('#' 
			+ blockObj.attr('id')
			+ ' '
			+ GENTICS.Aloha.CropNResize.settings.selector
		);
	}
	
	// insert the new tag code into the currently active editable
	if (insert) {
		// insert at current cursor position
		var selection = GENTICS.Aloha.Selection.getRangeObject();
		if (!selection.isCollapsed()) {
			GENTICS.Utils.Dom.removeRange(selection);
			selection.select();
		}
		var limit = selection.getCommonAncestorContainer();
		if (!GENTICS.Utils.Dom.insertIntoDOM(jQuery(data.content), selection, limit ? jQuery(limit) : null, false, true)) {
			this.log('error', 'Could not insert new tag');
		} else {
			selection.clearCaches();
			selection.select();
		}
	}

	// Activate editables
	if (data.editables) {
		if (!this.settings.editables) {
			this.settings.editables = new Array();
		}
		for (var i = 0; i < data.editables.length; ++i) {
			this.settings.editables.push(data.editables[i]);
		}
		this.alohaEditables(data.editables);
	}

	// Make blocks not editable
	if (data.blocks) {
		if (!this.settings.blocks) {
			this.settings.blocks = new Array();
		}
		for (var i = 0; i < data.blocks.length; ++i) {
			this.settings.blocks.push(data.blocks[i]);
		}
		this.alohaBlocks(data.blocks);
	}
	
	// the block has been handled, so trigger an event
	GENTICS.Aloha.EventRegistry.trigger(
		new GENTICS.Aloha.Event("blockHandled", GENTICS.Aloha.GCN, blockObj)
	);
};

/**
 * Render the block content by posting it to the renderBlockContentURL configured in the plugin settings.
 * @param content content of the block to be rendered
 * @return rendered content
 */
GENTICS.Aloha.GCN.renderBlockContent = function (content) {
	var that = this;
	var newContent = content;

	jQuery.ajax({
		'url' : this.settings.renderBlockContentURL,
		'type' : 'POST',
		'timeout' : 10000,
		'data' : {
			'content' : content
		},
		'dataType' : 'text',
		'async' : false,
		'success' : function (data) {
			newContent = data;
		},
		'error' : function (data) {
		  // invoke error handler
			if (this.errorHandler('restcall.renderblock', data) === false) {
				return;
			}
    	}
	});

	return newContent;
};

/**
 * Helper method that hides aloha elements, e.g. when the lightbox is shown
 */
GENTICS.Aloha.GCN.hideAlohaElements = function () {
	if (GENTICS.Aloha.Ribbon.isVisible()) {
		// hide the ribbon
		GENTICS.Aloha.Ribbon.hide();
		// remember that we did that
		this.ribbonHidden = true;
	}

	// blur the currently active editable
	if (GENTICS.Aloha.activeEditable) {
		this.lastActiveEditable = GENTICS.Aloha.activeEditable;
		GENTICS.Aloha.activeEditable.blur();
	}
};

/**
 * Helper method to restore the aloha elements, which were hidden via hideAlohaElements()
 */
GENTICS.Aloha.GCN.restoreAlohaElements = function () {
	if (this.ribbonHidden) {
		// show the ribbon again
		GENTICS.Aloha.Ribbon.show();
		this.ribbonHidden = undefined;
	}

	// Reactivate the editable that was active before
	if (this.lastActiveEditable != undefined) {
		this.lastActiveEditable.activate(); 
		this.lastActiveEditable.obj.focus();
		this.lastActiveEditable = undefined;
	}
};

/*
 * +++ CropAndResize plugin integration +++
 */
/**
 * reset callback integration for CropNResize plugin
 * @param image reference to the image that has been resized
 */
GENTICS.Aloha.GCN.cnrOnReset = function (image) {
	var info = this.cnrAnalyzeImage(image);
	if (info) {
		var oImg = new Image(); // the original image will be created again to determine it's original size
		oImg.src = info.src;
		image.width(oImg.width);
		image.height(oImg.height);
		image.attr('src', info.src);
		return true; // we applied our reset, so return true
	} else {
		return false; // no reset has been applied, so let the CropNResize plugin handle this 
	}
};
/**
 * resize callback integration for CropNResize plugin
 * @param image reference to the image that has been resized
 */
GENTICS.Aloha.GCN.cnrOnResized = function (image) {
	var info = this.cnrAnalyzeImage(image);
	var oImg = new Image(); // the original image will be created again to determine it's original size
	
	// the image was previously resized or cropped, so keep the parameters from the info 
	if (info) {
		oImg.src = info.src;
	} else {
		// generate new image info
		oImg.src = image.attr('src');
		info = {
			x : 0, // x-pos of crop
			y : 0, // y-pos of crop
			cw : oImg.width, // crop width
			ch : oImg.height, // crop height
			src : oImg.src // image source			
		};
	}

	// now set the resize options
	info.w = image.width();
	info.h = image.height();
	
	image.attr('src', this.cnrURL(info));
};

/**
 * crop callback integration for CropNResize plugin
 * @param image reference to the image that has been resized
 * @param props cropping properties
 */
GENTICS.Aloha.GCN.cnrOnCropped = function (image, props) {
	var info = this.cnrAnalyzeImage(image);
	var oImg = new Image(); // the original image will be created again to determine it's original size
	
	// the image was previously resized or cropped, so keep the parameters from the info 
	if (info) {
		oImg.src = info.src;
		
		// determine scaling factor
		// if the image has been scaled BEFORE cropping a x- and y-scaling factor needs
		// to be determined to recalculate x- and y- positions located on an unscaled image
		var sfX = 1; // scaling factor for the x-axis
		var sfY = 1; // an for y
		if (info.w != info.cw) {
			sfX = info.cw / info.w;
		}
		if (info.h != info.ch) {
			sfY = info.ch / info.h;
		}
		
		// as the image has already been resized or cropped before,
		// things are getting interesting here
		// first we have to correct the x- and y-pos of the crop
		info.x = info.x + parseInt(props.x * sfX);
		info.y = info.y + parseInt(props.y * sfY);
		
		// then we have to scale the current crop area up to the
		// whole image size and then re-apply the scaling
		info.cw = parseInt(props.w * sfX);
		info.ch = parseInt(props.h * sfY);
	} else {
		oImg.src = image.attr('src');
		info = {
			x : props.x, // x-pos of crop
			y : props.y, // y-pos of crop
			cw : props.w, // crop width
			ch : props.h, // crop height
			src : oImg.src // image source			
		};
	}

	// now set the resize options
	info.w = props.w; // image.width();
	info.h = props.h; // image.height();
	
	image.attr('src', this.cnrURL(info))
		.width(props.w)
		.height(props.h);
};

/**
 * analyze image for previous GenticsImageStore crop or resize actions
 * @param image jQuery image object to be analyzed
 * @return false if no GenticsImageStore cropandresize URL was detected
 * 	or an object containing all of the detected properties:
 * 	{
 * 		prefix : '/GenticsImageStore', // the prefix of the GenticsImageStore URL 
 * 		w : 400, // resize width
 * 		h : 300, // resize height
 * 		x : 10, // x-pos of crop
 *		y : 10, // y-pos of crop
 *		cw : 200, // crop width
 *		ch : 150, // crop height
 *		src : 'http://...', // original image source
 *		id : 15, // GCN image id
 *		repository : "com.gentics.aloha.GCN.Image" // repository the image was taken from
 * 	}
 */
GENTICS.Aloha.GCN.cnrAnalyzeImage = function (image) {
	var m = image.attr('src')
		.match(/(.+GenticsImageStore)\/(\d+)\/(\d+)\/cropandresize\/force\/(\d+)\/(\d+)\/(\d+)\/(\d+)\/(.+)/);
	if (m) {
		return {
			prefix : m[1],
			w : parseInt(m[2]), // resize width
			h : parseInt(m[3]), // resize height
			x : parseInt(m[4]), // x-pos of crop
			y : parseInt(m[5]), // y-pos of crop
			cw : parseInt(m[6]), // crop width
			ch : parseInt(m[7]), // crop height
			src : m[8], // image source
			id : parseInt(image.attr('data-gentics-aloha-object-id')), // gcn5's id for this image
			repository : image.attr('data-gentics-aloha-repository') // the corresponding repository
		};
	} else {
		return false;
	}
};

/**
 * Generate a GenticsImageStore cropandresize URL
 * URLs have to be generated this way to prevent nesting of GenticsImageStore calls in URLs
 * 
 * A GenticsImageStore URL looks like:
 * http://SERVER/GenticsImageStore
 * /300 - width
 * /200 - height
 * /cropandresize - mode
 * /force - resizemode
 * /20 - crop start left
 * /20 - crop start top
 * /100 - crop width
 * /100 - crop height
 * /http://dev42.office:91/node_5_stable/?sid=hXjD3HoJN31Bnam&time=1293543192&do=16000&id=214&keepsid=1 - img url
 * 
 * @param props object with crop and resize properties, eg:
 * {
 * 		w : 400, // resize width
 * 		h : 300, // resize height
 * 		x : 10, // x-pos of crop
 *		y : 10, // y-pos of crop
 *		cw : 200, // crop width
 *		ch : 150, // crop height
 *		src : 'http://...' // original image source
 * }
 */
GENTICS.Aloha.GCN.cnrURL = function (p) {
	return '/GenticsImageStore/' + 
		p.w + '/' +
		p.h + '/' +
		'cropandresize/force/' +
		p.x + '/' +
		p.y + '/' +
		p.cw + '/' +
		p.ch + '/' +
		p.src;
};

/**
 * Very ugly integration of "autosave before switching to another url" feature
 * of GCN. When content was modified but not saved, this will automatically save
 * the modified content
 * @param url
 *            url to switch to
 * @return void
 */
function cn3_go_list(url) {
	var where = undefined;
	if (top && top.main && top.main.list && parent && parent == top.main.list) {
		where = 'parent';
	}
	GENTICS.Aloha.GCN.openURL(url, where);
}

/**
 * And another ugly integration of "autosave", when URL is opened in new window
 * @param url url to show in new window
 * @return void
 */
function cn3_go_openwindow(url) {
	GENTICS.Aloha.GCN.openURL(url, 'popup');
}
