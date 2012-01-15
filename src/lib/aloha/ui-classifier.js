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
		"aloha-ui-element",
		"aloha-ui-wrapper",
		"aloha-ui-attr",
		"aloha-cleanme"
	];

	function stripUiShallow( elements ) {
		var classesToRemove = uiClasses.join(" ");
		elements.each(function() {
			var element = $( this );
			if ( element.hasClass( "aloha-ui-element" ) || element.hasClass( "aloha-cleanme" ) ) {
				element.remove();
			} else if ( element.hasClass( "aloha-ui-wrapper" ) ) {
				element.replaceWith( element.contents() );
			} else if ( element.hasClass( "aloha-ui-attr" ) ) {
				var attrData = element.attr( "data-aloha-ui-attr" );
				if ( null != attrData ) {
					var attrs = attrData.split(" ");
					var numAttrs = attrs.length;
					while ( numAttrs-- ) {
						element.removeAttr( attrs[ numAttrs ] );
					}
				}
				element.removeAttr( "data-aloha-ui-attr" );
				element.removeClass( classesToRemove );
				if ( "" === element.attr( "class" ) ) {
					element.removeAttr( "class" );
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
			if ( $.isArray( classes ) ) {
				uiClasses = uiClasses.concat( classes );
			} else {
				uiClasses.push( classes );
			}
		},

		letUiElement: function( element ) {
			element = $( element );
			element.addClass( "aloha-ui-element" );
		},

		/**
		 * Lets an attribute be qualified as a UI attribute.
		 */
		letUiAttr: function( element, attr ) {
			element = $( element );
			var attrData = element.attr( "data-aloha-ui-attr" );
			attrData = (null != attrData && "" !== attrData) ? " " + attr : attr;
			element.attr( "data-aloha-ui-attr", attrData );
			element.addClass( "aloha-ui-attr" );
		},

		letUiWrapper: function( element ) {
			element = $( element );
			element.addClass( "aloha-ui-wrapper" );
		},

		/**
		 * Strips content injected into an editable for presentational purposes.
		 */
		stripUiDeeply: function( elements ) {
			elements = $( elements );
			if ( elements.length ) {
				// We assume the class names don't need escaping
				var selector = "." + uiClasses.join(", .");
				stripUiShallow( elements.filter( selector ).add( elements.find( selector ) ) );
			}
		},

		/**
		 * Strips content injected into an editable for presentational purposes.
		 */
		stripUi: function( elements ) {
			stripUiShallow( $( elements ) );
		}
	};

	return UiClassifier;
});
