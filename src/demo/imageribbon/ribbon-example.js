Aloha.ready(function(){
	if (!Aloha.isPluginLoaded('ribbon')) {
		return;
	}
    Aloha.require(["ribbon/ribbon-plugin", "ui/ui", "ui/menuButton", 'ui/dialog'], function(Ribbon, Ui, MenuButton, Dialog){

		Ui.adopt("insertTag", MenuButton, {
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
			text: 'Image',
			menu: [
				{
					text: "Insert Image... (own dialog)",
					click: function() {
						createWysiwhatImagePicker();
					}
				},
				{
					text: "Insert Image... (Google Picker)",
					click: function() {
						newImagePicker();
						/*
						Dialog.alert({
							text: "Google Picker should show up!"
						});
						*/
					}
				},
				{
					text: "Insert Image... (Flickr)",
					click: function() {
						Dialog.alert({
							text: "Import from Flickr?!"
						});						
					}
				},
				{
					text: "Foobar!",
					click: function() {
						var img = Aloha.jQuery("<img />").attr("src", "http://a0.twimg.com/profile_images/1262048739/You-Made-it__2__normal.png");
						AlohaInsertIntoDom(img);
					}
				}
			],
		});

		Ribbon.addButton({
			text: 'Video',
			menu: [
				{
					text: "Insert Video... (Google Picker)",
					click: function() {
						newVideoPicker();
					}
				},
			],
		});

		Ribbon.show();


		Ribbon.show();

		// Comment Boilerplate example buttons out. Just kept in source for examples of new buttons
		/*

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

		Ribbon.addButton({
			text: 'confirm',
			click: function() {
				Dialog.confirm({
					text: "Do you want to X?"
				});
			}
		});

		Ribbon.addButton({
			text: 'alert',
			click: function() {
				Dialog.alert({
					text: "X happened!"
				});
			}
		});

		Ribbon.addButton({
			text: 'progress',
			click: function() {
				var progress = Dialog.progress({
					text: "X is in progress...",
					value: 0
				});
				var percent = 0;
				var interval = setInterval(function() {
					percent += 10;
					progress(percent);
					if (percent == 100) {
						clearInterval(interval);
					}
				}, 1000);
			}
		});

		*/
    });
});
