define([
	'jquery',
	'util/maps',
	'util/trees',
	'i18n!ui/nls/i18n'
], function (
	$,
	Maps,
	Trees,
	i18n
) {
	'use strict';

	var _defaultTabs = [
		// Format Tab
		{
			id: 'formatting',
			label: 'tab.format.label',
			icon: 'border_color',
			showOn: { scope: 'Aloha.continuoustext' },
			components: [
				[
					{ slot: 'bold' }, { slot: 'italic', scope: ['Aloha.continuoustext'] }, 'underline', '\n',
					'subscript', 'superscript', 'strikethrough', 'code', 'quote', 'removeFormat'
				], [
					'removeLink', 'formatAbbr', 'formatNumeratedHeaders', 'toggleDragDrop', '\n',
					'toggleMetaView', 'wailang', 'toggleFormatlessPaste'
				], [
					'alignMenu', '\n',
					'orderedListFormatSelector', 'unorderedListFormatSelector', 'definitionListFormatSelector', '\n', 'indentList', 'outdentList', 'textColor', 'textBackground'
				], [
					'formatBlock'
				]
			]
		},
		// Insert Tab
		{
			id: 'insert',
			label: "tab.insert.label",
			icon: 'add',
			showOn: { scope: 'Aloha.continuoustext' },
			components: [
				[ "createTable", "characterPicker", "insertLink",
				  "insertImage", "insertAbbr", "insertToc",
				  "insertHorizontalRule", "insertTag"]
			]
		},
		// Link Tab
		{
			id: 'link',
			label: 'tab.link.label',
			icon: 'link',
			showOn: { scope: 'link' },
			components: [ 'editLink', 'linkBrowser' ]
		},
		// Cite Tab
		{
			id: 'cite',
			label : 'tab.cite.label',
			icon: 'format_quote',
			showOn : { scope : 'cite' },
			components : [ 'editCite', 'removeCite', '\n', 'editNote' ]
		},
		// Image Tab
		{
			id: 'image',
			label: "tab.img.label",
			icon: 'image',
			showOn: {scope: 'image'},
			components: [
				[ "imageSource", "\n",
				  "imageTitle" ],
				[ "imageResizeWidth", "\n",
				  "imageResizeHeight" ],
				[ "imageAlignLeft", "imageAlignRight", "imageAlignNone", "imageIncPadding", "\n",
				  "imageCropButton", "imageCnrReset", "imageCnrRatio", "imageDecPadding" ],
				[ "imageBrowser" ]
			]
		},
		// Abbr Tab
		{
			id: 'abbr',
			label: "tab.abbr.label",
			icon: 'feed',
			showOn: { scope: 'abbr' },
			components: [
				[ "abbrText", "removeAbbr" ]
			]
		},
		// Wailang Tab
		{
			id: 'wai-lang',
			label: "tab.wai-lang.label",
			icon: 'language',
			showOn: { scope: 'wai-lang' },
			components: [ [ "wailangfield", "removewailang" ] ]
		},
		// Table Tabs
		{
			id: 'table.cell',
			label: "tab.table.label",
			icon: 'table',
			showOn: { scope: 'table.cell' },
			components: [
				[ "mergecells", "splitcells", "deleteTable", "tableCaption",
				  "naturalFit", "tableSummary" ],
				[ "formatTable" ]
			]
		},
		{
			id: 'table.column',
			label: "tab.col.label",
			icon: 'view_column',
			showOn: { scope: 'table.column' },
			components: [
				[ "addcolumnleft", "addcolumnright", "deletecolumns",
				  "columnheader", "mergecellsColumn", "splitcellsColumn",
				  "formatColumn" ]
			]
		},
		{
			id: 'table.row',
			label: "tab.row.label",
			icon: 'table_rows',
			showOn: { scope: 'table.row' },
			components: [
				[ "addrowbefore", "addrowafter", "deleterows", "rowheader",
				  "mergecellsRow", "splitcellsRow", "formatRow" ]
			]
		},
		{
			id: 'table.align',
			label: "tab.cell.label",
			icon: 'vertical_distribute',
			showOn: { scope: 'table.cell' },
			components: [
				[ "alignTop", "alignMiddle", "alignBottom", "formatCell" ]
			]
		}
	];

	var defaultToolbarSettings = {
		mobile: {
			tabs: [],
		},
		tablet: {
			tabs: [],
		},
		desktop: {
			tabs: [],
		},
	};

	/**
	 * Combines two toolbar configurations.
	 *
	 * The rules for combining configurations are as follows
	 *
	 * * remove all components and tabs from the default toolbar configuration
	 *   that are listed in the given exclude array,
	 * * add all remaining tabs from the default configuration to the user
	 *   configuration,
	 * * and merge tabs with the same name such that a tab property that is
	 *   omitted in the user configuration will be taken from the default
	 *   configuration,
	 * * and, if both the default tab and the user's tab configuration contain
	 *   a components property, and unless the exclusive property on a tab is
	 *   true, append all remaining components from the default tab to the
	 *   user's tab configuration.
	 *
	 * @param userTabs
	 *        a responsive map of lists of tab configurations ({ mobile: [], tablet: [], desktop: [] })
	 * @param defaultTabs
	 *        a responsive map of lists of tab configurations
	 * @param exclude
	 *        a responsive map of lists of component names and tab labels to ignore
	 *        in the given defaultTabs configuration.
	 * @return
	 *
	 */
	function combineToolbarSettings(userTabs, defaultTabs, exclude) {
		var responsiveKeys = ['mobile', 'tablet', 'desktop'];
		var returnSettings = { mobile: { tabs: [] }, tablet: { tabs: [] }, desktop: { tabs: [] } };

		function pruneDefaultComponents(form) {
			return 'array' === $.type(form) ? !form.length : exclusionLookup[form];
		}

		for (var i = 0; i < responsiveKeys.length; i++) {
			var key = responsiveKeys[i];
			var defaultTabsByLabel = (defaultTabs[key] || []).reduce(function(acc, tab) {
				acc[tab.label] = tab;
				return acc;
			}, {});

			var exclusionLookup = makeExclusionMap(userTabs[key], exclude[key] || []);
			userTabs[key] = mergeDefaultComponents(userTabs[key], defaultTabsByLabel, pruneDefaultComponents);
			defaultTabs[key] = remainingDefaultTabs(defaultTabs[key], exclusionLookup, pruneDefaultComponents);

			returnSettings[key].tabs = userTabs[key].concat(defaultTabs[key]).map(function(tab) {
				tab.label = i18n.t(tab.label, tab.label);
				return tab;
			});
		}

		return returnSettings;
	}

	function remainingDefaultTabs(defaultTabs, exclusionLookup, pruneDefaultComponents) {
		var i,
		    tab,
		    tabs = [],
		    defaultTab,
		    components;
		for (i = 0; i < defaultTabs.length; i++) {
			defaultTab = defaultTabs[i];
			if (!exclusionLookup[defaultTab.label]) {
				components = Trees.postprune(defaultTab.components, pruneDefaultComponents);
				if (components) {
					tab = $.extend({}, defaultTab);
					tab.components = components;
					tabs.push(tab);
				}
			}
		}
		return tabs;
	}

	function mergeDefaultComponents(userTabs, defaultTabsByLabel, pruneDefaultComponents) {
		var i,
			tab,
			tabs = [],
			userTab,
			components,
			defaultTab,
			defaultComponents;

		for (i = 0; i < userTabs.length; i++) {
			userTab = userTabs[i];
			components = userTab.components || [];
			defaultTab = defaultTabsByLabel[userTab.label];
			if (!userTab.exclusive && defaultTab) {
				defaultComponents = Trees.postprune(defaultTab.components, pruneDefaultComponents);
				if (defaultComponents) {
					components = components.concat(defaultComponents);
				}
			}
			tab = $.extend({}, defaultTab || {}, userTab);
			tab.components = components;
			tabs.push(tab);
		}
		return tabs;
	}

	function makeExclusionMap(userTabs, exclude) {
		if (!Array.isArray(exclude)) {
			exclude = [];
		}
		var i,
		    map = Maps.fillKeys({}, exclude, true);
		for (i = 0; i < userTabs.length; i++) {
			map[userTabs[i].label] = true;
			Maps.fillKeys(map, Trees.flatten(userTabs[i].components), true);
		}
		return map;
	}

	return {
		defaultToolbarSettings: defaultToolbarSettings,
		combineToolbarSettings: combineToolbarSettings
	};
});
