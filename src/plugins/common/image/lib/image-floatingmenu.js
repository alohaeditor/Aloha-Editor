define(['aloha/jquery','i18n!image/nls/i18n', 'i18n!aloha/nls/i18n','aloha/floatingmenu'],
function(aQuery, i18n, i18nCore, FloatingMenu){
	return {
		init: function(pl) {
			this.pl = pl;
			pl.floatingMenuControl = this;
			FloatingMenu.createScope(pl.name, 'Aloha.empty');
			
			if (this.pl.settings.ui.insert) {
				//i18nCore.t('floatingmenu.tab.insert')
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Insert'; 
				this._addUIInsertButton(tabId);
			}
			
			if (this.pl.settings.ui.meta) {
				//i18n.t('floatingmenu.tab.img')
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Image';
				this._addUIMetaButtons(tabId);
			}
			if (this.pl.settings.ui.reset) {
				var tabId = this.pl.settings.ui.reset ? 'Image' : 'Image';
				this._addUIResetButton(tabId);
			}
			if (this.pl.settings.ui.align) {
				//i18n.t('floatingmenu.tab.format')
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Formatting';
				this._addUIAlignButtons(tabId);
			}
			if (this.pl.settings.ui.margin) {
				//i18n.t('floatingmenu.tab.img'){
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Formatting';
				this._addUIMarginButtons(tabId);
			}
			if (this.pl.settings.ui.crop) {
				//i18n.t('floatingmenu.tab.img')
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Crop';
				this._addUICropButtons(tabId);
			}
			if (this.pl.settings.ui.resize) {
				//i18n.t('floatingmenu.tab.img')
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Resize';
				this._addUIResizeButtons(tabId);
			}
			if (this.pl.settings.ui.aspectRatioToggle) {
				var tabId = this.pl.settings.ui.oneTab ? 'Image' : 'Resize';
				this.__addUIAspectRatioToggleButton(tabId);
			}

			// TODO fix the function and reenable this button 
			//that._addNaturalSizeButton();
			
		},
		
		/**
		 * Adds the insert button to the floating menu
		 */
		_addUIInsertButton: function(tabId) {
			var that = this.pl;
			this.insertImgButton = new Aloha.ui.Button({
				'iconClass': 'aloha-button aloha-image-insert',
				'size' : 'small',
				'onclick' : function () { that.insertImg(); },
				'tooltip' : i18n.t('button.addimg.tooltip'),
				'toggle' : false
			});
			
			FloatingMenu.addButton(
				'Aloha.continuoustext',
				this.insertImgButton,
				tabId,
				1
			);
		},
		
		/**
	 	 * Adds the ui meta fields (search, title) to the floating menu. 
		 */
		_addUIMetaButtons: function(tabId) {
			var that = this.pl;
			var imgSrcLabel = new Aloha.ui.Button({
				'label': i18n.t('field.img.src.label'),
				'tooltip': i18n.t('field.img.src.tooltip'),
				'size': 'small'
			});
			this.imgSrcField = new Aloha.ui.AttributeField();
			this.imgSrcField.setObjectTypeFilter( this.objectTypeFilter );
			
			// add the title field for images
			var imgTitleLabel = new Aloha.ui.Button({
				'label': i18n.t('field.img.title.label'),
				'tooltip': i18n.t('field.img.title.tooltip'),
				'size': 'small'
			});
			
			this.imgTitleField = new Aloha.ui.AttributeField();
			this.imgTitleField.setObjectTypeFilter();
			FloatingMenu.addButton(
				that.name,
				this.imgSrcField,
				tabId,
				1
			);
			
		},
		
		/**
		 * Adds the reset button to the floating menu for the given tab 
		 */
		_addUIResetButton: function(tabId) {
			var that = this.pl;
			// Reset button
			var resetButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('Reset'),
				'toggle' : false,
				'iconClass' : 'cnr-reset',
				'onclick' : function (btn, event) {
					that.reset();
				}
			});

			FloatingMenu.addButton(
				that.name,
				resetButton,
				tabId,
				2
			);
		},
		

		/**
		 * Adds the ui align buttons to the floating menu
		 */
		_addUIAlignButtons: function(tabId) {
			var that = this.pl;
		
			var	alignLeftButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-left',
				'size': 'small',
				'onclick' : function() {
					var el = jQuery(that.findImgMarkup());
					el.add(el.parent()).css('float', 'left');
				},
				'tooltip': i18n.t('button.img.align.left.tooltip')
			});
			
			FloatingMenu.addButton(
				that.name,
				alignLeftButton,
				tabId,
				1
			);
			
			var alignRightButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-right',
				'size': 'small',
				'onclick' : function() {
					var el = jQuery(that.findImgMarkup());
					el.add(el.parent()).css('float', 'right');
				},
				'tooltip': i18n.t('button.img.align.right.tooltip')
			});
			
			FloatingMenu.addButton(
				that.name,
				alignRightButton,
				tabId,
				1
			);
			
			var alignNoneButton = new Aloha.ui.Button({
				'iconClass': 'aloha-img aloha-image-align-none',
				'size': 'small',
				'onclick' : function() {
					var el = jQuery(that.findImgMarkup());
					el.add(el.parent()).css({
						'float': 'none',
						display: 'inline-block'
					});
				},
				'tooltip': i18n.t('button.img.align.none.tooltip')
			});
			
			FloatingMenu.addButton(
				that.name,
				alignNoneButton,
				tabId,
				1
			);
		
		},
		
		/**
		 * Adds the ui margin buttons to the floating menu
		 */
		_addUIMarginButtons: function(tabId) {
			var that = this.pl;
			var incPadding = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-padding-increase',
				toggle: false,
				size: 'small',
				onclick: function() {
					jQuery(that.findImgMarkup()).increase('padding');
				},
				tooltip: i18n.t('padding.increase')
			});
			FloatingMenu.addButton(
				that.name,
				incPadding,
				tabId,
				2
			);
			
			var decPadding = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-padding-decrease',
				toggle: false,
				size: 'small',
				onclick: function() {
					jQuery(that.findImgMarkup()).decrease('padding');
				},
				tooltip: i18n.t('padding.decrease')
			});
			FloatingMenu.addButton(
				that.name,
				decPadding,
				tabId,
				2
			);
		},
		/**
		 * Adds the crop buttons to the floating menu
		 */		
 		_addUICropButtons: function (tabId) {
 			var that = this.pl;
 			
 			FloatingMenu.createScope('Aloha.img', ['Aloha.global']);

			this.cropButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('Crop'),
				'toggle' : true,
				'iconClass' : 'cnr-crop',
				'onclick' : function (btn, event) {
					if (btn.pressed) {
						that.crop();
					} else {
						that.endCrop();
					}
				}
			});

			FloatingMenu.addButton(
				that.name,
				this.cropButton,
				tabId,
				3
			);
	
 		},
 		
 		/**
 		 * Adds the resize buttons to the floating menu
 		 */	
 		_addUIResizeButtons: function (tabId) {
	 		var that = this.pl;
	 		
			// Manual resize fields
			this.imgResizeHeightField = new Aloha.ui.AttributeField();
			this.imgResizeHeightField.maxValue = that.settings.maxHeight;
			this.imgResizeHeightField.minValue = that.settings.minHeight;
			
			this.imgResizeWidthField = new Aloha.ui.AttributeField();
			this.imgResizeWidthField.maxValue = that.settings.maxWidth;
			this.imgResizeWidthField.minValue = that.settings.minWidth;

			this.imgResizeWidthField.width = 50;
			this.imgResizeHeightField.width = 50;
			
			var widthLabel = new Aloha.ui.Button({
				'label':  i18n.t('width'),
				'tooltip': i18n.t('width'),
				'size': 'small'
			});
			
			FloatingMenu.addButton(
					that.name,
					widthLabel,
					tabId,
					30
			);
			
			FloatingMenu.addButton(
					that.name,
					this.imgResizeWidthField,
					tabId,
					40
			);
			
			
			var heightLabel = new Aloha.ui.Button({
				'label':  i18n.t('height'),
				'tooltip': i18n.t('height'),
				'size': 'small'
			});
			
			FloatingMenu.addButton(
					that.name,
					heightLabel,
					tabId,
					50
			);
			
			FloatingMenu.addButton(
					that.name,
					this.imgResizeHeightField,
					tabId,
					60
			);
			
		
 		},
 		
 		/**
		 * Adds the aspect ratio toggle button to the floating menu
		 */
		__addUIAspectRatioToggleButton: function(tabId) {
			var that = this.pl;
			var toggleButton = new Aloha.ui.Button({
				'size' : 'small',
				'tooltip' : i18n.t('button.toggle.tooltip'),
				'toggle' : true,
				'iconClass' : 'cnr-ratio',
				'onclick' : function (btn, event) {
					that.toggleKeepAspectRatio();
				}
			});
			

			// If the setting has been set to a number or false we need to activate the 
			// toggle button to indicate that the aspect ratio will be preserved.
			if (that.settings.fixedAspectRatio != false) {
				toggleButton.pressed = true;
				that.keepAspectRatio = true;
			}
			
			FloatingMenu.addButton(
				that.name,
				toggleButton,
				tabId,
				20
			);
			

		},
		/**
		 * Adds the natural size button to the floating menu
		 */
		 _addNaturalSizeButton: function () {
	    	var that = this.pl;
			var naturalSize = new Aloha.ui.Button({
				iconClass: 'aloha-img aloha-image-size-natural',
				size: 'small',
				toggle: false,
				onclick: function() {
					var	img = new Image();
					img.onload = function() {
						var myimage = that.findImgMarkup();
						if (that.settings.ui.resizable) {
							that.endResize();
						}
						jQuery(myimage).css({
								'width': img.width + 'px',
								'height': img.height + 'px',
								'max-width': '',
								'max-height': ''
							});
						if (that.settings.ui.resizable) {
							that.resize();
						}
					};
					img.src = that.findImgMarkup().src;
						
				},
				tooltip: i18n.t('size.natural')
			});
			FloatingMenu.addButton(
				that.name,
				naturalSize,
				'Resize',	//i18n.t('floatingmenu.tab.img'),
				2
			);
		},
		
	}
});