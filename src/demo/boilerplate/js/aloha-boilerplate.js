Aloha.ready(function() {
	Aloha.require( ['aloha', 'aloha/jquery'], function( Aloha, $) {

		//var $ = window.alohaQuery;
		$.fn.alohaStage = function() {
			var switcher = this.find('ul.stage-switcher'),
				me = this,
				current,
				autoplay,
				showNext = function() {
					var nextTab;
					if (!me.currentTab) {
						nextTab = switcher.find('li').first();
					} else {
						nextTab = me.currentTab.next();
						if (nextTab.length == 0) {
							nextTab = switcher.find('li').first();
						}
					}
					nextTab.click();
					autoplay = setTimeout(showNext, 6000);
				};
			switcher.children('li').each(function() {
				var $this = $(this),
					editable = $this.find('.area-content'), // make stage switcher available thru editable
					item = $this.find('.stage-item').detach();
				editable[0].tab = $this;
				item.hide();
				item.appendTo(switcher.parent());
				$this.click(function(event) {
					clearTimeout( autoplay );
					if (me.currentTab) me.currentTab.removeClass('active');
					me.currentTab = $this;
					$this.addClass('active');
					if (current && current != item ) {
						if (current) current.fadeOut(500);
					}
					item.fadeIn(500);
					current = item;
				});
				$this.mouseover(function() {
					$this.addClass('hover');
					clearTimeout( autoplay );
				});
				$this.mouseout(function() {
					$this.removeClass('hover');
					clearTimeout( autoplay );
					autoplay = setTimeout(showNext, 6000);
				});
			});
			showNext();
			switcher.animate({right: -150}, {queue: false});
			switcher.mouseenter(function() {
				switcher.animate({right: 0}, {queue: false});
			});
			switcher.mouseleave(function() {
				switcher.animate({right: -150}, {queue: false});
			});
		

			Aloha.bind('aloha-editable-activated', function(e,a){
				if ( a.editable.obj[0].tab ) {
					a.editable.obj[0].tab.click();
				}
			});
			Aloha.bind('aloha-editable-deactivated', function(e,a){
				autoplay = setTimeout(showNext, 6000);
			});
		};
		$('.stage-area').alohaStage();
		
		require( [ '../../test/unit/testutils' ], function ( TestUtils ) {
			
			Aloha.Sidebar.right.addPanel( {
				id       : 'aloha-dev-selection-inspector',
				title    : 'Aloha DevTool: Source Viewer',
				expanded : true,
				activeOn : true,
				content  : '<div id="aloha-devtool-source-viewer"></div>',
				onInit   : function () {
					function getNodeIndex ( node ) {
						if ( !node ) {
							return -1;
						}
						
						var kids = node.parentNode.childNodes,
							l = kids.length,
							i = 0;
						
						for ( ; i < l; ++i ) {
							if ( kids[ i ] === node ) {
								return i;
							}
						}
						
						return -1;
					};
				
					var jQuery = Aloha.jQuery;
					
					// A hack to make the sidebar wider
					var sidebar = this.sidebar;
					sidebar.width = 600;
					sidebar.container.width( sidebar.width )
						   .find( '.aloha-sidebar-panels' ).width( sidebar.width );
					sidebar.open( 0 ).close( 0 ).open( 0 );
					
					var that = this;
					
					var viewArea = that.content.find( '#aloha-devtool-source-viewer' );
					
					viewArea.css( {
						background    : '#fff',
						height        : 400,
						margin        : 0,
						padding       : 10,
						border        : 0,
						'line-height' : '1.5em',
						'font-size'   : '16px',
						'font-family' : 'monospace',
						overflow      : 'scroll',
						'white-space' : 'pre',
					} );
					
					Aloha.bind(
						'aloha-selection-changed',
						function( event, range ) {
							var date = +( new Date );
							var sNode = range.startContainer;
							var eNode = range.endContainer;
							var sClass = 'aloha-tmp-start-' + date;
							var eClass = 'aloha-tmp-end-' + date;
							
							jQuery( sNode.parentNode ).addClass( sClass );
							jQuery( eNode.parentNode ).addClass( eClass );
							
							var clone = jQuery( jQuery( range.commonAncestorContainer ).clone() );
							
							jQuery( sNode.parentNode ).removeClass( sClass );
							jQuery( eNode.parentNode ).removeClass( eClass );
							
							range.commonAncestorContainer = clone[ 0 ];
							
							console.log( clone, range.commonAncestorContainer );
							console.log( sNode.parentNode, clone.find( '.' + sClass ) );
							console.log( eNode.parentNode, clone.find( '.' + eClass ) );
							
							range.startContainer = clone.find( '.' + sClass )[ 0 ].childNodes[ getNodeIndex( sNode ) ];
							range.endContainer = clone.find( '.' + eClass )[ 0 ].childNodes[ getNodeIndex( eNode ) ];
							
							jQuery( range.startContainer ).parent( '.' + sClass ).removeClass( sClass );
							jQuery( range.endContainer ).parent( '.' + eClass ).removeClass( eClass );
							
							TestUtils.addBrackets( range );
							
							viewArea.html(
								Aloha.jQuery('<div>').text( clone.html().replace( /\t/g, '  ' ) ).html()
							);
						}
					);
				}
			} );
			
		} );
		
	});
});