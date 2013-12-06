/*global jQuery */
( function ( $, window, undefined ) {
	var CORE = window.SEO_Slides,
		document = window.document;

	var processPlugins = CORE.processPlugins = function( $slide ) {
		if ( $slide.length === 0 ) {
			return;
		}

		$( '.slide-object-unparsed-content', $slide ).each( function( i, el ) {
			var unparsed = $( el ),
				parent = unparsed.parent(),
				content = document.createElement( 'div' ),
				UUID = parent.data( 'plugin' ),
				plugin = CORE.Plugins[ UUID ];

			// Create an object to parse
			var object = {
				'element_id': parent.data( 'element' ),
				'plugin_id':  parent.data( 'plugin' ),
				'settings':   {
					'content': unparsed.html(),
					'position': {
						'top':  $slide.data( 'top' ),
						'left': $slide.data( 'left' )
					},
					'size':     {
						'h': $slide.data( 'height' ),
						'w': $slide.data( 'width' )
					}
				}
			};

			var html = plugin.renderControlWithData( object );

			content.className = 'slide-object-content';
			content.innerHTML = html;

			unparsed.replaceWith( content );
		} );

		CORE.Events.debouncer.debounceAction( 'processPlugins', 'canvas.resize', $slide );
	};

	var resizeCanvas = CORE.resizeCanvas = function() {
		$( window ).off( 'resize.canvas' ).on( 'resize.canvas', resizeCanvas );

		var container = document.querySelector( 'article.deck-container' ),
			style = container.style,
			slides = document.querySelectorAll( 'section.slide' ),
			slidereel = document.querySelector( '.slide-reel' ),
			footer = document.querySelector( '.deck-footer' ),
			body = document.querySelector( 'body' ),
			bodyHeight = body.offsetHeight,
			bodyWidth = body.offsetWidth,
			slidereelHeight = 0,
			footerHeight = 0;

		if ( null !== slidereel ) {
			// Slide Reel exists, so do some magic
			bodyHeight -= slidereel.offsetHeight;
			slidereelHeight = slidereel.offsetHeight;
		}

		if ( null !== slidereel || null !== footer ) {
			style.paddingBottom = ( slidereelHeight + footerHeight ) + 'px';
		}

		// Build new height
		style.height = bodyHeight + 'px';
		style.minHeight = 'inherit';

		// Now set up slides
		var slide_maxHeight = bodyHeight,
			slide_maxWidth = body.offsetWidth;

		var idealWidth = slide_maxHeight * 16 / 9,
			idealHeight = slide_maxWidth * 9 / 16;

		// Setting to the maximum width
		if ( idealHeight > slide_maxHeight ) {
			style.margin = '0 auto';
			slide_maxWidth = idealWidth;
		}

		// Setting to the maximum height
		if ( idealWidth > slide_maxWidth ) {
			// Subtract the footer's height from the ideal height since we added that much
			// padding-bottom to the container above.
			var new_height = Math.floor( idealHeight - footerHeight ),
				top_margin = Math.floor( ( bodyHeight - idealHeight ) / 2 );

			style.height = new_height + 'px';

			// Extra -1 is to prevent rounding errors from showing a scrollbar
			var bottom_margin = bodyHeight - new_height - top_margin - 1;

			if ( bottom_margin < 0 ) {
				top_margin += bottom_margin;
				bottom_margin = 0;
			}

			style.margin = top_margin + 'px auto ' + bottom_margin + 'px';

			slide_maxHeight = idealHeight;
		}

		for( var i = 0; i < slides.length; i++ ) {
			var slide = slides[i],
				slideStyle = slide.style;

			if ( slide_maxHeight !== idealHeight ) {
				slideStyle.minHeight = slide_maxHeight + 'px';
			} else {
				slideStyle.removeProperty( 'minHeight' );
			}
			slideStyle.height = slide_maxHeight + 'px';
			slideStyle.width = slide_maxWidth + 'px';
			slideStyle.left = '-' + ( slide_maxWidth / 2 ) + 'px';
		}

		if ( null !== slidereel ) {
			var notesHeight = document.querySelector( '.deck-container' ).style.height;
			document.querySelector( '.slide-notes' ).style.height = notesHeight;
		}

		// Resize any objects on the page
		$( '.slide-body > div', slides ).each( function( i, el ) {
			resizePlugins( el );
		} );

		CORE.Events.debouncer.debounceAction( 'resizeCanvas', 'canvas.resize', slides );
	};

	var resizePlugins = CORE.resizePlugins = function( el ) {
		var $el = $( el ),
			parent = $( el ).parents( 'section.slide' ),
			slideHeight = parent.height(),
			slideWidth = parent.width();

		el.style.width = Math.floor( window.parseFloat( el.getAttribute( 'data-width' ) ) * slideWidth / 1600 ) + 'px';
		el.style.height = Math.floor( window.parseFloat( el.getAttribute( 'data-height' ) ) * slideHeight / 900 ) + 'px';
		el.style.top = Math.floor( window.parseFloat( el.getAttribute( 'data-top' ) ) * slideHeight / 900 ) + 'px';
		el.style.left = Math.floor( window.parseFloat( el.getAttribute( 'data-left' ) ) * slideHeight / 900 ) + 'px';
		el.style.position = 'absolute';

		CORE.Events.doAction( 'pluginContainer.resize', $el );
	};
} )( jQuery, this );
