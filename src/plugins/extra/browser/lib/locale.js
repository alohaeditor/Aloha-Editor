define( [
	'aloha/jquery',
	'i18n!browser/nls/i18n',
	'jquery-plugin!browser/../vendor/grid.locale.en',
	'jquery-plugin!browser/../vendor/grid.locale.de'
], function ( jQuery, i18n ) {
	var locale = i18n[ 'jgrid.locale' ] || 'en';
	if ( typeof jQuery.jgrid === 'undefined' ) {
		jQuery.jgrid = {};
	}
	jQuery.extend( jQuery.jgrid, jQuery[ 'jgrid_' + locale ] );
} );