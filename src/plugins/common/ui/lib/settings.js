/**
 * @typedef {object} FullComponentSlot
 * @property {string} slot The name of the slot which a component can be rendered in.
 * @property {string|Array.<string>=} scope One or more scopes the slot should be available/shown.
 */

/** @typedef {FullComponentSlot|string} ComponentSlot */

/**
 * @typedef {object} ScopeDefitinion
 * @property {string|Array.<string>} scope The scope(s) in which it should have effect.
 */

/** @typedef {'keep' | 'append' | 'prepend' | 'override'} ToolbarComponentMergeStrategy */

/**
 * @typedef {object} ToolbarTabMerge
 * @property {ToolbarComponentMergeStrategy=} components How components should be merged
 */

/**
 * @typedef {object} ToolbarTab
 * @property {string} id The ID of the Tab
 * @property {string} label The label of the Tab. Can be an i18n string of `ui/nls/i18n`.
 * @property {string} icon The icon for the Tab (May or may not be used).
 * @property {Array.<ComponentSlot>|Array.<Array.<ComponentSlot>>} components Slots/Components in this tab.
 * @property {ScopeDefitinion=} showOn In which scope it should be displayed.
 * @property {ToolbarTabMerge=} merge Options for when this tab is being merged.
 */

/**
 * @typedef {object} ResponsiveToolbarSettings
 * @property {Array.<ToolbarTab>} tabs Tabs to display.
 */

/**
 * @typedef {object} ToolbarSettings
 * @property {ResponsiveToolbarSettings} mobile The settings to use on mobile sized displays.
 * @property {ResponsiveToolbarSettings} tablet The settings to use on tablet sized displays.
 * @property {ResponsiveToolbarSettings} desktop The settings to use on desktop sized displays. 
 */

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

	const SCOPE_LIST = 'Aloha.List';
    const SCOPE_TABLE = 'table';
    const SCOPE_TABLE_CELL = 'table.cell';
    const SCOPE_TABLE_ROW = 'table.row';
    const SCOPE_TABLE_COLUMN = 'table.column';

	/** @type {Array.<ToolbarTab>} */
	var DEFAULT_TABS = [
		{
			id: 'formatting',
			label: 'tab.format.label',
			icon: 'edit',
			components: [
				[
					'bold',
					'italic',
					'underline',
					'strikethrough',
					'subscript',
					'superscript',
					'code',
					'cite',
					'quote',
					'abbr',
				],
				[ 'removeFormat' ],
				// List settings
				[
					'alignMenu',
					// TODO: Add list formatting buttons
					{ slot: 'indentList', scope: [SCOPE_LIST] },
					{ slot: 'outdentList', scope: [SCOPE_LIST] },
				],
				// Table settings
				[
					{ slot: 'deleteTable', scope: [SCOPE_TABLE] },
					{ slot: 'tableCaption', scope: [SCOPE_TABLE] },
					{ slot: 'mergecells', scope: [SCOPE_TABLE_CELL, SCOPE_TABLE_ROW, SCOPE_TABLE_COLUMN] },
					{ slot: 'splitcells', scope: [SCOPE_TABLE_CELL, SCOPE_TABLE_ROW, SCOPE_TABLE_COLUMN] },
					{ slot: 'addrowbefore', scope: [SCOPE_TABLE_CELL, SCOPE_TABLE_ROW, SCOPE_TABLE_COLUMN] },
					{ slot: 'addrowafter', scope: [SCOPE_TABLE_CELL, SCOPE_TABLE_ROW, SCOPE_TABLE_COLUMN] },
					// { slot: 'deleterows', scope: [SCOPE_TABLE_ROW] },
					// { slot: 'rowheader', scope: [SCOPE_TABLE_ROW] },
					{ slot: 'addcolumnleft', scope: [SCOPE_TABLE_CELL, SCOPE_TABLE_ROW, SCOPE_TABLE_COLUMN] },
					{ slot: 'addcolumnright', scope: [SCOPE_TABLE_CELL, SCOPE_TABLE_ROW, SCOPE_TABLE_COLUMN] },
					// { slot: 'deletecolumns', scope: [SCOPE_TABLE_ROW] },
					// { slot: 'columnheader', scope: [SCOPE_TABLE_ROW] },
				],
				[ 'textColor', 'textBackground', 'formatBlock', 'alignMenu' ],
				[ 'insertLink' ],
				[ 'toggleDragDrop', 'toggleMetaView', 'toggleFormatlessPaste' ],
			]
		},
		{
			id: 'insert',
			label: 'tab.insert.label',
			icon: 'add_box',
			components: [
				[ 'characterPicker', 'insertHorizontalRule', 'createTable', 'insertToc', 'insertAbbr' ],
			]
		},
		// TODO: Check Image settings
		{
			id: 'image',
			label: "tab.img.label",
			icon: 'image',
			showOn: {scope: 'image'},
			components: [
				[ "imageSource", "imageTitle" ],
				[ "imageResizeWidth", "imageResizeHeight" ],
				[ "imageAlignLeft", "imageAlignRight", "imageAlignNone", "imageIncPadding",
				  "imageCropButton", "imageCnrReset", "imageCnrRatio", "imageDecPadding" ],
				[ "imageBrowser" ]
			]
		},
	];

	var DEFAULT_TOOLBAR_SETTINGS = {
		mobile: {
			tabs: DEFAULT_TABS,
		},
		tablet: {
			tabs: DEFAULT_TABS,
		},
		desktop: {
			tabs: DEFAULT_TABS,
		},
	};

	/**
	 * Combines/Merges two toolbar configurations.
	 * Applies the `mergerSettings` onto the `baseSettings`, similar to how `Object.assign` would do it.
	 * Tabs are only "defined" by the `mergerSettings`, but properties will be properly merged.
	 * 
	 * @param {ToolbarSettings|ResponsiveToolbarSettings} baseSettings
	 * @param {ToolbarSettings|ResponsiveToolbarSettings} mergerSettings
	 */
	function combineToolbarSettings(baseSettings, mergerSettings) {
		baseSettings = normalizeToolbarSettings(baseSettings);
		mergerSettings = normalizeToolbarSettings(mergerSettings);

		/** @type {ToolbarSettings} */
		var outputSettings = {};

		Object.entries(mergerSettings).forEach(function(entry) {
			/** @type {ResponsiveToolbarSettings} */
			var baseResponsive = baseSettings[entry[0]];

			/** @type {ResponsiveToolbarSettings} */
			var tmpResponsive = {
				tabs: entry[1].tabs
					.map(function(tab) {
						// Can not merge tabs without id
						if (typeof tab.id !== 'string') {
							return tab;
						}

						var found = baseResponsive.tabs.find(function(baseTab) {
							return baseTab.id === tab.id;
						});

						// If we couldn't find another tab, then simply add this tab
						if (!found) {
							return tab;
						}

						var tmpTab = Object.assign({}, found, tab);

						switch (tab.merge) {
							case 'keep':
								tmpTab.components = found.components || tab.components;
								break;
							
							case 'append':
								tmpTab.components = combineComponents(found.components || [], tab.components || []);
								break;

							case 'prepent':
								tmpTab.components = combineComponents(tab.components || [], found.components || []);
								break;

							default:
							case 'override':
								tmpTab.components = tab.components || found.components;
								break;
						}

						return tmpTab;
					}).filter(function(tab) {
						return tab != null;
					}),
			};

			outputSettings[entry[0]] = tmpResponsive;
		});

		return translateToolbarTabs(outputSettings);
	}

	/**
	 * 
	 * @param {Array.<ComponentSlot>|Array.<Array<ComponentSlot>>} base 
	 * @param {Array.<ComponentSlot>|Array.<Array<ComponentSlot>>} additional 
	 */
	function combineComponents(base, additional) {
		if (!Array.isArray(base[0])) {
			base = [base];
		}
		if (Array.isArray(additional[0])) {
			additional = [additional];
		}

		var combined = [];

		/** @type {Array.<string>} */
		var usedSlots = base.map(function(group) {
			// Push the regular group into the combined list
			combined.push(group);

			return group.map(function(comp) {
				return typeof comp === 'string' ? comp : comp.slot;
			});
		});

		additional.forEach(function(group) {
			var tmp = group.filter(function(comp) {
				var compSlot = typeof comp === 'string' ? comp : comp.slot;
				return !usedSlots.includes(compSlot);
			});
			if (tmp.length > 0) {
				combined.push(tmp);
			}
		});

		return combined;
	}

	/**
	 * @param {ToolbarSettings|ResponsiveToolbarSettings} settingsObj The settings to normalize
	 * @returns {ToolbarSettings} Standardized settings.
	 */
	function normalizeToolbarSettings(settingsObj) {
		if (settingsObj.hasOwnProperty('mobile') && settingsObj.hasOwnProperty('tablet') && settingsObj.hasOwnProperty('desktop')) {
			return settingsObj;
		}

		// Use copies, as they might be edited later on
		return {
			mobile: Object.assign({}, settingsObj),
			tablet: Object.assign({}, settingsObj),
			desktop: Object.assign({}, settingsObj),
		};
	}

	/**
	 * Translates the tab labels **in place**.
	 * @param {ToolbarSettings} settings The settings which should be translated.
	 * @returns Simply `settings` again.
	 */
	function translateToolbarTabs(settings) {
		Object.values(settings).forEach(function(sizeSettings) {
			((sizeSettings || {}).tabs || []).forEach(function(tab) {
				tab.label = i18n.t(tab.label, tab.label);
			});
		});

		return settings;
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
		defaultToolbarSettings: DEFAULT_TOOLBAR_SETTINGS,
		translateToolbarTabs: translateToolbarTabs,
		normalizeToolbarSettings: normalizeToolbarSettings,
		combineToolbarSettings: combineToolbarSettings
	};
});
