(function(window, undefined) {

	if (window.Aloha === undefined || window.Aloha === null) {
		var Aloha = window.Aloha = {};		
	}
	
	Aloha.settings = {
				logLevels: {'error': true, 'warn': true, 'info': true, 'debug': false},
				errorhandling : false,
				ribbon: false,

				"i18n": {
					// you can either let the system detect the users language (set acceptLanguage on server)
					// In PHP this would would be '<?=$_SERVER['HTTP_ACCEPT_LANGUAGE']?>' resulting in
					// "acceptLanguage": 'de-de,de;q=0.8,it;q=0.6,en-us;q=0.7,en;q=0.2'
					// or set current on server side to be in sync with your backend system
					"current": "en"
				},
				"floatingmenu": {
					"width" : 800
				},
				"repositories": {
					"linklist": {
						data: [
									{ name: 'Aloha Developers Wiki', url:'http://www.aloha-editor.com/wiki', type:'website', weight: 0.50 },
									{ name: 'Aloha Editor - The HTML5 Editor', url:'http://aloha-editor.com', type:'website', weight: 0.90  },
									{ name: 'Aloha Demo', url:'http://www.aloha-editor.com/demos.html', type:'website', weight: 0.75  },
									{ name: 'Aloha Wordpress Demo', url:'http://www.aloha-editor.com/demos/wordpress-demo/index.html', type:'website', weight: 0.75  },
									{ name: 'Aloha Logo', url:'http://www.aloha-editor.com/images/aloha-editor-logo.png', type:'image', weight: 0.10  }
						]
					}
				},
				"plugins": {
					"format": {
						// all elements with no specific configuration get this configuration
						config : [  'b', 'i', 'p', 'sub', 'sup', 'del', 'title', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre', 'removeFormat' ],
							editables : {
							// no formatting allowed for title
							'#top-text'	: [  ]
							}
					},
					"list": {
						// all elements with no specific configuration get an UL, just for fun :)
						config : [ 'ul', 'ol' ],
							editables : {
							// Even if this is configured it is not set because OL and UL are not allowed in H1.
							'#top-text'	: [  ]
							}
					},
					"abbr": {
						// all elements with no specific configuration get an UL, just for fun :)
						config : [ 'abbr' ],
							editables : {
							// Even if this is configured it is not set because OL and UL are not allowed in H1.
							'#top-text'	: [  ]
							}
					},
					"link": {
						// all elements with no specific configuration may insert links
						config : [ 'a' ],
							editables : {
							// No links in the title.
							'#top-text'	: [  ]
							},
							// all links that match the targetregex will get set the target
						// e.g. ^(?!.*aloha-editor.com).* matches all href except aloha-editor.com
							targetregex : '^(?!.*aloha-editor.com).*',
							// this target is set when either targetregex matches or not set
							// e.g. _blank opens all links in new window
							target : '_blank',
							// the same for css class as for target
							cssclassregex : '^(?!.*aloha-editor.com).*',
							cssclass : 'aloha',
							// use all resources of type website for autosuggest
							objectTypeFilter: ['website'],
							// handle change of href
							onHrefChange: function( obj, href, item ) {
								if ( item ) {
									window.alohaQuery(obj).attr('data-name', item.name);
								} else {
									window.alohaQuery(obj).removeAttr('data-name');
								}
							}
					},
					"table": {
						// all elements with no specific configuration are not allowed to insert tables
						config : [ 'table' ],
							editables : {
							// Don't allow tables in top-text
							'#top-text'	: [ '' ]
							},
							// [{name:'green', text:'Green', tooltip:'Green is cool', iconClass:'GENTICS_table GENTICS_button_green', cssClass:'green'}]
						tableConfig : [
											{name:'hor-minimalist-a'},
											{name:'box-table-a'},
											{name:'hor-zebra'},
							],
							columnConfig : [
									{name: 'table-style-bigbold',  iconClass: 'aloha-button-col-bigbold'},
									{name: 'table-style-redwhite', iconClass: 'aloha-button-col-redwhite'}
							],
						rowConfig : [
									{name: 'table-style-bigbold',  iconClass: 'aloha-button-row-bigbold'},
									{name: 'table-style-redwhite', iconClass: 'aloha-button-row-redwhite'}
							]

					},
					"image": {
	   					config : { 
	   						'img': { 
	   							'max_width': '50px',
								'max_height': '50px' 
							}
	   					},
					  	editables : {
							'#top-text'	: {}
					  	}
					}
					}
			};
})(window);