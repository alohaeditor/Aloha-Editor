/**
 * content.js is part of Aloha Editor project http://aloha-editor.org
 *
 * Aloha Editor is a WYSIWYG HTML5 inline editing library and editor.
 * Copyright (c) 2010-2014 Gentics Software GmbH, Vienna, Austria.
 * Contributors http://aloha-editor.org/contribution.php
 */
define([], function Content() {
	'use strict';

	var TABLE_CHILDREN = {
		'CAPTION'  : true,
		'COLGROUP' : true,
		'THEAD'    : true,
		'TBODY'    : true,
		'TFOOT'    : true,
		'TR'       : true
	};

	var TR_CHILDREN = {
		'TH' : true,
		'TD' : true
	};

	var SELECT_CHILDREN = {
		'OPTION'   : true,
		'OPTGROUP' : true
	};

	var RUBY_CHILDREN = {
		'_PHRASING_' : true,
		'RT'         : true,
		'RP'         : true
	};

	var MENU_CHILDREN = {
		'LI'     : true,
		'_FLOW_' : true
	};

	var HGROUP_CHILDREN = {
		'H1' : true,
		'H2' : true,
		'H3' : true,
		'H4' : true,
		'H5' : true,
		'H6' : true
	};

	var FIGURE_CHILDREN = {
		'FIGCAPTION' : true,
		'_FLOW_'     : true
	};

	var FIELDSET_CHILDREN = {
		'LEGEND' : true,
		'_FLOW_' : true
	};

	var DL_CHILDREN = {
		'DT' : true,
		'DD' : true
	};

	var DETAILS = {
		'SUMMARY' : true,
		'_FLOW_'  : true
	};

	var DATALIST = {
		'_PHRASING_' : true,
		'OPTION'     : true
	};

	/**
	 * The complete set of HTML(5) elements, mapped to their respective content
	 * models, which define what types of HTML nodes are permitted as their
	 * children.
	 *
	 * http://www.w3.org/html/wg/drafts/html/master/index.html#elements-1
	 * http://www.whatwg.org/specs/web-apps/current-work/#elements-1
	 */
	var ALLOWED_CHILDREN = {
		'A'                  : '_PHRASING_', // transparent
		'ABBR'               : '_PHRASING_',
		'ADDRESS'            : '_FLOW_',
		'AREA'               : '_EMPTY_',
		'ARTICLE'            : '_FLOW_',
		'ASIDE'              : '_FLOW_',
		'AUDIO'              : 'SOURCE', // transparent
		'B'                  : '_PHRASING_',
		'BASE'               : '_EMPTY_',
		'BDO'                : '_PHRASING_',
		'BLOCKQUOTE'         : '_PHRASING_',
		'BODY'               : '_FLOW_',
		'BR'                 : '_EMPTY_',
		'BUTTON'             : '_PHRASING_',
		'CANVAS'             : '_PHRASING_', // transparent
		'CAPTION'            : '_FLOW_',
		'CITE'               : '_PHRASING_',
		'CODE'               : '_PHRASING_',
		'COL'                : '_EMPTY_',
		'COLGROUP'           : 'COL',
		'COMMAND'            : '_EMPTY_',
		'DATALIST'           : DATALIST,
		'DD'                 : '_FLOW_',
		'DEL'                : '_PHRASING_',
		'DIV'                : '_FLOW_',
		'DETAILS'            : DETAILS,
		'DFN'                : '_FLOW_',
		'DL'                 : DL_CHILDREN,
		'DT'                 : '_PHRASING_', // varies
		'EM'                 : '_PHRASING_',
		'EMBED'              : '_EMPTY_',
		'FIELDSET'           : FIELDSET_CHILDREN,
		'FIGCAPTION'         : '_FLOW_',
		'FIGURE'             : FIGURE_CHILDREN,
		 // Because processing content orginating from paste events my contain
		 // font nodes, we need to accomodate this element, even though it is
		 // non-standard.
		 // http://htmlhelp.com/reference/html40/special/font.html
		'FONT'               : '_PHRASING__',
		'FOOTER'             : '_FLOW_',
		'FORM'               : '_FLOW_',
		'H1'                 : '_PHRASING_',
		'H2'                 : '_PHRASING_',
		'H3'                 : '_PHRASING_',
		'H4'                 : '_PHRASING_',
		'H5'                 : '_PHRASING_',
		'H6'                 : '_PHRASING_',
		'HEADER'             : '_FLOW_',
		'HGROUP'             : HGROUP_CHILDREN,
		'HR'                 : '_EMPTY_',
		'I'                  : '_PHRASING_',
		'IFRAME'             : '#TEXT',
		'IMG'                : '_EMPTY_',
		'INPUT'              : '_EMPTY_',
		'INS'                : '_PHRASING_', // transparent
		'KBD'                : '_PHRASING_',
		'KEYGEN'             : '_EMPTY_',
		'LABEL'              : '_PHRASING_',
		'LEGEND'             : '_PHRASING_',
		'LI'                 : '_FLOW_',
		'LINK'               : '_EMPTY_',
		'MAP'                : 'AREA', // transparent
		'MARK'               : '_PHRASING_',
		'MENU'               : MENU_CHILDREN,
		'META'               : '_EMPTY_',
		'METER'              : '_PHRASING_',
		'NAV'                : '_FLOW_',
		'NOSCRIPT'           : '_PHRASING_', // varies
		'OBJECT'             : 'PARAM', // transparent
		'OL'                 : 'LI',
		'OPTGROUP'           : 'OPTION',
		'OPTION'             : '#TEXT',
		'OUTPUT'             : '_PHRASING_',
		'P'                  : '_PHRASING_',
		'PARAM'              : '_EMPTY_',
		'PRE'                : '_PHRASING_',
		'PROGRESS'           : '_PHRASING_',
		'Q'                  : '_PHRASING_',
		'RP'                 : '_PHRASING_',
		'RT'                 : '_PHRASING_',
		'RUBY'               : RUBY_CHILDREN,
		'S'                  : '_PHRASING_',
		'SAMP'               : 'pharsing',
		'SCRIPT'             : '#script', //script
		'SECTION'            : '_FLOW_',
		'SELECT'             : SELECT_CHILDREN,
		'SMALL'              : '_PHRASING_',
		'SOURCE'             : '_EMPTY_',
		'SPAN'               : '_PHRASING_',
		'STRONG'             : '_PHRASING_',
		'STYLE'              : '_PHRASING_', // varies
		'SUB'                : '_PHRASING_',
		'SUMMARY'            : '_PHRASING_',
		'SUP'                : '_PHRASING_',
		'TABLE'              : TABLE_CHILDREN,
		'TBODY'              : 'TR',
		'TD'                 : '_FLOW_',
		'TEXTAREA'           : '#TEXT',
		'TFOOT'              : 'TR',
		'TH'                 : '_PHRASING_',
		'THEAD'              : 'TR',
		'TIME'               : '_PHRASING_',
		'TITLE'              : '#TEXT',
		'TR'                 : TR_CHILDREN,
		'TRACK'              : '_EMPTY_',
		'U'                  : '_PHRASING_',
		'UL'                 : 'LI',
		'VAR'                : '_PHRASING_',
		'VIDEO'              : 'SOURCE', // transparent
		'WBR'                : '_EMPTY_',
		'#DOCUMENT-FRAGMENT' : '_FLOW_'
	};

	var FLOW_PHRASING_CATEGORY = {
		'_FLOW_'     : true,
		'_PHRASING_' : true
	};

	var FLOW_SECTIONING_CATEGORY = {
		'_FLOW_'     : true,
		'_PHRASING_' : true
	};

	var FLOW_HEADING_CATEGORY = {
		'_FLOW_'     : true,
		'_HEADER_'   : true
	};

	var FLOW_CATEGORY = {
		'_FLOW_'     : true
	};

	var CONTENT_CATEGORIES = {
		'A'          : {
			'_FLOW_'        : true,
			'_INTERACTIVE_' : true,
			'_PHRASING_'    : true
		},
		'ABBR'       : FLOW_PHRASING_CATEGORY,
		'ADDRESS'    : FLOW_CATEGORY,
		'AREA'       : FLOW_PHRASING_CATEGORY,
		'ARTICLE'    : FLOW_SECTIONING_CATEGORY,
		'ASIDE'      : FLOW_SECTIONING_CATEGORY,
		'AUDIO'      : {
			'_EMBEDDED_'    : true,
			'_FLOW_'        : true,
			'_INTERACTIVE_' : true,
			'_PHRASING_'    : true
		},
		'B'          : FLOW_PHRASING_CATEGORY,
		'BASE'       : {
			'_META_DATA_'   : true
		},
		'BDI'        : FLOW_PHRASING_CATEGORY,
		'BDO'        : FLOW_PHRASING_CATEGORY,
		'BLOCKQUOTE' : {
			'_FLOW_'            : true,
			'_SECTIONING_ROOT_' : true
		},
		'BODY'       : {
			'_SECTIONING_ROOT_' : true
		},
		'BR'         : FLOW_PHRASING_CATEGORY,
		'BUTTON'     : {
			'_EMBEDDED_'        : true,
			'_FLOW_'            : true,
			'_INTERACTIVE_'     : true,
			'_PHRASING_'        : true,
			'_LISTED_'          : true,
			'_LABELABLE_'       : true,
			'_SUBMITTABLE_'     : true,
			'_REASSOCIATABLE_'  : true,
			'_FORM_ASSOCIATED_' : true
		},
		'CANVAS'     : {
			'_EMBEDDED_'        : true,
			'_FLOW_'            : true,
			'_PHRASING_'        : true
		},
		'CAPTION'    : {},
		'CITE'       : FLOW_PHRASING_CATEGORY,
		'CODE'       : FLOW_PHRASING_CATEGORY,
		'COL'        : {},
		'COLGROUP'   : {},
		'COMMAND'    : {}, // ?
		'DATALIST'   : FLOW_PHRASING_CATEGORY,
		'DD'         : {},
		'DEL'        : FLOW_PHRASING_CATEGORY,
		'DETAILS'    : {
			'_FLOW_'            : true,
			'_SECTIONING_ROOT_' : true,
			'_INTERACTIVE_'     : true
		},
		'DFN'        : FLOW_PHRASING_CATEGORY,
		'DIV'        : FLOW_CATEGORY,
		'DL'         : FLOW_CATEGORY,
		'DT'         : {},
		'EM'         : FLOW_PHRASING_CATEGORY,
		'EMBED'      : {
			'_EMBEDDED_'        : true,
			'_FLOW_'            : true,
			'_INTERACTIVE_'     : true,
			'_PHRASING_'        : true
		},
		'FIELDSET'   : {
			'_FLOW_'            : true,
			'_FORM_ASSOCIATED_' : true,
			'_LISTED_'          : true,
			'_REASSOCIATABLE_'  : true,
			'_SECTIONING_ROOT_' : true
		},
		'FIGCAPTION' : {},
		'FIGURE'     : {
			'_FLOW_'            : true,
			'_SECTIONING_ROOT_' : true
		},
		'FONT'       : FLOW_PHRASING_CATEGORY,
		'FOOTER'     : FLOW_CATEGORY,
		'FORM'       : FLOW_CATEGORY,
		'H1'         : FLOW_HEADING_CATEGORY,
		'H2'         : FLOW_HEADING_CATEGORY,
		'H3'         : FLOW_HEADING_CATEGORY,
		'H4'         : FLOW_HEADING_CATEGORY,
		'H5'         : FLOW_HEADING_CATEGORY,
		'H6'         : FLOW_HEADING_CATEGORY,
		'HEADER'     : FLOW_CATEGORY,
		'HGROUP'     : FLOW_HEADING_CATEGORY,
		'HR'         : FLOW_CATEGORY,
		'I'          : FLOW_PHRASING_CATEGORY,
		'IFRAME'     : {
			'_EMBEDDED_'        : true,
			'_FLOW_'            : true,
			'_INTERACTIVE_'     : true,
			'_PHRASING_'        : true
		},
		'IMG'        : {
			'_EMBEDDED_'        : true,
			'_FLOW_'            : true,
			'_FORM_ASSOCIATED_' : true,
			'_INTERACTIVE_'     : true,
			'_PHRASING_'        : true
		},
		'INPUT'      : {
			'_FLOW_'            : true,
			'_FORM_ASSOCIATED_' : true,
			'_INTERACTIVE_'     : true,
			'_LABELABLE_'       : true,
			'_LISTED_'          : true,
			'_PHRASING_'        : true,
			'_REASSOCIATABLE_'  : true,
			'_RESETTABLE_'      : true,
			'_SUBMITTABLE_'     : true
		},
		'INS'        : FLOW_PHRASING_CATEGORY,
		'KBD'        : FLOW_PHRASING_CATEGORY,
		'KEYGEN'     : {
			'_FLOW_'            : true,
			'_FORM_ASSOCIATED_' : true,
			'_INTERACTIVE_'     : true,
			'_LABELABLE_'       : true,
			'_LISTED_'          : true,
			'_PHRASING_'        : true,
			'_REASSOCIATABLE_'  : true,
			'_RESETTABLE_'      : true,
			'_SUBMITTABLE_'     : true
		},
		'LABEL'      : {
			'_FLOW_'            : true,
			'_FORM_ASSOCIATED_' : true,
			'_INTERACTIVE_'     : true,
			'_PHRASING_'        : true,
			'_REASSOCIATABLE_'  : true
		},
		'LEGEND'     : {},
		'LI'         : {},
		'LINK'       : {
			'_FLOW_'            : true,
			'_METADATA_'        : true,
			'_PHRASING_'        : true
		},
		'MAIN'       : FLOW_CATEGORY,
		'MAP'        : FLOW_PHRASING_CATEGORY,
		'MARK'       : FLOW_PHRASING_CATEGORY,
		'MENU'       : FLOW_CATEGORY,
		'MENUITEM'   : FLOW_CATEGORY,
		'META'       : {
			'_FLOW_'            : true,
			'_METADATA_'        : true,
			'_PHRASING_'        : true
		},
		'METER'      : {
			'_FLOW_'            : true,
			'_LABELABLE_'       : true,
			'_PHRASING_'        : true
		},
		'NAV'        : {
			'_FLOW_'            : true,
			'_SECTIONING_'      : true
		},
		'NOSCRIPT'   : {
			'_FLOW_'            : true,
			'_METADATA_'        : true,
			'_PHRASING_'        : true
		},
		'OBJECT'     : {
			'_FLOW_'            : true,
			'_EMBEDDABLE_'      : true,
			'_FORM_ASSOCIATED_' : true,
			'_INTERACTIVE_'     : true,
			'_LISTED_'          : true,
			'_PHRASING_'        : true,
			'_REASSOCIATABLE_'  : true,
			'_SUBMITTABLE_'     : true
		},
		'OL'         : FLOW_CATEGORY,
		'OPTGROUP'   : {},
		'OPTION'     : {},
		'OUTPUT'     : {
			'_FLOW_'            : true,
			'_PHRASING_'        : true,
			'_LISTED_'          : true,
			'_LABELABLE_'       : true,
			'_RESETTALBE_'      : true,
			'_REASSOCIATABLE_'  : true,
			'_FORM_ASSOCIATED_' : true
		},
		'P'          : FLOW_CATEGORY,
		'PARAM'      : {},
		'PRE'        : FLOW_CATEGORY,
		'PROGRESS'   : {
			'_FLOW_'            : true,
			'_PHRASING_'        : true,
			'_LABELABLE_'       : true
		},
		'Q'          : FLOW_PHRASING_CATEGORY,
		'RP'         : {},
		'RT'         : {},
		'RUBY'       : FLOW_PHRASING_CATEGORY,
		'S'          : FLOW_PHRASING_CATEGORY,
		'SAMP'       : FLOW_PHRASING_CATEGORY,
		'SCRIPT'     : {
			'_FLOW_'              : true,
			'_PHRASING_'          : true,
			'_METADATA_'          : true,
			'_SCRIPT_SUPPORTING_' : true
		},
		'SECTION'    : {
			'_FLOW_'             : true,
			'_SECTIONING_'       : true
		},
		'SELECT'     : {
			'_FLOW_'            : true,
			'_PHRASING_'        : true,
			'_INTERACTIVE_'     : true,
			'_LISTED_'          : true,
			'_LABELABLE_'       : true,
			'_SUBMITTALBE_'     : true,
			'_RESETTALBE_'      : true,
			'_REASSOCIATABLE_'  : true,
			'_FORM_ASSOCIATED_' : true
		},
		'SMALL'      : FLOW_PHRASING_CATEGORY,
		'SOURCE'     : {},
		'SPAN'       : FLOW_PHRASING_CATEGORY,
		'STRONG'     : FLOW_PHRASING_CATEGORY,
		'STYLE'      : {
			'_FLOW_'            : true,
			'_METADATA_'        : true
		},
		'SUB'        : FLOW_PHRASING_CATEGORY,
		'SUMMARY'    : {},
		'SUP'        : FLOW_PHRASING_CATEGORY,
		'TABLE'      : FLOW_CATEGORY,
		'TBODY'      : {},
		'TD'         : {
			'_SECTIONING_ROOT_' : true
		},
		'TEMPLATE'   : {
			'_FLOW_'              : true,
			'_METADATA_'          : true,
			'_PHRASING_'          : true,
			'_SCRIPT_SUPPORTING_' : true
		},
		'TEXTAREA'   : {
			'_FLOW_'            : true,
			'_PHRASING_'        : true,
			'_INTERACTIVE_'     : true,
			'_LISTED_'          : true,
			'_LABELABLE_'       : true,
			'_SUBMITTALBE_'     : true,
			'_RESETTALBE_'      : true,
			'_REASSOCIATABLE_'  : true,
			'_FORM_ASSOCIATED_' : true
		},
		'TFOOT'      : {},
		'TH'         : {},
		'THEAD'      : {},
		'TIME'       : FLOW_PHRASING_CATEGORY,
		'TITLE'      : {
			'_METADATA_'        : true
		},
		'TR'         : {},
		'TRACK'      : {},
		'U'          : FLOW_PHRASING_CATEGORY,
		'UL'         : FLOW_CATEGORY,
		'VAR'        : FLOW_PHRASING_CATEGORY,
		'VIDEO'      : {
			'_FLOW_'            : true,
			'_PHRASING_'        : true,
			'_EMBEDDED_'        : true,
			'_INTERACTIVE_'     : true
		},
		'WBR'        : FLOW_PHRASING_CATEGORY,
		'#TEXT'      : FLOW_PHRASING_CATEGORY
	};

	var ATTRIBUTES_WHITELIST = {
		'IMG' : ['alt', 'src'],
		'A'   : ['href', '_target'],
		'TD'  : ['colspan', 'rowspan'],
		'TH'  : ['colspan', 'rowspan'],
		'OL'  : ['start', 'type'],
		'*'   : ['xstyle']
	};

	var STYLES_WHITELIST = {
		'TABLE' : ['width'],
		'IMG'   : ['width', 'height'],
		'*'     : [
			// '*',
			'color',
			'font-family', 'font-size', 'font-weight', 'font-stlye', 'font-decoration',
			'background', 'background-image', 'background-color'
		]
	};

	var NODES_BLACKLIST = [
		'AUDIO',
		'COMMAND',
		'COLGROUP',
		'IFRAME',
		'INPUT',
		'INS',
		'KBD',
		'KEYGEN',
		'LINK',
		'META',
		'NOSCRIPT',
		'OUTPUT',
		'Q',
		'RUBY',
		'SAMP',
		'SCRIPT',
		'SELECT',
		'STYLE',
		'TEMPLATE',
		'TEXTAREA',
		'TITLE',
		'WBR'
	];

	/**
	 * Checks whether the node name `outer` is allowed to contain in a node with
	 * the node name `inner` as a direct descendant based on the HTML5
	 * specification.
	 *
	 * Reference:
	 * http://www.w3.org/html/wg/drafts/html/master/index.html#elements-1
	 * http://www.whatwg.org/specs/web-apps/current-work/#elements-1
	 *
	 * @param {String} outer
	 *        The node which would contain the other.
	 * @param {String} inner
	 *        The node to be nested a child of `outer`.
	 * @return {Boolean}
	 *        True if `inner` is allowed a direct child of `outer`.
	 */
	function allowsNesting(outer, inner) {
		var categories;
		outer = outer.toUpperCase();
		inner = inner.toUpperCase();
		var allowed = ALLOWED_CHILDREN[outer];
		if (!allowed) {
			return false;
		}
		if ('string' === typeof allowed) {
			if (allowed === inner) {
				return true;
			}
			categories = CONTENT_CATEGORIES[inner];
			if (categories && categories[allowed]) {
				return true;
			}
		} else {
			if (allowed[inner]) {
				return true;
			}
			categories = CONTENT_CATEGORIES[inner];
			var category;
			for (category in categories) {
				if (categories.hasOwnProperty(category)) {
					if (allowed[category]) {
						return true;
					}
				}
			}
		}
		return false;
	}

	return {
		allowsNesting        : allowsNesting,
		NODES_BLACKLIST      : NODES_BLACKLIST,
		STYLES_WHITELIST     : STYLES_WHITELIST,
		ATTRIBUTES_WHITELIST : ATTRIBUTES_WHITELIST

	};
});
