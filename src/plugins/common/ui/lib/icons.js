define([
    'jquery'
], function(
    $
) {
    'use strict';

    var AvailableIcons = {
        // General formatting
        BOLD:                               'bold',
        ITALIC:                             'italic',
        UNDERLINE:                          'underline',
        STRIKE_THROUGH:                     'strikethrough',
        SUB_SCRIPT:                         'subscript',
        SUPER_SCRIPT:                       'superscript',
        ABBRIVIATION:                       'abbr',
        EMPHASIS:                           'emphasis',
        STRONG:                             'strong',
        CODE:                               'code',
        CLEAR_FORMATTING:                   'clear-formatting',

        // Text alignment
        ALIGN_LEFT:                         'align-left',
        ALIGN_CENTER:                       'align-center',
        ALIGN_RIGHT:                        'align-right',
        ALIGN_JUSTIFY:                      'align-justify',
        ALIGN_TOP:                          'align-top',
        ALIGN_MIDDLE:                       'align-middle',
        ALIGN_BOTTOM:                       'align-bottom',

        // Typography
        PARAGRAPH:                          'paragraph',
        HEADER_1:                           'h1',
        HEADER_2:                           'h2',
        HEADER_3:                           'h3',
        HEADER_4:                           'h4',
        HEADER_5:                           'h5',
        HEADER_6:                           'h6',
        PRE_FORMATTED:                      'pre',
        TYPOGRAPHY:                         'typography',

        // Table
        TABLE:                              'table',
        TABLE_CREATE:                       'table-create',
        TABLE_ADD_COLUMN_LEFT:              'table-add-column-left',
        TABLE_ADD_COLUMN_RIGHT:             'table-add-column-right',
        TABLE_ADD_ROW_BEFORE:               'table-add-row-before',
        TABLE_ADD_ROW_AFTER:                'table-add-row-after',
        TABLE_ROW_HEADER:                   'table-row-header',
        TABLE_COLUMN_HEADER:                'table-column-header',
        TABLE_MERGE_CELLS:                  'table-merge-cells',
        TABLE_SPLIT_CELLS:                  'table-split-cells',
        TABLE_DELETE_ROWS:                  'table-delete-rows',
        TABLE_DELETE_COLUMNS:               'table-delete-columns',
        TABLE_DELETE:                       'table-delete',

        // Lists
        LIST_ORDERED:                       'list-ordered',
        LIST_UNORDERED:                     'list-unordered',
        LIST_INDENT:                        'list-indent',
        LIST_OUTDENT:                       'list-outdent',

        // Link
        LINK:                               'link',
        LINK_ANCHOR:                        'link-anchor',
        LINK_REMOVE:                        'link-remove',

        // Textcolor
        TEXT_COLOR:                         'text-color',
        BACKGROUND_COLOR:                   'background-color',

        // Misc
        TREE:                               'tree',
    };

    var ClassMapping = {};
    var URLMapping = {};

    ClassMapping[AvailableIcons.BOLD] = 'aloha-icon-bold';
    ClassMapping[AvailableIcons.ITALIC] = 'aloha-icon-italic';
    ClassMapping[AvailableIcons.UNDERLINE] = 'aloha-icon-underline';
    ClassMapping[AvailableIcons.STRIKE_THROUGH] = 'aloha-icon-strikethrough';
    ClassMapping[AvailableIcons.SUB_SCRIPT] = 'aloha-icon-subscript';
    ClassMapping[AvailableIcons.SUPER_SCRIPT] = 'aloha-icon-superscript';
    ClassMapping[AvailableIcons.ABBRIVIATION] = 'aloha-icon-abbr';
    ClassMapping[AvailableIcons.EMPHASIS] = 'aloha-icon-emphasis';
    ClassMapping[AvailableIcons.STRONG] = 'aloha-icon-strong';
    ClassMapping[AvailableIcons.CODE] = 'aloha-icon-code';
    ClassMapping[AvailableIcons.CLEAR_FORMATTING] = 'aloha-icon-clear';

    ClassMapping[AvailableIcons.ALIGN_LEFT] = 'aloha-icon-align aloha-icon-align-left'
    ClassMapping[AvailableIcons.ALIGN_CENTER] = 'aloha-icon-align aloha-icon-align-center'
    ClassMapping[AvailableIcons.ALIGN_RIGHT] = 'aloha-icon-align aloha-icon-align-right'
    ClassMapping[AvailableIcons.ALIGN_JUSTIFY] = 'aloha-icon-align aloha-icon-align-justify'
    ClassMapping[AvailableIcons.ALIGN_TOP] = 'aloha-icon-align aloha-icon-align-top'
    ClassMapping[AvailableIcons.ALIGN_MIDDLE] = 'aloha-icon-align aloha-icon-align-middle'
    ClassMapping[AvailableIcons.ALIGN_BOTTOM] = 'aloha-icon-align aloha-icon-align-bottom'

    ClassMapping[AvailableIcons.PARAGRAPH] = 'aloha-icon-paragraph';
    ClassMapping[AvailableIcons.HEADER_1] = 'aloha-icon-h1';
    ClassMapping[AvailableIcons.HEADER_2] = 'aloha-icon-h2';
    ClassMapping[AvailableIcons.HEADER_3] = 'aloha-icon-h3';
    ClassMapping[AvailableIcons.HEADER_4] = 'aloha-icon-h4';
    ClassMapping[AvailableIcons.HEADER_5] = 'aloha-icon-h5';
    ClassMapping[AvailableIcons.HEADER_6] = 'aloha-icon-h6';
    ClassMapping[AvailableIcons.PRE_FORMATTED] = 'aloha-icon-pre';
    ClassMapping[AvailableIcons.TYPOGRAPHY] = 'aloha-icon-typography';

    ClassMapping[AvailableIcons.TABLE_CREATE] = 'aloha-icon-createTable';
    ClassMapping[AvailableIcons.TABLE_ADD_COLUMN_LEFT] = 'aloha-icon-addcolumnleft';
    ClassMapping[AvailableIcons.TABLE_ADD_COLUMN_RIGHT] = 'aloha-icon-addcolumnright';
    ClassMapping[AvailableIcons.TABLE_ADD_ROW_BEFORE] = 'aloha-icon-addrowbefore';
    ClassMapping[AvailableIcons.TABLE_ADD_ROW_AFTER] = 'aloha-icon-addrowafter';
    ClassMapping[AvailableIcons.TABLE_DELETE_ROWS] = 'aloha-icon-deleterows';
    ClassMapping[AvailableIcons.TABLE_DELETE_COLUMNS] = 'aloha-icon-deletecolumns';
    ClassMapping[AvailableIcons.TABLE] = 'aloha-icon-table';
    ClassMapping[AvailableIcons.TABLE_ROW_HEADER] = 'aloha-icon-rowheader';
    ClassMapping[AvailableIcons.TABLE_COLUMN_HEADER] = 'aloha-icon-columnheader';
    ClassMapping[AvailableIcons.TABLE_MERGE_CELLS] = 'aloha-icon-mergecells';
    ClassMapping[AvailableIcons.TABLE_SPLIT_CELLS] = 'aloha-icon-splitcells';
    ClassMapping[AvailableIcons.TABLE_DELETE] = 'aloha-icon-deletetable';

    ClassMapping[AvailableIcons.LIST_ORDERED] = 'aloha-icon-orderedlist';
    ClassMapping[AvailableIcons.LIST_UNORDERED] = 'aloha-icon-unorderedlist';
    ClassMapping[AvailableIcons.LIST_INDENT] = 'aloha-icon-indent';
    ClassMapping[AvailableIcons.LIST_OUTDENT] = 'aloha-icon-outdent';

    ClassMapping[AvailableIcons.LINK] = 'aloha-icon-link';
    ClassMapping[AvailableIcons.LINK_ANCHOR] = 'aloha-icon-anchor';
    ClassMapping[AvailableIcons.LINK_REMOVE] = 'aloha-icon-unlink';

    ClassMapping[AvailableIcons.TEXT_COLOR] = 'aloha-icon-textcolor-color';
    ClassMapping[AvailableIcons.BACKGROUND_COLOR] = 'aloha-icon-textcolor-background-color';

    ClassMapping[AvailableIcons.TREE] = 'aloha-icon-tree';

    var MAPPING = {
        BOLD: 'format_bold',
        STRONG: 'format_bold',
        ITALIC: 'format_italic',
        EMPHASIS: 'format_italic',
        UNDERLINE: 'format_underlined',
        STRIKE_THROUGH: 'format_strikethrough',
        SUB_SCRIPT: 'subscript',
        SUPER_SCRIPT: 'superscript',
        ABBREVIATION: 'book',
        CODE: 'code',
        CLEAR: 'format_clear',

        TYPOGRAPHY: 'format_size',
        PARAGRAPH: 'format_paragraph',
        HEADER_1: 'format_h1',
        HEADER_2: 'format_h2',
        HEADER_3: 'format_h3',
        HEADER_4: 'format_h4',
        HEADER_5: 'format_h5',
        HEADER_6: 'format_h6',
        PRE_FORMATTED: 'segment',

        LANGUAGE: 'language',

        QUOTE: 'format_quote',

        LINK: 'link',
        UNLINK: 'link_off',
        ANCHOR: 'anchor',

        ALIGN_LEFT: 'format_align_left',
        ALIGN_CENTER: 'format_align_center',
        ALIGN_RIGHT: 'format_align_right',
        ALIGN_JUSTIFY: 'format_align_justify',

        TABLE_CREATE: 'table',
        TABLE_MERGE_CELLS: 'cell_merge',
        TABLE_SPLIT_CELLS: 'arrows_outward',
        TABLE_DELETE: 'delete',
        TABLE_CAPTION: 'title',
        TABLE_ADD_COLUMN_LEFT: 'splitscreen_left',
        TABLE_ADD_COLUMN_RIGHT: 'splitscreen_right',
        TABLE_DELETE_COLUMNS: 'delete',
        TABLE_COLUMN_HEADER: 'leaderboard',
        TABLE_ADD_ROW_BEFORE: 'splitscreen_top',
        TABLE_ADD_ROW_AFTER: 'splitscreen_bottom',
        TABLE_DELETE_ROWS: 'delete',
        TABLE_ROW_HEADER: 'leaderboard',

        TOGGLE_DRAG_AND_DROP: 'drag_pan',
        TREE: 'account_tree',

        INDENT: 'format_indent_increase',
        OUTDENT: 'format_indent_decrease',

        CHARACTER_PICKER: 'special_character',
        TEXT_COLOR: 'format_color_text',
        BACKGROUND_COLOR: 'format_color_fill',
    };

    return {
        MAPPING: MAPPING,
        AvailableIcons: AvailableIcons,
        ClassMapping: ClassMapping,
        URLMapping: URLMapping,
    }
});
