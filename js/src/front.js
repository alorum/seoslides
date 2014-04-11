/*global jQuery, seoslides, YT */
(function ( $, window, undefined ) {
	var CORE = window.SEO_Slides,
		document = window.document,
		notesOverlay = document.querySelector( '.deck-notes-overlay' ),
		$d = $( document ),
		$html = $( 'html' ),
		$body = $( 'body' ),
		youtube_players = [];

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
	 * Build a YouTube onReady polyfill method.
	 */
	var youtube_ready = (function () {
		var onReady_funcs = [], api_isReady = false;
		/* @param func function     Function to execute on ready
		 * @param func Boolean      If true, all qeued functions are executed
		 * @param b_before Boolean  If true, the func will added to the first position in the queue*/
		return function ( func, b_before ) {
			if ( func === true ) {
				api_isReady = true;
				while ( onReady_funcs.length ) {
					// Removes the first func from the array, and execute func
					onReady_funcs.shift()();
				}
			} else if ( typeof func === "function" ) {
				if ( api_isReady ) {
					func();
				}
				else {
					onReady_funcs[b_before ? "unshift" : "push"]( func );
				}
			}
		};
	})();

	/**
	 * Make sure we fire the YouTube ready event when we're actually ready.
	 */
	window.onYouTubePlayerAPIReady = function() {
		youtube_ready( true );
	};

	/**
	 * Scan the current slide for any embeds and, if present, add a body class.
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function scanEmbeds( e, from, to ) {
		window.setTimeout( function() {
			if ( 0 !== $d.find( '.deck-current' ).find( '.seoslides_iframe' ).length ) {
				$body.addClass( 'has-embed' );

				// Process YouTube players and add them to an array.
				var players = $( 'iframe[src*="youtube.com"]' );

				if ( players.length > 0 ) {
					// Load YouTube API.
					if ( null === document.getElementById( 'youtube-script' ) ) {
						var tag = document.createElement( 'script' );
						tag.id = 'youtube-script';
						tag.src = "//www.youtube.com/player_api";
						var firstScriptTag = document.getElementsByTagName( 'script' )[0];
						firstScriptTag.parentNode.insertBefore( tag, firstScriptTag );
					}

					youtube_ready( function () {
						players.each( function ( i, el ) {
							youtube_players.push( new YT.Player( el ) );

						} );
					} );
				}
			} else {
				$body.removeClass( 'has-embed' );
			}
		}, 10 );
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
		$.each( youtube_players, function( i, player ) {
			if ( undefined !== player.pauseVideo && undefined !== player.getPlayerState ) {
				switch( player.getPlayerState() ) {
					case 1: // Playing
					case 3: // Buffering
						player.pauseVideo();
						break;
					case -1: // Unstarted
					case 0:  // Ended
					case 2:  // Paused
					case 5:  // Cued
						break;
					default:
						break;
				}
			}
		} );
	}

	function loadContent() {
		process_content();

		var presentation_url = $( 'link[rel=canonical]' ).attr( 'href' ),
			allslides_url = presentation_url + 'allslides/';

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

					$( '.loading' ).removeClass( 'loading' );
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
		$d.on( 'deck.change', scanEmbeds   );
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
			var frames = document.querySelectorAll( '.seoslides_iframe' );
			for ( var i = 0, l = frames.length; i < l; i++ ) {
				var frame = frames[ i ];

				if ( $html.hasClass( 'mobile' ) ) {
					frame.style.display = 'none';
					$( frame ).siblings( 'img' ).css( 'display', 'block' );
				} else {
					$( frame ).siblings( 'p.video-no-mobile' ).css( 'display', 'none' );
					frame.style.width = width + 'px';
					frame.style.height = height + 'px';
				}
			}

			// Resize notes
			var notes = document.querySelector( '.note-container' );
			if ( notes !== notes ) {
				notes.style.height = height - 130 + 'px';
			}
		}
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

	// Let's run things
	loadContent();

} )( jQuery, this );