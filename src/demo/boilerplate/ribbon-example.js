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
			label: "label",
			menu: [
				{
					label: "X",
					menu: [
						{
							label: "Z",
							menu: [{ label: "Q" }]
						},
						{
							label: "ZZ"
						}
					],	
					onclick: function(){
					}
				}
			],
			// icon: 'url',
			onclick: function(){
			}
		});
		Ribbon.show();
		Ribbon.addButton({
			label: "label",
			menu: [
				{
					label: "X",
					menu: [
						{
							label: "Z",
							menu: [{ label: "Q" }]
						},
						{
							label: "ZZ"
						}
					],	
					onclick: function(){
					}
				}
			]
		});
    });
});
