/*global jQuery, seoslides */
(function ( $, window, undefined ) {
	var CORE = window.SEO_Slides,
		document = window.document,
		notesOverlay = document.querySelector( '.deck-notes-overlay' ),
		$d = $( document ),
		$body = $( 'body' );

	CORE.isEmbeded = false;
	if ( window.self !== window.top ) {
		CORE.isEmbeded = true;

		var body = document.getElementsByTagName( 'body' )[0];
		body.className += ' embeded';
	}

	function hideNotes( e, from, to ) {
		var newSlide = $.deck( 'getSlide', to ),
			notesEl = newSlide[0].querySelector( 'aside.note' );

		if ( null !== notesEl ) {
			$( notesEl ).addClass( 'hidden' );
		}
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

		// Hide notes icon if embedded
		if ( CORE.isEmbeded ) {
			$d.on( 'deck.change', hideNotes );
		}

		$d.on( 'deck.change', scanEmbeds );
	}

	/**
	 *
	 * @param element
	 * @constructor
	 */
	function Footer( element ) {
		var SELF = this,
			enabled = true,
			disabledForLastSlide = false,
			$element = $( element );

		var speed = CORE.Events.applyFilter( 'footer.fadeSpeed', 300 ),
			timeout, block;

		SELF.hide = function() {
			window.clearTimeout( timeout );
			$element.fadeOut( speed * 4, function() {
				$d.focus();
			} );
		};

		SELF.show = function() {
			window.clearTimeout( timeout );
			if ( ! enabled ) {
				return;
			}

			$element.fadeIn( speed );
			timeout = window.setTimeout( SELF.hide, 3000 );
		};

		SELF.disable = function() {
			enabled = false;
			$d.off( 'mousemove', SELF.show );

			return SELF;
		};

		SELF.enable = function() {
			enabled = true;
			$d.on( 'mousemove', SELF.show );

			return SELF;
		};

		SELF.position = function() {
			var node = document.querySelector( '.deck-current' );
			if ( null !== node ) {
				var $node = $( node ),
					right = $node.offset().left + 5;

				element.style.right = right + 'px';
			}
		};
	}
	var footer = new Footer( document.querySelector( 'footer.deck-footer' ) );
	CORE.Events.addAction( 'debounced.canvas.resize', footer.position );

	if ( null === window.document.querySelector( 'section.overview' ) ) {
		loadContent();
		footer.enable().show();
	} else {
		footer.disable();
		// Run backstretch on overview slides
		$( document.querySelectorAll( '.overview .slide' ) ).backstretchShort();

		// Wait until the user clicks to start the presentation before advancing to the first slide
		var keys = [ 13, 32, 34, 39, 40 ]; // enter, space, page down, right arrow, down arrow

		$d.off( 'keydown.overview' ).on( 'keydown.overview', function ( e ) {
			var srcElement = e.target || e.srcElement;

			if ( (e.which === keys || $.inArray( e.which, keys ) > - 1) &&
				srcElement !== document.querySelector( 'input#author' ) &&
				srcElement !== document.querySelector( 'input#email' ) &&
				srcElement !== document.querySelector( 'input#website' ) &&
				srcElement !== document.querySelector( 'textarea#comment' ) ) {
				loadContent();
				footer.enable().show();
				$d.unbind( 'keydown.overview' );
				e.preventDefault();
			}
		} );

		var plugins = $( '.slide-body > div' );
		CORE.processPlugins( plugins );
		plugins.each( function( i, el ) { CORE.resizePlugins( el ); } );
		$( '.seoslides_responsive', '.list.thumbnails' ).responsiveText();

		// Handle clicks for the overview button
		$( '.link-wrap' ).on( 'click', function( e ) {
			var $this = $( this ),
				$target = $( e.target ),
				href = $this.data( 'href' );

			if ( $target.hasClass( 'embed-button' ) || $this.find( '.embed-container' ).hasClass( 'opened' ) ) {
				return;
			}

			window.location.href = href;
		} );
	}

	$.extend(true, $.deck.defaults, {
		selectors: {
			hashLink: '.deck-permalink'
		},

		hashPrefix: '',
		preventFragmentScroll: true
	});

	if ( CORE.isEmbeded ) {
		// We're in an iframe
		var head  = window.document.getElementsByTagName('head')[0],
			title = window.document.getElementsByTagName('title')[0],
			base  = window.document.createElement('base');

		base.target = '_parent';
		head.insertBefore(base, title.nextSibling);
	}

	CORE.Events.addAction( 'debounced.canvas.resize', function ( context ) {
		$( '.seoslides_responsive', context ).responsiveText();

		var node = document.querySelector( '.deck-current' );
		if ( null !== node ) {
			var $node = $( node ),
				left = $node.offset().left + 5, // Left offset + Padding
				width = $node.width(),
				height = $node.height();

			var branding = document.querySelector( '.branding' );
			if ( null !== branding ) {
				branding.style.left = left + 'px';
			}

			// Resize iframes
			var frames = document.querySelectorAll( '.seoslides_iframe' );
			for ( var i = 0, l = frames.length; i < l; i++ ) {
				var frame = frames[ i ];

				frame.style.width = width + 'px';
				frame.style.height = height + 'px';
			}

			// Resize notes
			var notes = document.querySelector( '.note-container' );
			if ( notes !== notes ) {
				notes.style.height = height - 130 + 'px';
			}
		}
	} );

	var $buttons = $( document.querySelectorAll( '.detail-expander .button' ) ),
		$details = $( document.querySelector( 'section.details' ) );
	$( '.detail-expander' ).on( 'click', '.button', function() {
		$buttons.toggleClass( 'hidden' );
		$details.toggleClass( 'short' );
	} );

} )( jQuery, this );