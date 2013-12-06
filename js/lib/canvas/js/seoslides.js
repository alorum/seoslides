( function( window, $, ndefined ) {
	var document = window.document;

	var SEO_Slides = function() {
		var SELF = this;

		SELF.css = function( element, prop ) {
			var computedStyle;
			if( typeof element.currentStyle !== 'undefined' ) {
				computedStyle = element.currentStyle;
			}
			else {
				computedStyle = document.defaultView.getComputedStyle( element, null );
			}
			return computedStyle[ prop ];
		};
		SELF.addEvent = function( event, element, callback ) {
			if( window[ 'addEventListener' ] ) {
				element.addEventListener( event, callback, false );
			}
			else {
				element.attachEvent( 'on' + event, callback );
			}
		};
		SELF.killEvent = function( e ) {
			e.returnValue = false;
			e.cancelBubble = true;
			if( e.stopPropagation ) {
				e.stopPropagation();
			}
			if( e.preventDefault ) {
				e.preventDefault();
			}
		};
		SELF.hasClass = function( element, classToSearchFor ) {
			var classes = element.className.split( ' ' );
			for( var i = 0, len = classes.length; i < len; i++ ) {
				if( classes[ i ] === classToSearchFor ) {
					return true;
				}
			}

			return false;
		};

		SELF.removeClass = function( element, className ) {
			var classes = element.className.split( ' ' ),
				newClasses = [];
			for ( var i = 0, len = classes.length; i < len; i++ ) {
				if ( classes[ i ] !== className ) {
					newClasses.push( classes[ i ] );
				}
			}

			return element.className = newClasses.join( ' ' );
		};

		/**
		 * Send an AJAX POST request to WordPress
		 *
		 * @param {string} action  The WordPress action slug to fire.
		 * @param {object} options jQuery ajax options object.
		 * @return {$.promise}
		 */
		SELF.ajax = function( action, options ) {
			var internals = window.seoslides;

			if ( action === Object( action ) ) {
				options = action;
			} else {
				options = options || {};
				options.data = options.data || {};
				options.data.action = action;
			}

			options = options || {};
			options.type = options.type || 'POST';
			options.url = options.url || internals.ajaxurl;
			options.context = options.context || this;

			return $.Deferred( function( deferred ) {
				// Transfer success/error callbacks.
				if ( options.success ) {
					deferred.done( options.success );
				}

				if ( options.error ) {
					deferred.fail( options.error );
				}

				delete options.success;
				delete options.error;

				// Use with PHP's wp_send_json_success() and wp_send_json_error()
				$.ajax( options ).done( function( response ) {
					// Treat a response of `1` as successful for backwards
					// compatibility with existing handlers.
					if ( response === '1' || response === 1 ) {
						response = { success: true };
					}

					if ( response === Object( response ) && response.success !== undefined ) {
						deferred[ response.success ? 'resolveWith' : 'rejectWith' ]( this, [response.data] );
					} else {
						deferred.rejectWith( this, [response] );
					}
				}).fail( function() {
						deferred.rejectWith( this, arguments );
					});
			}).promise();
		};

		/**
		 * seoslides.post( [action], [data] )
		 *
		 * Sends a POST request to WordPress.
		 *
		 * @param  {string} action The slug of the action to fire in WordPress.
		 * @param  {object} data   The data to populate $_POST with.
		 * @return {$.promise}     A jQuery promise that represents the request.
		 */
		SELF.post = function( action, data ) {
			if ( action === Object( action ) ) {
				data = action;
			} else {
				data = data || {};
				data.action = action;
			}

			return this.ajax( { data: data } );
		};

		SELF.createElement = function( block, data ) {
			var el = document.createElement( block );

			if ( undefined !== data['class'] ) {
				el.className = data['class'];
			}

			if ( undefined !== data['attr'] ) {
				for( var i = 0; i < data['attr'].length; i++ ) {
					var attr = data['attr'][ i ];
					el.setAttribute( attr[0], attr[1] );
				}
			}

			if ( undefined !== data['appendTo'] ) {
				data['appendTo'].appendChild( el );
			}

			return el;
		};
	};

	window.SEO_Slides = new SEO_Slides();
} )( window, jQuery );