/*global jQuery */
( function ( window, $, undefined ) {
	var CORE = window.SEO_Slides;

	$( '.slide' ).each( function( i, el ) {
		CORE.slideBuilder.parseSlide( el );

		CORE.slideBuilder.resize( el );

		$( '> div', el ).backstretchShort();
	} );
} )( this, jQuery );
