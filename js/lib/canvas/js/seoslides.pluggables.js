( function( window, $, undefined ) {
	var document = window.document;

	var Pluggables = function( CORE ) {
		var SELF = this;
		var ACTION = false;

		SELF.getSavedData = function() {
			var data = CORE.Events.applyFilter( 'plugin.settings.get', {} );

			// Filter out any empty objects before returning
			var objects = [];
			for ( var hash in data ) {
				if ( ! data.hasOwnProperty( hash ) ) {
					continue;
				}
				var object = data[ hash ];

				if ( 0 === Object.keys( object ).length ) {
					continue;
				}

				for (var el in object ) {
					if ( ! object.hasOwnProperty( el ) ) {
						continue;
					}

					var element = object[ el ];
					element.plugin_id = hash;
					element.element_id = el;

					// Remove reference to the jQuery object
					delete element.element;

					objects.push( element );
				}
			}

			return objects;
		};

		SELF.resetPluginObjects = function() {
			for( var index in CORE.Plugins ) {
				if ( ! CORE.Plugins.hasOwnProperty( index ) ) {
					continue;
				}

				var plugin = CORE.Plugins[ index ];
				plugin.clearInstances();
			}
		};

		var _pluginMenuItemClicked = function( e, target, position ) {
			// make sure this is the plugin we're clicking
			if( CORE.hasClass( target.parentNode, 'context-menu-object' ) === true ) {
				target = target.parentNode;
			}

			var UUID = target.getAttribute( 'data-uuid' );
			if( UUID === null ) {
				return;
			}

			var html = CORE.Events.applyFilter( 'plugin.render.' + UUID, false );
			if( html === false ) {
				return;
			}

			_renderPlugin( html, position, UUID );
		};

		var _renderPlugin = function( html, position, UUID ) {

			// check if this plugin is draggable
			var canDrag = CORE.Events.applyFilter( 'plugin.canDrag.' + UUID );
			var canResize = CORE.Events.applyFilter( 'plugin.canResize.' + UUID );

			var div = document.createElement( 'div' );

			// setup classes correctly
			var className = 'slide-object';
			if( canDrag === true ) {
				className += ' can-drag';
			}
			if( canResize === true ) {
				className += ' can-resize';
			}

			div.className = className;
			div.setAttribute( 'data-uuid', UUID );

			if( canResize === true ) {
				html += '<div class="resize-control"></div>';
			}
			if( canDrag === true ) {
				html += '<div class="drag-control"></div>';
			}
			html += '<div class="dismiss-control"></div>';

			div.innerHTML = '<div class="slide-object-content">' + html + '</div>';

			// get the current slide element so we can calculate offset
			var slide = CORE.Bucket.getCurrentSlideElement();
			var offset = slide.offset();

			div.style.cssText = 'top: ' + ( position.y - offset.top ) + 'px; left: ' + ( position.x - offset.left ) + 'px;';

			CORE.Bucket.addToCurrentSlide( div );
			CORE.Events.doAction( 'plugin.rendered.' + UUID, div );

			var $div = $( div );
			CORE.Events.doAction( 'plugin.settings.save.' + UUID, div, 'size', _getRealPluginSize( $div, slide ) );
			CORE.Events.doAction( 'plugin.settings.save.' + UUID, div, 'position', _getRealPluginPosition( $div, slide ) );
		};

		var _getRealPluginSize = function( $element, $slide ) {
			$slide = $slide || CORE.Bucket.getCurrentSlideElement();

			return {
				w : 1600 / $slide.width() * $element.width(),
				h : 900 / $slide.height() * $element.height()
			};
		}

		var _getRealPluginPosition = function( $element, $slide ) {
			var position = $element.position();
			$slide = $slide || CORE.Bucket.getCurrentSlideElement();

			return {
				top  : 900 / $slide.height() * position.top,
				left : 1600 / $slide.width() * position.left
			};
		}

		var _renderPluginMenuOption = function( html ) {
			var objects = CORE.Events.applyFilter( 'plugins.menu', [] );

			if( objects.length === 0 ) {
				return html;
			}

			var object;
			html = '<ul>';
			for( var i = 0, len = objects.length; i < len; i++ ) {
				object = objects[ i ];
				html += '<li data-uuid="' + object.UUID + '" class="context-menu-object" style="background-image: url(' + object.icon + ');"><a href="javascript:void(0);">' + object.menuText + '</a></li>';
			}
			html += '</ul>';

			return html;
		};
		var _isPlugin = function( target ) {
			while( target !== document && target !== null ) {
				if( CORE.hasClass( target, 'slide-object' ) === true ) {
					return target;
				}
				target = target.parentNode;
			}

			return false;
		};
		var _getPluginUUID = function( element ) {
			var UUID;
			UUID = element.getAttribute( 'data-uuid' );

			if( UUID === null ) {
				return false;
			}

			return UUID;
		};
		var _getPluginData = function( target ) {
			var plugin = _isPlugin( target );
			if( plugin !== false ) {
				var UUID = _getPluginUUID( plugin );
				if( UUID !== false ) {
					return { UUID: UUID, element: plugin };
				}
			}

			return false;
		};
		var _checkPluginObjectClick = function( e, target ) {
			// deselect plugins cause we're not taking any actions
			CORE.Events.doAction( 'plugin.deselect', target );

			// check to see if we can interact with this plugin or not
			var pluginData = _getPluginData( target );
			if( pluginData === false ) {
				return;
			}

			CORE.Events.doAction( 'plugin.click.' + pluginData.UUID, e, target );
		};
		var _checkMouseDownPlugin = function( e, target ) {
			var pluginData = _getPluginData( target );
			if( pluginData === false ) {
				return;
			}

			if ( CORE.hasClass( target, 'resize-control' ) === true ) {
				// the user mouse-downed on the resize control for this plugin
				ACTION = { element: $( pluginData.element ), type: 'resize', UUID: pluginData.UUID };
				CORE.killEvent( e );
			}
			else if ( CORE.hasClass( target, 'drag-control' ) === true ) {
				ACTION = { element: $( pluginData.element ), type: 'drag', UUID: pluginData.UUID };
				CORE.killEvent( e );
			}
			else if ( CORE.hasClass( target, 'dismiss-control' ) === true ) {
				ACTION = { element: $( pluginData.element ), type: 'dismiss', UUID: pluginData.UUID };
				CORE.killEvent( e );
			}
		};
		var _checkMouseUpPlugin = function( e, target ) {
			// stop the current action from continuing on mouse-move
			if( ACTION !== false ) {
				// update the settings for this instance of the plugin
				if ( ACTION.type === 'resize' ) {
					var size = {
						w: ACTION.element.width(),
						h: ACTION.element.height()
					};
					CORE.Events.doAction( 'plugin.settings.save.' + ACTION.UUID, ACTION.element[ 0 ], 'size', _getRealPluginSize( ACTION.element ) );
				}
				else if ( ACTION.type === 'drag' ) {
					var position = ACTION.element.position();
					CORE.Events.doAction( 'plugin.settings.save.' + ACTION.UUID, ACTION.element[ 0 ], 'position', _getRealPluginPosition( ACTION.element ) );
				}
				else if ( ACTION.type === 'dismiss' ) {
					CORE.Events.doAction( 'plugin.remove.' + ACTION.UUID, ACTION.element[0] );
				}

				// clear the action now
				ACTION = false;

				// prevent the event from continuing
				CORE.killEvent( e );
			}
		};
		var _movePlugin = function( e, target, diffX, diffY ) {
			if( ACTION !== false ) {
				// continue doing the action
				if ( ACTION.type === 'resize' ) {
					var height = ACTION.element.height() + diffY,
						width = ACTION.element.width() + diffX;
					ACTION.element.css( {
						'height': height,
						'width':  width
					} );
					CORE.Events.doAction( 'plugin.resize.' + ACTION.UUID, ACTION.element[0], height, width );
				}
				else if( ACTION.type === 'drag' ) {
					// todo: make sure the plugin never goes out of bounds
					var position = ACTION.element.position();
					ACTION.element.css ( {
						top : position.top + diffY,
						left : position.left + diffX
					} );
				}
			}
		};

		// hook into the context menu action
		CORE.Events.addFilter( 'menu.render', _renderPluginMenuOption );
		CORE.Events.addAction( 'menu.click', _pluginMenuItemClicked );
		CORE.Events.addAction( 'bucket.click', _checkPluginObjectClick );
		CORE.Events.addAction( 'body.mouse.move', _movePlugin );
		CORE.Events.addAction( 'bucket.mouse.down', _checkMouseDownPlugin );
		CORE.Events.addAction( 'body.mouse.up', _checkMouseUpPlugin );
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Pluggables = new Pluggables( window.SEO_Slides );
} )( window, jQuery );