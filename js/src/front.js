/*global jQuery, seoslides, YT, $f */
(function ( $, window, undefined ) {
	var CORE = window.SEO_Slides,
		document = window.document,
		notesOverlay = document.querySelector( '.deck-notes-overlay' ),
		$d = $( document ),
		$html = $( 'html' ),
		$body = $( 'body' ),
		youtube_players = [],
		vimeo_players = [];

	CORE.isEmbeded = false;
	if ( window.self !== window.top ) {
		CORE.isEmbeded = true;

		var body = document.getElementsByTagName( 'body' )[0];
		body.className += ' embeded';

		var head  = window.document.getElementsByTagName('head')[0],
			title = window.document.getElementsByTagName('title')[0],
			base  = window.document.createElement('base');

		base.target = '_parent';
		head.insertBefore(base, title.nextSibling);
	}

	/**
	 * Process slide content upon navigation.
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function process_content( e, from, to ) {
		$.deck( '.slide' );

		CORE.resizeCanvas();

		$( 'section.slide' ).each( function () {
			var $this = $( this ).backstretchShort();

			CORE.processPlugins( $( '.slide-body > div', $this ) );
		} );
	}

	/**
	 * If Google Analytics tracking is installed, fire a pageview event.
	 *
	 * @global {Object} _gaq
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function google_track( e, from, to ) {
		if ( undefined === window._gaq ) {
			return;
		}

		var location = window.location.pathname;

		// Track the pageview
		window._gaq.push( ['_trackPageView', location ] );
	}

	/**
	 * Stop all playing videos.
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function kill_videos( e, from, to ) {

		var command = window.JSON.stringify( { event: 'command', func: 'pauseVideo', method: 'pause' } );

		$( '.seoslides-iframe-video' ).each( function( i, player ) {
			if ( null === player.contentWindow ) {
				return;
			}

			player.contentWindow.postMessage( command, 'https://www.youtube.com' );
		} );
	}

	function loadContent() {
		process_content();

		var presentation_url = $( 'link[rel=canonical]' ).attr( 'href' ),
			lastChar = presentation_url.substr( -1 ),
			allslides_url;

		if ( '/' === lastChar ) {
			allslides_url = presentation_url + 'allslides/';
		} else {
			allslides_url = presentation_url + '/allslides/';
		}

		// By default, the single page *only* contains the content of the current slide.  We asynchronously load the content
		// of the entire slide deck before firing the rest of the system.
		$.ajax( {
			'type': 'GET',
			'url': allslides_url
		} ).done( function ( data ) {
				if ( true === data.success ) {
					var container = $( '.deck-container' );

					$( document.querySelectorAll( '.overview' ) ).removeClass( 'overview' );
					container.find( 'section' ).remove();
					container.prepend( data.sections );

					process_content();

					var interstitial = document.getElementById( 'loading-interstitial' );
					$( interstitial ).fadeOut( 300, function() {
						interstitial.parentNode.removeChild( interstitial );
					} );
				}
			} );

		// Detect the keypress of F11 so we can detect fullscreen
		$d.unbind( 'keyup.fullscreen' ).bind( 'keyup.fullscreen', function(e) {
			var $body = $( 'body' );
			if ( 122 === e.which && !CORE.isEmbeded ) {
				$body.toggleClass('fullscreen');
				CORE.resizeCanvas();
			}
		} );

		// Set up jQuery events
		$d.on( 'deck.change', google_track );
		$d.on( 'deck.change', kill_videos );
	}

	/**
	 * Make sure dynamically-sized elements are resized after we change the size of the canvas.
	 *
	 * This will involve embeded iframes, the notes container, and embedded branding.
	 *
	 * @param {*} context
	 */
	function resize_elements( context ) {
		$( '.seoslides_responsive', context ).responsiveText();

		var node = document.querySelector( '.deck-current' );
		if ( null !== node ) {
			var $node = $( node ),
				left = $node.offset().left + 5, // Left offset + Padding
				width = $node.width(),
				height = $node.height();

			// Resize iframes
			var images = document.querySelectorAll( '.seoslides_iframe_thumb' );
			for ( var i = 0, l = images.length; i < l; i++ ) {
				var image = images[ i ];

				$( image ).siblings( 'p.video-no-mobile' ).css( 'display', 'none' );
			}

			// Resize notes
			var notes = document.querySelector( '.note-container' );
			if ( notes !== notes ) {
				notes.style.height = height - 130 + 'px';
			}
		}
	}

	/**
	 * Play a video in a modal overlay
	 *
	 * @param {Event} event
	 */
	function play_video( event ) {
		var $this = $( this ),
			close_video,
			video = this.getAttribute( 'data-embed' ),
			content = document.createElement( 'iframe' );

		content.width = '100%';
		content.height = '100%';
		content.src = video;
		content.className = 'seoslides-iframe-video';

		var overlay = CORE.createElement( 'div', {
			'appendTo': document.body
		} );
		overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #000;z-index: 159900;';

		var $overlay = $( overlay );
		$overlay.css( 'opacity', 0.7 ).on( 'click', close_video );

		var modal = CORE.createElement( 'div', {
			'appendTo': document.body
		} );
		modal.style.cssText = 'position: fixed; top: 30px; left: 30px; right: 30px; bottom: 30px; background-color: #fff; z-index: 160000;';

		var closer = CORE.createElement( 'a', {
			'attr':     [
				['class', 'seoslides-iframe-close'],
				['href', '#']
			],
			'appendTo': modal
		} );
		$( closer ).on( 'click', function ( e ) { e.preventDefault(); close_video(); } );

		var closeSpan = CORE.createElement( 'span', {
			'appendTo': closer
		} );

		close_video = function() {
			$( modal ).remove();
			$overlay.remove();
		};

		modal.appendChild( content );

		$d.on( 'deck.change', close_video );
	}

	// Set up DeckJS Defaults
	$.extend( true, $.deck.defaults, {
		selectors: {
			hashLink: '.deck-permalink'
		},

		hashPrefix:            '',
		preventFragmentScroll: true
	} );

	// Set up events
	CORE.Events.addAction( 'debounced.canvas.resize', resize_elements );
	$d.on( 'click', '.seoslides_iframe_play', play_video );

	// Let's run things
	loadContent();

} )( jQuery, this );