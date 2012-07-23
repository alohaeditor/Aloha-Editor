Aloha.ready(function(){
Aloha.require(['ui/settings'], function(Settings){
	'use strict';

	module('Settings');
	test('combine user and default settings', function() {

		var userSettings = [
			{label: "not-modified" , components: ["1", "2", "3"]},
			{label: "groups"       , components: [["a", "b", "c"], ["d", "e", "f"]]},
			{label: "one-added"    , components: ["4", "5", "6"]}
		];

		var defaultSettings = [
			{label: "one-added"    , components: ["4", "added", "6", "ignored"]},
			{label: "groups"       , components: [["d", "e", "g"], ["f", "a", "b"], ["h", "i", "j"]]},
			{label: "one-remains"  , components: ["2", "3", "remains"]},
			{label: "empty"        , components: ["1", "5"]}
		];

		var expected = [
			{label: "not-modified" , components: ["1", "2", "3"]},
			{label: "groups"       , components: [["a", "b", "c"], ["d", "e", "f"], ["g"], ["h", "i", "j"]]},
			{label: "one-added"    , components: ["4", "5", "6", "added"]},
			{label: "one-remains"  , components: ["remains"]}
		];

		var combined = Settings.combineToolbarSettings(userSettings, defaultSettings, ["ignored"]);
		deepEqual(expected, combined);
	});
});
});
