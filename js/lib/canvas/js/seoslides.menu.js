( function( window, $, undefined ) {
	var document = window.document;

	var ContextMenu = function( CORE ) {
		var SELF = this;
		var CONTEXT_MENU = false;
		var ANIMATION_TIME = 250;
		var MOUSE_POS = { x : 0, y : 0 };

		var _detectContextScope = function( e, target ) {
			if( ( CORE.hasClass( target, 'bucket-slide' ) === true || CORE.hasClass( target.parentNode, 'backstretch' ) ) && CORE.hasClass( target, 'left' ) === false && CORE.hasClass( target, 'right' ) === false ) {
				_renderSlideContextMenu( e );
			}
		};

		var _renderSlideContextMenu = function( e ) {
			if( CONTEXT_MENU !== false ) {
				_closeContextMenu();
			}

			MOUSE_POS.x = e.pageX;
			MOUSE_POS.y = e.pageY;
			CONTEXT_MENU = _createContextMenu();
			CONTEXT_MENU.style.top = MOUSE_POS.y + 'px';
			CONTEXT_MENU.style.left = MOUSE_POS.x + 'px';
			document.body.appendChild( CONTEXT_MENU );

			CORE.addEvent( 'click', CONTEXT_MENU, _fireClick );
		};

		var _fireClick = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			if( CORE.hasClass( target, 'context-menu-object' ) === true ) {
				_fireControlEvent( e, target );
			}
			else if( CORE.hasClass( target.parentNode, 'context-menu-object' ) === true ) {
				_fireControlEvent( e, target );
			}

			_closeContextMenu();
		};

		var _createContextMenu = function() {
			var menu = document.createElement( 'div' );
			menu.className = 'seoslides-context-menu';

			var html = CORE.Events.applyFilter( 'menu.render', false );
			if( html === false ) {
				html = '<ul><li class="context-menu-status"><i>No options available</i></li></ul>';
			}

			menu.innerHTML = html;

			return menu;
		};

		var _fireControlEvent = function( e, target ) {
			CORE.Events.doAction( 'menu.click', e, target, MOUSE_POS );
		};

		var _checkForClose = function( e, target ) {
			while( target !== null && target !== document ) {
				if( CORE.hasClass( target, 'seoslides-context-menu' ) ) {
					return;
				}
				target = target.parentNode;
			}

			// could not find the parent, close the menu
			_closeContextMenu();
		};

		var _closeContextMenu = function() {
			if( CONTEXT_MENU === false ) {
				return;
			}

			$( CONTEXT_MENU ).css( 'z-index', 1000 ).animate( { opacity : 0.00 }, ANIMATION_TIME, function() {
				this.parentNode.removeChild( this );
			} );
			CONTEXT_MENU = false;
		};

		CORE.Events.addAction( 'bucket.context.menu', _detectContextScope );
		CORE.Events.addAction( 'bucket.click', _checkForClose );
		CORE.Events.addAction( 'modal.close', _closeContextMenu );
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Menu = new ContextMenu( window.SEO_Slides );
} )( window, jQuery );