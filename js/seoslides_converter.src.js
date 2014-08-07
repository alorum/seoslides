/*! seoslides - v1.6.1
 * https://seoslides.com
 * Copyright (c) 2014 Alroum; * Licensed GPLv2+ */
(function( window, $, undefined ) {
	var CORE = window.ssimport,
		document = window.document,
		status = '',
		import_button = document.getElementById( 'seoslides_process' ),
		status_box = document.getElementById( 'seoslides_import_status' ),
		$import_button = $( import_button ),
		$status_box = $( status_box );

	/**
	 * Warn the user that they are leaving the import page and will cause problems.
	 *
	 * @param {event} e
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
	 * Manage a queue of slides that need to be imported.
	 *
	 * @constructor
	 */
	function ImportQueue() {
		var SELF = this,
			presentations = [],
			presentation = null,
			slidesets = {},
			totalSlides = 0,
			imported = 0;

		/**
		 * Add an array of slides to the collection.
		 *
		 * @param {string} presentation
		 */
		SELF.add_presentation = function( presentation ) {
			presentations.push( presentation );
		};

		/**
		 * Count the total slides available for import.
		 *
		 * @returns {object}
		 */
		SELF.count_slides = function() {
			var deferred = $.Deferred();

			var ajax_counters = $( presentations ).map( function ( i, elem ) {
				return $.ajax( {
					'type': 'post',
					'url':  CORE.ajaxurl,
					'data': {
						'action':       'seoslides-import',
						'presentation': elem
					},
					'success': function ( data ) {
						if ( undefined === data.not_ready ) {
							slidesets[ data.slideset ] = data.slides;
							totalSlides += data.total;
						}
					}
				} );
			} );

			// Make sure we resolve the counter after all of the presentations have been counted
			$.when.apply( null, ajax_counters.get() ).then( function() {
				deferred.resolveWith( SELF, [ totalSlides ] );
			} );

			return deferred.promise();
		};

		/**
		 * Placeholder for the jQuery Progressbar element
		 *
		 * @type {object}
		 */
		SELF.progress = null;

		/**
		 * Increment the progress bar
		 */
		SELF.import_success = function() {
			imported += 1;

			var progress = window.Math.floor( imported / totalSlides * 100 );

			if ( null !== SELF.progress ) {
				SELF.progress.progressbar( { value: progress } );
			}
		};

		/**
		 * Actually process the import.
		 *
		 * @returns {object}
		 */
		SELF.do_import = function() {
			var deferred = $.Deferred(),
				importers = [];

			$.each( slidesets, function( key, value ) {
				$.each( value, function( i, file ) {
					importers.push( $.ajax( {
						type: 'post',
						url: CORE.ajaxurl,
						tryCount: 0,
						retryLimit: 3,
						data: {
							action: 'seoslides-get-slide',
							slideset: key,
							file: file,
							slide: i,
							_nonce: CORE.nonce_import
						},
						error: function( xhr, textStatus, errorThrown ) {
							// OK, something went wrong, so let's give this another try.
							if ( 'timeout' === textStatus && ++this.tryCount <= this.retryLimit ) {
								if ( undefined !== window.console ) {
									window.console.log( 'Re-import: ' + file );
								}

								$.ajax( this );
								return;
							}

							if ( undefined !== window.console ) {
								window.console.log( 'Import failed: ' + file );
							}

							// Signal failure
							$status_box.html( '<p>' + CORE.text_failure + '</p>' );

							// Abort any remaining imports
							$.each( importers, function ( i, e ) {
								e.abort();
							} );

							// Alert the code that something has failed
							deferred.rejectWith( this );
						},
						success: SELF.import_success
					} ) );
				} );
			} );

			// Now that all of the slides have been imported, flag all of the presentations as being done
			$.when.apply( null, importers ).then( function() {
				var presentation_statii = [];

				$.each( presentations, function( i, e ) {
					presentation_statii.push( $.ajax( {
						type: 'post',
						url: CORE.ajaxurl,
						data: {
							action: 'seoslides-import-complete',
							presentation: e
						}
					} ) );
				} );

				// Make sure we resolve the counter after all of the presentations have been counted
				$.when.apply( null, presentation_statii ).then( function() {
					deferred.resolveWith( SELF, [ imported ] );
				} );
			} );

			return deferred.promise();
		};
	}

	/**
	 * Actually process imports.
	 *
	 * @param {ImportQueue} import_queue
	 * @constructor
	 */
	function ImportProcessor( import_queue ) {
		var SELF = this,
			running = false;

		SELF.import_queue = import_queue;

		SELF.queue = function queue() {
			var deferred = $.Deferred();

			window.onbeforeunload = confirm_navigation;
			$import_button.prop( 'disabled', true );
			status = '<p>' + CORE.text_running + '</p><div id="import-progressbar" style="margin-bottom:20px;"><div class="progress-label"></div></div>';

			$status_box.html( status );

			$.ajax( {
				'type':    'post',
				'url':     CORE.ajaxurl,
				'data':    { 'action': 'get_presentations' },
				'success': function ( data ) {
					for ( var i = 0, l = data.length; i < l; i ++ ) {
						import_queue.add_presentation( data[i] );
					}
					deferred.resolveWith( this, [ data ] );
				}
			} );

			return deferred.promise();
		};
	}

	/**
	 * Callback function run after everything has been imported.
	 */
	function imported() {
		$.ajax( {
			type: 'post',
			url: CORE.ajaxurl,
			data: {
				action: 'seoslides-import-status'
			},
			success: function( data ) {
				queue.progress.fadeOut( 'slow', function() {
					window.onbeforeunload = null;
					queue = new ImportQueue();
					handler = new ImportProcessor( queue );
					$status_box.html( '<p>' + data + '</p>' );
				} );
			}
		} );
	}

	/**
	 * Callback function to run after everything is queued.
	 */
	function queued() {
		var progressBar = $( document.getElementById( 'import-progressbar' ) ),
			progressLabel = progressBar.find( ".progress-label" );

		queue.progress = progressBar.progressbar(
			{
				value: false,
				change: function() {
					progressLabel.text( queue.progress.progressbar( "value" ) + "%" );
				}
			}
		);

		queue.count_slides().done( function() {
			queue.do_import().done( imported );
		} );
	}

	var queue = new ImportQueue(),
		handler = new ImportProcessor( queue );

	// Wire up our click event
	$import_button.on( 'click', function() {
		handler.queue().done( queued );
	} );

	/**
	 * Allow "More info" sections to be toggled open and closed.
	 */
	$( document.getElementsByClassName( 'wrap' ) ).on( 'click', '.seoslides-vistoggler', function() {
		$( this ).find( '.seoslides-vistogglee' ).toggle( 'slow' );
	});
} )( this, jQuery );
