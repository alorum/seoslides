/*global jQuery */
( function( window, $, undefined ) {
	// Pseudo global variables
	var document = window.document,
		CORE = window.SEO_Slides,
		INTERNALS = window.seoslides,
		I18N = window.seoslides_i18n;

	// Variables just needed for the updater
	var indicator = 0,
		indicatorInterval,
		indicator_element = document.getElementById( 'seoslides_indicator' ),
		batchOffset = 0;

	/**
	 * Update the "upgrading" indicator every second by adding a period to the ellipsis. This is subtle, but lets
	 * the editor know that things are still happening behind the scenes.
	 */
	function update_indicator() {
		indicator_element.innerHTML = I18N[ 'indicator' + indicator ];

		indicator = 2 === indicator ? 0 : indicator += 1;
	}
	indicatorInterval = window.setInterval( update_indicator, 1000 );

	/**
	 * Once we're done updating, make sure we let the editor know. Also, clear the itnerval we set earlier so that
	 * the UI doesn't keep refreshing.
	 *
	 * Make sure we set a timer to get rid of the update window.
	 */
	function finished() {
		indicator_element.innerHTML = I18N.indicatorDone;
		window.clearInterval( indicatorInterval );

		window.setTimeout( function() {
			$( indicator_element.parentElement ).hide( 'slow' );
		}, 4000 );
	}

	/**
	 * Tell WordPress to upgrade a batch of images.
	 */
	function upgrade_batch() {
		var options = {
			'data': {
				'action': 'seoslides_upgrade_batch',
				'offset': batchOffset,
				'ajaxurl': CORE.ajaxurl
			}
		};

		CORE.ajax( options ).done( function( data ) {
			if ( data.remaining ) {
				batchOffset += 1;
				upgrade_batch();
			} else {
				finished();
			}
		} );
	}

	// Run the upgrade
	upgrade_batch();
} )( this, jQuery );