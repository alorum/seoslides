/*global jQuery, seoslides */
(function ( $, window, undefined ) {
	var CORE = window.SEO_Slides,
		document = window.document,
		notesOverlay = document.querySelector( '.deck-notes-overlay' ),
		$d = $( document ),
		$html = $( 'html' ),
		$body = $( 'body' );

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
	 * Scan the current slide for any embeds and, if present, add a body class.
	 *
	 * @param e
	 * @param from
	 * @param to
	 */
	function scanEmbeds( e, from, to ) {
		window.setTimeout( function() {
			if ( 0 !== $d.find( '.deck-current' ).find( '.seoslides_iframe' ).length ) {
				$body.addClass( 'has-embed' );
			} else {
				$body.removeClass( 'has-embed' );
			}
		}, 10 );
	}

	function process_content() {
		$.deck( '.slide' );

		CORE.resizeCanvas();

		$( 'section.slide' ).each( function () {
			var $this = $( this ).backstretchShort();

			CORE.processPlugins( $( '.slide-body > div', $this ) );
		} );
	}

	function loadContent() {
		process_content();

		// By default, the single page *only* contains the content of the current slide.  We asynchronously load the content
		// of the entire slide deck before firing the rest of the system.
		$.post( seoslides.ajaxurl, { 'action': 'get-slide-sections', 'slideset': seoslides.slideset } )
			.done( function ( data ) {
				if ( true === data.success ) {
					var container = $( '.deck-container' );

					$( document.querySelectorAll( '.overview' ) ).removeClass( 'overview' );
					container.find( 'section' ).remove();
					container.prepend( data.sections );

					process_content();
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

		$d.on( 'deck.change', scanEmbeds );
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

	CORE.Events.addAction( 'debounced.canvas.resize', resize_elements );

	// Let's run things
	loadContent();

} )( jQuery, this );