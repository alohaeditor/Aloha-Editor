define( [
	'aloha',
	'jquery',
	'aloha/plugin',
	'../../cms/extra/cms-linklist' // custom linklist
], function ( Aloha, jQuery, Plugin ) {
	
	var GENTICS = window.GENTICS;

	/**
	 * register the plugin with unique name
	 */
	return Plugin.create( 'cms-plugin', {

		/**
		 * Initialize the plugin and set initialize flag on true
		 */
		init: function () {
			// do nothing
		},

		/**
		* toString method
		* @return string
		*/
		toString: function () {
			return 'cms-plugin';
		}

	} );
	
} );
