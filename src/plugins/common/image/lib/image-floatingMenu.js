/*global documents: true define: true */
/*!
 * Aloha Editor
 * Author & Copyright (c) 2011 Gentics Software GmbH
 * aloha-sales@gentics.com
 * Licensed under the terms of http://www.aloha-editor.com/license.html
 *
 * Author : Nicolas Karageuzian - http://nka.me
 */
define([
	'jquery',
    'util/class',
	'i18n!image/nls/i18n',
	'i18n!aloha/nls/i18n',
	'ui/ui',
	'ui/scopes',
    'ui/button',
    'ui/toggleButton',
	'ui/contextButton',
	'ui/icons',
	'ui/utils',
],
function (
	jQuery,
	Class,
	i18n,
	i18nCore,
	Ui,
	Scopes,
	Button,
	ToggleButton,
	ContextButton,
	Icons,
	Utils
) {
	'use strict';

	var $ = jQuery;
	var GENTICS = window.GENTICS;
	var Aloha = window.Aloha;

	/**
     * Toolbar elements for Image plugin
     *
     * @class MyClass
     */
	return Class.extend({
        /**
         * Empty constructor
         *
         * @method
         * @constructor
         */
		_constructor: function () {

		},

         /**
          * Initialize Floating menu buttons according to plugin config
          */
        init: function (plugin) {
			var that = this;
			plugin.floatingMenuControl = this;

			that.plugin = plugin;
			that.src = '';
			that.title = '';
			that.width = '';
			that.height = '';

			Scopes.registerScope(plugin.name, [Scopes.SCOPE_EMPTY]);

			this._editImage = Ui.adopt('imageEdit', ContextButton, {
				contextType: 'modal',
				icon: Icons.IMAGE_EDIT,
				context: function () {
					if (!plugin || !plugin.imageObj) {
						return null;
					}

					var src = plugin.imageObj.attr('src');
					var title = plugin.imageObj.attr('title');
					var width = plugin.imageObj.css('width');
					var height = plugin.imageObj.css('height');
					var pxIdx = width.indexOf('px');

					if (pxIdx > 0) {
						width = width.substring(0, pxIdx);
					}

					pxIdx = height.indexOf('px');

					if (pxIdx > 0) {
						height = height.substring(0, pxIdx);
					}

					return {
						title: i18n.t('modal.properties.title'),
						initialValue: {
							src: src,
							title: title,
							width: width,
							height: height,
						},
						controls: {
							src: {
								type: 'input',
								options: {
									label: i18n.t('field.img.label'),
								}
							},
							title: {
								type: 'input',
								options: {
									label: i18n.t('field.img.title.label'),
								}
							},
							width: {
								type: 'input',
								options: {
									label: i18n.t('width'),
								},
							},
							height: {
								type: 'input',
								options: {
									label: i18n.t('height'),
								}
							}
						},
						onChange: function (value, control) {
							if (!plugin.keepAspectRatio) {
								return;
							}

							var widthChanged = that.width != control.value.width;
							var heightChanged = that.height != control.value.height;

							if (!widthChanged && !heightChanged) {
								return;
							}

							var w = parseInt(that.width);
							var h = parseInt(that.height);
							var ratio = w / h;

							if (widthChanged) {
								w = parseInt(control.value.width);
								h = w / ratio;
							}

							if (heightChanged) {
								h = parseInt(control.value.height);
								w = h * ratio;
							}

							that.width = w.toString();
							that.height = h.toString();
							control.setValue({
								src: control.value.src,
								title: control.value.title,
								width: that.width,
								height: that.height,
							})
						}
					};
				},
				contextResolve: function (data) {
					that.src = data.src;
					that.title = data.title;
					that.width = data.width;
					that.height = data.height;
					plugin.setSizeByFieldValue();
					plugin.srcChange();
				},
				contextReject: function (error) {
					if (!Utils.isUserCloseError(error)) {
						console.log(error);
					}
				}
			 });

			this._addUIInsertButton();
			this._addUIResetButton();
			this._addUIAlignButtons();
			this._addUIMarginButtons();
			this._addUICropButtons();
			this._addUIAspectRatioToggleButton();
			this._addFocalPointButton();
		},

		/**
		 * Adds the aspect ratio toggle button to the floating menu
		 */
		_addUIAspectRatioToggleButton: function () {
			var that = this;
			var plugin = that.plugin;

			this._imageCnrRatioButton = Ui.adopt("imageCnrRatio", ToggleButton, {
				tooltip: i18n.t('button.toggle.tooltip'),
				icon: Icons.IMAGE_RATIO,
				pure: true,
				onToggle: function (active) {
					plugin.toggleKeepAspectRatio(active);
					that._imageCnrRatioButton.setActive(active);
				}
			});

			// If the setting has been set to a number or false we need to activate the
			// toggle button to indicate that the aspect ratio will be preserved.
			if (plugin.settings.fixedAspectRatio !== false) {
				this._imageCnrRatioButton.setActive(true);
				plugin.keepAspectRatio = true;
			}
		},

		/**
		 * Adds the reset button to the floating menu for the given tab
		 */
		_addUIResetButton: function () {
			var plugin = this.plugin;

			this._imageCnrResetButton = Ui.adopt("imageCnrReset", Button, {
				tooltip: i18n.t('Reset'),
				icon: Icons.IMAGE_RESET,
				click: function () {
					plugin.reset();
				}
			});
		},

		/**
		 * Adds the insert button to the floating menu
		 */
		_addUIInsertButton: function () {
			var plugin = this.plugin;

			this._insertImageButton = Ui.adopt("insertImage", Button, {
				tooltip: i18n.t('button.addimg.tooltip'),
				icon: 'aloha-button aloha-image-insert',
				click: function () {
					plugin.insertImg();
				}
			});
		},

		/**
		 * Adds the ui align buttons to the floating menu
		 */
		_addUIAlignButtons: function () {
			var plugin = this.plugin;

			this._imageAlignLeftButton = Ui.adopt("imageAlignLeft", Button, {
				tooltip: i18n.t('button.img.align.left.tooltip'),
				icon: Icons.IMAGE_ALIGN_LEFT,
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'left');
				}
			});

			this._imageAlignRightButton = Ui.adopt("imageAlignRight", Button, {
				tooltip: i18n.t('button.img.align.right.tooltip'),
				icon: Icons.IMAGE_ALIGN_RIGHT,
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css('float', 'right');
				}
			});

			this._imageAlignNoneButton = Ui.adopt("imageAlignNone", Button, {
				tooltip: i18n.t('button.img.align.none.tooltip'),
				icon: Icons.IMAGE_ALIGN_NONE,
				click : function () {
					var el = jQuery(plugin.getPluginFocus());
					el.add(el.parent()).css({
						'float': 'none',
						display: 'inline-block'
					});
				}
			});
		},

		/**
		 * Adds the ui margin buttons to the floating menu
		 */
		_addUIMarginButtons: function () {
			var plugin = this.plugin;

			this._imageIncPaddingButton = Ui.adopt("imageIncPadding", Button, {
				tooltip: i18n.t('padding.increase'),
				icon: Icons.IMAGE_INCREASE_PADDING,
				click: function () {
					jQuery(plugin.getPluginFocus()).increase('padding');
				}
			});

			this._imageDecPaddingButton = Ui.adopt("imageDecPadding", Button, {
				tooltip: i18n.t('padding.decrease'),
				icon: Icons.IMAGE_DECREASE_PADDING,
				click: function () {
					jQuery(plugin.getPluginFocus()).decrease('padding');
				}
			});
		},

		/**
		 * Adds the crop buttons to the floating menu
		 */
		_addUICropButtons: function () {
			var plugin = this.plugin;

			Scopes.registerScope('Aloha.img', [Scopes.SCOPE_GLOBAL]);

			this._imageCropButton = Ui.adopt("imageCropButton", ToggleButton, {
				tooltip: i18n.t('Crop'),
				icon: Icons.IMAGE_CROP,
				pure: true,
				onToggle: function (active) {
					if (active) {
						plugin.crop();
					} else {
						plugin.endCrop();
					}
				}
			});
		},

		_addFocalPointButton: function() {
			var plugin = this.plugin;

			Scopes.registerScope('Aloha.img', [Scopes.SCOPE_GLOBAL]);

			this._imageFocalPointButton = Ui.adopt("imageFocalPointButton", ToggleButton, {
				tooltip: i18n.t('focalpoint'),
				icon: Icons.IMAGE_FOCAL_POINT,
				pure: true,
				onToggle: function (active) {
					if (active) {
						plugin.enableFocalPointMode();
					} else {
						plugin.disableFocalPointMode();
					}
				}
			});

		},

		/**
		 * Sets the scope
		 */
		setScope: function () {
			// Scopes.setScope(this.plugin.name);
		},

		/**
		 * Redraws UI
		 */
		doLayout: function () {
			// Implementation was removed while porting this plugin to
			// the jqueryui toolbar because it seems to be a hack that
			// is not needed with the new implementation.
		}
	});
});
