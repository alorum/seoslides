/*global jQuery */
(function ( window, $, undefined ) {
	var document = window.document,
		CORE = window.SEO_Slides,
		$d = $( document ),
		$footer = $d.find( '.deck-footer' ),
		$extras = $d.find( '.extras' ),
		embed_code;

	/**
	 * The Embed_Code object handles all events and interactions with the standard footer overlays.
	 *
	 * It's called "embed code" because it originally only controlled the script and shortcode embeds.
	 *
	 * @constructor
	 */
	function Embed_Code() {
		var SELF = this;

		/**
		 * Get the embed script for the current slide.
		 *
		 * @param {object} data
		 * @returns {string}
		 */
		function get_code( data ) {
			var code = '<script id="' + data.embed_id + '" type="text/javascript" src="' + data.embed_url + '"></script>';
			code += '<span id="seoslides-embed-' + data.embed_id + '"><a href="' + data.overview + '">' + data.slide_title + '</a> from <a href="' + data.site_url + '">' + data.site_title + '</a>' + '</span>';
			code = CORE.Events.applyFilter( 'seoslides.embed_code', code );

			return code;
		}

		/**
		 * Get the WordPress shortcode for the current slide.
		 *
		 * @param {object} data
		 * @returns {string}
		 */
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
				$extras.removeClass( 'opened' );
			}

			$container.find( 'aside.current' ).removeClass( 'current' );
			$container.find( 'aside, .embed-input' ).addClass( 'hidden' );
			$container.find( 'aside.default' ).addClass( 'current' );
			$container.find( 'aside.default, input.default' ).removeClass( 'hidden' );

			load_embed_code( $container[0] );
		}

		/**
		 * Load the embed code into the input field if we're on an embedable overlay.
		 *
		 * @param {HTMLElement} container
		 * @param {string}      slide_link
		 */
		function load_embed_code( container, slide_link ) {
			var input = container.querySelector( '.embed-input' ),
				$container = $( container ),
				$input = $( input ),
				embed_data;

			// If no link was passed in, try to grab it from the anchor wrapping the slide.
			if ( undefined === slide_link ) {
				slide_link = $container.closest( 'a' ).attr( 'href' );
			}

			// If no anchor is wrapping the slide, we must be actually viewing a slide. Grab the current location.
			if ( undefined === slide_link ) {
				slide_link = window.location.href;
			}

			embed_data = {
				embed_id: input.getAttribute( 'id' ),
				embed_url: slide_link.replace( /\/(slides|embeds)\//, '/embed-script/').replace( /\/share\//, '/'),
				overview: window.location.href.replace( /\/share\//, '/'),
				slide_title: input.getAttribute( 'data-title' ),
				site_title: input.getAttribute( 'data-site' ),
				site_url: input.getAttribute( 'data-siteurl' )
			};

			// Find out whether we're using the WordPress shortcode or the script embed
			var activeElement = container.querySelector( 'aside.current' );
			if ( activeElement.className.match( /(^| )wordpress-embed-instructions( |$)/ ) ) {
				$input.val( get_shortcode( embed_data ) );
			} else if ( activeElement.className.match( /(^| )script-embed-instructions( |$)/) ) {
				$input.val( get_code( embed_data ) );
			}
		}

		/**
		 * Switch from one overlay to another based on the footer button being clicked.
		 *
		 * @param {object} $container
		 * @param {object} $target
		 */
		function switchOverlay( $container, $target ) {
			$container.find( 'aside.current' ).removeClass( 'current' );

			if ( $target.hasClass( 'seoslides' ) ) {
				$container.find( 'aside.wordpress-embed-instructions' ).addClass( 'current' );
				load_embed_code( $container[0] );
				$container.find( '.embed-input' ).show();
			} else if ( $target.hasClass( 'link' ) ) {
				$container.find( 'aside.script-embed-instructions' ).addClass( 'current' );
				load_embed_code( $container[0] );
				$container.find( '.embed-input' ).show();
			} else if ( $target.hasClass( 'notes' ) ) {
				$container.find( 'aside.note' ).addClass( 'current' );
				$container.find( '.embed-input' ).hide();
			}
		}

		/**
		 * Share the presentation on one of the 3 default social networks.
		 *
		 * @param {Event} event
		 */
		SELF.sharePresentation = function( event ) {
			var $target = $( event.target ),
				me = window.self;

			// Get the URL to share
			var url = me.location.href,
				title = encodeURIComponent( document.title );

			url = url.replace( me.location.origin + '/embeds/', me.location.origin + '/slides/' );
			url = encodeURIComponent( url );

			if ( $target.hasClass( 'facebook' ) ) {
				window.open( 'https://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + url + '&p[title]=' + title + '&p[summary]=' + title, 'sharer','toolbar=0,status=0,width=580,height=325' );
			} else if ( $target.hasClass( 'google' ) ) {
				window.open( 'https://plus.google.com/share?url=' + url, 'google', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600' );
			} else if ( $target.hasClass( 'twitter' ) ) {
				window.open( 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title + '&via=seoslides', 'twitter', 'toolbar=0,status=0,width=580,height=250' );
			}
		};

		/**
		 * Open the overlay from a footer trigger.
		 *
		 * @param {Event} event
		 */
		SELF.open_footer_embed = function ( event ) {
			event.preventDefault();
			var container = document.querySelector( '.deck-current .embed-container' ),
				$container = $( container ),
				$target = $( event.target );

			if ( $container.hasClass( 'opened' ) ) {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
				return;
			}

			reset_container( $container, false );

			// Make sure the correct element is selected
			switchOverlay( $container, $target );

			$container.addClass( 'opened' );
			$footer.addClass( 'opened' );
			$extras.addClass( 'opened' );

			$d.on( 'deck.change', function() {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
			} );

			CORE.Events.doAction( 'embed.open', container );
		};

		/**
		 * Make sure that clicking on the input field for the embed code doesn't cancel out the overlay.
		 *
		 * @param {Event} event
		 */
		SELF.cancel_click_on_embed = function ( event ) {
			var srcElement = event.target || event.srcElement;

			if ( srcElement.className.match( /(^| )embed-input( |$)/ ) ) {
				event.preventDefault();
			}
		};

		/**
		 * Handle any clicks within the fotter container.
		 *
		 * @param {Event} event
		 */
		SELF.click_on_container = function( event ) {
			var container = document.querySelector( '.deck-current .embed-container' ),
				$container = $( container ),
				$target = $( event.target );

			if ( $container.hasClass( 'opened' ) && $target.hasClass( 'overlay' ) ) {
				event.preventDefault();
				event.stopImmediatePropagation();

				switchOverlay( $container, $target );
			} else if ( $container.hasClass( 'opened' ) && $target.hasClass( 'ssi' ) && $target.hasClass( 'social' ) ) {
				SELF.sharePresentation( event );

				CORE.Events.doAction( 'embed.close', container );
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
			} else if ( $this.hasClass( 'embiggen' ) ) {
				var me = window.self,
					embed_url = me.location.href;
				embed_url = embed_url.replace( me.location.origin + '/embeds/', me.location.origin + '/slides/' );

				window.open( embed_url );
			}

			CORE.Events.doAction( 'embed.action', '' );
		};
	}

	embed_code = new Embed_Code();

	/**
	 * Make sure the embed input field is selected when we open the overlay to facilitate copy-paste.
	 *
	 * Do this in an action callback, though, so we aren't changing the browser focus away from the document element
	 * and thus disabling keyboard navigation.
	 */
	CORE.Events.addAction( 'embed.open', function( container ) {
		var input = container.querySelector( '.embed-input' ), $input = $( input );
		$input.select();
	} );

	$d.on( 'click.embed-input', 'section.slide', embed_code.cancel_click_on_embed );
	$d.on( 'click.embed-overlay', '.ssi, .embed-container', embed_code.click_on_container );
	$d.on( 'keyup.embed-overlay', embed_code.close_on_escape );
	$d.on( 'click.embed-code', '.ssi.social', embed_code.sharePresentation );
	$d.on( 'click.embed-code', '.ssi.overlay', embed_code.open_footer_embed );

	$d.on( 'click.embed-actions', '.ssi.embiggen', embed_code.click_on_action );
}( this, jQuery ));