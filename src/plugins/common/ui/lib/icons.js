define([], function() {
    'use strict';

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
        CITATION: 'help',
        QUOTE: 'format_quote',
        DELETED: 'backspace',
        INSERTED: 'playlist_add',
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
        NUMERATED_HEADERS: '123',
        VIDEO_DELETE: 'videocam_off',

        LINK: 'link',
        UNLINK: 'link_off',
        ANCHOR: 'anchor',

        ALIGN_LEFT: 'format_align_left',
        ALIGN_CENTER: 'format_align_center',
        ALIGN_RIGHT: 'format_align_right',
        ALIGN_JUSTIFY: 'format_align_justify',
        ALIGN_TOP: 'vertical_align_top',
        ALIGN_MIDDLE: 'vertical_align_center',
        ALIGN_BOTTOM: 'vertical_align_bottom',

        TABLE_CREATE: 'table',
        TABLE_MERGE_CELLS: 'cell_merge',
        TABLE_SPLIT_CELLS: 'arrows_outward',
        TABLE_DELETE: 'delete',
        TABLE_CAPTION: 'title',
        TABLE_ADD_COLUMN_LEFT: 'splitscreen_left',
        TABLE_ADD_COLUMN_RIGHT: 'splitscreen_right',
        TABLE_SELECTION_HEADER: 'leaderboard',
        TABLE_ADD_ROW_BEFORE: 'splitscreen_top',
        TABLE_ADD_ROW_AFTER: 'splitscreen_bottom',
        TABLE_STYLE_CELLS: 'format_paint',
        TABLE_DELETE_SELECTION: 'delete',

        IMAGE_ALIGN_LEFT: 'format_image_left',
        IMAGE_ALIGN_RIGHT: 'format_image_right',
        IMAGE_ALIGN_NONE: 'image',
        IMAGE_INCREASE_PADDING: 'open_in_full',
        IMAGE_DECREASE_PADDING: 'close_fullscreen',
        IMAGE_CROP: 'crop',
        IMAGE_FOCAL_POINT: 'filter_center_focus',
        IMAGE_RATIO: 'aspect_ratio',
        IMAGE_RESET: 'restart_alt',
        IMAGE_EDIT: 'edit',

        TOGGLE_DRAG_AND_DROP: 'drag_pan',
        TREE: 'account_tree',

        INDENT: 'format_indent_increase',
        OUTDENT: 'format_indent_decrease',
        LIST_ORDERED: 'format_list_numbered',
        LIST_UNORDERED: 'format_list_bulleted',
        LIST_DEFINITION: 'lists',

        CHARACTER_PICKER: 'special_character',
        TEXT_COLOR: 'format_color_text',
        BACKGROUND_COLOR: 'format_color_fill',

        PASTE: 'content_paste',
        FORMATLESS_PASTE: 'content_paste_go',
        META_VIEW: 'mystery',
        HORIZONTAL_RULE: 'horizontal_rule',
        SPELLCHECK: 'spellcheck',

        // Tabs
        FORMATTING: 'edit',
        INSERT: 'add_box',
        VIEW: 'visibility',
        TABLE: 'table',
        IMAGE: 'image',
    };

    return MAPPING;
});
