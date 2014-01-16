/*! seoslides - v1.2.3
 * https://seoslides.com
 * Copyright (c) 2014 Alroum; * Licensed GPLv2+ */
(function ( $, window, undefined ) {
	var document = window.document,
		CORE = window.seoslides_track,
		I18N = window.seoslides_i18n,
		pointer;

	function store_answer( input ) {
		var data = {
			action: 'seoslides_track',
			allow_tracking: input,
			nonce: I18N.tracking_nonce
		};


		$.post( CORE.ajaxurl, data, function() {
			pointer.pointer.remove();
		} );
	}

	var options = {
		content: I18N.tracking_label + I18N.tracking_language,
		position: {
			edge: 'top',
			align: 'center'
		},
		buttons: function (event, t ) {
			pointer = t;
			var button = $( '<a id="pointer-close" style="margin-left:5px" class="button-secondary">' + I18N.tracking_no_button + '</a>' );
			button.on( 'click', function() {
				t.element.pointer( 'close' );
			} );

			return button;
		},
		close: function() {}
	};

	function setup() {
		$( document.getElementById( 'wpadminbar' ) ).pointer( options ).pointer( 'open' );

		var closer = $( document.getElementById( 'pointer-close' ) );
		closer.after( '<a id="pointer-primary" class="button-primary">' + I18N.tracking_button + '</a>' );
		$( document.getElementById( 'pointer-primary' ) ).on( 'click', function() {
			store_answer( 'yes' );
		} );
		closer.on( 'click', function() {
			store_answer( 'no' );
		} );
	}

	$( window ).on( 'load.wp-pointers', setup );
} )( jQuery, this );