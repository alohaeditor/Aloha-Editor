/*!
* Aloha Editor
* Author & Copyright (c) 2010 Gentics Software GmbH
* aloha-sales@gentics.com
* Licensed under the terms of http://www.aloha-editor.com/license.html
*/

define(['aloha/jquery','i18n!image/nls/i18n', 'i18n!aloha/nls/i18n'],
function(aQuery, i18n, i18nCore){
	var jQuery = $ = aQuery,
	   	imageNamespace = 'aloha-image';
	return {
		init: function(pl, sidebar) {
			var sb = this;
			pl.sidebar = sidebar;
			this.pl = pl;
			sidebar.addPanel({
				id       : sb.nsClass('sidebar-panel-target'),
				title    : i18n.t('floatingmenu.tab.img'),
				content  : '',
				expanded : true,
				activeOn : 'img, image',
				
				onInit     : function () {
					 var that = this,
						 content = this.setContent(
							'<div class="' + sb.nsClass('src-container') + '"><fieldset><legend>' + i18n.t('field.img.src.label') + '</legend>' +
							'<input type="text" class="' + sb.nsClass('imageSrc') + '" /></fieldset></div>' + 
							'<div class="' + sb.nsClass('title-container') + '" ><fieldset><legend>' + i18n.t('field.img.title.label') +
							'</legend><input type="text" class="' + sb.nsClass('imageTitle') + '" /></fieldset></div>').content; 
					 
					 jQuery( sb.nsSel('framename') ).live( 'keyup', function() {
						jQuery( that.effective )
							.attr( "src", jQuery(this).val().replace("\"", '&quot;').replace("'", "&#39;") );
					 });
					 jQuery( sb.nsSel('imageTitle') ).live( 'keyup', function() {
						jQuery( that.effective )
							.attr( "title", jQuery(this).val().replace("\"", '&quot;').replace("'", "&#39;") );
					 });
				},
				
				onActivate: function (effective) {
					var that = this;
					that.effective = effective;
					
					var that = this;
					that.effective = effective;
					jQuery( sb.nsSel('imageTitle') ).val( jQuery(that.effective).attr('title') );
				}
				
			});
			
			sidebar.show();
		},
		nsSel: function () {
			var stringBuilder = [], prefix = imageNamespace,
				that = this;
			jQuery.each(arguments, function () { stringBuilder.push('.' + (this == '' ? prefix : prefix + '-' + this)); });
			return stringBuilder.join(' ').trim();
		},

		//Creates string with this component's namepsace prefixed the each classname
		nsClass: function () {
			var stringBuilder = [], prefix = imageNamespace,
				that = this;
			jQuery.each(arguments, function () { stringBuilder.push(this == '' ? prefix : prefix + '-' + this); });
			return stringBuilder.join(' ').trim();
		},
		update: function() {
			var 
				range = rangy.createRangyRange(this.pl.imageObj);
			range.markupEffectiveAtStart = [this.pl.imageObj];
			Aloha.Sidebar.right.checkActivePanels(range);
		}
	};
});