Aloha.ready(function(){
    Aloha.require(["ribbon/ribbon-plugin", "ui/component", "ribbon/menuButton"], function(Ribbon, Component, MenuButton){

		Component.define("insertTag", MenuButton, {
			label: "X",
			menu: [
				{ label: "Z",
				  menu: [ { label: "Q", onclick: function(){console.log("Q");} },
						  { label: "W", onclick: function(){console.log("W");} } ] },
				{ label: "V",
				  menu: [ { label: "Q", onclick: function(){console.log("Q");} },
						  { label: "W", onclick: function(){console.log("W");} } ] }
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
							menu: [{ label: "action only", onclick: function(){ console.log("action only"); } }]
						},
						{
							label: "action only",
							onclick: function() {
								console.log("action only");
							}
						}
					],	
					onclick: function(){
						console.log("action with submenu");
					}
				}
			],
			// icon: 'url',
			onclick: function(){
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
							menu: [{ label: "action only", onclick: function(){ console.log("action only"); } }]
						},
						{
							label: "action only",
							onclick: function() {
								console.log("action only");
							}
						}
					],	
					onclick: function(){
						console.log("action with submenu");
					}
				}
			]
			// icon: 'url',
		});
    });
});
