Aloha.ready(function(){
    Aloha.require(["ribbon/ribbon-plugin", "ribbon/menuButton"], function(Ribbon){
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
