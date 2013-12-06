/*global jQuery */
(function ( window, $, undefined ) {
	var document = window.document,
		CORE = window.SEO_Slides,
		$d = $( document ),
		$footer = $d.find( '.deck-footer' ),
		embed_code;

	function Embed_Code() {
		var SELF = this;

		function get_code( data ) {
			var code = '<script id="' + data.embed_id + '" type="text/javascript" src="' + data.embed_url + '"></script>';
			code += '<span id="seoslides-embed-' + data.embed_id + '"><a href="' + data.overview + '">' + data.slide_title + '</a> from <a href="' + data.site_url + '">' + data.site_title + '</a>' + '</span>';
			code = CORE.Events.applyFilter( 'seoslides.embed_code', code );

			return code;
		}

		function get_shortcode( data ) {
			var code = '[seoslides embed_id="' + data.embed_id + '"';
			code += ' script_src="' + data.embed_url + '"';
			code += ' overview_src="' + data.overview + '"';
			code += ' title="' + data.slide_title + '"';
			code += ' site_src="' + data.site_url + '"';
			code += ' site_title="' + data.site_title + '"';
			code += ' /]';

			code = CORE.Events.applyFilter( 'seoslides.embed_shortcode', code );

			return code;
		}

		/**
		 * Reset container elements to their default state.
		 *
		 * @param {object} $container
		 * @param {bool}   stay_open  Whether or not the overlay should remain open. Default assumes true.
		 */
		function reset_container( $container, stay_open ) {
			if ( undefined === stay_open || ! stay_open ) {
				$container.removeClass( 'opened' );
				$footer.removeClass( 'opened' );
			}

			$container.find( 'li.current' ).removeClass( 'current' );
			$container.find( 'aside.child, .embed-input' ).addClass( 'hidden' );
			$container.find( 'li.default' ).addClass( 'current' );
			$container.find( 'aside.default, input.default' ).removeClass( 'hidden' );

			load_embed_code( $container[0] );
		}

		function load_embed_code( container, slide_link ) {
			var input = container.querySelector( '.embed-input' ),
				$container = $( container ),
				$input = $( input ),
				embed_data;

			// If no link was passed in, try to grab it from the anchor wrapping the slide.
			if ( undefined === slide_link ) {
				slide_link = $container.closest( 'a' ).attr( 'href' );
			}

			// If no anchor is wrapping the slide, we much be actually viewing a slide. Grab the current location.
			if ( undefined === slide_link ) {
				slide_link = window.location.href;
			}

			embed_data = {
				embed_id: input.getAttribute( 'id' ),
				embed_url: slide_link.replace( /\/(slides|embeds)\//, '/embed-script/' ),
				overview: window.location.href,
				slide_title: input.getAttribute( 'data-title' ),
				site_title: input.getAttribute( 'data-site' ),
				site_url: input.getAttribute( 'data-siteurl' )
			};

			var scheme = container.querySelector( 'aside.child:not(.hidden)' ),
				code = '';
			if ( scheme.className.match( /(^| )wordpress-embed-instructions( |$)/ ) ) {
				code = get_shortcode( embed_data );
			} else {
				code = get_code( embed_data );
			}

			$input.val( code );
			$input.select();
		}

		SELF.open_footer_embed = function ( event ) {
			event.preventDefault();
			var container = document.querySelector( '.deck-current .embed-container' ),
				$container = $( container );

			if ( $container.hasClass( 'opened' ) ) {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
				return;
			}

			reset_container( $container, false );

			$container.addClass( 'opened' );
			$footer.addClass( 'opened' );

			$d.on( 'deck.change', function() {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
			} );

			CORE.Events.doAction( 'embed.open', container );
		};

		SELF.overview_embed_clicked = function ( event ) {
			event.preventDefault();

			var container = document.querySelector( '.deck-current .embed-container' ),
				$container = $( container );

			if ( $container.hasClass( 'opened' ) ) {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
				return;
			}

			reset_container( $container, false );
			load_embed_code( container );

			$container.addClass( 'opened' );
			$footer.addClass( 'opened' );

			CORE.Events.doAction( 'embed.open', container );
		};

		SELF.cancel_click_on_embed = function ( event ) {
			var srcElement = event.target || event.srcElement;

			if ( srcElement.className.match( /(^| )embed-input( |$)/ ) ) {
				event.preventDefault();
			}
		};

		SELF.cancel_click_on_container = function( event ) {
			var srcElement = event.target || event.srcElement;

			if( $( event.currentTarget ).hasClass( 'opened' ) ) {
				event.preventDefault();

				var container = document.querySelector( '.deck-current .embed-container' ),
					$container = $( container );

				if ( 'LI' === srcElement.nodeName ) {
					var $this = $( srcElement ),
						child = srcElement.getAttribute( 'data-child' ),
						$child = $( child );

					$container.find( 'li.current' ).removeClass( 'current' );
					$this.addClass( 'current' );

					$container.find( 'aside.child' ).addClass( 'hidden' );
					$child.removeClass( 'hidden' );

					if ( srcElement.className.match( /(^| )shortcode-li( |$)/ ) || srcElement.className.match( /(^| )embed-script-li( |$)/ ) ) {
						$container.find( '.embed-input' ).removeClass( 'hidden' );
						load_embed_code( container );
					} else {
						$container.find( '.embed-input' ).addClass( 'hidden' );
					}

					CORE.Events.doAction( 'embed.navigate', srcElement );
				}
			}
		};

		SELF.close_on_escape = function( event ) {
			if ( 27 === event.keyCode ) {
				var container = document.querySelector( '.deck-current .embed-container' ),
					$container = $( container );

				reset_container( $container, false );

				CORE.Events.doAction( 'embed.close', container );
			}
		};

		SELF.click_on_action = function( event ) {
			var $this = $( this );

			if ( $this.hasClass( 'overview' ) ) {
				window.open( $this.data( 'href' ) );
			} else if ( $this.hasClass( 'full-screen' ) ) {
				var me = window.self,
					embed_url = me.location.href;
				embed_url = embed_url.replace( me.location.origin + '/embeds/', me.location.origin + '/slides/' );

				window.open( embed_url );
			}

			CORE.Events.doAction( 'embed.action', '' );
		};
	}

	embed_code = new Embed_Code();

	$d.off( 'click.embed-code' ).on( 'click.embed-code', '#deck-embed-link', embed_code.open_footer_embed );
	$d.off( 'click.embed-code' ).on( 'click.embed-code', '.deck-actions', embed_code.open_footer_embed );
	$d.off( 'click.overview-embed' ).on( 'click.overview-embed', '.overview .slide .embed-button', embed_code.overview_embed_clicked );

	$d.on( 'click.embed-input', 'section.slide', embed_code.cancel_click_on_embed );
	$d.on( 'click.embed-overlay', '.embed-container', embed_code.cancel_click_on_container );
	$d.on( 'click.embed-overlay', '.deck-actions', embed_code.cancel_click_on_container );
	$d.on( 'keyup.embed-overlay', embed_code.close_on_escape );

	$d.on( 'click.embed-actions', '.action-icon', embed_code.click_on_action );
}( this, jQuery ));