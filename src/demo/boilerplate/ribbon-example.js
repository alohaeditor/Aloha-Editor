Aloha.ready(function(){
    Aloha.require(["ribbon/ribbon-plugin", "ui/component", "ui/menuButton"], function(Ribbon, Component, MenuButton){

		Component.define("insertTag", MenuButton, {
			text: "X",
			menu: [
				{ text: "Z",
				  menu: [ { text: "Q", click: function(){console.log("Q");}, iconUrl: '../../plugins/extra/wai-lang/img/button.png' },
						  { text: "W", click: function(){console.log("W");} } ],
				  iconUrl: '../../plugins/extra/wai-lang/img/button.png'},
				{ text: "V",
				  menu: [ { text: "Q", click: function(){console.log("Q");} },
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
			]
		});
		Ribbon.addButton({
			text: "menu button icons",
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
							iconUrl: '../../plugins/extra/wai-lang/img/button.png',
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
    });
});
