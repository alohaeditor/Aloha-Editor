Aloha.ready(function() {
	Aloha.require( ['aloha', 'aloha/jquery'], function( Aloha, $) {

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
					clearTimeout( autoplay );
					autoplay = setTimeout( showNext, 6000 );
				};
			switcher.children('li').each(function() {
				var $this = $(this),
					editable = $this.find('.area-content'), // make stage switcher available thru editable
					item = $this.find('.stage-item').detach();
				editable[0].tab = $this;
				item.hide();
				item.appendTo(switcher.parent());
				$this.click(function(event) {
					if (me.currentTab) me.currentTab.removeClass('active');
					me.currentTab = $this;
					$this.addClass('active');
					if (current && current != item ) {
						if (current) current.fadeOut(500);
					}
					item.fadeIn(500);
					current = item;
					clearTimeout( autoplay );
				});
				$this.mouseover(function() {
					$this.addClass('hover');
				});
				$this.mouseout(function() {
					$this.removeClass('hover');
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
				clearTimeout( autoplay );
			});
			Aloha.bind('aloha-editable-deactivated', function(e,a){
				clearTimeout( autoplay );
				autoplay = setTimeout( showNext, 6000 );
			});
		};
		$('.stage-area').alohaStage();
		
		/**
		 * Aloha Source Viewer
		 * Provides a development tool that shows the source around the
		 * selection inside an editable
		 *
		 * @todo support for pretty print
		 */
		
		require( [ '../../test/unit/testutils' ], function ( TestUtils ) {
			
			Aloha.Sidebar.right.addPanel( {
				id       : 'aloha-devtool-source-viewer-panel',
				title    : '<span style="float:left; margin-left:20px;">Source Viewer</span>\
							<span style="float:right; padding-right:10px;">\
								<input type="checkbox"\
									   id="aloha-devtool-source-viewer-widen-ckbx"\
									   class="aloha-devtool-source-viewer-ckbx"\
									   style="vertical-align:middle;" />\
								<label for="aloha-devtool-source-viewer-widen-ckbx"\
									   class="aloha-devtool-source-viewer-ckbx">\
									   Widen</label>\
								<input type="checkbox"\
									   id="aloha-devtool-source-viewer-entire-ckbx"\
									   class="aloha-devtool-source-viewer-ckbx"\
									   style="vertical-align:middle;"\
									   checked="true"\
									   />\
								<label for="aloha-devtool-source-viewer-entire-ckbx"\
									   class="aloha-devtool-source-viewer-ckbx">\
									   Show all source</label>\
							</span><span style="float:clear"></span>',
				expanded : true,
				activeOn : true,
				content  : '<div id="aloha-devtool-source-viewer-content"></div>',
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
					
					function showSource ( container ) {
						var source =
							Aloha.jQuery('<div>')
								 .text( container.html() )
								 .html()
								 .replace( /\t/g, '  ' )
								 .replace( /([\[\{])/,
									'<span class="aloha-devtool-source-viewer-marker"\
										style="background:#70a5e2; color:#fff">$1' )
								 .replace( /([\]\}])/, '$1</span>' )
								 .replace( /([\[\]\{\}])/g,
									'<b style="background:#0c53a4; color:#fff;">$1</b>' );
						
						viewArea.html( source );
						
						var marker = viewArea.find( '.aloha-devtool-source-viewer-marker' );
						
						if ( marker.length ) {
							// add rounding at the tip of the selection
							var radius = 3;
							marker.css( 'border-radius', radius );
							marker.find( '>b' ).first().css( {
								'border-top-left-radius'    : radius,
								'border-bottom-left-radius' : radius
							} );
							marker.find( '>b' ).last().css( {
								'border-top-right-radius'    : radius,
								'border-bottom-right-radius' : radius
							} );
							
							// scroll the view to the start of the selection
							viewArea
								.scrollTop( 0 )
								.scrollTop( Math.max(
									0, ( marker.offset().top -
											viewArea.offset().top ) - 30
								) );
						}
					};
					
					var that = this,
					    jQuery = Aloha.jQuery,
					    showEntireEditableSource = true,
					    sidebar = this.sidebar,
					    originalWidth = sidebar.width,
					    viewArea = this.content.find( '#aloha-devtool-source-viewer-content' );
					
					this.title.find( '.aloha-devtool-source-viewer-ckbx' )
						.click( function ( ev ) {
							ev.stopPropagation();
						} );
					
					this.title.find( '#aloha-devtool-source-viewer-widen-ckbx' )
						.change( function () {
							sidebar.width = jQuery( this ).attr( 'checked' )
								? 600
								: originalWidth;
							
							sidebar.container.width( sidebar.width )
								.find( '.aloha-sidebar-panels' ).width( sidebar.width );
							sidebar.open( 0 );
						} );
					
					this.title.find( '#aloha-devtool-source-viewer-entire-ckbx' )
						.change( function () {
							showEntireEditableSource =
								!!jQuery( this ).attr( 'checked' );
						} );
					
					viewArea.css( {
						'background'  : '#fff',
						'height'      : 400,
						'margin'      : 0,
						'padding'     : 10,
						'border'      : 0,
						'color'		  : '#888',
						'line-height' : '1.5em',
						'font-size'   : '12px',
						'font-family' : 'monospace',
						'overflow'	  : 'scroll'
						// 'white-space' : 'pre'
					} );
					
					// false to deactivate source viewer
					if ( true ) {
						Aloha.bind(
							'aloha-selection-changed',
							function ( event, range ) {
								var sNode = range.startContainer;
								var eNode = range.endContainer;
								
								if ( !sNode || !eNode || Aloha.activeEditable == null ) {
									return;
								}
								
								var id = +( new Date );
								var sClass = 'aloha-selection-start-' + id;
								var eClass = 'aloha-selection-end-' + id;
								
								// Add marker classes onto the container nodes,
								// or their parentNodes if the containers are
								// textNodes
								jQuery( sNode.nodeType == 3
											? sNode.parentNode : sNode )
												.addClass( sClass );
								
								jQuery( eNode.nodeType == 3
											? eNode.parentNode : eNode )
												.addClass( eClass );
								
								if ( showEntireEditableSource ) {
									common = Aloha.activeEditable.obj[ 0 ];
								} else {
									// We determine which element's source to
									// show. If either the startContainer or the
									// endContainer is a text node, we will want
									// to show more of the source around our
									// selection so we will use the parent node of
									// the commonAncestorContainer
									var common;
									if ( ( sNode.nodeType == 3 ||
												eNode.nodeType == 3 ) &&
													!jQuery( range.commonAncestorContainer )
														.is( '.aloha-editable' ) ) {
										common = range.commonAncestorContainer.parentNode;
									} else {
										common = range.commonAncestorContainer;
									}
								}
								
								var clonedContainer = jQuery( jQuery( common ).clone() );
								
								var clonedStartContainer = clonedContainer.is( '.' + sClass )
										? clonedContainer
										: clonedContainer.find( '.' + sClass );
								
								var clonedEndContainer = clonedContainer.is( '.' + eClass )
										? clonedContainer
										: clonedContainer.find( '.' + eClass );
								
								// We may not find clonedStart- and clonedEnd-
								// Containers if the selection range is outside
								// of of the active editable (something that
								// can happen when doing CTRL+A)
								if ( clonedStartContainer.length == 0 &&
										clonedEndContainer.length == 0 ) {
									return;
								}
								
								// Now that we have identified all our
								// containers, we can remove markers anywhere
								// we have placed them
								jQuery( '.' + sClass ).removeClass( sClass );
								jQuery( '.' + eClass ).removeClass( eClass );
								clonedStartContainer.removeClass( sClass );
								clonedEndContainer.removeClass( eClass );
								
								var startNode;
								var cSC = clonedStartContainer[ 0 ];
								if ( sNode.nodeType == 3 && cSC.childNodes.length ) {
									var sNI = getNodeIndex( sNode );
									if ( sNI >= cSC.childNodes.length ) {
										startNode = cSC.lastChild;
									} else {
										startNode = cSC.childNodes[ sNI ];
									}				
								} else {
									startNode = cSC;
								}
								
								var endNode;
								var cEC = clonedEndContainer[ 0 ];
								if ( eNode.nodeType == 3 && cEC.childNodes.length ) {
									var eNI = getNodeIndex( eNode );
									
									if ( eNI >= cEC.childNodes.length ) {
										endNode = cEC.lastChild;
									} else {
										endNode = cEC.childNodes[ eNI ];
									}
								} else {
									endNode = cEC;
								}
								
								var fakeRange = {
									startContainer : startNode,
									endContainer   : endNode,
									startOffset    : range.startOffset,
									endOffset      : range.endOffset
								};
								
								try {
									TestUtils.addBrackets( fakeRange );
								} catch ( ex ) {
									viewArea.html( '[' + ex + ']' );
									return;
								}
								
								showSource( clonedContainer );
							}
						);
					}
				}
			} );
			
		} );
		
	});
});
