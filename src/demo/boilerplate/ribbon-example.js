Aloha.ready(function(){
	if (!Aloha.isPluginLoaded('ribbon')) {
		return;
	}
    Aloha.require(["ribbon/ribbon-plugin", "ui/component", "ui/menuButton"], function(Ribbon, Component, MenuButton){

		Component.define("insertTag", MenuButton, {
			text: "X",
			menu: [
				{ text: "Z",
				  menu: [ { text: "one two", click: function(){console.log("Q");}, iconUrl: '../../plugins/extra/wai-lang/img/button.png' },
						  { text: "three four five", click: function(){console.log("W");} } ],
				  iconUrl: '../../plugins/extra/wai-lang/img/button.png'},
				{ text: "V sdf asdf as fasd fasfd asfasf asf",
				  menu: [ { text: "Q asd fas fasf as faw awe ftasf asd sad f", click: function(){console.log("Q");} },
						  { text: "W", click: function(){console.log("W");} } ] }
			],
			iconUrl: '../../plugins/extra/wai-lang/img/button.png'
		});

		Ribbon.addButton({
			text: "split button",
			menu: [
				{
					text: "action with submenu",
					menu: [
						{
							text: "submenu only",
							menu: [{ text: "action only", click: function(){ console.log("action only"); } }]
						},
						{
							text: "action only",
							click: function() {
								console.log("action only");
							}
						}
					],	
					click: function(){
						console.log("action with submenu");
					}
				}
			],
			click: function(){
				console.log("split button");
			},
			iconUrl: '../../plugins/extra/wai-lang/img/button.png'
		});
		Ribbon.show();
		Ribbon.addButton({
			text: "menu button",
			menu: [
				{
					text: "action with submenu",
					menu: [
						{
							text: "submenu only",
							menu: [{
								text: "action only",
								click: function(){ console.log("action only"); }
							}]
						},
						{
							text: "action only  x x x x  x x",
							click: function() {
								console.log("action only");
							}
						}
					],	
					click: function(){
						console.log("action with submenu");
					}
				}
			]
		});
		Ribbon.addButton({
			menu: [
				{
					text: "action with submenu",
					menu: [
						{
							text: "submenu only",
							menu: [{
								text: "action only",
								click: function(){ console.log("action only"); },
								iconUrl: '../../plugins/extra/wai-lang/img/button.png'
							}],
							iconUrl: '../../plugins/extra/wai-lang/img/button.png'
						},
						{
							text: "action only",
							click: function() {
								console.log("action only");
							},
							iconUrl: '../../plugins/extra/wai-lang/img/button.png'
						}
					],	
					click: function(){
						console.log("action with submenu");
					},
					iconUrl: '../../plugins/extra/wai-lang/img/button.png'
				}
			],
			iconUrl: '../../plugins/extra/wai-lang/img/button.png'
		});
		Ribbon.addButton({
			text: "split button2",
			menu: [
				{
					text: "action with submenu",
					menu: [
						{
							text: "submenu only",
							menu: [{ text: "action only", click: function(){ console.log("action only"); } }]
						},
						{
							text: "action only",
							click: function() {
								console.log("action only");
							}
						}
					],	
					click: function(){
						console.log("action with submenu");
					}
				}
			],
			click: function(){
				console.log("split button");
			}
		});
    });
});
