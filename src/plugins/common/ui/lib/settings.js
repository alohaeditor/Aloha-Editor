define([
	'jquery',
	'util/arrays',
	'util/maps',
	'util/trees'
], function (
	$,
	Arrays,
	Maps,
	Trees
) {
	'use strict';

	var _defaultTabs = [
		// Format Tab
		{
			label: 'tab.format.label',
			showOn: { scope: 'Aloha.continuoustext' },
			components: [
				[
					{ slot: 'bold' }, 'strong', { slot: 'italic', scope: ['Aloha.continuoustext'] }, 'emphasis', 'underline', '\n',
					'subscript', 'superscript', 'strikethrough', 'code', 'quote'
				], [
					'formatLink', 'formatAbbr', 'formatNumeratedHeaders', 'toggleDragDrop', '\n',
					'toggleMetaView', 'wailang', 'toggleFormatlessPaste'
				], [
					'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', '\n',
					'orderedListFormatSelector', 'unorderedListFormatSelector', 'definitionListFormatSelector', '\n', 'indentList', 'outdentList', 'textColor', 'textBackground'
				], [
					'formatBlock'
				]
			]
		},
		// Insert Tab
		{
			label: "tab.insert.label",
			showOn: { scope: 'Aloha.continuoustext' },
			components: [
				[ "createTable", "characterPicker", "insertLink",
				  "insertImage", "insertAbbr", "insertToc",
				  "insertHorizontalRule", "insertTag"]
			]
		},
		// Link Tab
		{
			label: 'tab.link.label',
			showOn: { scope: 'link' },
			components: [ 'editLink', 'toggleAnchor', 'editAnchor', 'removeLink', 'linkBrowser' ]
		},
		// Cite Tab
		{
			label : 'tab.cite.label',
			showOn : { scope : 'cite' },
			components : [ 'editCite', 'removeCite', '\n', 'editNote' ]
		},
		// Image Tab
		{
			label: "tab.img.label",
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
		{   label: "tab.abbr.label",
			showOn: { scope: 'abbr' },
			components: [
				[ "abbrText", "removeAbbr" ]
			]
		},
		// Wailang Tab
		{   label: "tab.wai-lang.label",
			showOn: { scope: 'wai-lang' },
			components: [ [ "wailangfield", "removewailang" ] ]
		},
		// Table Tabs
		{
			label: "tab.table.label",
			showOn: { scope: 'table.cell' },
			components: [
				[ "mergecells", "splitcells", "deleteTable", "tableCaption",
				  "naturalFit", "tableSummary" ],
				[ "formatTable" ]
			]
		},
		{
			label: "tab.col.label",
			showOn: { scope: 'table.column' },
			components: [
				[ "addcolumnleft", "addcolumnright", "deletecolumns",
				  "columnheader", "mergecellsColumn", "splitcellsColumn",
				  "formatColumn" ]
			]
		},
		{
			label: "tab.row.label",
			showOn: { scope: 'table.row' },
			components: [
				[ "addrowbefore", "addrowafter", "deleterows", "rowheader",
				  "mergecellsRow", "splitcellsRow", "formatRow" ]
			]
		},
		{
			label: "tab.cell.label",
			showOn: { scope: 'table.cell' },
			components: [
				[ "alignTop", "alignMiddle", "alignBottom", "formatCell" ]
			]
		}
	];

	var defaultToolbarSettings = {
		mobile: {
			tabs: _defaultTabs,
		},
		tablet: {
			tabs: _defaultTabs,
		},
		desktop: {
			tabs: _defaultTabs,
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
		var returnSettings = { mobile: [], tablet: [], desktop: [] };

		function pruneDefaultComponents(form) {
			return 'array' === $.type(form) ? !form.length : exclusionLookup[form];
		}

		for (var i = 0; i < responsiveKeys; i++) {
			var key = responsiveKeys[i];
			var defaultTabsByLabel = Maps.fillTuples({}, Arrays.map(defaultTabs[key], function(tab) {
				return [tab.label, tab];
			}));

			var exclusionLookup = makeExclusionMap(userTabs[key], exclude[key]);
			userTabs[key] = mergeDefaultComponents(userTabs[key], defaultTabsByLabel, pruneDefaultComponents);
			defaultTabs[key] = remainingDefaultTabs(defaultTabs[key], exclusionLookup, pruneDefaultComponents);

			returnSettings[key] = userTabs[key].concat(defaultTabs[key]);
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
