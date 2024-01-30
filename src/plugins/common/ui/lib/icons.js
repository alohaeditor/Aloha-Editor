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

    function createIconElement(icon) {
        var cssClass = ClassMapping[icon];
        if (cssClass) {
            var classList = ['ui-icon', 'aloha-icon', cssClass];
            return $('<span>', {
                class: classList.join(' '),
            });
        }

        var url = URLMapping[icon];
        if (!url) {
            return null;
        }

        return $('<img>', {
            class: 'aloha-ui-inline-icon',
            src: url,
        });
    }

    return {
        AvailableIcons: AvailableIcons,
        ClassMapping: ClassMapping,
        URLMapping: URLMapping,

        createIconElement: createIconElement,
    }
});
