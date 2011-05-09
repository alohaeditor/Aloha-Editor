/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed unter the terms of http://www.aloha-editor.com/license.html
*/


(function(window, undefined) {
	var
		jQuery = window.alohaQuery, $ = jQuery,
		GENTICS = window.GENTICS,
		Aloha = window.Aloha;
	
	Aloha.HilightEditable = new (Aloha.Plugin.extend({ 
		_constructor: function(){
			this._super('highlighteditables');
		},
		
		init: function () {
	
			// remember refernce to this class for callback
			var that = this;
	
			// highlight editables as long as the mouse is moving
			GENTICS.Utils.Position.addMouseMoveCallback(function () {
				for ( var i = 0; i < Aloha.editables.length; i++) {
					var editable = Aloha.editables[i];
					if (!Aloha.activeEditable && !editable.isDisabled()) {
						editable.obj.addClass('GENTICS_editable_highlight');
					}
				}
			});
	
			// fade editable borders when mouse stops moving
			GENTICS.Utils.Position.addMouseStopCallback(function () {
				that.fade();
			});
	
			// mark active Editable with a css class
			Aloha.bind(
					"aloha-editable-activated",
					function (jEvent, aEvent) {
						aEvent.editable.obj.addClass('GENTICS_editable_active');
						that.fade();
					}
			);
	
			// remove active Editable ccs class
			Aloha.bind("aloha-editable-deactivated",
					function (jEvent, aEvent) {
						aEvent.editable.obj.removeClass('GENTICS_editable_active');
					}
			);
	
		},
		/**
		 * fades all highlighted editables
		 */
		fade: function () {
			for ( var i = 0; i < Aloha.editables.length; i++) {
				var editable = Aloha.editables[i].obj;
				if (editable.hasClass('GENTICS_editable_highlight')) {
					editable.removeClass('GENTICS_editable_highlight')
						.css('outline', '5px solid #FFE767')
						.animate({
							outlineWidth : '0px'
						}, 300, 'swing', function () {
							jQuery(this).css('outline', '');
						});
				}
			}
		}
		
	}))();
})(window);

