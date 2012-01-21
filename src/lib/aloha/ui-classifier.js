/*!
 * This file is part of Aloha Editor Project http://aloha-editor.org
 * Copyright © 2010-2011 Gentics Software GmbH, aloha@gentics.com
 * Contributors http://aloha-editor.org/contribution.php
 * Licensed unter the terms of http://www.aloha-editor.org/license.html
 *
 * Aloha Editor is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * ( at your option ) any later version.*
 *
 * Aloha Editor is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
define( [
	"aloha/jquery"
], function( $ ) {
	"use strict";

	var uiClasses = [
		"aloha-cleanme",
		"aloha-ui-wrapper",
		"aloha-ui-attr"
	];

	function stripUiShallow( elems ) {
		var classesToRemove = uiClasses.join(" ");
		elems.each(function() {
			var elem = $( this );
			if ( elem.hasClass( "aloha-cleanme" ) ) {
				elem.remove();
			} else if (    elem.hasClass( "aloha-ui-wrapper" )
						|| elem.hasClass( "aloha-ui-filler" ) ) {
				elem.replaceWith( elem.contents() );
			} else if ( elem.hasClass( "aloha-ui-attr" ) ) {
				var attrData = elem.attr( "data-aloha-ui-attr" );
				if ( null != attrData ) {
					var attrs = attrData.split(" ");
					var numAttrs = attrs.length;
					while ( numAttrs-- ) {
						elem.removeAttr( attrs[ numAttrs ] );
					}
				}
				elem.removeAttr( "data-aloha-ui-attr" );
				elem.removeClass( classesToRemove );
				if ( "" === elem.attr( "class" ) ) {
					elem.removeAttr( "class" );
				}
			}
		});
	}

	var UiClassifier = {
		/**
		 * Registers classes to be stripped by the stripUi and stripUiDeeply functions.
		 *
		 * The class-name should be of the form /^[a-z][a-z-]*$/.
		 */
		registerUiClasses: function( classes ) {
			uiClasses = uiClasses.concat( classes );
			Aloha.trigger( "aloha-ui-classes-registered", [ classes ] );
		},

		getRegisteredUiClasses: function() {
			return uiClasses;
		},

		letUiElement: function( elem ) {
			elem = $( elem );
			elem.addClass( "aloha-cleanme" );
		},

		/**
		 * Lets an attribute be qualified as a UI attribute.
		 */
		letUiAttr: function( elem, attr ) {
			elem = $( elem );
			var attrData = elem.attr( "data-aloha-ui-attr" );
			attrData = (null != attrData && "" !== attrData) ? " " + attr : attr;
			elem.attr( "data-aloha-ui-attr", attrData );
			elem.addClass( "aloha-ui-attr" );
		},

		letUiWrapper: function( elem ) {
			$( elem ).addClass( "aloha-ui-wrapper" );
		},

		letUiFiller: function( elem ) {
			$( elem ).addClass( "aloha-ui-filler" );
		},

		/**
		 * Strips content injected into an editable for presentational purposes.
		 */
		stripUiDeeply: function( elems ) {
			elems = $( elems );
			if ( elems.length ) {
				// We assume the class names don't need escaping
				var selector = "." + uiClasses.join(", .");
				stripUiShallow( elems.filter( selector ).add( elems.find( selector ) ) );
			}
		},

		/**
		 * Strips content injected into an editable for presentational purposes.
		 */
		stripUi: function( elems ) {
			stripUiShallow( $( elems ) );
		}
	};

	return UiClassifier;
});
