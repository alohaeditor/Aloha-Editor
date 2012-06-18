/**
 * Aloha Editor User Interface API Semantics
 * =========================================
 *
 * Note
 * ===
 *    * This documentation is "thinking out loud," and very much "work in work
 *      in progress--as is the Aloha UI API itself.
 *
 *    * For flexibility and ease, it seems that it would be best that the Aloha
 *      UI API will not constrain the developer to these semantics, but will
 *      naively assume that these semantics are observed.
 *
 * Components (Buttons, Labels, Icons)
 * ---
 * Aloha Editor represents its user interface using objects called
 * `components`.  A uniform interface for these components allows them to be
 * agnostic to what container they are rendered on.
 *
 * Controls (Buttons)
 * ---
 * Interactive components like buttons, are called `controls`, to distinguish
 * them from non-interactive components like labels, and icons.
 *
 * Containers (Tabs, Panels)
 * ---
 * In rendering the UI, components are organized in visual groups, and these
 * groups are in turn bundled onto `containers`.  Containers can be tabs, as in
 * the case of the floating menu, or panels like in the sidebar.  Containers
 * allow a collection of controls that represent a feature set to be rendered
 * as a group and to be brought in and out of view together.
 *
 * Surfaces (Toolbar, Sidebar, Ribbon)
 * ---
 * `Surfaces` are areas on a web page in which containers can be placed.  The
 * sidebar, and the toolbar are examples of such surfaces.  The possibility
 * exists for other surfaces to be defined--such as a ribbon, or a footer menu.
 *
 *
 * Class structure
 * ===
 *
 *         Surface
 *	          |
 *	     ,----+----.
 *       |         |
 *	  Toolbar   Sidebar
 *
 *
 *        Container
 *	          |
 *	     ,----+----.
 *       |         |
 *	   Panel      Tab
 *
 *
 *        Component
 *            |
 *	     ,----+----.
 *       |         |
 *	   Label    Control
 *
 *
 * Enforcing good dependencies
 * ===
 * In order to void subtle errors that arise from erroneous dependency
 * declarations, we will have ill-defined or missing dependencies fail early
 * and noisily.  We achieve this by never exposing individual modules through
 * the Aloha.ui hash unless absolutely necessary. Modules are accessibly only
 * through require.
 *
 * How this works:
 * For example, a ui module "uiModule" would not be exposed through
 * `Aloha.ui.uiModule` but from require's `define` call:

 *		define([ 'ui/uiModule' ], function( uiModule ) {});

 * or

 *		var uiModule = Aloha.require( 'ui/uiModule' );
 * 
 * This will force more deliberate and precise usage of dependencies.  The
 * developer will have to know exactly which direct dependencies they are using;
 * any missing or unsuccessfully require dependency will not inadvertantly be
 * provided from another require somewhere else in Aloha thereby silencing an
 * error that will emerge unexpectedly if that require is ever removed.
 */

define([
	'aloha/core',
	'aloha/jquery'
],
function( Aloha, jQuery ) {
	// Temporary location helper methods.
	// TODO: These need to live somewhere not tied to the UI.
	var Ui = {
		util: {
			findElemFromRange: function( selector, range ) {
				range = range || Aloha.getSelection().getRangeAt( 0 );
				range = new GENTICS.Utils.RangeObject( range );
				return range.findMarkup(function() {
					return jQuery( this ).is( selector );
				});
			}
		}
	};

	return Ui;
});
