/*! seoslides - v1.2.3
 * https://seoslides.com
 * Copyright (c) 2014 Alroum; * Licensed GPLv2+ */
(function( window, $, undefined ) {
	var CORE = window.ssimport,
		document = window.document;

	function Importer( import_button ) {
		var $import_button = $( import_button ),
			status = '', presentations = [], current_presentation = null, count= 0, slides = [], position = 0, slideset = 0,
			status_box = document.getElementById( 'seoslides_import_status' ),
			$status_box = $( status_box ),
			error = false,
			running = false;

		/**
		 * Warn the user that they are leaving the import page and will cause problems.
		 */
		function confirm_navigation( e ) {
			// Make sure we have the navigation event
			e = e || window.event;

			// For old IE
			if ( e ) {
				e.returnValue = CORE.confirm_navigation;
			}

			return CORE.confirm_navigation;
		}

		/**
		 * Process the current presentation by first grabbing a list of its potential slides from the server
		 * and then importing them 1 at a time.
		 */
		function process_current() {
			$.ajax( {
				type: 'post',
				url: CORE.ajaxurl,
				data: {
					action: 'seoslides-import',
					presentation: current_presentation
				},
				success: function( data ) {
					if ( undefined !== data.not_ready ) {
						$status_box.html( $status_box.html() + '<p>' + CORE.text_notready + '</p>' );
						presentation_finished();
						return;
					}
					slideset = data.slideset;
					slides = data.slides;
					count = data.total;
					do_import( slides[ position ] );
				}
			} );
		}

		/**
		 * Import a file into the given slideset ID as a new slide.
		 *
		 * @param {string} file
		 */
		function do_import( file ) {
			$status_box.html( $status_box.html() + '<p>' + CORE.text_importing.replace( '%1%', ( position + 1 ) ).replace( '%2%', count ) + '</p>' );

			$.ajax( {
				type: 'post',
				url: CORE.ajaxurl,
				data: {
					action: 'seoslides-get-slide',
					slideset: slideset,
					file: file,
					slide: position,
					_nonce: CORE.nonce_import
				},
				success: slide_finished,
				error: function() {
					if ( false === error ) {
						// OK, something wen't wrong, so let's give this another try.
						if ( undefined !== window.console ) {
							window.console.log( 'Re-import: ' + file );
						}

						error = true;

						do_import( file );
					} else {
						// This is the second failure, so let's kill the import.
						if ( undefined !== window.console ) {
							window.console.log( 'Import failed: ' + file );
						}

						$status_box.html( '<p>' + CORE.text_failure + '</p>' );
					}
				}
			} );
		}

		/**
		 * Handle when a slide has finished importing and move on to the next.
		 */
		function slide_finished() {
			error = false; // Reset this if it was used previously.
			position += 1;
			if ( position >= count ) {
				presentation_finished();
				return;
			}

			do_import( slides[ position ] );
		}

		/**
		 * Flush the system import status and grab a new indicator from the server.
		 */
		function flush_status() {
			error = false;
			position = 0;
			slideset = 0;
			status = '';
			presentations = [];
			slides = [];
			count = 0;
			current_presentation = null;

			$.ajax( {
				type: 'post',
				url: CORE.ajaxurl,
				data: {
					action: 'seoslides-import-status'
				},
				success: function( data ) {
					$status_box.html( data );
				}
			} );
		}

		/**
		 * Handle when a presentation is finished and move on to the next.
		 */
		function presentation_finished() {
			$.ajax( {
				type: 'post',
				url: CORE.ajaxurl,
				data: {
					action: 'seoslides-import-complete',
					presentation: current_presentation
				},
				success: function() {
					if ( 0 === presentations.length ) {
						flush_status();
						running = false;
						window.onbeforeunload = null;

						return;
					}

					position = 0;
					current_presentation = presentations.pop();
					process_current();
				}
			} );
		}

		/**
		 * Lock the import button and begin fetching down data.
		 */
		function queue() {
			if ( running ) {
				return;
			}

			running = true;
			window.onbeforeunload = confirm_navigation;
			$import_button.prop( 'disabled', true );
			status = '<p>' + CORE.text_running + '</p>';

			$status_box.html( status );

			// Get a list of presentations to process the server
			$.ajax( {
				type: 'post',
				url: CORE.ajaxurl,
				data: {
					action: 'get_presentations'
				},
				success: function( data ) {
					presentations = data;

					current_presentation = presentations.pop();
					process_current();
				}
			} );
		}

		function bind() {
			$import_button.on( 'click', queue );
		}

		bind();
	}

	/**
	 * Allow "More info" sections to be toggled open and closed.
	 */
	$( document.getElementsByClassName( 'wrap' ) ).on( 'click', '.seoslides-vistoggler', function() {
		$( this ).find( '.seoslides-vistogglee' ).toggle( 'slow' );
	});


	CORE.importer = new Importer( document.getElementById( 'seoslides_process' ) );
} )( this, jQuery );
