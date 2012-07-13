define(['jquery', 'util/arrays', 'util/maps'], function($, Arrays, Maps){
	var defaultToolbarSettings = {
		tabs: [
			// Format Tab
			{
				label: 'Format',
				showOn: { scope: 'Aloha.continuoustext' },
				components: [
					[
						'bold', 'strong', 'italic', 'emphasis', '\n',
						'subscript', 'superscript', 'strikethrough', 'quote'
					], [
						'formatLink', 'formatAbbr', 'formatNumeratedHeaders', '\n',
						'toggleMetaView', 'wailang', 'toggleFormatlessPaste'
					], [
						'alignLeft', 'alignCenter', 'alignRight', 'alignJustify', '\n',
						'orderedList', 'unorderedList', 'indentList', 'outdentList'
					], [
						'formatBlock'
					]
				]
			},
			// Insert Tab
			{
				label: "Insert",
				showOn: { scope: 'Aloha.continuoustext' },
				components: [
					[ "createTable", "characterPicker", "insertLink",
					  "insertImage", "insertAbbr", "insertToc",
					  "insertHorizontalRule", "insertTag"]
				]
			},
			// Link Tab
			{
				label: 'Link', 
				showOn: { scope: 'link' },
				components: [ 'editLink', 'removeLink', 'linkBrowser' ]
			},
            // Image Tab
            {
                label: "Image",
                showOn: {scope: 'image'},
                components: [
                    [ "imageSource", "imageTitle",
                      "imageAlignLeft", "imageAlignRight", "imageAlignNone",
                      "imageIncPadding", "imageDecPadding",
                      "imageBrowser",
                      "imageCropButton", "imageCnrReset", "imageCnrRatio",
                      "imageResizeWidth", "imageResizeHeight" ]
                ]
            },
            // Abbr Tab
            {   label: "Abbreviation",
                showOn: { scope: 'abbr' },
                components: [
                    [ "abbrText" ]
                ]
            },
            // Wailang Tab
            {   label: "Wailang",
				showOn: { scope: 'wai-lang' },
                components: [ [ "wailangfield", "removewailang" ] ]
            },
			// Table Tabs
			{
				label: "Table",
				showOn: { scope: 'table.cell' },
				components: [
					[ "mergecells", "splitcells", "tableCaption",
					  "tableSummary", "formatTable" ]
				]
			},
			{ 
				label: "Column",
				showOn: { scope: 'table.column' },
				components: [
					[ "addcolumnleft", "addcolumnright", "deletecolumns",
					  "columnheader", "mergecellsColumn", "splitcellsColumn",
					  "formatColumn" ]
				]
			},
			{
				label: "Row",
				showOn: { scope: 'table.row' },
				components: [
					[ "addrowbefore", "addrowafter", "deleterows", "rowheader",
					  "mergecellsRow", "splitcellsRow", "formatRow" ]
				]
			}
		]
	};

	/**
	 * Combines two toolbar configurations.
	 *
	 * @param userTabs
	 *        a list of tab configurations
	 * @param defaultTabs
	 *        a list of tab configurations
	 * @param exclude
	 *        a list of component names and tab labels to ignore
	 *        in the given defaultTabs configuration.
	 * @return
	 *        The resulting configuration will contain all tabs from
	 *        userTabs and defaultTabs. If a tab is contained in both,
	 *        the one in userTabs takes precedence, but the components
	 *        of both tabs will be combined.
	 *        If a given component in defaultTabs already exists in any
	 *        tab of userTabs, the component in defaultTabs will be
	 *        ignored.
	 *        Tabs and components of defaulTabs can be excluded by
	 *        listing the tab labels and component names in the given
	 *        exlcude param.
	 */
	function combineToolbarSettings(userTabs, defaultTabs, exclude) {
		var i = 0;
		var tabs = [];
		var defaultComponentsByTabLabel = Maps.fillTuples({}, defaultTabs, function(tab) {
			return [tab.label, tab.components];
		});
		var exclusionLookup = Maps.fillKeys({}, exclude, true);
		function isNotExcluded(component){
			return !exclusionLookup[component];
		}
		for (i = 0; i < userTabs.length; i++) {
			exclusionLookup[userTabs[i].label] = true;
			Maps.fillKeys(exclusionLookup, userTabs[i].components, true);
		}
		for (var i = 0; i < userTabs.length; i++) {
			var userTab = userTabs[i];
			var components = userTab.components;
			var defaultComponents = defaultComponentsByTabLabel[userTab.label];
			if (defaultComponents) {
				defaultComponents = Arrays.filter(defaultComponents, isNotExcluded);
				components = components.concat(defaultComponents);
			}
			var tab = $.extend({}, userTab);
			tab.components = components;
			tabs.push(tab);
		}
		for (var i = 0; i < defaultTabs.length; i++) {
			var defaultTab = defaultTabs[i];
			if (!exclusionLookup[defaultTab.label]) {
				var tab = $.extend({}, defaultTab);
				tab.components = Arrays.filter(tab.components, isNotExcluded);
				if (tab.components.length) {
					tabs.push(tab);
				}
			}
		}
		return tabs;
	}

	/*
	var x = combineToolbarConfig(
		[{label: "not-modified" , components: ["1", "2", "3"]},
		 {label: "one-added"    , components: ["4", "5", "6"]}], 
		[{label: "one-added"    , components: ["4", "added", "6", "ignored"]},
		 {label: "one-remains  ", components: ["2", "3", "remains"]},
		 {label: "empty"        , components: ["1", "5"]}],
		["ignored"]
	);
	assertEqual(x, [{label: "not-modified" , components: ["1", "2", "3"]},
	                {label: "one-added"    , components: ["4", "5", "6", "added"]},
					{label: "one-remains"  , components: ["remains"]}]);
	*/

	return {
		defaultToolbarSettings: defaultToolbarSettings,
		combineToolbarSettings: combineToolbarSettings
	};
});
