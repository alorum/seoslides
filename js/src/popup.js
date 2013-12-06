/*global window, jQuery */
/* Load links with a class of .popup in small window. Dimensions hardcoded for now. Parameterize later if needed. */
( function( window, $, undefined ) {
	var document = window.document;

	function onPopupLinkClick ( e ) {
		e.preventDefault();

		var w = 320,
			h = 500,
			x = window.screenX + ( window.outerWidth - w ) / 2,
			y = window.screenY + ( window.outerHeight - h ) / 4;

		window.open( this.href, "_blank", "height=" + h + ",width=" + w + ",left=" + x + ",top=" + y );
	}

	$( document.querySelectorAll( '.popup' ) ).click( onPopupLinkClick );
} )( window, jQuery );