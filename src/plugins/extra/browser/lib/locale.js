define( [
	'i18n!browser/nls/i18n',
	'browser/locale.en',
	'browser/locale.de'
], function () {
	var args = Array.prototype.slice.call( arguments ),
	    locale = args[ 0 ][ 'jgrid.locale' ] || 'en';
	
	for ( var i = 1; i < args.length; i++ ) {
		if ( args[ i ].aloha_locale == locale ) {
			Aloha.jQuery.jgrid = args[ i ];
			return;
		}
	}
} );