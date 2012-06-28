Aloha.ready(function(){
    Aloha.require(["ribbon/ribbon-plugin", "ui/component", "ui/menuButton"], function(Ribbon, Component, MenuButton){

		Component.define("insertTag", MenuButton, {
			label: "X",
			menu: [
				{ label: "Z",
				  menu: [ { label: "Q", click: function(){console.log("Q");} },
						  { label: "W", click: function(){console.log("W");} } ] },
				{ label: "V",
				  menu: [ { label: "Q", click: function(){console.log("Q");} },
						  { label: "W", click: function(){console.log("W");} } ] }
			]
		});

		Ribbon.addButton({
			label: "split button",
			menu: [
				{
					label: "action with submenu",
					menu: [
						{
							label: "submenu only",
							menu: [{ label: "action only", click: function(){ console.log("action only"); } }]
						},
						{
							label: "action only",
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
			// icon: 'url',
			click: function(){
				console.log("split button");
			}
		});
		Ribbon.show();
		Ribbon.addButton({
			label: "menu button",
			menu: [
				{
					label: "action with submenu",
					menu: [
						{
							label: "submenu only",
							menu: [{ label: "action only", click: function(){ console.log("action only"); } }]
						},
						{
							label: "action only",
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
			// icon: 'url',
		});
    });
});
