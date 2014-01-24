/*! seoslides - v1.2.4
 * https://seoslides.com
 * Copyright (c) 2014 Alroum; * Licensed GPLv2+ */
;(function ($, window, undefined) {
	'use strict';

	var document = window.document,
		$document = $( document ),
		photon = ( undefined !== window.seoslides ) && ( undefined !== window.seoslides.photon_url ) && ( 'enabled' === window.seoslides.photon_url );

	/* PLUGIN DEFINITION
	 * ========================= */

	/**
	 * Overload for Backstretch.
	 *
	 * First, detect whether we have a video or an image set as the background.  If we have a video,
	 * then swap the video out with MediaElement.js so it's playable.  If the source is actually an
	 * image, though, then run things through Backstretch as usual.
	 *
	 * @returns {Object}
	 */
	$.fn.backstretchShort = function() {
		return this.each( function() {
			var item = this,
				$this = $( item ),
				bg = item.style.backgroundImage;

			if ( undefined !== bg && 'none' !== bg ) {
				bg = bg.replace( /^url\(["']?/, '' ).replace( /["']?\).*$/, '' );
				if ( _isImage( bg ) ) {
					item.style.backgroundImage = 'none';
					$this.backstretch( bg, { centeredX: true } );
				} else if ( _isVideo( bg ) ) {
					// Get video type
					var type = _videoType( bg );
					if( null !== type ) {
						var video = document.createElement( 'video' );
						video.className = 'wp-video';
						video.style.width = '100%';
						video.style.height = '100%';
						video.setAttribute( 'controls', 'controls' );
						video.setAttribute( 'preload', 'none' );

						var source = document.createElement( 'source' );
						source.setAttribute( 'type', type );
						source.setAttribute( 'src', bg );
						video.appendChild( source );

						item.style.backgroundImage = 'none';
						item.style.padding = 0;
						item.appendChild( video );

						var melement = $( video ).mediaelementplayer(),
							player = melement.data( 'mediaelementplayer' );

						$document.on( 'deck.change', function() { 
							player.pause();
						} );
					}
				}
			}
		} );
	};

	/**
	 * Determine whether or not a source URL is an image based on its extension.
	 *
	 * @param {string} src
	 * @returns {boolean}
	 * @private
	 */
	function _isImage( src ) {
		var ext = src.split( '.' ).pop();
		ext = ext.toLowerCase();

		var extensions = [ 'jpg', 'jpeg', 'png', 'gif' ];

		for ( var i = 0; i < extensions.length; i++ ) {
			var extension = extensions[i];

			if ( ext === extension ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Determine whether or not a source URL is a video based on its extension.
	 *
	 * @param {string} src
	 * @returns {boolean}
	 * @private
	 */
	function _isVideo( src ) {
		var ext = src.split( '.' ).pop();
		ext = ext.toLowerCase();

		var extensions = [ 'mp4', 'm4v', 'webm', 'ogv', 'wmv', 'flv' ];

		for ( var i = 0; i < extensions.length; i++ ) {
			var extension = extensions[i];

			if ( ext === extension ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get the video MIME type based on the extension of the video src.
	 *
	 * @param {string} src
	 * @returns {string}
	 * @private
	 */
	function _videoType( src ) {
		var ext = src.split( '.' ).pop(), type = null;
		ext = ext.toLowerCase();

		switch( ext ) {
			case 'mp4':
			case 'm4v':
				type = 'video/mp4';
				break;
			case 'webm':
				type = 'video/webm';
				break;
			case 'ogv':
				type = 'video/ogg';
				break;
			case 'wmv':
				type = 'video/x-ms-wmv';
				break;
			case 'flv':
				type = 'video/x-flv';
				break;
		}

		return type;
	}

	/**
	 * Backstretch plugin definition.
	 *
	 * Backstretch - v2.0.4
	 * http://srobbin.com/jquery-plugins/backstretch/
	 * Copyright (c) 2013 Scott Robbin; Licensed MIT
	 *
	 * @param images
	 * @param options
	 * @returns {Object}
	 */
	$.fn.backstretch = function (images, options) {
		// We need at least one image or method name
		if (images === undefined || images.length === 0) {
			$.error("No images were supplied for Backstretch");
		}

		/*
		 * Scroll the page one pixel to get the right window height on iOS
		 * Pretty harmless for everyone else
		 */
		if ($(window).scrollTop() === 0 ) {
			window.scrollTo(0, 0);
		}

		return this.each(function () {
			var $this = $(this)
				, obj = $this.data('backstretch');

			// Do we already have an instance attached to this element?
			if (obj) {

				// Is this a method they're trying to execute?
				if (typeof images == 'string' && typeof obj[images] == 'function') {
					// Call the method
					obj[images](options);

					// No need to do anything further
					return;
				}

				// Merge the old options with the new
				options = $.extend(obj.options, options);

				// Remove the old instance
				obj.destroy(true);
			}

			obj = new Backstretch(this, images, options);
			$this.data('backstretch', obj);
		});
	};

	// If no element is supplied, we'll attach to body
	$.backstretch = function (images, options) {
		// Return the instance
		return $('body')
			.backstretch(images, options)
			.data('backstretch');
	};

	// Custom selector
	$.expr[':'].backstretch = function(elem) {
		return $(elem).data('backstretch') !== undefined;
	};

	/* DEFAULTS
	 * ========================= */

	$.fn.backstretch.defaults = {
		centeredX: true   // Should we center the image on the X axis?
		, centeredY: true   // Should we center the image on the Y axis?
		, duration: 5000    // Amount of time in between slides (if slideshow)
		, fade: 0           // Speed of fade transition between slides
	};

	/* STYLES
	 *
	 * Baked-in styles that we'll apply to our elements.
	 * In an effort to keep the plugin simple, these are not exposed as options.
	 * That said, anyone can override these in their own stylesheet.
	 * ========================= */
	var styles = {
		wrap: {
			left: 0
			, top: 0
			, overflow: 'hidden'
			, margin: 0
			, padding: 0
			, height: '100%'
			, width: '100%'
			, zIndex: -999999
		}
		, img: {
			position: 'absolute'
			, display: 'none'
			, margin: 0
			, padding: 0
			, border: 'none'
			, width: 'auto'
			, height: 'auto'
			, maxHeight: 'none'
			, maxWidth: 'none'
			, zIndex: -999999
		}
	};

	/* CLASS DEFINITION
	 * ========================= */
	var Backstretch = function (container, images, options) {
		this.options = $.extend({}, $.fn.backstretch.defaults, options || {});

		/* In its simplest form, we allow Backstretch to be called on an image path.
		 * e.g. $.backstretch('/path/to/image.jpg')
		 * So, we need to turn this back into an array.
		 */
		this.images = $.isArray(images) ? images : [images];

		// Preload images
		$.each(this.images, function () {
			$('<img />')[0].src = this;
		});

		// Convenience reference to know if the container is body.
		this.isBody = container === document.body;

		/* We're keeping track of a few different elements
		 *
		 * Container: the element that Backstretch was called on.
		 * Wrap: a DIV that we place the image into, so we can hide the overflow.
		 * Root: Convenience reference to help calculate the correct height.
		 */
		this.$container = $(container);
		this.$root = this.isBody ? supportsFixedPosition ? $(window) : $(document) : this.$container;

		// Don't create a new wrap if one already exists (from a previous instance of Backstretch)
		var $existing = this.$container.children(".backstretch").first();
		this.$wrap = $existing.length ? $existing : $('<div class="backstretch"></div>').css(styles.wrap).appendTo(this.$container);

		// Non-body elements need some style adjustments
		if (!this.isBody) {
			// If the container is statically positioned, we need to make it relative,
			// and if no zIndex is defined, we should set it to zero.
			var position = this.$container.css('position')
				, zIndex = this.$container.css('zIndex');

			this.$container.css({
				position: position === 'static' ? 'relative' : position
				, zIndex: zIndex === 'auto' ? 0 : zIndex
				//, background: 'none'
				, backgroundImage: 'none'
			});

			// Needs a higher z-index
			this.$wrap.css({zIndex: -999998});
		}

		// Fixed or absolute positioning?
		this.$wrap.css({
			position: this.isBody && supportsFixedPosition ? 'fixed' : 'absolute'
		});

		// Set the first image
		this.index = 0;
		this.show(this.index);

		// Listen for resize
		$(window).on('resize.backstretch', $.proxy(this.resize, this))
			.on('orientationchange.backstretch', $.proxy(function () {
				// Need to do this in order to get the right window height
				if (this.isBody && window.pageYOffset === 0) {
					window.scrollTo(0, 1);
					this.resize();
				}
			}, this));
	};

	/* PUBLIC METHODS
	 * ========================= */
	Backstretch.prototype = {
		resize: function () {
			try {
				// Original functionality. Hacked to resize to maximum height always. - EAM
				/*var bgCSS = {left: 0, top: 0}
					, rootWidth = this.isBody ? this.$root.width() : this.$root.innerWidth()
					, bgWidth = rootWidth
					, rootHeight = this.isBody ? ( window.innerHeight ? window.innerHeight : this.$root.height() ) : this.$root.innerHeight()
					, bgHeight = bgWidth / this.$img.data('ratio')
					, bgOffset;*/
				var bgCSS = {left: 0, top: 0}
					, rootHeight = this.isBody ? ( window.innerHeight ? window.innerHeight : this.$root.height() ) : this.$root.innerHeight()
					, bgHeight = rootHeight
					, rootWidth = this.isBody ? this.$root.width() : this.$root.innerWidth()
					, bgWidth = bgHeight * this.$img.data( 'ratio' )
					, bgOffset;

				// Make adjustments based on image ratio
				if (bgHeight >= rootHeight) {
					bgOffset = (bgHeight - rootHeight) / 2;
					if(this.options.centeredY) {
						bgCSS.top = -bgOffset + 'px';
					}

					// Adding to account for centered position - EAM
					if(this.options.centeredX) {
						bgWidth = bgHeight * this.$img.data('ratio');
						bgOffset = (bgWidth - rootWidth) / 2;
						bgCSS.left = -bgOffset + 'px';
					}
				} else {
					bgHeight = rootHeight;
					bgWidth = bgHeight * this.$img.data('ratio');
					bgOffset = (bgWidth - rootWidth) / 2;
					if(this.options.centeredX) {
						bgCSS.left = -bgOffset + 'px';
					}
				}

				this.$wrap.css({width: rootWidth, height: rootHeight})
					.find('img:not(.deleteable)').css({width: bgWidth, height: bgHeight}).css(bgCSS);

				// Code added to dynamically replace the image URL if Jetpack's Photon module is enabled
				if ( photon ) {
					var orig = this.$img.attr( 'src' ),
						path = orig.split( '?' )[0],
						parts = orig.split( '?' )[1],
						query_args = {};

					// Parse existing query args if there are any
					if ( undefined !== parts ) {
						parts = parts.split( '&' );
						for ( var i = 0, l = parts.length; i < l; i++ ) {
							var part = parts[i],
								key = part.split( '=' )[0],
								val = part.split( '=' )[1];

							if ( 'fit' !== key ) {
								query_args[ key ] = val;
							}
						}
					}

					// Add the new fit parameter
					query_args['fit'] = this.$img.width() + ',' + this.$img.height();

					// Build the new path
					var query_string = '';
					for ( var arg in query_args ) {
						if ( ! query_args.hasOwnProperty( arg ) ) {
							continue;
						}

						query_string += '&' + arg + '=' + query_args[ arg ];
					}
					query_string = query_string.replace( '&', '?' );
					path = path + query_string;

					// Replace the image path
					if ( orig !== path ) {
						this.$img.attr( 'src', path );
					}
				}
			} catch(err) {
				// IE7 seems to trigger resize before the image is loaded.
				// This try/catch block is a hack to let it fail gracefully.
			}

			return this;
		}

		// Show the slide at a certain position
		, show: function (newIndex) {

			// Validate index
			if (Math.abs(newIndex) > this.images.length - 1) {
				return;
			}

			// Vars
			var self = this
				, oldImage = self.$wrap.find('img').addClass('deleteable')
				, evtOptions = { relatedTarget: self.$container[0] };

			// Trigger the "before" event
			self.$container.trigger($.Event('backstretch.before', evtOptions), [self, newIndex]);

			// Set the new index
			this.index = newIndex;

			// Pause the slideshow
			clearInterval(self.interval);

			// New image
			self.$img = $('<img />')
				.css(styles.img)
				.bind('load', function (e) {
					var imgWidth = this.width || $(e.target).width()
						, imgHeight = this.height || $(e.target).height();

					// Save the ratio
					$(this).data('ratio', imgWidth / imgHeight);

					// Show the image, then delete the old one
					// "speed" option has been deprecated, but we want backwards compatibilty
					$(this).fadeIn(self.options.speed || self.options.fade, function () {
						oldImage.remove();

						// Resume the slideshow
						if (!self.paused) {
							self.cycle();
						}

						// Trigger the "after" and "show" events
						// "show" is being deprecated
						$(['after', 'show']).each(function () {
							self.$container.trigger($.Event('backstretch.' + this, evtOptions), [self, newIndex]);
						});
					});

					// Resize
					self.resize();
				})
				.appendTo(self.$wrap);

			// Hack for IE img onload event
			self.$img.attr('src', self.images[newIndex]);
			return self;
		}

		, next: function () {
			// Next slide
			return this.show(this.index < this.images.length - 1 ? this.index + 1 : 0);
		}

		, prev: function () {
			// Previous slide
			return this.show(this.index === 0 ? this.images.length - 1 : this.index - 1);
		}

		, pause: function () {
			// Pause the slideshow
			this.paused = true;
			return this;
		}

		, resume: function () {
			// Resume the slideshow
			this.paused = false;
			this.next();
			return this;
		}

		, cycle: function () {
			// Start/resume the slideshow
			if(this.images.length > 1) {
				// Clear the interval, just in case
				clearInterval(this.interval);

				this.interval = setInterval($.proxy(function () {
					// Check for paused slideshow
					if (!this.paused) {
						this.next();
					}
				}, this), this.options.duration);
			}
			return this;
		}

		, destroy: function (preserveBackground) {
			// Stop the resize events
			$(window).off('resize.backstretch orientationchange.backstretch');

			// Clear the interval
			clearInterval(this.interval);

			// Remove Backstretch
			if(!preserveBackground) {
				this.$wrap.remove();
			}
			this.$container.removeData('backstretch');
		}
	};

	/* SUPPORTS FIXED POSITION?
	 *
	 * Based on code from jQuery Mobile 1.1.0
	 * http://jquerymobile.com/
	 *
	 * In a nutshell, we need to figure out if fixed positioning is supported.
	 * Unfortunately, this is very difficult to do on iOS, and usually involves
	 * injecting content, scrolling the page, etc.. It's ugly.
	 * jQuery Mobile uses this workaround. It's not ideal, but works.
	 *
	 * Modified to detect IE6
	 * ========================= */

	var supportsFixedPosition = (function () {
		var ua = navigator.userAgent
			, platform = navigator.platform
		// Rendering engine is Webkit, and capture major version
			, wkmatch = ua.match( /AppleWebKit\/([0-9]+)/ )
			, wkversion = !!wkmatch && wkmatch[ 1 ]
			, ffmatch = ua.match( /Fennec\/([0-9]+)/ )
			, ffversion = !!ffmatch && ffmatch[ 1 ]
			, operammobilematch = ua.match( /Opera Mobi\/([0-9]+)/ )
			, omversion = !!operammobilematch && operammobilematch[ 1 ]
			, iematch = ua.match( /MSIE ([0-9]+)/ )
			, ieversion = !!iematch && iematch[ 1 ];

		return !(
			// iOS 4.3 and older : Platform is iPhone/Pad/Touch and Webkit version is less than 534 (ios5)
			((platform.indexOf( "iPhone" ) > -1 || platform.indexOf( "iPad" ) > -1  || platform.indexOf( "iPod" ) > -1 ) && wkversion && wkversion < 534) ||

				// Opera Mini
				(window.operamini && ({}).toString.call( window.operamini ) === "[object OperaMini]") ||
				(operammobilematch && omversion < 7458) ||

				//Android lte 2.1: Platform is Android and Webkit version is less than 533 (Android 2.2)
				(ua.indexOf( "Android" ) > -1 && wkversion && wkversion < 533) ||

				// Firefox Mobile before 6.0 -
				(ffversion && ffversion < 6) ||

				// WebOS less than 3
				("palmGetResource" in window && wkversion && wkversion < 534) ||

				// MeeGo
				(ua.indexOf( "MeeGo" ) > -1 && ua.indexOf( "NokiaBrowser/8.5.0" ) > -1) ||

				// IE6
				(ieversion && ieversion <= 6)
			);
	}());

}(jQuery, window));
(function (window, $, undefined) {
	var elements = [],
			CORE = null,
			resize = function (base_size) {
				if (CORE === null) {
					CORE = window['SEO_Slides'] || {};
					if (CORE.Bucket && !CORE.Bucket.getCurrentSlideElement()) {
						CORE = {};
					}
				}
				var element = $(this),
						slide = CORE.Bucket ? CORE.Bucket.getCurrentSlideElement() : element.closest('.slide').get(0),
						factor = $(slide).width() / 1600;
				if (!slide) {
					return;
				}
				element.data('responsivetext.base', base_size);
				var new_font_size = Math.ceil(base_size * factor);
				element.css("font-size", Math.max(1, new_font_size) + 'px');
				return elements.push(element);
			};

	/**
	 * jQuery plugin for scaling text built specifically for wpslidepost
	 *
	 * Must be used on a child of a slide.
	 *
	 * This will update the font-size of any elements selected in the jQuery object
	 * by multiplying the base_size (defaults to 28; units in pixels) by the ratio
	 * of the slide's width (in pixels) to 1600. It will round up if it is a float
	 * and will always be at least 1. This should be used on containers and any
	 * text elements inside the container should be sized in em values so they will
	 * automatically scale with the changing font-size of the container.
	 *
	 * @param base_size The base size that gets scaled up or down
	 * @returns jQuery the jQuery object
	 */
	$.fn.responsiveText = function (base_size) {
		base_size = base_size || 28;
		return this.each(function () {
			resize.call(this, base_size);
		});
	};
	return $(window).on("resize", function () {
		var $elements = $(elements);
		elements = [];
		return $elements.each(function () {
			resize.call(this, $(this).data('responsivetext.base'));
		});
	});
}(this, jQuery));
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
( function( window, undefined ) {
	'use strict';
	var document = window.document;

	/**
	 * Handles managing all events for whatever you plug it into. Priorities for hooks are based on lowest to highest in
	 * that, lowest priority hooks are fired first.
	 */
	var EventManager = function() {
		/**
		 * Maintain a reference to the object scope so 'this' never becomes confusing.
		 */
		var SELF = this;

		/**
		 * Contains the hooks that get registered with this EventManager. The array for storage utilizes a "flat"
		 * object literal such that looking up the hook utilizes the native hash object literal hash.
		 */
		var STORAGE = {
			actions : {},
			filters : {}
		};

		/**
		 * Adds an action to the event manager.
		 *
		 * @param action Must contain namespace.identifier
		 * @param callback Must be a valid callback function before this action is added
		 * @param priority Defaults to 10
		 */
		SELF.addAction = function( action, callback, priority ) {
			if( _validateNamespace( action ) === false || typeof callback !== 'function' ) {
				return SELF;
			}

			priority = parseInt( ( priority || 10 ), 10 );
			_addHook( 'actions', action, callback, priority );
			return SELF;
		};

		/**
		 * Performs an action if it exists. You can pass as many arguments as you want to this function; the only rule is
		 * that the first argument must always be the action.
		 */
		SELF.doAction = function( /* action, arg1, arg2, ... */ ) {
			var args = Array.prototype.slice.call( arguments );
			var action = args.shift();

			if( _validateNamespace( action ) === false ) {
				return SELF;
			}

			_runHook( 'actions', action, args );

			return SELF;
		};

		/**
		 * Removes the specified action if it contains a namespace.identifier & exists.
		 *
		 * @param action The action to remove
		 */
		SELF.removeAction = function( action ) {
			if( _validateNamespace( action ) === false ) {
				return SELF;
			}

			_removeHook( 'actions', action );
			return SELF;
		};

		/**
		 * Adds a filter to the event manager.
		 *
		 * @param filter Must contain namespace.identifier
		 * @param callback Must be a valid callback function before this action is added
		 * @param priority Defaults to 10
		 */
		SELF.addFilter = function( filter, callback, priority ) {
			if( _validateNamespace( filter ) === false || typeof callback !== 'function' ) {
				return SELF;
			}

			priority = parseInt( ( priority || 10 ), 10 );
			_addHook( 'filters', filter, callback, priority );
			return SELF;
		};

		/**
		 * Performs a filter if it exists. You should only ever pass 1 argument to be filtered. The only rule is that
		 * the first argument must always be the filter.
		 */
		SELF.applyFilter = function( /* filter, arg1 */ ) {
			var args = Array.prototype.slice.call( arguments );
			var filter = args.shift();
			var param = args.shift();

			if( _validateNamespace( filter ) === false ) {
				return SELF;
			}

			return _runHook( 'filters', filter, param );
		};

		/**
		 * Removes the specified filter if it contains a namespace.identifier & exists.
		 *
		 * @param filter The action to remove
		 */
		SELF.removeFilter = function( filter ) {
			if( _validateNamespace( filter ) === false ) {
				return SELF;
			}

			_removeHook( 'filters', filter );
			return SELF;
		};

		/**
		 * Removes the specified hook by resetting the value of it.
		 *
		 * @param type Type of hook, either 'actions' or 'filters'
		 * @param hook The hook (namespace.identifier) to remove
		 * @private
		 */
		var _removeHook = function( type, hook ) {
			if( STORAGE[ type ][ hook ] ) {
				STORAGE[ type ][ hook ] = [];
			}
		};

		/**
		 * Validates that the hook has both a namespace and an identifier.
		 *
		 * @param hook The hook we are checking for namespace and identifier for.
		 * @return {Boolean} False if it does not contain both or is incorrect. True if it has an appropriate namespace & identifier.
		 * @private
		 */
		var _validateNamespace = function( hook ) {
			if( typeof hook !== 'string' ) {
				return false;
			}
			var identifier = hook.replace( /^\s+|\s+$/i, '' ).split( '.' );
			var namespace = identifier.shift();
			identifier = identifier.join( '.' );

			return ( namespace !== '' && identifier !== '' );
		};

		/**
		 * Adds the hook to the appropriate storage container
		 *
		 * @param type 'actions' or 'filters'
		 * @param hook The hook (namespace.identifier) to add to our event manager
		 * @param callback The function that will be called when the hook is executed.
		 * @param priority The priority of this hook. Must be an integer.
		 * @private
		 */
		var _addHook = function( type, hook, callback, priority ) {
			var hookObject = {
				callback : callback,
				priority : priority
			};

			// Utilize 'prop itself' : http://jsperf.com/hasownproperty-vs-in-vs-undefined/19
			var hooks = STORAGE[ type ][ hook ];
			if( hooks ) {
				hooks.push( hookObject );
				hooks = _hookInsertSort( hooks );
			}
			else {
				hooks = [ hookObject ];
			}

			STORAGE[ type ][ hook ] = hooks;
		};

		/**
		 * Use an insert sort for keeping our hooks organized based on priority. This function is ridiculously faster
		 * than bubble sort, etc: http://jsperf.com/javascript-sort
		 *
		 * @param hooks The custom array containing all of the appropriate hooks to perform an insert sort on.
		 * @private
		 */
		var _hookInsertSort = function( hooks ) {
			var tmpHook, j, prevHook;
			for( var i = 1, len = hooks.length; i < len; i++ ) {
				tmpHook = hooks[ i ];
				j = i;
				while( ( prevHook = hooks[ j - 1 ] ) &&  prevHook.priority > tmpHook.priority ) {
					hooks[ j ] = hooks[ j - 1 ];
					--j;
				}
				hooks[ j ] = tmpHook;
			}

			return hooks;
		};

		/**
		 * Runs the specified hook. If it is an action, the value is not modified but if it is a filter, it is.
		 *
		 * @param type 'actions' or 'filters'
		 * @param hook The hook ( namespace.identifier ) to be ran.
		 * @param args Arguments to pass to the action/filter. If it's a filter, args is actually a single parameter.
		 * @private
		 */
		var _runHook = function( type, hook, args ) {
			var hooks = STORAGE[ type ][ hook ];
			if( typeof hooks === 'undefined' ) {
				if( type === 'filters' ) {
					return args;
				}
				return false;
			}

			for( var i = 0, len = hooks.length; i < len; i++ ) {
				if( type === 'actions' ) {
					hooks[ i ].callback.apply( undefined, args );
				}
				else {
					args = hooks[ i ].callback.apply( undefined, [ args ] );
				}
			}

			if( type === 'actions' ) {
				return true;
			}

			return args;
		};
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Events = new EventManager( window.SEO_Slides );

} )( window );
( function ( window, $, undefined ) {
	var CORE = window.SEO_Slides;

	// Debounced events
	function Debouncer() {
		var SELF = this,
			hooks = {};

		/**
		 * Debounce a regular event.
		 *
		 * Specify a unique key whenever calling debounceAction so that only one version
		 * of the callback will be stored for any particular callee.
		 *
		 * @param {string} key    Unique identifier for callee
		 * @param {string} action Action to debounce
		 */
		SELF.debounceAction = function( key, action /*, arg1, arg2, ... */ ) {
			var args = Array.prototype.slice.call( arguments );

			key = args.shift();
			action = args.shift();

			hooks[ action ] = hooks[ action ] || {};
			hooks[ action ][ key ] = hooks[ action ][ key ] || {};

			if ( undefined !== hooks[ action ].timeout ) {
				window.clearTimeout( hooks[ action ].timeout );
				delete hooks[ action ].timeout;
			}

			hooks[ action ][ key ].hooks = hooks[ action ][ key ].hooks || [];

			hooks[ action ][ key ].hooks.push( args );

			hooks[ action ].timeout = window.setTimeout( function() {
				_runDebounced( action );
			}, 30 );
		};

		/**
		 * Actually run the debounced actions bound to a specific hook.
		 *
		 * @param {string} hook Hook to fire
		 * @private
		 */
		function _runDebounced( hook ) {
			var allKeys = hooks[ hook ];

			window.clearTimeout( hooks[ hook ].timeout );
			delete hooks[ hook ].timeout;

			for ( var key in allKeys ) {
				if ( ! hooks[ hook ].hasOwnProperty( key ) ) {
					continue;
				}

				var run = hooks[ hook ][ key ].hooks;

				for ( var i = 0; i < run.length; i++ ) {
					var args = run[ i ];

					var newArgs = [ 'debounced.' + hook ];
					newArgs = newArgs.concat( args );

					CORE.Events.doAction.apply( this, newArgs );
				}
			}

			hooks[ hook ] = {};
		}
	}

	CORE.Events.debouncer = new Debouncer();
} )( this, jQuery );
( function( window, $, undefined ) {
	var document = window.document;

	var Slide = function( CORE, BUCKET, SLIDE_ID, SLIDESET ) {
		var SELF = this;
		var FULL_SIZE = { height: 0, width: 0 };
		var ELEMENT = false;
		var $ELEMENT = false;
		var BUCKET_POSITION = 'middle';
		var ANIMATION_TIME = 250;
		var LOADED_AND_ANIMATED = false;
		var SIDE_SLIDE_WIDTH = 20;
		var SLIDE = false;

		var _initialize = function() {
			_getSlideFromServer();
			_resizeSlide();
			_createSlide();
			_bindEvents();
		};
		var _bindEvents = function() {
			CORE.Events.addAction( 'bucket.resize', _resizeSlide );
		};
		var _createSlide = function() {
			var slide = document.createElement( 'div' );
			slide.className = 'bucket-slide';

			// find the center of the bucket, etc
			var bucketWidth = parseInt( BUCKET.style.width, 10 );
			var bucketHeight = parseInt( BUCKET.style.height, 10 );
			var left = ( ( bucketWidth / 2 ) - ( FULL_SIZE.width / 2 ) );
			var top = ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) );

			slide.style.cssText = 'height: ' + FULL_SIZE.height + 'px;width: ' + FULL_SIZE.width + 'px;left:' + left + 'px;top:' + top + 'px;';
			BUCKET.appendChild( slide );

			// cache this slide's main element
			ELEMENT = slide;
			$ELEMENT = $( slide );

			// now animate it to the fullsize
			$ELEMENT.css( 'opacity', 0.00 ).animate( {
				//height:  FULL_SIZE.height,
				//width:   FULL_SIZE.width,
				//top:     ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) ),
				//left:    ( ( bucketWidth / 2 ) - ( FULL_SIZE.width / 2 ) ),
				opacity: 1.00
			}, ANIMATION_TIME, 'linear', function () {
				$( document.querySelector( '.bucket-slide' ) ).backstretchShort();
				CORE.Events.doAction( 'slide.receivedData', SLIDE );
				CORE.Events.doAction( 'slide.resized', SLIDE );
			} );
		};
		var _resizeSlide = function() {
			var bucketHeight = parseInt( BUCKET.style.height, 10 );
			var bucketWidth = parseInt( BUCKET.style.width, 10 );
			var widthMargin = 50;
			var style = ELEMENT.style;

			if( BUCKET_POSITION === 'middle' ) {
				FULL_SIZE.width = bucketWidth - ( widthMargin * 2 );
				FULL_SIZE.height = FULL_SIZE.width / 1.77778;

				if( ELEMENT !== false ) {
					style.left = ( ( bucketWidth / 2 ) - ( FULL_SIZE.width / 2 ) ) + 'px';
					style.top = ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) ) + 'px';
				}
			}
			else if( BUCKET_POSITION === 'left' ) {
				FULL_SIZE.width = SIDE_SLIDE_WIDTH;
				FULL_SIZE.height = ( bucketWidth - ( widthMargin * 2 ) ) / 1.77778;

				if( ELEMENT !== false ) {
					style.top = ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) ) + 'px';
				}
			}

			if( ELEMENT !== false ) {
				style.width = FULL_SIZE.width + 'px';
				style.height = FULL_SIZE.height + 'px';
			}
		};
		var _getSlideFromServer = function() {
			var options = {
				'data': {
					'action': 'get-slide',
					'slide': SLIDE_ID,
					'slideset': SLIDESET
				}
			};

			CORE.ajax( options ).done( function( data ) {
				SLIDE = data;

				CORE.Events.doAction( 'slide.receivedData', data );
			} );
		};

		SELF.getElement = function() {
			return $ELEMENT;
		};
		SELF.setBucketPosition = function( position ) {
			BUCKET_POSITION = position;
		};

		_initialize();
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Slide = Slide;
} )( window, jQuery );
( function( window, $, undefined ) {
	var document = window.document;

	var ContextMenu = function( CORE ) {
		var SELF = this;
		var CONTEXT_MENU = false;
		var ANIMATION_TIME = 250;
		var MOUSE_POS = { x : 0, y : 0 };

		var _detectContextScope = function( e, target ) {
			if( ( CORE.hasClass( target, 'bucket-slide' ) === true || CORE.hasClass( target.parentNode, 'backstretch' ) ) && CORE.hasClass( target, 'left' ) === false && CORE.hasClass( target, 'right' ) === false ) {
				_renderSlideContextMenu( e );
			}
		};

		var _renderSlideContextMenu = function( e ) {
			if( CONTEXT_MENU !== false ) {
				_closeContextMenu();
			}

			MOUSE_POS.x = e.pageX;
			MOUSE_POS.y = e.pageY;
			CONTEXT_MENU = _createContextMenu();
			CONTEXT_MENU.style.top = MOUSE_POS.y + 'px';
			CONTEXT_MENU.style.left = MOUSE_POS.x + 'px';
			document.body.appendChild( CONTEXT_MENU );

			CORE.addEvent( 'click', CONTEXT_MENU, _fireClick );
		};

		var _fireClick = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			if( CORE.hasClass( target, 'context-menu-object' ) === true ) {
				_fireControlEvent( e, target );
			}
			else if( CORE.hasClass( target.parentNode, 'context-menu-object' ) === true ) {
				_fireControlEvent( e, target );
			}

			_closeContextMenu();
		};

		var _createContextMenu = function() {
			var menu = document.createElement( 'div' );
			menu.className = 'seoslides-context-menu';

			var html = CORE.Events.applyFilter( 'menu.render', false );
			if( html === false ) {
				html = '<ul><li class="context-menu-status"><i>No options available</i></li></ul>';
			}

			menu.innerHTML = html;

			return menu;
		};

		var _fireControlEvent = function( e, target ) {
			CORE.Events.doAction( 'menu.click', e, target, MOUSE_POS );
		};

		var _checkForClose = function( e, target ) {
			while( target !== null && target !== document ) {
				if( CORE.hasClass( target, 'seoslides-context-menu' ) ) {
					return;
				}
				target = target.parentNode;
			}

			// could not find the parent, close the menu
			_closeContextMenu();
		};

		var _closeContextMenu = function() {
			if( CONTEXT_MENU === false ) {
				return;
			}

			$( CONTEXT_MENU ).css( 'z-index', 1000 ).animate( { opacity : 0.00 }, ANIMATION_TIME, function() {
				this.parentNode.removeChild( this );
			} );
			CONTEXT_MENU = false;
		};

		CORE.Events.addAction( 'bucket.context.menu', _detectContextScope );
		CORE.Events.addAction( 'bucket.click', _checkForClose );
		CORE.Events.addAction( 'modal.close', _closeContextMenu );
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Menu = new ContextMenu( window.SEO_Slides );
} )( window, jQuery );
( function( window, $, undefined ) {
	var document = window.document;

	var Pluggables = function( CORE ) {
		var SELF = this;
		var ACTION = false;

		SELF.getSavedData = function() {
			var data = CORE.Events.applyFilter( 'plugin.settings.get', {} );

			// Filter out any empty objects before returning
			var objects = [];
			for ( var hash in data ) {
				if ( ! data.hasOwnProperty( hash ) ) {
					continue;
				}
				var object = data[ hash ];

				if ( 0 === Object.keys( object ).length ) {
					continue;
				}

				for (var el in object ) {
					if ( ! object.hasOwnProperty( el ) ) {
						continue;
					}

					var element = object[ el ];
					element.plugin_id = hash;
					element.element_id = el;

					// Remove reference to the jQuery object
					delete element.element;

					objects.push( element );
				}
			}

			return objects;
		};

		SELF.resetPluginObjects = function() {
			for( var index in CORE.Plugins ) {
				if ( ! CORE.Plugins.hasOwnProperty( index ) ) {
					continue;
				}

				var plugin = CORE.Plugins[ index ];
				plugin.clearInstances();
			}
		};

		var _pluginMenuItemClicked = function( e, target, position ) {
			// make sure this is the plugin we're clicking
			if( CORE.hasClass( target.parentNode, 'context-menu-object' ) === true ) {
				target = target.parentNode;
			}

			var UUID = target.getAttribute( 'data-uuid' );
			if( UUID === null ) {
				return;
			}

			var html = CORE.Events.applyFilter( 'plugin.render.' + UUID, false );
			if( html === false ) {
				return;
			}

			_renderPlugin( html, position, UUID );
		};

		var _renderPlugin = function( html, position, UUID ) {

			// check if this plugin is draggable
			var canDrag = CORE.Events.applyFilter( 'plugin.canDrag.' + UUID );
			var canResize = CORE.Events.applyFilter( 'plugin.canResize.' + UUID );

			var div = document.createElement( 'div' );

			// setup classes correctly
			var className = 'slide-object';
			if( canDrag === true ) {
				className += ' can-drag';
			}
			if( canResize === true ) {
				className += ' can-resize';
			}

			div.className = className;
			div.setAttribute( 'data-uuid', UUID );

			if( canResize === true ) {
				html += '<div class="resize-control"></div>';
			}
			if( canDrag === true ) {
				html += '<div class="drag-control"></div>';
			}
			html += '<div class="dismiss-control"></div>';

			div.innerHTML = '<div class="slide-object-content">' + html + '</div>';

			// get the current slide element so we can calculate offset
			var slide = CORE.Bucket.getCurrentSlideElement();
			var offset = slide.offset();

			div.style.cssText = 'top: ' + ( position.y - offset.top ) + 'px; left: ' + ( position.x - offset.left ) + 'px;';

			CORE.Bucket.addToCurrentSlide( div );
			CORE.Events.doAction( 'plugin.rendered.' + UUID, div );

			var $div = $( div );
			CORE.Events.doAction( 'plugin.settings.save.' + UUID, div, 'size', _getRealPluginSize( $div, slide ) );
			CORE.Events.doAction( 'plugin.settings.save.' + UUID, div, 'position', _getRealPluginPosition( $div, slide ) );
		};

		var _getRealPluginSize = function( $element, $slide ) {
			$slide = $slide || CORE.Bucket.getCurrentSlideElement();

			return {
				w : 1600 / $slide.width() * $element.width(),
				h : 900 / $slide.height() * $element.height()
			};
		}

		var _getRealPluginPosition = function( $element, $slide ) {
			var position = $element.position();
			$slide = $slide || CORE.Bucket.getCurrentSlideElement();

			return {
				top  : 900 / $slide.height() * position.top,
				left : 1600 / $slide.width() * position.left
			};
		}

		var _renderPluginMenuOption = function( html ) {
			var objects = CORE.Events.applyFilter( 'plugins.menu', [] );

			if( objects.length === 0 ) {
				return html;
			}

			var object;
			html = '<ul>';
			for( var i = 0, len = objects.length; i < len; i++ ) {
				object = objects[ i ];
				html += '<li data-uuid="' + object.UUID + '" class="context-menu-object" style="background-image: url(' + object.icon + ');"><a href="javascript:void(0);">' + object.menuText + '</a></li>';
			}
			html += '</ul>';

			return html;
		};
		var _isPlugin = function( target ) {
			while( target !== document && target !== null ) {
				if( CORE.hasClass( target, 'slide-object' ) === true ) {
					return target;
				}
				target = target.parentNode;
			}

			return false;
		};
		var _getPluginUUID = function( element ) {
			var UUID;
			UUID = element.getAttribute( 'data-uuid' );

			if( UUID === null ) {
				return false;
			}

			return UUID;
		};
		var _getPluginData = function( target ) {
			var plugin = _isPlugin( target );
			if( plugin !== false ) {
				var UUID = _getPluginUUID( plugin );
				if( UUID !== false ) {
					return { UUID: UUID, element: plugin };
				}
			}

			return false;
		};
		var _checkPluginObjectClick = function( e, target ) {
			// deselect plugins cause we're not taking any actions
			CORE.Events.doAction( 'plugin.deselect', target );

			// check to see if we can interact with this plugin or not
			var pluginData = _getPluginData( target );
			if( pluginData === false ) {
				return;
			}

			CORE.Events.doAction( 'plugin.click.' + pluginData.UUID, e, target );
		};
		var _checkMouseDownPlugin = function( e, target ) {
			var pluginData = _getPluginData( target );
			if( pluginData === false ) {
				return;
			}

			if ( CORE.hasClass( target, 'resize-control' ) === true ) {
				// the user mouse-downed on the resize control for this plugin
				ACTION = { element: $( pluginData.element ), type: 'resize', UUID: pluginData.UUID };
				CORE.killEvent( e );
			}
			else if ( CORE.hasClass( target, 'drag-control' ) === true ) {
				ACTION = { element: $( pluginData.element ), type: 'drag', UUID: pluginData.UUID };
				CORE.killEvent( e );
			}
			else if ( CORE.hasClass( target, 'dismiss-control' ) === true ) {
				ACTION = { element: $( pluginData.element ), type: 'dismiss', UUID: pluginData.UUID };
				CORE.killEvent( e );
			}
		};
		var _checkMouseUpPlugin = function( e, target ) {
			// stop the current action from continuing on mouse-move
			if( ACTION !== false ) {
				// update the settings for this instance of the plugin
				if ( ACTION.type === 'resize' ) {
					var size = {
						w: ACTION.element.width(),
						h: ACTION.element.height()
					};
					CORE.Events.doAction( 'plugin.settings.save.' + ACTION.UUID, ACTION.element[ 0 ], 'size', _getRealPluginSize( ACTION.element ) );
				}
				else if ( ACTION.type === 'drag' ) {
					var position = ACTION.element.position();
					CORE.Events.doAction( 'plugin.settings.save.' + ACTION.UUID, ACTION.element[ 0 ], 'position', _getRealPluginPosition( ACTION.element ) );
				}
				else if ( ACTION.type === 'dismiss' ) {
					CORE.Events.doAction( 'plugin.remove.' + ACTION.UUID, ACTION.element[0] );
				}

				// clear the action now
				ACTION = false;

				// prevent the event from continuing
				CORE.killEvent( e );
			}
		};
		var _movePlugin = function( e, target, diffX, diffY ) {
			if( ACTION !== false ) {
				// continue doing the action
				if ( ACTION.type === 'resize' ) {
					var height = ACTION.element.height() + diffY,
						width = ACTION.element.width() + diffX;
					ACTION.element.css( {
						'height': height,
						'width':  width
					} );
					CORE.Events.doAction( 'plugin.resize.' + ACTION.UUID, ACTION.element[0], height, width );
				}
				else if( ACTION.type === 'drag' ) {
					// todo: make sure the plugin never goes out of bounds
					var position = ACTION.element.position();
					ACTION.element.css ( {
						top : position.top + diffY,
						left : position.left + diffX
					} );
				}
			}
		};

		// hook into the context menu action
		CORE.Events.addFilter( 'menu.render', _renderPluginMenuOption );
		CORE.Events.addAction( 'menu.click', _pluginMenuItemClicked );
		CORE.Events.addAction( 'bucket.click', _checkPluginObjectClick );
		CORE.Events.addAction( 'body.mouse.move', _movePlugin );
		CORE.Events.addAction( 'bucket.mouse.down', _checkMouseDownPlugin );
		CORE.Events.addAction( 'body.mouse.up', _checkMouseUpPlugin );
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Pluggables = new Pluggables( window.SEO_Slides );
} )( window, jQuery );
( function( window, $, undefined ) {
	var document = window.document;
	window.SEO_Slides = window.SEO_Slides || {};

	var CORE = window.SEO_Slides;
	window.SEO_Slides.Plugin =  function( uuid ) {
		var SELF = this;
		var SETTINGS = {
			name : 'Plugin',
			menuText : 'Context Menu Item',
			icon : 'http://cdn1.iconfinder.com/data/icons/gnomeicontheme/16x16/stock/object/stock_insert-plugin.png',
			UUID : '',
			canDrag : true,
			canResize : true,
			selected : false,
			data : {}
		};
		var INSTANCES = {};

		CORE.Plugins = CORE.Plugins || {};
		CORE.Plugins[ uuid ] = SELF;

		/**
		 * Sets the name of this plugin
		 *
		 * @param name
		 */
		SELF.setName = function( name ) {
			SETTINGS.name = name;
		};

		/**
		 * Gets the name of this plugin
		 *
		 * @return {String}
		 */
		SELF.getName = function() {
			return SETTINGS.name;
		};

		/**
		 * Sets the menu text for the slide context menu that will be used in the context menu
		 *
		 * @param text
		 */
		SELF.setMenuText = function( text ) {
			SETTINGS.menuText = text;
		};

		/**
		 * Gets the menu text that was specified for this plugin. This text is displayed for plugins in the context menu.
		 *
		 * @return {String}
		 */
		SELF.getMenuText = function() {
			return SETTINGS.menuText;
		};

		/**
		 * Sets the plugins context menu icon URL
		 *
		 * @param icon
		 */
		SELF.setIcon = function( icon ) {
			SETTINGS.icon = icon;
		};

		/**
		 * Gets the icon URL that was registered for this plugin's context menu
		 *
		 * @return {String}
		 */
		SELF.getIcon = function() {
			return SETTINGS.icon;
		};

		/**
		 * Allows you to toggle resizing on or off at any given time
		 *
		 * @param value
		 */
		SELF.toggleResize = function( value ) {
			if( value !== false ) {
				value = true;
			}

			SETTINGS.canResize = value;
		};

		/**
		 * Allows you to toggle dragging on or off at any given time.
		 *
		 * @param value
		 */
		SELF.toggleDrag = function( value ) {
			if( value !== false ) {
				value = true;
			}

			SETTINGS.canDrag = value;
		};

		/**
		 * Indicates whether this plugin element can be dragged or not
		 *
		 * @return {Boolean}
		 */
		SELF.canDrag = function() {
			return SETTINGS.canDrag;
		};

		/**
		 * Indicates whether this plugin element can be resized or not.
		 *
		 * @return {Boolean}
		 */
		SELF.canResize = function() {
			return SETTINGS.canResize;
		};

		/**
		 * You can override this for rendering your plugin control in the slide. When you customize this, you can simply
		 * return the HTML from your function and it will get inserted into the control - see sample plugin for usage
		 *
		 * @return {Boolean}
		 */
		SELF.renderControl = function() {
			return false;
		};

		/**
		 * You can override this for rendering your plugin control in the slide. When you customize this, you can simply
		 * return the HTML from your function and it will get inserted into the control - see sample plugin for usage
		 *
		 * @return {Boolean}
		 */
		SELF.renderControlWithData = function() {
			return false;
		};

		/**
		 * You can override this for handling post-plugin rendering. This means developers can bind events, etc.
		 *
		 * @param element The plugin control element
		 * @return {Boolean}
		 */
		SELF.onPluginRendered = function( element ) {
			return false;
		};

		/**
		 * You can override this for handling click events in the plugin. This means developers can use the plugin object
		 * to save the state.
		 *
		 * @param e
		 * @param target
		 * @param plugin
		 */
		SELF.onClick = function( e, target, plugin ) {
			return false;
		};

		SELF.setData = function( uuid, key, value ) {
			var instance = INSTANCES[ uuid ];
			if ( undefined !== instance ) {
				instance.settings[ key ] = value;

				CORE.Events.doAction( 'plugin.setData', SELF, uuid, key, value );
			}
		};

		SELF.getData = function( uuid, key ) {
			return INSTANCES[ uuid ].settings[ key ];
		};

		SELF.addInstance = function( uuid, object ) {
			INSTANCES[ uuid ] = object;
		};

		SELF.clearInstances = function() {
			INSTANCES = {};
		};

		/**
		 * Internal function used for retrieving the UUID
		 *
		 * @return {String}
		 * @private
		 */
		var _getUUID = function() {
			return SETTINGS.UUID;
		};

		/**
		 * Handles rendering the plugin by passing the HTML, if found, back to pluggables
		 *
		 * @param html
		 * @return {*}
		 * @private
		 */
		var _renderPlugin = function( html ) {
			var controlHTML = SELF.renderControl();
			if( controlHTML === false || typeof controlHTML !== 'string' ) {
				return html;
			}

			return controlHTML;
		};

		/**
		 * Handles rendering the plugin by passing the HTML, if found, back to pluggables
		 *
		 * @param html
		 * @return {*}
		 * @private
		 */
		var _renderPluginData = function( data, html ) {
			var controlHTML = SELF.renderControlWithData( data );
			if( controlHTML === false || typeof controlHTML !== 'string' ) {
				return html;
			}

			return controlHTML;
		};

		/**
		 * Action hook that's used for caching the slide element AND letting the plugin developer's register hooks
		 * or bind events to the plugin itself
		 *
		 * @param element
		 * @private
		 */
		var _pluginRendered = function( element ) {
			var $element = $( element );
			var pluginUUID = _createUUID();
			element.setAttribute( 'data-plugin-uuid', pluginUUID );
			SELF.addInstance( pluginUUID, {
				element : $element,
				settings : {}
			} );
			SELF.onPluginRendered( $element );
		};

		/**
		 * Returns the plugin's custom UUID for each instance of that plugin created
		 *
		 * @param target The plugin control container ( created by Pluggables )
		 * @return {*}
		 * @private
		 */
		var _getPluginUUID = function( target ) {
			var pluginUUID;
			while( target !== document ) {
				pluginUUID = target.getAttribute( 'data-plugin-uuid' );
				if( pluginUUID !== null ) {
					return pluginUUID;
				}

				target = target.parentNode;
			}
			return false;
		};

		/**
		 * Filter hook that is used by pluggables to get all of the context menu items.
		 *
		 * @param objects The array of objects that are being registered to the context menu
		 * @return {*}
		 * @private
		 */
		var _renderContextMenu = function( objects ) {
			objects.push( {
				menuText : SELF.getMenuText(),
				icon : SELF.getIcon(),
				UUID : _getUUID()
			} );
			return objects;
		};

		/**
		 * Creates a randomized string from a base 16 number
		 *
		 * @return {String}
		 * @private
		 */
		var _createUUIDPiece = function() {
			return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
		};

		/**
		 * Creates a UUID string for use. This UUID actually links this plugin to all of its events and data so it can
		 * be safely interacted with
		 *
		 * @return {String}
		 * @private
		 */
		var _createUUID = function() {
			var uuid = _createUUIDPiece() + _createUUIDPiece() + '-' + _createUUIDPiece() + '-' + _createUUIDPiece() + '-';
			uuid = uuid + _createUUIDPiece() + '-' + _createUUIDPiece() + _createUUIDPiece() + _createUUIDPiece();
			return uuid;
		};

		/**
		 * Handles firing when the plugin is clicked
		 *
		 * @param e The event that was fired from the DOM
		 * @param target The original target of the event
		 * @private
		 */
		var _pluginClicked = function( e, target ) {
			var pluginUUID = _getPluginUUID( target );
			if( pluginUUID === false ) {
				return;
			}
			INSTANCES[ pluginUUID ].element.addClass( 'selected' );
		};

		/**
		 * Hook is called to deselect this plugin if something else other than the plugin is clicked
		 *
		 * @private
		 */
		var _deselectPlugin = function( target ) {
			for( var UUID in INSTANCES ) {
				INSTANCES[ UUID ].element.removeClass( 'selected' );
			}
		};

		var _removePlugin = function( target ) {
			var pluginUUID = _getPluginUUID( target );
			if( pluginUUID === false ) {
				return;
			}

			// Remove the object from the UI
			INSTANCES[ pluginUUID ].element.remove();

			// Remove the object
			delete INSTANCES[ pluginUUID ];
		};

		var _saveSetting = function( target, key, value ) {
			var pluginUUID = _getPluginUUID( target );
			if( pluginUUID === false ) {
				return;
			}

			INSTANCES[ pluginUUID ].settings[ key ] = value;
		};

		var _getSettings = function( settings ) {
			settings[ _getUUID() ] = INSTANCES;
			return settings;
		};

		// setup settings, etc
		SETTINGS.UUID = ( undefined === uuid ) ? _createUUID() : uuid;

		// hook into the plugins.menu so we can render the context menu option
		CORE.Events.addFilter( 'plugins.menu', _renderContextMenu );

		// register our callback for rendering this object - since UUID is unique, no other plugin can ever handle the
		// rendering for this plugin - this is pretty sweet.
		CORE.Events.addFilter( 'plugin.render.' + _getUUID(), _renderPlugin );
		CORE.Events.addFilter( 'plugin.renderdata.' + _getUUID(), _renderPluginData );

		// register our hook callback that intercepts events for after a plugin has been rendered
		CORE.Events.addAction( 'plugin.rendered.' + _getUUID(), _pluginRendered );

		// intercept plugin control click events
		CORE.Events.addAction( 'plugin.click.' + _getUUID(), _pluginClicked );

		// respond to canDrag & canResize pulses
		CORE.Events.addFilter( 'plugin.canDrag.' + _getUUID(), SELF.canDrag );
		CORE.Events.addFilter( 'plugin.canResize.' + _getUUID(), SELF.canResize );

		// deselect this plugin unless it was clicked
		CORE.Events.addAction( 'plugin.deselect', _deselectPlugin );

		// handle save events
		CORE.Events.addAction( 'plugin.settings.save.' + _getUUID(), _saveSetting );

		// handle getting settings
		CORE.Events.addFilter( 'plugin.settings.get', _getSettings );

		// handle removal events
		CORE.Events.addAction( 'plugin.remove.' + _getUUID(), _removePlugin );
	};

} )( window, jQuery );
( function( window, $, undefined ) {
	var document = window.document;

	var Bucket = function( CORE ) {
		var SELF = this;
		var UI = {};
		var CURRENT_SLIDES = {
			left : false,
			middle : false,
			right : false
		};
		var ANIMATION_TIME = 500;
		var SIDE_SLIDE_WIDTH = 20;
		var MOUSE_POS = { x : 0, y : 0 };

		SELF.initialize = function( container ) {
			UI.BUCKET = container;
			UI.$BUCKET = $( container );
			_bindEvents();
			_resizeBucket();
			//_createControls();

			CORE.Events.doAction( 'core.init' );
		};

		SELF.getBucketElement = function() {
			return UI.$BUCKET;
		};

		SELF.addToCurrentSlide = function( thing ) {
			if( CURRENT_SLIDES.middle === false ) {
				return;
			}

			// insert the HTML into the slide
			CURRENT_SLIDES.middle.getElement().append( thing );
		};

		SELF.getCurrentSlideElement = function() {
			if( CURRENT_SLIDES.middle === false ) {
				return false;
			}

			return CURRENT_SLIDES.middle.getElement();
		};

		SELF.loadSlide = function( slide_id, slideset_id ) {
			CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id, slideset_id );
		};

		var _bindEvents = function() {
			CORE.addEvent( 'resize', window, _resizeBucket );
			CORE.addEvent( 'click', UI.BUCKET, _fireClickEvent );
			CORE.addEvent( 'contextmenu', UI.BUCKET, _fireContextMenu );
			CORE.addEvent( 'mousedown', window, _fireMouseDown );
			CORE.addEvent( 'mouseup', window, _fireMouseUp );
			CORE.addEvent( 'mousemove', window, _fireMouseMove );
		};

		var _fireMouseDown = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			CORE.Events.doAction( 'bucket.mouse.down', e, target );
		};

		var _fireMouseUp = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			CORE.Events.doAction( 'body.mouse.up', e, target );
		};

		var _fireMouseMove = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			// calculate the difference
			var diffX = e.clientX - MOUSE_POS.x;
			var diffY = e.clientY - MOUSE_POS.y;
			MOUSE_POS.x = e.clientX;
			MOUSE_POS.y = e.clientY;

			CORE.Events.doAction( 'body.mouse.move', e, target, diffX, diffY );
		};

		var _createControls = function() {
			var controls = document.createElement( 'div' );
			controls.className = 'seoslides-bucket-controls';
			var html = '';// '<div class="button bucket-show-slides">View Slides</div>';
			html += '<div class="button bucket-add-slide">Add Slide</div>';
			controls.innerHTML = html;

			UI.BUCKET.appendChild( controls );
			UI.CONTROLS = controls;
		};

		var _fireContextMenu = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;
			CORE.Events.doAction( 'bucket.context.menu', e, target );
			CORE.killEvent( e );
		};

		var _fireClickEvent = function( e ) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			if( CORE.hasClass( target, 'bucket-add-slide' ) === true ) {
				var slide_id = CORE.Events.applyFilter( 'bucket.createSlide', 0 );

				_createNewSlide( slide_id );
			}
			else if( CORE.hasClass( target, 'bucket-slide' ) === true && CORE.hasClass( target, 'left' ) === true ) {
				_shiftSlidesRight();
			}
			else if( CORE.hasClass( target, 'bucket-slide' ) === true && CORE.hasClass( target, 'right' ) === true ) {
				_shiftSlidesLeft();
			}

			CORE.Events.doAction( 'bucket.click', e, target );
		};

		var _shiftSlidesRight = function() {
			//
		};

		var _shiftSlidesLeft = function() {
			//
		};

		var _createNewSlide = function( slide_id ) {
			// left and middle slides exist
			if( CURRENT_SLIDES.left !== false && CURRENT_SLIDES.middle !== false ) {
				CURRENT_SLIDES.left.getElement().stop( true, true ).animate( { width : 0 }, ANIMATION_TIME, function(){
					$( this ).remove();
				} );
				CURRENT_SLIDES.middle.getElement().stop( true, true ).animate( { left : 0, width: SIDE_SLIDE_WIDTH, opacity : 0.7 }, ANIMATION_TIME, function() {
					CURRENT_SLIDES.left = CURRENT_SLIDES.middle;
					CURRENT_SLIDES.left.setBucketPosition( 'left' );
					this.className = 'bucket-slide left';
					CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id );
				} );
			}

			// only middle slide showing
			else if( CURRENT_SLIDES.left === false && CURRENT_SLIDES.middle !== false && CURRENT_SLIDES.right === false ) {
				CURRENT_SLIDES.middle.getElement().stop( true, true ).animate( { left : 0, width : SIDE_SLIDE_WIDTH, opacity : 0.7 }, ANIMATION_TIME, function() {
					CURRENT_SLIDES.left = CURRENT_SLIDES.middle;
					CURRENT_SLIDES.left.setBucketPosition( 'left' );
					this.className = 'bucket-slide left';
					CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id );
				} );
			}

			// no slides exist
			else if( CURRENT_SLIDES.left === false && CURRENT_SLIDES.middle === false && CURRENT_SLIDES.right === false ) {
				CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id );
			}
		};

		var _resizeBucket = function() {
			var ratio = 16 / 9,
				$parent = $( UI.BUCKET.parentNode ),
				maxWidth = $parent.width(),
				maxHeight = $parent.height(),
				height, width;

			if ( ( maxWidth / maxHeight ) > ratio ) {
				// Parent container is wider than required, scale to height
				height = maxHeight;
				width = height * ratio;
			} else {
				// Parent container is taller than required, scale to width
				width = maxWidth;
				height = width / ratio;
			}

			// Set the bucket's styles
			var style = UI.BUCKET.style;
			style.width = width + 'px';
			style.height = height + 'px';

			// might need to hide the UI here and then resize and show UI after done - don't want slide to be super heavy
			// on resize
			CORE.Events.doAction( 'bucket.resize', 1.77778 );
		};
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Bucket = new Bucket( window.SEO_Slides );
} )( window, jQuery );
( function( window, $, undefined ) {
	var document = window.document,
		CORE = window.SEO_Slides,
		INTERNALS = window.seoslides;

	/**
	 * Image Picker object
	 *
	 * Uses WordPress Thickbox JS overlay.
	 *
	 * @param {String} label
	 * @param {Object} picker
	 * @constructor
	 */
	CORE.ImagePicker = function( label, picker ) {
		var SELF = this;

		SELF.editor_store = undefined;
		SELF.ifWindow = undefined;
		SELF.fileQueued = undefined;

		/**
		 * Handle the selection of an image.
		 *
		 * @param {String} html
		 */
		function send_handler( html ) {
			var mediaPath = jQuery( html ).attr( 'href' );

			// Remove the modal overlay
			window.tb_remove();

			// Restore original handlers
			window.send_to_editor = SELF.editor_store;
			SELF.ifWindow.fileQueued = SELF.fileQueued;

			// Trigger internal change event
			SELF.changed( mediaPath );
		}

		/**
		 * Our custom click event handler
		 *
		 * @param {Event} e
		 */
		SELF.launchOverlay = function( e ) {
			e.preventDefault();

			SELF.editor_store = window.send_to_editor;

			// Set up our new handler
			window.send_to_editor = send_handler;

			// Show the overlay
			window.tb_show( label, 'media-upload.php?type=image&TB_iframe=1&width=640&height=263' );

			$( 'iframe#TB_iframeContent' ).load( SELF.loaded );
		};

		/**
		 * Override this function to do some magic after an image is selected.
		 *
		 * @param {String} newUri The new image URL.
		 *
		 * @return {Boolean}
		 */
		SELF.changed = function( newUri ) {
			return false;
		};

		/**
		 * Override this function to do some magic after the iFrame is loaded
		 *
		 * @returns {Boolean}
		 */
		SELF.loaded = function() {
			return false;
		};
	};

	/**
	 * Check if a file extension is inclided in a particular array.
	 *
	 * @param {Array}  extArray
	 * @param {String} src
	 * @returns {Boolean}
	 */
	function isExtensionMatch( extArray, src ) {
		var ext = src.split( '.' ).pop();
		ext = ext.toLowerCase();

		for ( var i = 0; i < extArray.length; i++ ) {
			var extension = extArray[i];

			if ( ext === extension ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if a file name is that of an image.
	 *
	 * @param {String} src
	 * @returns {Boolean}
	 */
	CORE.ImagePicker.prototype.isImage = function( src ) {
		var extensions = [ 'jpg', 'jpeg', 'png', 'gif' ];
		extensions = CORE.Events.applyFilter( 'media.image.extensions', extensions );

		return isExtensionMatch( extensions, src );
	};

	/**
	 * Check if a file name is that of a video.
	 *
	 * @param {String} src
	 * @returns {Boolean}
	 */
	CORE.ImagePicker.prototype.isVideo = function( src ) {
		var extensions = [ 'mp4', 'm4v', 'webm', 'ogv', 'wmv', 'flv' ];
		extensions = CORE.Events.applyFilter( 'media.video.extensions', extensions );

		return isExtensionMatch( extensions, src );
	};

	/**
	 * Object that intercepts the input of remote file URLs and verifies they are actually video URLs.
	 * Used to override the default onblur event of the 'src' element in Thickbox.
	 *
	 * @constructor
	 */
	CORE.ImagePicker.MediaFilter = function( ifWindow ) {
		var SELF = this;

		SELF.getData = function() {
			var src = ifWindow.document.forms[0].src.value,
				img = ifWindow.document.getElementById( 'status_img' );

			if ( ! src ) {
				SELF.reset();
				return false;
			}

			img.innerHTML = '<img src="' + INTERNALS.thickbox_spinner + '" alt="" width="16" />';

			if ( CORE.ImagePicker.prototype.isVideo( src ) ) {
				SELF.update();
			} else {
				SELF.reset();
			}
		};

		SELF.update = function() {
			ifWindow.document.getElementById( 'insertonlybutton' ).style.color = '#333';
			ifWindow.document.getElementById( 'status_img' ).innerHTML = '<img src="' + INTERNALS.thickbox_yes + '" alt="" />';
		};

		SELF.reset = function() {
			var img = ifWindow.document.getElementById( 'status_img' );

			ifWindow.document.getElementById( 'insertonlybutton' ).style.color = '#bbb';

			if ( ! ifWindow.document.forms[0].src.value ) {
				img.innerHTML = '*';
			} else {
				img.innerHTML = '<img src="' + INTERNALS.thickbox_noimage + '" alt="" />';
			}
		};
	};
} )( this, jQuery );
( function( window, $, undefined ) {
	var document = window.document,
		INTERNALS = window.seoslides,
		I18N = window.seoslides_i18n;

	window.SEO_Slides = window.SEO_Slides || {};

	window.SEO_Slides.Modal = function( SETTINGS ) {
		var SELF = this,
			CORE = window.SEO_Slides,
			$MODAL = false,
			$OVERLAY = false,
			clean = true;

		var createOverlay = function() {
			var overlay = CORE.createElement( 'div', {
				'class': SETTINGS.overlayClass,
				'appendTo': document.body
			} );
			overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #000;z-index: 159900;';

			$OVERLAY = $( overlay ).css( 'opacity', SETTINGS.backgroundOpacity ).on( 'click', SELF.close );
		};
		var removeOverlay = function() {
			if( false !== $OVERLAY ) {
				$OVERLAY.remove();
				$OVERLAY = false;
			}
		};
		var createModal = function() {
			var modal = CORE.createElement( 'div', {
				'class': SETTINGS.modalClass,
				'appendTo': document.body
			} );
			modal.style.cssText = 'position: fixed; top: 30px; left: 30px; right: 30px; bottom: 30px; background-color: #fff; z-index: 160000;overflow: hidden;';

			/* Close button for the modal dialog */
			{
				var closer = CORE.createElement( 'a', {
					'class':    'seoslides-modal-close',
					'attr':     [
						['href', '#'],
						['title', I18N.close]
					],
					'appendTo': modal
				} );
				$( closer ).on( 'click', function ( e ) { e.preventDefault(); SELF.close(); } );

				var closeSpan = CORE.createElement( 'span', {
					'class':    'seoslides-modal-icon',
					'appendTo': closer
				} );
			}

			/* Left-side menu for manipulating BG data, SEO */
			{
				var left_rail = CORE.createElement( 'div', {
					'class': 'seoslides-left-rail',
					'appendTo': modal
				} );

				var left_rail_content = CORE.createElement( 'div', {
					'class': 'seoslides-rail-content',
					'appendTo': left_rail
				} );

				$( '.seoslides-rail-content' ).on( 'keydown', function() {
					CORE.Events.doAction( 'seoslides.slideEdited' );
				} );

				// SEO Meta
				{
					var seo = CORE.createElement( 'div', {
						'class': 'seoslides-modal-seo',
						'appendTo': left_rail_content
					} );

					// Title
					var seo_title_p = document.createElement( 'p' );

					CORE.createElement( 'label', {
						'attr':     [
							['for', 'seoslides_slide_title']
						],
						'appendTo': seo_title_p
					} ).innerHTML = I18N.seo_title;

					seo_title_p.appendChild( document.createElement( 'br' ) );

					CORE.createElement( 'input', {
						'attr':     [
							['type', 'text'],
							['id', 'seoslides_slide_title'],
							['name', 'seoslides_slide_title']
						],
						'appendTo': seo_title_p
					} );

					seo.appendChild( seo_title_p );

					// Description
					var seo_description_p = document.createElement( 'p' );

					CORE.createElement( 'label', {
						'attr':     [
							['for', 'seoslides_slide_description']
						],
						'appendTo': seo_description_p
					} ).innerHTML = I18N.seo_description;

					seo_description_p.appendChild( document.createElement( 'br' ) );

					CORE.createElement( 'textarea', {
						'attr':     [
							['cols', 25],
							['rows', 2],
							['id', 'seoslides_slide_description'],
							['name', 'seoslides_slide_description']
						],
						'appendTo': seo_description_p
					} );

					seo.appendChild( seo_description_p );

					// Keywords
					var seo_keywords_p = document.createElement( 'p' );

					CORE.createElement( 'label', {
						'attr':     [
							['for', 'seoslides_slide_keywords']
						],
						'appendTo': seo_keywords_p
					} ).innerHTML = I18N.seo_keywords;

					seo_keywords_p.appendChild( document.createElement( 'br' ) );

					CORE.createElement( 'input', {
						'attr':     [
							['type', 'text'],
							['id', 'seoslides_slide_keywords'],
							['name', 'seoslides_slide_keywords']
						],
						'appendTo': seo_keywords_p
					} );

					seo.appendChild( seo_keywords_p );
				}

				// Background Color and Image
				{
					var bginfo = CORE.createElement( 'div', {
						'class': 'seoslides-modal-bginfo',
						'appendTo': left_rail_content
					} );

					CORE.createElement( 'label', {
						'appendTo': bginfo
					} ).innerHTML = I18N.background;

					var customize = CORE.createElement( 'div', {
						'class': 'customize-control-content',
						'appendTo': bginfo
					} );

					CORE.createElement( 'input', {
						'attr':     [
							['id', 'modal_color_picker_hex'],
							['name', 'modal_color_picker_hex'],
							['type', 'text'],
							['maxlength', 7],
							['placeholder', I18N.hex_value],
							['data-default-color', '#ffffff'],
							['value', '#ffffff']
						],
						'appendTo': customize
					} );

					CORE.createElement( 'div', {
						'attr':  [
							['id', 'modal_fallback-color-picker']
						],
						'appendTo': customize
					} );

					bginfo.appendChild( document.createElement( 'br' ) );

					var preview = CORE.createElement( 'div', {
						'attr':     [
							['id', 'modal_seoslides_image_preview'],
							['data-none', I18N.label_no_bg]
						],
						'appendTo': bginfo
					} );
					preview.innerHTML = I18N.label_no_bg;

					bginfo.appendChild( document.createElement( 'br' ) );

					CORE.createElement( 'input', {
						'attr':     [
							['type', 'hidden'],
							['id', 'modal_seoslides_image_src'],
							['name', 'modal_seoslides_image_src']
						],
						'appendTo': bginfo
					} );

					CORE.createElement( 'input', {
						'class':    'button-secondary choose',
						'attr':     [
							['type', 'submit'],
							['id', 'modal_seoslides_image_picker'],
							['name', 'modal_seoslides_image_picker'],
							['data-chosen', I18N.remove_media],
							['data-unchosen', I18N.choose_media],
							['value', I18N.choose_media]
						],
						'appendTo': bginfo
					} );

					var youtube_vimeo = CORE.createElement( 'p', { 'appendTo': bginfo } );
					youtube_vimeo.className = 'youtube-vimeo';

					CORE.createElement( 'label', {
						'attr': [
							['for', 'seoslides_video_oembed']
						],
						'appendTo': youtube_vimeo
					} ).innerHTML = I18N.oembed_video;

					var video = CORE.createElement( 'input', {
						'attr':     [
							['type', 'text'],
							['id', 'seoslides_video_oembed'],
							['name', 'seoslides_video_oembed']
						],
						'appendTo': youtube_vimeo
					} );

					var video_helper = CORE.createElement( 'p', {
						'attr': [
							['class', 'description']
						],
						'appendTo': youtube_vimeo
					} );
					video_helper.innerHTML = I18N.oembed_helper;

					var videoTimeout;
					var validateVideo = function() {
						var oembed_el = document.getElementById( 'seoslides_video_oembed' ),
							oembed_label = $( 'label[for="seoslides_video_oembed"]' );

						if ( null === oembed_el ) {
							return;
						}

						var url_to_validate = oembed_el.value;
						if ( '' === url_to_validate.trim() ) {
							return;
						}

						var $oembed_el = $( oembed_el );

						CORE.ajax( 'check_omebed', {
							data: {
								'seoslides_video_oembed': url_to_validate
							},
							success: function() {
								$oembed_el.removeClass( 'error' ).addClass( 'valid' );
								oembed_label.html( I18N.oembed_valid );
							},
							error: function() {
								$oembed_el.addClass( 'error' ).removeClass( 'valid' );
								oembed_label.html( I18N.oembed_invalid );
							}
						} );
					};

					$( video ).on( 'keyup blur', function() {
						window.clearTimeout( videoTimeout );

						videoTimeout = window.setTimeout( validateVideo, 300 );
					} );
				}

				// Transitions
				{
					var transitions = CORE.createElement( 'div', {
						'class': 'seoslides-modal-transitions',
						'appendTo': left_rail_content
					} );

					CORE.createElement( 'label', {
						'appendTo': transitions
					} ).innerHTML = I18N.transitions;

					$( transitions ).append( INTERNALS.themes );
				}
			}

			modal.appendChild( SETTINGS.content );

			$MODAL = $( modal );
			if ( undefined !== SETTINGS.callback && 'function' === typeof SETTINGS.callback ) {
				SETTINGS.callback( SELF );
			}
		};
		var removeModal = function() {
			if( false !== $MODAL ) {
				$MODAL.remove();
				$MODAL = false;
			}
		};

		SELF.close = function() {
			if ( ! clean && ! window.confirm( I18N.close_modal_conf ) ) {
				return;
			}

			removeModal();
			removeOverlay();

			window.SEO_Slides.Events.doAction( 'modal.close' );
		};

		SELF.getContainer = function() {
			return $MODAL;
		};

		SELF.show = function() {
			SELF.close();
			createOverlay();
			createModal();

			window.SEO_Slides.Events.doAction( 'modal.open' );
		};

		var setDefaults = function() {
			var defaults = [
				{ key : 'callback', value : undefined },
				{ key : 'speed', value : 500 },
				{ key : 'backgroundOpacity', value : 0.7 },
				{ key : 'modalClass', value : 'tc-Modal-modal' },
				{ key : 'overlayClass', value : 'tc-Modal-overlay' },
				{ key : 'html', value : '' }
			];

			// use for instead of for in for iterating over an object, for is faster
			var defaultSetting;
			for( var i = 0, len = defaults.length; i < len; i++ ) {
				defaultSetting = defaults[ i ];
				if( undefined === SETTINGS[ defaultSetting.key ] ) {
					SETTINGS[ defaultSetting.key ] = defaultSetting.value;
				}
			}
		};

		function contaminate() {
			clean = false;
		}

		window.SEO_Slides.Events.addAction( 'plugin.setData', contaminate );
		window.SEO_Slides.Events.addAction( 'wysiwyg.key', contaminate );
		window.SEO_Slides.Events.addAction( 'slide.tabsToggled', contaminate );
		window.SEO_Slides.Events.addAction( 'seoslides.slideEdited', contaminate );

		window.SEO_Slides.Events.addAction( 'modal.saved', function() {
			clean = true;
		} );

		setDefaults();
	};
} )( this, jQuery );

( function( window, $, undefined ) {
	var document = window.document,
		I18N = window.seoslides_i18n,
		CORE = window.SEO_Slides;

	var UUID = '09038190-8695-11e2-9e96-0800200c9a66';
	var plugin = new CORE.Plugin( UUID );
	var defaultControl = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;padding: 0.5em;text-align: center;background-color: #ccc;border: 3px dashed #888;border-radius: 3px;-moz-border-radius: 3px;-webkit-border-radius: 3px"><span class="no-image">' + I18N.layout_image + '</span></div>';

	plugin.setName( I18N.image_name );
	plugin.setMenuText( I18N.image_menu );
	plugin.setIcon( I18N.image_icon );
	plugin.renderControl = function() {
		return defaultControl;
	};
	plugin.renderControlWithData = function( data ) {
		var control = '';

		if ( I18N.layout_image === data.settings.content ) {
			control = defaultControl;
		} else {
			control += '<div style="position:absolute;top:0;bottom:0;left:0;right:0;">';
			control += '<img style="height:100%;width:100%;" class="plugin-image" src="' + data.settings.content + '" />';
			control += '</div>';
		}

		return control;
	};
	plugin.onPluginRendered = function( $element ) {
		// Set up the element's minimum height
		if ( "" === $element[0].style.height ) {
			$element.css( 'height', 200 );
		}

		// Set up the element's minimum width
		if ( "" === $element[0].style.width ) {
			$element.css( 'width', 200 );
		}

		var swapper = ( function( $el ) {
			var uuid = $el.data( 'plugin-uuid' ),
				pickerEl = $el.find( '.no-image' ),
				imagePicker = new CORE.ImagePicker( I18N.image_select, pickerEl ),
				container = $el.find( '.slide-object-content > div:first-child' );

			pickerEl.on( 'dblclick', imagePicker.launchOverlay );

			var setImageSize = function() {
				var $image = $el.find( '.plugin-image' ),
					maxHeight = container.height(),
					maxWidth = container.width(),
					ratio = maxHeight / maxWidth,
					idealHeight = maxWidth * ratio,
					idealWidth = maxHeight / ratio,
					realHeight = idealHeight,
					realWidth = idealWidth;

				if ( 0 === $image.length ) {
					return;
				}

				if ( idealHeight > maxHeight ) {
					// Resizing will make things too tall
					realHeight = realWidth * ratio;
				} else if ( idealWidth > maxWidth ) {
					// Resizing will make things too wide
					realWidth = realHeight / ratio;
				}

				$image.css( {
					'height': realHeight,
					'width': realWidth
				} );
			};

			/**
			 * Intercept the file queueing process for plupload and block non-images.
			 */
			imagePicker.loaded = function() {
				imagePicker.ifWindow = document.getElementById('TB_iframeContent').contentWindow;
				imagePicker.fileQueued = imagePicker.ifWindow.fileQueued;

				var notImage = imagePicker.ifWindow.document.getElementById( 'not-image' );
				if ( null !== notImage ) {
					notImage.parentNode.style.display = 'none';
				}

				// Hide non image selection
				var ifStyle = imagePicker.ifWindow.document.createElement( 'style' );
				ifStyle.type = 'text/css';
				ifStyle.innerHTML = '#filter li:first-child,#filter li:nth-child(3),#filter li:nth-child(4) {display: none;}';
				imagePicker.ifWindow.document.getElementsByTagName('head')[0].appendChild( ifStyle );
				var filter = imagePicker.ifWindow.document.getElementById( 'filter' ),
					imageLI = $( filter ).find( '.subsubsub li:nth-child(2)' ),
					html = imageLI.html();
				if ( undefined !== html ) {
					imageLI.html( html.substring( 0, html.length - 3 ) );
				}

				// Set new fileQueued handler
				imagePicker.ifWindow.fileQueued = function( fileObj ) {
					// If we're good, go for it!
					if ( imagePicker.isImage( fileObj.name ) ) {
						imagePicker.fileQueued( fileObj );

						return;
					}

					// If we've gotten this far, someone's trying to do something nasty. Stop them!
					window.alert( I18N.not_image );
				};
			};

			/**
			 * Intercept the default change event so we can do some special magic.
			 *
			 * @param {String} newUri
			 */
			imagePicker.changed = function( newUri ) {
				var image = document.createElement( 'img' );
				image.className = 'plugin-image';
				image.setAttribute( 'src', newUri );

				plugin.setData( uuid, 'content', newUri );

				$el.find( '.no-image' ).replaceWith( image );

				// Build the callback for after the image is replaced.
				function prepareImage () {
					var imageStyle = window.getComputedStyle( image ),
						idealHeight = window.parseFloat( imageStyle.height ),
						idealWidth = window.parseFloat( imageStyle.width ),
						ratio = idealHeight / idealWidth,
						maxHeight = container.height(),
						maxWidth = container.width();

					var realHeight = maxHeight,
						realWidth = maxWidth;

					if ( idealHeight > maxHeight && ratio > 1 ) {
						// Resizing will make things too tall
						realWidth = maxHeight / ratio;
					} else if ( idealWidth > maxWidth && ratio < 1 ) {
						// Resizing will make things too wide
						realHeight = maxWidth * ratio;
					}

					// Prepare container
					container.css( {
						'padding':         0,
						'backgroundColor': 'transparent',
						'border':          'none',
						'borderRadius':    0,
						'textAlign':       'left',
						'height':          realHeight,
						'width':           realWidth
					} );

					// Prepare container parent
					container.parents( '.slide-object' ).css( {
						'height': realHeight,
						'width':  realWidth
					} );

					setImageSize();

					var size = getPluginSize( $element );
					CORE.Events.doAction( 'plugin.settings.save.' + UUID, $el[0], 'size', size );
				}

				$( image ).on( 'load', prepareImage );
			};

			return {
				setImageSize: setImageSize
			};
		} )( $element );

		swapper.setImageSize();
	};

	var handleResize = function( element, height, width ) {
		var img = element.querySelector( 'img' ),
			style = window.getComputedStyle( img ),
			ratio = window.parseFloat( style.height ) / window.parseFloat( style.width ),
			maxHeight = window.parseFloat( height ),
			maxWidth = window.parseFloat( width ),
			idealHeight, idealWidth, realHeight, realWidth;

		// Calculate the new height and width
		idealHeight = maxWidth * ratio;
		idealWidth = maxHeight / ratio;

		if ( idealHeight > maxHeight ) {
			// Resizing will make things too tall
			realWidth = idealWidth;
			realHeight = realWidth * ratio;
		} else if ( idealWidth > maxWidth ) {
			// Resizing will make things too wide
			realHeight = idealHeight;
			realWidth = realHeight / ratio;
		}

		img.style.height = realHeight + 'px';
		img.style.width = realWidth + 'px';
	};
	CORE.Events.addAction( 'plugin.resize.' + UUID, handleResize );

	var handleCanvasResize = function( $slide ) {
		$( '.plugin-image', $slide ).each( function( i, el ) {
			var $el = $( el ),
				$parent = $el.parent();

			$el.css( {
				'height': $parent.height(),
				'width':  $parent.width()
			} );
		} );
	};
	CORE.Events.addAction( 'debounced.canvas.resize', handleCanvasResize, 11 );

	/**
	 * Get the plugin's size from the canvas element.
	 *
	 * @param {Object} $element
	 * @param {Object} $slide
	 * @returns {{w: number, h: number}}
	 */
	var getPluginSize = function( $element, $slide ) {
		$slide = $slide || CORE.Bucket.getCurrentSlideElement();

		return {
			w : 1600 / $slide.width() * $element.width(),
			h : 900 / $slide.height() * $element.height()
		};
	};
} )( this, jQuery );

( function( window, $, undefined ) {
	var document = window.document,
		SEO_Slides = window.SEO_Slides,
		I18N = window.seoslides_i18n,
		pluginUUID;

	SEO_Slides.inline_editors = SEO_Slides.inline_editors || [];

	var plugin = new SEO_Slides.Plugin( '1798dfc0-8695-11e2-9e96-0800200c9a66' );
	plugin.setName( I18N.wysiwyg_textarea );
	plugin.setMenuText( I18N.wysiwyg_menu );
	plugin.setIcon( I18N.wysiwyg_icon );

	/**
	 * Build up the default text field.
	 *
	 * @returns {String}
	 */
	function default_text() {
		var font_names = window.CKEDITOR.config.font_names,
			fonts = font_names.split( ';' ),
			collection = {};

		$.each( fonts, function( i, e ) {
			var pieces = e.split( '/' );

			collection[ pieces[0] ] = pieces[1];
		} );

		var bucket = document.querySelector( '.bucket-slide' ),
			font = bucket.getAttribute( 'data-default_font' ),
			size = bucket.getAttribute( 'data-default_size' ),
			color = bucket.getAttribute( 'data-default_font_color' );

		font = collection[ font ];

		var style = '';

		if ( undefined !== font ) {
			style = 'font-family:' + font + ';';
		}

		if ( '#000000' !== color ) {
			style += 'color:' + color + ';';
		}

		style += 'font-size:' + size + ';';

		var block = '<span style="' + style + '">';
		block += I18N.layout_text;
		block += '</span>';

		return block;
	}

	plugin.renderControl = function() {
		var control = '<div style="padding: 0.5em;">';
		control += '<div class="seoslides_responsive seoslides_wysiwyg" contenteditable="true">';
		control += default_text();
		control += '</div>';
		control += '</div>';

		return control;
	};

	plugin.renderControlWithData = function( data, editable ) {
		if ( undefined !== editable ) {
			editable = ' contenteditable="true"';
		} else {
			editable = '';
		}

		var control = '<div style="padding: 0.5em;">';
		control += '<div class="seoslides_responsive seoslides_wysiwyg"' + editable + '>';
		control += data.settings.content;
		control += '</div>';
		control += '</div>';

		return control;
	};

	plugin.onPluginRendered = function( $element ) {
		var cke = window.CKEDITOR;

		// Disabled automated insertion
		cke.disableAutoInline = true;

		// Set up the element's minimum height
		if ( "" === $element[0].style.height ) {
			$element.css( 'height', 60 );
		}

		// Set up the element's minimum width
		if ( "" === $element[0].style.width ) {
			$element.css( 'width', 150 );
		}

		( function( $el ) {
			var uuid = $el.data( 'plugin-uuid' ),
				editor = $( '.seoslides_wysiwyg', $el );

			var editor_instance = cke.inline(
				editor[0],
				{
					baseFloatZIndex:         170001,
					floatSpaceDockedOffsetY: 20,
					on:                      {
						blur: function () {
							var content = this.getData();

							plugin.setData( uuid, 'content', content );
						},
						key: function () {
							SEO_Slides.Events.doAction( 'wysiwyg.key' );
						}
					}
				}
			);

			SEO_Slides.inline_editors.push( editor_instance );
		} )( $element );
	};

} )( this, jQuery );
( function( window, $, undefined ) {
	var CORE = window.SEO_Slides,
		I18N = window.seoslides_i18n,
		document = window.document;

	/**
	 * Build out slides and handle internally-bound events.
	 *
	 * @constructor
	 */
	function SlideBuilder() {
		var SELF = this;

		SELF.pluginManager = new PluginManager();

		/**
		 * Create a slide object (jQuery object) based on a given slide and specified template.
		 *
		 * @param {object}  slide
		 * @param {object}  template
		 * @param {boolean} thumbnail
		 *
		 * @return {object}
		 */
		SELF.createSlide = function( slide, template, thumbnail ) {
			thumbnail = ( undefined === thumbnail ) ? false : thumbnail;
			var row = template.clone();

			// Render Slide
			var slideEl = document.createElement( 'section' );

			slideEl.className = 'slide';
			slideEl.setAttribute( 'data-id', slide.id );

			var slideDiv = renderSlideThumb( slide );
			slideEl.appendChild( slideDiv );

			if ( thumbnail ) {
				if ( undefined !== slide['bg_thumb'] && typeof slide['bg_thumb'] === 'string' && '' !== slide['bg_thumb'].trim() ) {
					slideEl.style.backgroundImage = 'url(' + slide['bg_thumb'] + ')';
				}
			} else {
				if ( undefined !== slide['bg_image'] && typeof slide['bg_image'] === 'string' && '' !== slide['bg_image'].trim() ) {
					slideEl.style.backgroundImage = 'url(' + slide['bg_image'] + ')';
				}
			}

			slideEl.style.backgroundColor = slide.fill_color;

			if ( slide.title === '' ) {
				slide.title = I18N.label_notitle;
			}

			var title = '<div class="title">' + slide.title + '</div>';
			title += '<div class="row-actions">';
			title += '<span class="edit"><a data-id="' + slide.id + '" class="editslide" href="javascript:void;" title="' + I18N.label_edit_slide + '">' + I18N.label_edit + '</a> | </span>';
			title += '<span class="trash"><a data-id="' + slide.id + '" class="submittrash" href="javascript:void;" title="' + I18N.label_trash_slide + '">' + I18N.label_trash + '</a></span>';
			title += '<span class="restore"><a data-id="' + slide.id + '" class="restoreslide" href="javascript:void;" title="' + I18N.label_restore_slide + '">' + I18N.label_restore + '</a> | </span>';
			title += '<span class="delete"><a data-id="' + slide.id + '" class="submitdelete" href="javascript:void;" title="' + I18N.label_delete_slide + '">' + I18N.label_delete + '</a></span>';
			title += '</div>';

			row.find( '.slide-preview' ).html( '<span data-id="' + slide.id + '" class="editslide" title="' + I18N.label_edit_slide + '"></span>').find('span.editslide').append( slideEl );
			row.find( '.slide-title' ).html( title );
			row.find( '.slide-description' ).html( slide.seo_description );
			row.find( '.slide-notes' ).html( slide.presenter_notes );

			return row;
		};

		/**
		 * Parse a flat HTML node into a slide and replace the node with the parsed content.
		 *
		 * @param {HTMLElement} node
		 */
		SELF.parseSlide = function( node ) {
			// Build data object
			var slide = {};

			var img = node.querySelector( '.slide-body > img' );
			if ( null !== img ) {
				slide.oembed_thumb = img.src;
			}
			var iframe = node.querySelector( '.slide-body > iframe' );
			if ( null !== iframe ) {
				slide.oembed = iframe.src;
			}

			var objects = node.querySelectorAll( '.slide-body > div' );
			for ( var i = 0; i < objects.length; i++ ) {
				slide.objects = slide.objects || [];

				var raw = objects[i];
				var object = {
					'element_id': raw.getAttribute( 'data-element' ),
					'plugin_id':  raw.getAttribute( 'data-plugin' ),
					'settings':   {}
				};

				// Use basic polyfill for IE support
				var child = raw.firstElementChild || raw.children[0] || null;
				if ( null !== child && 'slide-object-unparsed-content' === child.className ) {
					object.settings.content = child.innerHTML;
				} else {
					object.settings.content = raw.innerHTML;
				}

				object.settings.size = {
					'h': raw.getAttribute( 'data-height' ),
					'w': raw.getAttribute( 'data-width' )
				};
				object.settings.position = {
					'top':  raw.getAttribute( 'data-top' ),
					'left': raw.getAttribute( 'data-left' )
				};

				slide.objects.push( object );
			}

			var slideDiv = renderSlideThumb( slide );
			var original = node.querySelector( '.slide-body' );
			slideDiv.style.backgroundColor = original.style.backgroundColor;
			slideDiv.style.backgroundImage = original.style.backgroundImage;

			node.replaceChild( slideDiv, original );
		};

		/**
		 * Handle resize events within the slide.
		 *
		 * Encompases responsive text, images, and backstretched-backgrounds.
		 *
		 * @param {HTMLElement} node HTMLElement object to resize
		 */
		SELF.resize = function( node ) {
			$( '.slide-body > div', node ).each( _resize );
			$( '.seoslides_responsive', node ).responsiveText();
		};

		/**
		 * Resize each plugin object.
		 *
		 * @param {Number}      i  Iterator
		 * @param {HTMLElement} el HTML node
		 */
		function _resize( i, el ) {
			var $el = $( el ),
				parent = $( el ).parents( 'section.slide' ),
				slideHeight = parent.height(),
				slideWidth = parent.width();

			el.style.width = Math.floor( window.parseFloat( el.getAttribute( 'data-width' ) ) * slideWidth / 1600 ) + 'px';
			el.style.height = Math.floor( window.parseFloat( el.getAttribute( 'data-height' ) ) * slideHeight / 900 ) + 'px';
			el.style.top = Math.floor( window.parseFloat( el.getAttribute( 'data-top' ) ) * slideHeight / 900 ) + 'px';
			el.style.left = Math.floor( window.parseFloat( el.getAttribute( 'data-left' ) ) * slideHeight / 900 ) + 'px';

			parent.backstretchShort();
		}

		/**
		 * Create a slide from a set of data.
		 *
		 * @param {object} data
		 * @returns {HTMLElement}
		 */
		function renderSlideThumb( data ) {
			var slideDiv = document.createElement( 'div' );
			slideDiv.className = 'slide-body';

			// Add oembed thumbnail and video
			if (  undefined !== data.oembed_thumb && '' !== data.oembed_thumb ) {
				var oembed_img = document.createElement( 'img' );
				oembed_img.className = 'seoslides_iframe_thumb';
				oembed_img.src = data.oembed_thumb;
				slideDiv.appendChild( oembed_img );
			}

			if ( undefined !== data.objects && '' !== data.objects ) {
				var objects = data.objects;

				for ( var i = 0; i < objects.length; i ++ ) {
					var object = objects[ i ];
					if ( object !== Object( object ) ) {
						try {
							object = window.decodeURIComponent( object );
							object = window.JSON.parse( object );
						} catch ( e ) {
							window.console.log( e );
							continue;
						}
					}

					var UUID = object.plugin_id,
						plugin = CORE.Plugins[ UUID ],
						html = '';

					if ( undefined === plugin ) {
						continue;
					}

					var objectEl = document.createElement( 'div' );
					objectEl.setAttribute( 'data-element', object.element_id );
					objectEl.setAttribute( 'data-plugin', object.plugin_id );
					objectEl.setAttribute( 'data-width', object.settings.size.w );
					objectEl.setAttribute( 'data-height', object.settings.size.h );
					objectEl.setAttribute( 'data-top', object.settings.position.top );
					objectEl.setAttribute( 'data-left', object.settings.position.left );

					// Build out CSS text
					var css = 'position:absolute; ';
					css += 'top:' + object.settings.position.top + 'px; ';
					css += 'left:' + object.settings.position.left + 'px; ';
					css += 'width:' + object.settings.size.w + 'px; ';
					css += 'height:' + object.settings.size.h + 'px;';

					objectEl.style.cssText = css;

					slideDiv.appendChild( objectEl );

					// Now convert the plugin to the right object
					html = plugin.renderControlWithData( object );

					objectEl.innerHTML = '<div class="slide-object-content">' + html + '</div>';
				}
			}
			return slideDiv;
		}
	}

	/**
	 * Dynamically add and remove plugins from a slide canvas region.
	 *
	 * @constructor
	 */
	function PluginManager() {
		var SELF = this;

		/**
		 * Remove plugins from the system based on a specified class name.
		 *
		 * Useful for removing all generated plugins from the system.
		 *
		 * @param {string} classSelector
		 */
		SELF.remove = function( classSelector ) {
			$( document.querySelectorAll( '.slide-object.layout-generated' ) ).each( function( i, el ) {
				CORE.Events.doAction( 'plugin.remove.' + el.getAttribute( 'data-uuid' ), el );
			} );
		};

		/**
		 * Load a plugin based on a specified object.
		 *
		 * @param {object} object
		 */
		SELF.load = function( object ) {
			var UUID = object.plugin_id,
				plugin = CORE.Plugins[ UUID ],
				html = plugin.renderControlWithData( object, true );

			if ( false === html ) {
				return;
			}

			// check if this plugin is draggable
			var canDrag = CORE.Events.applyFilter( 'plugin.canDrag.' + UUID );
			var canResize = CORE.Events.applyFilter( 'plugin.canResize.' + UUID );

			var div = document.createElement( 'div' );

			// setup classes correctly
			var className = 'slide-object';
			if( canDrag === true ) {
				className += ' can-drag';
			}
			if( canResize === true ) {
				className += ' can-resize';
			}

			if ( undefined !== object.generated && true === object.generated ) {
				className += ' layout-generated';
				className += ' ' + object.specialClass;
			}

			div.className = className;
			div.setAttribute( 'data-uuid', UUID );

			if( canResize === true ) {
				html += '<div class="resize-control"></div>';
			}
			if( canDrag === true ) {
				html += '<div class="drag-control"></div>';
			}
			html += '<div class="dismiss-control"></div>';

			div.innerHTML = '<div class="slide-object-content">' + html + '</div>';

			// get the current slide element so we can calculate offset
			var slide = CORE.Bucket.getCurrentSlideElement(),
				correctSize = {
					h : Math.floor( slide.height() / 900 * object.settings.size.h ),
					w : Math.floor( slide.width() / 1600 * object.settings.size.w )
				},
				correctPosition = {
					top  : Math.floor( slide.height() / 900 * object.settings.position.top ),
					left : Math.floor( slide.width() / 1600 * object.settings.position.left )
				};

			div.style.cssText = [
				'height: ' + correctSize.h + 'px',
				'width: ' + correctSize.w + 'px',
				'top: ' + correctPosition.top + 'px',
				'left: ' + correctPosition.left + 'px;'
			].join('; ') + ';';
			div.setAttribute( 'data-plugin-uuid', object.element_id );

			CORE.Bucket.addToCurrentSlide( div );

			var $element = $( div );
			plugin.addInstance( object.element_id, { 'element': $element, 'settings': object.settings } );
			plugin.onPluginRendered( $element, object.element_id );
		};
	}

	CORE.slideBuilder = new SlideBuilder();
} )( this, jQuery );

( function( window, $, undefined ) {
	var $window = $( window ),
		document = window.document,
		CORE = window.SEO_Slides,
		I18N = window.seoslides_i18n,
		inputs = {},
		rivers = {},
		timeToTriggerRiver = 150,
		minRiverAJAXDuration = 200,
		riverBottomThreshold = 5,
		keySensitivity = 100,
		River, Query, linker;

	River = function( element, search ) {
		var self = this;
		self.element = element;
		self.ul = element.children( 'ul' );
		self.waiting = element.find( '.river-waiting' );

		self.change( search );
		self.refresh();

		element.scroll( function () {
			self.maybeLoad();
		} );
		element.delegate( 'li', 'click', function ( e ) {
			self.select( $( this ), e );
		} );
	};

	$.extend( River.prototype, {
		refresh: function() {
			this.deselect();
			this.visible = this.element.is( ':visible' );
		},
		show: function() {
			if ( ! this.visible ) {
				this.deselect();
				this.element.show();
				this.visible = true;
			}
		},
		hide: function() {
			this.element.hide();
			this.visible = false;
		},
		// Selects a list item and triggers the river-select event.
		select: function( li, event ) {
			var liHeight, elHeight, liTop, elTop;

			if ( li.hasClass('unselectable') || li === this.selected ) {
				return;
			}

			this.deselect();
			this.selected = li.addClass('selected');
			// Make sure the element is visible
			liHeight = li.outerHeight();
			elHeight = this.element.height();
			liTop = li.position().top;
			elTop = this.element.scrollTop();

			if ( liTop < 0 ) { // Make first visible element
				this.element.scrollTop( elTop + liTop );
			} else if ( liTop + liHeight > elHeight ) { // Make last visible element
				this.element.scrollTop( elTop + liTop - elHeight + liHeight );
			}

			// Trigger the river-select event
			this.element.trigger('river-select', [ li, event, this ]);
		},
		deselect: function() {
			if ( this.selected ) {
				this.selected.removeClass('selected');
			}
			this.selected = false;
		},
		prev: function() {
			if ( ! this.visible ) {
				return;
			}

			var to;
			if ( this.selected ) {
				to = this.selected.prev('li');
				if ( to.length ) {
					this.select( to );
				}
			}
		},
		next: function() {
			if ( ! this.visible ) {
				return;
			}

			var to = this.selected ? this.selected.next('li') : $('li:not(.unselectable):first', this.element);
			if ( to.length ) {
				this.select( to );
			}
		},
		ajax: function( callback ) {
			var self = this,
				delay = this.query.page === 1 ? 0 : minRiverAJAXDuration,
				response = linker.delayedCallback( function( results, params ) {
					self.process( results, params );
					if ( callback ) {
						callback( results, params );
					}
				}, delay );

			this.query.ajax( response );
		},
		change: function( search ) {
			if ( this.query && this._search === search ) {
				return;
			}

			this._search = search;
			this.query = new Query( search );
			this.element.scrollTop(0);
		},
		process: function( results, params ) {
			var list = '', alt = true, classes = '',
				firstPage = params.page === 1;

			if ( !results ) {
				if ( firstPage ) {
					list += '<li class="unselectable"><span class="item-title"><em>' + window.wpLinkL10n.noMatchesFound + '</em></span></li>';
				}
			} else {
				$.each( results, function() {
					classes = alt ? 'alternate' : '';
					classes += this['title'] ? '' : ' no-title';
					list += classes ? '<li class="' + classes + '">' : '<li>';
					list += '<input type="hidden" class="item-permalink" value="' + this['permalink'] + '" />';
					list += '<span class="item-title">';
					list += this['title'] ? this['title'] : I18N.no_title;
					list += '</span><span class="item-info">' + this['info'] + '</span></li>';
					alt = ! alt;
				});
			}

			this.ul[ firstPage ? 'html' : 'append' ]( list );
		},
		maybeLoad: function() {
			var self = this,
				el = this.element,
				bottom = el.scrollTop() + el.height();

			if ( ! this.query.ready() || bottom < this.ul.height() - riverBottomThreshold ) {
				return;
			}

			window.setTimeout(function() {
				var newTop = el.scrollTop(),
					newBottom = newTop + el.height();

				if ( ! self.query.ready() || newBottom < self.ul.height() - riverBottomThreshold ) {
					return;
				}

				self.waiting.show();
				el.scrollTop( newTop + self.waiting.outerHeight() );

				self.ajax( function() { self.waiting.hide(); });
			}, timeToTriggerRiver );
		}
	} );

	Query = function( search ) {
		this.page = 1;
		this.allLoaded = false;
		this.querying = false;
		this.search = search;
	};

	$.extend( Query.prototype, {
		ready: function () {
			return ! ( this.querying || this.allLoaded );
		},
		ajax: function( callback ) {
			var self = this,
				query = {
					action : 'wp-link-ajax',
					page : this.page,
					'_ajax_linking_nonce' : inputs.nonce.val()
				};

			if ( this.search ) {
				query.search = this.search;
			}

			this.querying = true;

			$.post( window.ajaxurl, query, function(r) {
				self.page++;
				self.querying = false;
				self.allLoaded = !r;
				callback( r, query );
			}, "json" );
		}
	} );

	linker = window.SEO_Slides.Linker = window.SEO_Slides.Linker || {
		lastSearch: '',
		textarea: '',

		init: function () {
			inputs.final = $( document.getElementById( 'seoslides_link' ) );
			inputs.dialog = $( document.getElementById( 'seoslides-linker' ) );
			inputs.nonce = $( document.getElementById( '_ajax_linking_nonce' ) );
			inputs.submit = $( document.getElementById( 'seoslides-link-submit' ) );
			inputs.url = $( document.getElementById( 'seoslides-link-input' ) );
			inputs.search = $( document.getElementById( 'seoslides-link-field' ) );
			$( document.getElementById( 'seoslides-link-cancel' ) ).click( function ( event ) {
				event.preventDefault();
				linker.close();
			} );
			inputs.submit.click( function ( event ) {
				event.preventDefault();
				linker.update();
			} );

			// Build rivers
			rivers.search = new River( $( document.getElementById( 'seoslides-link-results' ) ) );
			rivers.recent = new River( $( document.getElementById( 'seoslides-recent-links' ) ) );
			rivers.elements = $( '.query-results', inputs.dialog );

			// Bind event handlers
			inputs.dialog.on( 'click', '.toggle-arrow', toggle_search );
			inputs.dialog.on( 'wpdialogrefresh', linker.refresh );
			inputs.search.on( 'keyup', linker.searchInternalLinks );
			rivers.elements.on( 'river-select', linker.updateFields );
			$( [] ).add( document.getElementById( 'seoslides_link' ) ).add( document.querySelector( '.seoslides_link' ) ).on( 'click', linker.open );

			rivers.elements.on( 'river-select', linker.updateFields );

			inputs.search.keyup( linker.searchInternalLinks );

			inputs.dialog.bind( 'wpdialogrefresh', linker.refresh );
			inputs.dialog.bind( 'wpdialogbeforeopen', linker.beforeOpen );
			inputs.dialog.bind( 'wpdialogclose', linker.onClose );

			$( document.getElementById( 'seoslides_link_clear' ) ).on( 'click', function ( e ) {
				e.preventDefault();

				linker.clear();
			} );
		},

		open : function() {
			var _tinyMCEPopup = window.tinyMCEPopup;
			window.tinyMCEPopup = false;

			// Initialize the dialog if necessary (html mode).
			if ( ! inputs.dialog.data( 'wpdialog' ) ) {
				inputs.dialog.wpdialog( {
					title:       I18N.link_title,
					width:       480,
					height:      'auto',
					modal:       true,
					dialogClass: 'wp-dialog',
					zIndex:      300000
				} );
			}

			inputs.dialog.wpdialog( 'open' );
			window.tinyMCEPopup = _tinyMCEPopup;
		},

		refresh : function() {
			// Refresh rivers (clear links, check visibility)
			rivers.search.refresh();
			rivers.recent.refresh();

			linker.setDefaultValues();

			// Focus the URL field and highlight its contents.
			//     If this is moved above the selection changes,
			//     IE will show a flashing cursor over the dialog.
			inputs.url.focus()[0].select();
			// Load the most recent results if this is the first time opening the panel.
			if ( ! rivers.recent.ul.children().length ) {
				rivers.recent.ajax();
			}
		},

		clear : function() {
			inputs.final.val( '' );
		},

		close : function() {
			inputs.dialog.wpdialog('close');
		},

		onClose: function() {
			if ( '' !== linker.textarea ) {
				linker.textarea.focus();
			}

			if ( linker.range ) {
				linker.range.moveToBookmark( linker.range.getBookmark() );
				linker.range.select();
			}
		},

		getAttrs : function() {
			return {
				href : inputs.url.val(),
				title : inputs.title.val(),
				target : inputs.openInNewTab.prop('checked') ? '_blank' : ''
			};
		},

		update : function() {
			inputs.final.val( inputs.url.val().trim() );
			linker.close();
		},

		updateFields : function( e, li, originalEvent ) {
			inputs.url.val( li.children('.item-permalink').val() );
			if ( originalEvent && originalEvent.type === "click" ) {
				inputs.url.focus();
			}
		},

		setDefaultValues : function() {
			// Set URL and description to defaults.
			// Leave the new tab setting as-is.
			var default_val = 'http://',
				final = inputs.final.val();

			if ( '' !== final.trim() ) {
				default_val = final.trim();
			}

			inputs.url.val( default_val );

			// Update save prompt.
			inputs.submit.val( I18N.insert_link );
		},

		searchInternalLinks : function() {
			var t = $(this), waiting,
				search = t.val();

			if ( search.length > 2 ) {
				rivers.recent.hide();
				rivers.search.show();

				// Don't search if the keypress didn't change the title.
				if ( linker.lastSearch === search ) {
					return;
				}

				linker.lastSearch = search;
				waiting = t.parent().find('.spinner').show();

				rivers.search.change( search );
				rivers.search.ajax( function(){ waiting.hide(); });
			} else {
				rivers.search.hide();
				rivers.recent.show();
			}
		},

		next : function() {
			rivers.search.next();
			rivers.recent.next();
		},

		prev : function() {
			rivers.search.prev();
			rivers.recent.prev();
		},

		keydown : function( event ) {
			var fn, key = $.ui.keyCode;

			switch( event.which ) {
				case key.UP:
					fn = 'prev';
					window.clearInterval( linker.keyInterval );
					linker[ fn ]();
					linker.keyInterval = window.setInterval( linker[ fn ], linker.keySensitivity );
					break;
				case key.DOWN:
					fn = fn || 'next';
					window.clearInterval( linker.keyInterval );
					linker[ fn ]();
					linker.keyInterval = window.setInterval( linker[ fn ], linker.keySensitivity );
					break;
				default:
					return;
			}
			event.preventDefault();
		},

		keyup: function( event ) {
			var key = $.ui.keyCode;

			switch( event.which ) {
				case key.ESCAPE:
					event.stopImmediatePropagation();
					if ( ! $(document).triggerHandler( 'wp_CloseOnEscape', [{ event: event, what: 'linker', cb: linker.close }] ) ) {
						linker.close();
					}

					return false;
				case key.UP:
				case key.DOWN:
					window.clearInterval( linker.keyInterval );
					break;
				default:
					return;
			}
			event.preventDefault();
		},

		delayedCallback : function( func, delay ) {
			var timeoutTriggered, funcTriggered, funcArgs, funcContext;

			if ( ! delay ) {
				return func;
			}

			window.setTimeout( function() {
				if ( funcTriggered ) {
					return func.apply( funcContext, funcArgs );
				}
				// Otherwise, wait.
				timeoutTriggered = true;
			}, delay);

			return function() {
				if ( timeoutTriggered ) {
					return func.apply( this, arguments );
				}
				// Otherwise, wait.
				funcArgs = arguments;
				funcContext = this;
				funcTriggered = true;
			};
		}
	};

	linker.init();

	/**
	 * Display the form for listing existing presentations.
	 *
	 * @param {Event} e
	 */
	function toggle_search( e ) {
		var $this = $( this ),
			panel = $( document.getElementById( 'seoslides-link-panel' ) ),
			widget = inputs.dialog.wpdialog('widget');

		$this.toggleClass( 'toggle-arrow-active' );

		panel.slideToggle( 300, function() {
			// Scrolling code taken directly from wplink.js in WordPress core.
			var scroll = $window.scrollTop(),
				top = widget.offset().top,
				bottom = top + widget.outerHeight(),
				diff = bottom - $window.height();

			if ( diff > scroll ) {
				widget.animate( {
					'top': diff < top ? top = diff : scroll
				}, 200 );
			}
		} );

		e.preventDefault();
	}
} )( this, jQuery );

(function ( window, $, undefined ) {
	var document = window.document,
		CORE = window.SEO_Slides,
		INTERNALS = window.seoslides,
		I18N = window.seoslides_i18n;

	var table = $( '.slide-table' ),
		rowTemplate = document.getElementById( 'slide-row' ),
		slideEditor = $( document.getElementById( 'seoslides-slide' ) ).find( '.editor' );

	rowTemplate = $( rowTemplate.innerHTML );

	/**
	 * Queue up sortables
	 */
	function Sortables() {
		var container = false;
		var helper = function( e, ui ) {
			ui.children().each( function() {
				$( this ).width( $( this ).width() );
			} );

			return ui;
		};

		var queue = function() {
			container = $( '.slide-container tbody' );

			return container.sortable( {
				items: "tr:not('.slide-master')",
				helper: "clone",
				containment: "parent",
				cursor: "move",
				update: function ( evt, ui ) {
					// User has stopped sorting, so let's save the new positions
					var positions = {};

					$( 'tr', container ).each( function( index ) {
						var classes = this.className.split( ' ' );

						classes = $.grep( classes, function( el, i ) {
							return 'publish' !== el && 'trash' !== el;
						} );

						if ( classes.length >= 1 ) {
							var slide_id = classes[0].substr( 6 );

							positions[ slide_id ] = index;
						}
					} );

					var options = {
						'data':   {
							'action':    'update-positions',
							'positions': positions,
							'_nonce':    INTERNALS.update_nonce,
							'slideset':  INTERNALS.slideset
						}
					};

					CORE.ajax( options );
				},
				start: function( evt, ui ){
					ui.placeholder.height( ui.helper.outerHeight() );
				}
			} ).disableSelection();
		};

		var destroy = function() {
			if ( false !== container ) {
				return container.sortable( 'destroy' );
			}
			return undefined;
		};

		return {
			queue: queue,
			destroy: destroy
		};
	}
	var sortables = new Sortables();

	/**
	 * Create the table body (and replace any tbody that currently exists).
	 *
	 * @param {array} slides
	 */
	function createListTable( slides ) {
		var tbody = $( document.createElement( 'tbody' ) ).addClass( 'list' );

		var master = CORE.slideBuilder.createSlide( INTERNALS.slide_default, rowTemplate );
		master.find( '.editslide' ).attr( 'title', I18N.label_master );

		var title = '<div class="title"><strong>' + I18N.label_master + '</strong></div>';
		title += '<div class="row-actions">';
		title += '<span class="edit"><a data-id="master" class="editslide" href="javascript:void;" title="' + I18N.label_master + '">' + I18N.label_edit + '</a></span>';
		title += '</div>';
		master.find( '.slide-title' ).html( title );
		master.find( '.slide-description' ).html( INTERNALS.slideset_data.seo_description );
		master.find( '.slide-notes' ).html( INTERNALS.slideset_data.short_notes );
		tbody.append( '<tr class="slide-master">' + master.html() + '</tr>' );

		for ( var i = 0; i < slides.length; i++ ) {
			var slide = slides[i],
				rendered = CORE.slideBuilder.createSlide( slide, rowTemplate );

			tbody.append( '<tr class="slide-' + slide.id + ' ' + slide.status + '">' + rendered.html() + '</tr>' );
		}

		table.append( tbody );
		sortables.queue();

		CORE.Events.doAction( 'slideList.resize', table );
	}

	/**
	 * Populate a specific slide given a return from the server.
	 *
	 * @param {Object} slide
	 */
	function populateSlide( slide ) {
		slide.id = slide.ID;

		var tbody = table.find( 'tbody' ),
			rendered = CORE.slideBuilder.createSlide( slide, rowTemplate, true );

		var newRow = '<tr class="slide-' + slide.id + '">' + rendered.html() + '</tr>';

		tbody.find( 'tr.slide-' + slide.id ).replaceWith( newRow );

		CORE.Events.doAction( 'slideList.resize', table );
	}

	/**
	 * Specifically populate the master slide given a return from the server.
	 *
	 * @param {Object} master
	 */
	function populateMaster( master ) {
		var tbody = table.find( 'tbody' ),
			rendered = CORE.slideBuilder.createSlide( master, rowTemplate );

		rendered.find( '.editslide' ).attr( 'title', I18N.label_master );

		var title = '<div class="title"><strong>' + I18N.label_master + '</strong></div>';
		title += '<div class="row-actions">';
		title += '<span class="edit"><a data-id="master" class="editslide" href="javascript:void;" title="' + I18N.label_master + '">' + I18N.label_edit + '</a></span>';
		title += '</div>';

		rendered.find( '.slide-title' ).html( title );
		rendered.find( '.slide-description' ).html( master.seo_description );
		rendered.find( '.slide-notes' ).html( master.short_notes );

		var newRow = '<tr class="slide-master">' + rendered.html() + '</tr>';

		tbody.find( 'tr.slide-master' ).replaceWith( newRow );

		CORE.Events.doAction( 'slideList.resize', table );
	}

	/**
	 * Refresh a specific row in the slide table based on the slide ID being updated.
	 *
	 * @param {Number} slide_id
	 */
	function refreshSlideRow( slide_id ) {
		var options = {
			'data': {
				'action': 'get-slide',
				'slide': slide_id
			}
			},
			request;

		if ( 'master' === slide_id ) {
			options.data.slideset = INTERNALS.slideset;
			options.data.slide = 'slide-default';
			request = CORE.ajax( options );
			request.done( populateMaster );
		} else {
			request = CORE.ajax( options );
			request.done( populateSlide );
		}

		return request.promise();
	}
	CORE.Events.addAction( 'updated.slide', refreshSlideRow );

	/**
	 * Resize slide thumbnails.
	 * 
	 * @param context
	 */
	function resizeSlides( context ) {
		$( context ).find( '.slide-body' ).each( function( i, el ) {
			var $el = $( el ),
				parent = $el.parents( 'section.slide' ),
				slideHeight = parent.height(),
				slideWidth = parent.width();

			$el.find( '> div' ).each( function( i, div ) {
				div.style.width = Math.floor( window.parseFloat( div.getAttribute( 'data-width' ) ) * slideWidth / 1600 ) + 'px';
				div.style.height = Math.floor( window.parseFloat( div.getAttribute( 'data-height' ) ) * slideHeight / 900 ) + 'px';
				div.style.top = Math.floor( window.parseFloat( div.getAttribute( 'data-top' ) ) * slideHeight / 900 ) + 'px';
				div.style.left = Math.floor( window.parseFloat( div.getAttribute( 'data-left' ) ) * slideHeight / 900 ) + 'px';

				$( div ).find( '.seoslides_responsive' ).responsiveText();
			} );

			parent.backstretchShort();
		} );
	}
	CORE.Events.addAction( 'slideList.resize', resizeSlides );

	// Wire up list table events
	table.on( 'click', 'a.submitdelete', function (e) {
		e.preventDefault();

		var slide_id = this.getAttribute( 'data-id' );

		var options = {
			'data':   {
				'action':   'delete-slide',
				'id':       slide_id,
				'_nonce':   INTERNALS.delete_nonce,
				'slideset': INTERNALS.slideset
			}
		};

		CORE.ajax( options ).done( function() {
			table.find( '.slide-' + slide_id ).remove();
		} );
	} );
	table.on( 'click', 'a.submittrash', function (e) {
		e.preventDefault();

		var slide_id = this.getAttribute( 'data-id' );

		var options = {
			'data': {
				'action':   'trash-slide',
				'id':       slide_id,
				'_nonce':   INTERNALS.trash_nonce,
				'slideset': INTERNALS.slideset
			}
		};

		CORE.ajax( options ).done( function() {
			table.find( '.slide-' + slide_id ).addClass( 'trash' );
		} );
	} );
	table.on( 'click', 'a.restoreslide', function (e) {
		e.preventDefault();

		var slide_id = this.getAttribute( 'data-id' );

		var options = {
			'data': {
				'action':   'restore-slide',
				'id':       slide_id,
				'_nonce':   INTERNALS.restore_nonce,
				'slideset': INTERNALS.slideset
			}
		};

		CORE.ajax( options ).done( function() {
			table.find( '.slide-' + slide_id ).removeClass( 'trash' );
		} );
	} );

	function toggle_trash( e ) {
		e.preventDefault();

		var $this = $( this ),
			markup = $this.html();

		$this.toggleClass( 'active' );
		table.toggleClass( 'show-trash' );
	}
	$( document.getElementById( 'toggle-trash' ) ).on( 'click', toggle_trash );

	function Layout_Swapper() {
		var SELF = this;

		// Internal containers for plugin data when swapping
		var image_container = I18N.layout_image,
			text_container = I18N.layout_text;

		/**
		 * Swaps generated layout elements for new ones (with preset positions and sizes).
		 *
		 * @param {string} layout
		 */
		SELF.swapLayout = function( layout ) {
			var bucket = document.querySelector( '.bucket-slide' ),
				font = bucket.getAttribute( 'data-default_font' ),
				size = bucket.getAttribute( 'data-default_size' ),
				color = bucket.getAttribute( 'data-default_font_color' ),
				h1_font = bucket.getAttribute( 'data-default_h1_font' ),
				h1_size = bucket.getAttribute( 'data-default_h1_size' ),
				h1_color = bucket.getAttribute( 'data-default_h1_font_color' );

			var text_default_style = '';
			var h_style = '', sub_style = '', txt_style = '';

			if ( undefined !== h1_font ) {
				h_style += 'font-family:' + h1_font + ';';
				sub_style += 'font-family:' + h1_font + ';';
			}
			if ( '#000000' !== h1_color ) {
				h_style += 'color:' + h1_color + ';';
				sub_style += 'font-family:' + h1_font + ';';
			}
			h_style += 'font-size:' + h1_size + ';';

			if ( undefined !== font ) {
				txt_style += 'font-family:' + font + ';';
			}
			if ( '#000000' !== color ) {
				txt_style += 'color:' + color + ';';
			}
			txt_style += 'font-size:' + size + ';';
			sub_style += 'font-size:' + size + ';';

			// Add plugin content to containers
			$( document.querySelectorAll( '.slide-object.layout-generated' ) ).each( function( i, el ) {
				switch( el.getAttribute( 'data-uuid' ) ) {
					case '1798dfc0-8695-11e2-9e96-0800200c9a66': // WYSIWYG
						if ( CORE.hasClass( el, 'text' ) ) {
							text_container = $( '.seoslides_wysiwyg', el ).html();
						}
						break;
					case '09038190-8695-11e2-9e96-0800200c9a66': // Image
						var img_obj = $( '.plugin-image', el ),
							has_image = img_obj.length > 0;

						if ( has_image ) {
							image_container = img_obj.attr( 'src' );
						} else {
							image_container = I18N.layout_image;
						}
						break;
				}
			} );

			// Remove existing generated-plugins
			CORE.slideBuilder.pluginManager.remove( 'layout-generated' );

			// Add new plugins
			var plugins = [];
			var headline = {
				'element_id': _createUUID(),
				'plugin_id':  '1798dfc0-8695-11e2-9e96-0800200c9a66',
				'generated':  true,
				'specialClass': 'headline',
				'settings':   {
					'content':  '<h1 style="text-align:center;"><span style="' + h_style + '">' + I18N.layout_headline + '</span></h1>',
					'position': {
						'top':  0,
						'left': 50
					},
					'size':     {
						'h': 150,
						'w': 1500
					}
				}
			};
			var text = {
				'element_id': _createUUID(),
				'plugin_id':  '1798dfc0-8695-11e2-9e96-0800200c9a66',
				'generated':  true,
				'specialClass': 'text',
				'settings':   {
					'content':  '<span style="' + txt_style + '">' + text_container + '</span>',
					'position': {
						'top':  50,
						'left': 50
					},
					'size':     {
						'h': 800,
						'w': 1500
					}
				}
			};
			var subheading = {
				'element_id': _createUUID(),
				'plugin_id':  '1798dfc0-8695-11e2-9e96-0800200c9a66',
				'generated':  true,
				'specialClass': 'subheading',
				'settings':   {
					'content':  '<h2 style="text-align:center;"><span style="' + sub_style + '">' + I18N.layout_subheading + '</style></h2>',
					'position': {
						'top':  455,
						'left': 50
					},
					'size':     {
						'h': 150,
						'w': 1500
					}
				}
			};
			var image = {
				'element_id': _createUUID(),
				'plugin_id':  '09038190-8695-11e2-9e96-0800200c9a66',
				'generated':  true,
				'specialClass': 'image',
				'settings':   {
					'content':  image_container,
					'position': {
						'top':  50,
						'left': 50
					},
					'size':     {
						'h': 800,
						'w': 1500
					}
				}
			};
			switch ( layout ) {
				case 'title':
				{
					headline.settings.position.top = 295;
					plugins.push( headline );

					plugins.push( subheading );
				}
					break;
				case 'standard':
				{
					plugins.push( headline );

					text.settings.position.top = 150;
					text.settings.size.h = 700;
					plugins.push( text );
				}
					break;
				case 'textonly':
				{
					plugins.push( text );
				}
					break;
				case 'imageonly':
				{
					plugins.push( image );
				}
					break;
				case 'rightimage':
				{
					text.settings.size.w = 700;
					plugins.push( text );

					image.settings.position.left = 850;
					image.settings.size.w = 700;
					plugins.push( image );
				}
					break;
				case 'leftimage':
				{
					text.settings.position.left = 850;
					text.settings.size.w = 700;
					plugins.push( text );

					image.settings.size.w = 700;
					plugins.push( image );
				}
					break;
			}
			plugins = CORE.Events.applyFilter( 'layout.' + layout + '.plugins', plugins );

			for( var i = 0; i < plugins.length; i++ ) {
				CORE.slideBuilder.pluginManager.load( plugins[i] );
			}
		};

		/**
		 * Creates a randomized string from a base 16 number
		 *
		 * @return {String}
		 * @private
		 */
		var _createUUIDPiece = function() {
			return Math.floor( ( 1 + Math.random() ) * 0x10000 ).toString( 16 ).substring( 1 );
		};

		/**
		 * Creates a UUID string for use. This UUID actually links this plugin to all of its events and data so it can
		 * be safely interacted with
		 *
		 * @return {String}
		 * @private
		 */
		var _createUUID = function() {
			var uuid = _createUUIDPiece() + _createUUIDPiece() + '-' + _createUUIDPiece() + '-' + _createUUIDPiece() + '-';
			uuid = uuid + _createUUIDPiece() + '-' + _createUUIDPiece() + _createUUIDPiece() + _createUUIDPiece();
			return uuid;
		};
	}

	// Build slide modal editor
	function editSlide( slide_id ) {
		var modal,
			swapper = new Layout_Swapper();

		// Fist, clear any loaded plugins
		CORE.Pluggables.resetPluginObjects();

		function saveData() {
			var saver = $.Deferred(),
				editor = document.getElementById( 'slide-editor' );

			var pluggable_data = CORE.Pluggables.getSavedData();

			// Get data from CKEditor.
			var notes = window.CKEDITOR.instances['seoslides_slide_notes'].getData(),
				slide_id = editor.getAttribute( 'data-slide_id' );

			var options = {
				data: {
					'action':          'save-slide',
					'_nonce':          INTERNALS.update_nonce,
					'slide_id':        slide_id,
					'title':           document.getElementById( 'seoslides_slide_title' ).value,
					'seo_description': document.getElementById( 'seoslides_slide_description' ).value,
					'seo_keywords':    document.getElementById( 'seoslides_slide_keywords' ).value,
					'presenter_notes': notes,
					'fill_color':      $( "#modal_color_picker_hex" ).wpColorPicker( 'color' ),
					'bg_image':        document.getElementById( 'modal_seoslides_image_src' ).value,
					'objects':         pluggable_data,
					'oembed':          document.getElementById( 'seoslides_video_oembed' ).value
				}
			};

			CORE.ajax( options ).done( function( data ) {
				CORE.Events.doAction( 'slide.savedData', data );
				$.when( refreshSlideRow( slide_id ) ).done( function() {
					saver.resolve();
				} );
			} );

			return saver.promise();
		}

		function createContent() {
			var content = CORE.createElement( 'div', {
				'class':    'seoslides-modal-content'
			} );

			var tabs = CORE.createElement( 'div', {
				'class':    'seoslides-modal-tabs',
				'appendTo': content
			} );

			var editor_tab = CORE.createElement( 'a', {
				'class':    'seoslides-tab-item active',
				'attr':     [
					['href', '#'],
					['title', 'Edit Slide']
				],
				'appendTo': tabs
			} );
			editor_tab.innerHTML = I18N.edit_slide;

			var notes_tab = CORE.createElement( 'a', {
				'class':    'seoslides-tab-item',
				'attr':     [
					['href', '#'],
					['title', I18N.slide_notes]
				],
				'appendTo': tabs
			} );
			notes_tab.innerHTML = I18N.slide_notes;

			var layouts = CORE.createElement( 'div', {
				'class':    'seoslides-modal-presets',
				'appendTo': content
			} );
			var layout_wrapper = CORE.createElement( 'div', {
				'class': 'preset-wrapper',
				appendTo: layouts
			} );
			{
				var title_slide = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-title',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'title'],
						['title', I18N.layout_title]
					]
				} );

				var standard = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-standard',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'standard'],
						['title', I18N.layout_standard]
					]
				} );

				var text_only = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-textonly',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'textonly'],
						['title', I18N.layout_textonly]
					]
				} );

				var image_only = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-imageonly',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'imageonly'],
						['title', I18N.layout_imageonly]
					]
				} );

				var right_image = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-rightimage',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'rightimage'],
						['title', I18N.layout_rightimage]
					]
				} );

				var left_image = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-leftimage',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'leftimage'],
						['title', I18N.layout_leftimage]
					]
				} );

				$( [] ).add( title_slide ).add( standard ).add( text_only ).add( image_only ).add( right_image ).add( left_image ).on( 'click', function( e ) {
					e.preventDefault();

					var layout = this.getAttribute( 'data-layout' );

					swapper.swapLayout( layout );
				} );
			}

			var content_frame = CORE.createElement( 'div', {
				'class':    'seoslides-modal-frame-content',
				'appendTo': content
			} );

			var slide_editor = CORE.createElement( 'div', {
				'class': 'seoslides',
				'attr': [
					['id', 'slide-editor'],
					['data-slide_id', slide_id]
				],
				'appendTo': content_frame
			} );

			var content_description = CORE.createElement( 'p', {
				'class':    'description',
				'appendTo': content_frame
			} );
			content_description.innerHTML = I18N.right_click;

			var note_frame = CORE.createElement( 'div', {
				'class':    'seoslides-modal-frame-notes hidden',
				'appendTo': content
			} );
			note_frame.innerHTML = '<textarea cols="30" rows="20" id="seoslides_slide_notes" name="seoslides_slide_notes"></textarea>';

			var $tabs = $( [] ).add( editor_tab ).add( notes_tab ),
				$frames = $( [] ).add( content_frame ).add( note_frame ).add( layouts );

			$tabs.on( 'click', function( e ) {
				e.preventDefault();

				CORE.Events.doAction( 'slide.tabsToggled' );
				$tabs.toggleClass( 'active' );
				$frames.toggleClass( 'hidden' );
			} );

			/* Toolbar element for containing Save buttons */
			{
				var toolbar = CORE.createElement( 'div', {
					'class': 'seoslides-modal-toolbar',
					'appendTo': content
				} );

				var toolbar_content = CORE.createElement( 'div', {
					'class': 'seoslides-toolbar-content',
					'appendTo': toolbar
				} );

				var saveButton = CORE.createElement( 'a', {
					'class':    'button button-primary button-large',
					'attr':     [
						['href', '#']
					],
					'appendTo': toolbar_content
				} );
				saveButton.innerHTML = I18N.save_slide;

				//<span style="float: right;margin-top: 1.3em;" class="spinner"></span>
				var spinner = CORE.createElement( 'span', {
					'class':    'spinner',
					'attr':     [
						['style', 'float: right;margin-top: 20px;']
					],
					'appendTo': toolbar_content
				} );

				$( saveButton ).on( 'click', function ( e ) {
					e.preventDefault();

					var $spinner = $( spinner );
					$spinner.show();

					$.each( window.CKEDITOR.instances, function( i, el ) {
						if ( undefined !== el.fire ) {
							el.fire( 'blur' );
						}
					} );

					if ( undefined !== CORE.inline_editors ) {
						$.each( CORE.inline_editors, function( i, el ) {
							if ( undefined !== el.fire ) {
								el.fire( 'blur' );
							}
						} );
					}

					var saver = saveData();

					saver.done( function() {
						CORE.Events.doAction( 'modal.saved' );

						$spinner.hide();
						modal.close();
					} );
				} );
			}

			return content;
		}

		var args = {
			callback:          function ( modal ) {
				CORE.Bucket.initialize( document.getElementById( 'slide-editor' ) );
				CORE.Bucket.loadSlide( slide_id, INTERNALS.slideset );

				if ( null !== document.getElementById( 'seoslides_slide_notes' ) ) {
					var editor = window.CKEDITOR.replace( 'seoslides_slide_notes', {
						'autoGrow':        true,
						'extraPlugins':    'wordcount',
						'baseFloatZIndex': 170000,
						'wordcount':       {
							'showCharCount': false,
							'showWordCount': true
						}
					} );

					editor.on( 'instanceReady', function ( e ) {
						document.querySelector( '.cke_contents' ).style.height = $( '.seoslides-modal-frame-notes' ).height() - 75 + 'px';
					} );
				}
			},
			speed:             500,
			backgroundOpacity: 0.7,
			modalClass:        'seoslides-modal',
			overlayClass:      'seoslides-overlay',
			content:           createContent()
		};

		modal = new CORE.Modal( args );
		modal.show();
	}

	// Remove any extra CKEditor instances
	function cleanCKE() {
		if ( undefined !== CORE.inline_editors ) {
			for ( var i = 0; i < CORE.inline_editors.length; i++ ) {
				CORE.inline_editors[i].destroy();
			}

			CORE.inline_editors = [];
		}

		if ( undefined !== window.CKEDITOR && undefined !== window.CKEDITOR.instances ) {
			for ( var instance in window.CKEDITOR.instances ) {
				if( ! window.CKEDITOR.instances.hasOwnProperty( instance ) ) {
					continue;
				}

				delete window.CKEDITOR.instances[ instance ];
			}

			window.CKEDITOR.instances = [];
		}
	}
	CORE.Events.addAction( 'modal.close', cleanCKE );

	// Build modal overview editor
	function editOverview() {
		var modal,
			swapper = new Layout_Swapper(),
			populated = false;

		// Fist, clear any loaded plugins
		CORE.Pluggables.resetPluginObjects();

		function saveData() {
			var pluggable_data = CORE.Pluggables.getSavedData(),
				saver = $.Deferred(),
				color = $( document.getElementById( 'modal_color_picker_hex' ) ).wpColorPicker( 'color' ),
				font_color = $( document.getElementById( 'default_font_color' ) ).wpColorPicker( 'color' ),
				h1_font_color = $( document.getElementById( 'default_h1_font_color' ) ).wpColorPicker( 'color' );

			var default_slide_opts = {
				data: {
					'action':          'save-slide',
					'_nonce':          INTERNALS.update_nonce,
					'slide_id':        'slide-default',
					'slideset':        INTERNALS.slideset,
					'title':           document.getElementById( 'seoslides_slide_title' ).value,
					'seo_description': document.getElementById( 'seoslides_slide_description' ).value,
					'seo_keywords':    document.getElementById( 'seoslides_slide_keywords' ).value,
					'fill_color':      color,
					'bg_image':        document.getElementById( 'modal_seoslides_image_src' ).value,
					'objects':         pluggable_data,
					'oembed':          document.getElementById( 'seoslides_video_oembed' ).value
				}
			};

			CORE.ajax( default_slide_opts );

			var options = {
				data: {
					action:            'update-presentation-meta',
					'_nonce':          INTERNALS.update_nonce,
					'slideset':        INTERNALS.slideset,
					'seo_title':       document.getElementById( 'seoslides_slide_title' ).value,
					'seo_description': document.getElementById( 'seoslides_slide_description' ).value,
					'seo_keywords':    document.getElementById( 'seoslides_slide_keywords' ).value,
					'fill_color':      color,
					'bg_image':        document.getElementById( 'modal_seoslides_image_src' ).value,
					'default_font':    document.getElementById( 'default_font' ).value,
					'default_size':    document.getElementById( 'default_size' ).value,
					'default_color':   font_color,
					'header_font':     document.getElementById( 'default_h1_font' ).value,
					'header_size':     document.getElementById( 'default_h1_size' ).value,
					'header_color':    h1_font_color,
					'seoslides_theme': document.getElementById( 'seoslides_theme' ).value
				}
			};

			CORE.ajax( options ).done( function( data ) {
				INTERNALS.themes = data.themes;
				$.when( refreshSlideRow( 'master' ) ).done( function() {
					saver.resolve();
				} );
			} );

			return saver.promise();
		}

		function createContent() {
			var content = CORE.createElement( 'div', {
				'class':    'seoslides-modal-content'
			} );

			var tabs = CORE.createElement( 'div', {
				'class':    'seoslides-modal-tabs',
				'appendTo': content
			} );

			var preview_tab = CORE.createElement( 'a', {
				'class':    'seoslides-tab-item active',
				'attr':     [
					['title', I18N.label_overview],
					['href', '#']
				],
				'appendTo': tabs
			} );
			preview_tab.innerHTML = I18N.label_overview;

			var defaults_tab = CORE.createElement( 'a', {
				'class':    'seoslides-tab-item',
				'attr':     [
					['title', I18N.label_defaults],
					['href', '#']
				],
				'appendTo': tabs
			} );
			defaults_tab.innerHTML = I18N.label_defaults;

			var layouts = CORE.createElement( 'div', {
				'class':    'seoslides-modal-presets',
				'appendTo': content
			} );
			var layout_wrapper = CORE.createElement( 'div', {
				'class': 'preset-wrapper',
				appendTo: layouts
			} );
			{
				var title_slide = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-title',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'title'],
						['title', I18N.layout_title]
					]
				} );

				var standard = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-standard',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'standard'],
						['title', I18N.layout_standard]
					]
				} );

				var text_only = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-textonly',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'textonly'],
						['title', I18N.layout_textonly]
					]
				} );

				var image_only = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-imageonly',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'imageonly'],
						['title', I18N.layout_imageonly]
					]
				} );

				var right_image = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-rightimage',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'rightimage'],
						['title', I18N.layout_rightimage]
					]
				} );

				var left_image = CORE.createElement( 'div', {
					'class':    'seoslides-modal-preset seoslides-modal-preset-leftimage',
					'appendTo': layout_wrapper,
					'attr':     [
						['data-layout', 'leftimage'],
						['title', I18N.layout_leftimage]
					]
				} );

				$( [] ).add( title_slide ).add( standard ).add( text_only ).add( image_only ).add( right_image ).add( left_image ).on( 'click', function( e ) {
					e.preventDefault();

					var layout = this.getAttribute( 'data-layout' );

					swapper.swapLayout( layout );
				} );
			}

			var preview_frame = CORE.createElement( 'div', {
				'class':    'seoslides-modal-frame-preview',
				'appendTo': content
			} );

			var defaults_frame = CORE.createElement( 'div', {
				'class':    'seoslides-modal-frame-defaults hidden',
				'appendTo': content
			} );
			{
				var fonts = ( function() {
					var fontarr = [ '' ];
					var fonts = window.CKEDITOR.config.font_names.split( ';' );
					for ( var i = 0, l = fonts.length; i < l; i ++ ) {
						var font = fonts[ i ];

						fontarr.push( font.split( '/' )[0] );
					}

					return fontarr;
				} )();
				var sizes = [
					['14', '1.077em'],
					['16', '1.231em'],
					['18', '1.385em'],
					['20', '1.538em'],
					['22', '1.692em'],
					['24', '1.846em'],
					['26', '2em'],
					['28', '2.154em'],
					['36', '2.769em'],
					['48', '3.692em'],
					['72', '5.538em']
				];

				var defaults_table = CORE.createElement( 'table', { 'appendTo': defaults_frame } );
				var defaults_body = CORE.createElement( 'tbody', { 'appendTo': defaults_table } );

				// Body Defaults
				var font_row = CORE.createElement( 'tr', { 'appendTo': defaults_body } );
				var size_row = CORE.createElement( 'tr', { 'appendTo': defaults_body } );
				var color_row = CORE.createElement( 'tr', { 'appendTo': defaults_body } );
				var td_1 = CORE.createElement( 'td', { 'appendTo': font_row } );
				var td_2 = CORE.createElement( 'td', { 'appendTo': font_row } );
				var td_3 = CORE.createElement( 'td', { 'appendTo': color_row } );
				var td_4 = CORE.createElement( 'td', { 'appendTo': color_row } );
				var td_5 = CORE.createElement( 'td', { 'appendTo': size_row } );
				var td_6 = CORE.createElement( 'td', { 'appendTo': size_row } );
				var font_label = CORE.createElement( 'label', {
					'attr': [
						['for', 'default_font']
					],
					'appendTo': td_1
				} );
				font_label.innerHTML = I18N.label_font;
				var font_input = CORE.createElement( 'select', {
					'attr': [
						['id', 'default_font'],
						['name', 'default_font']
					],
					'appendTo': td_2
				} );
				for ( var i = 0, l = fonts.length; i < l; i ++ ) {
					var opt = CORE.createElement( 'option', {
						'attr': [
							['value', fonts[ i ] ]
						],
						'appendTo' : font_input
					} );
					opt.innerHTML = fonts[ i ];
				}

				var size_label = CORE.createElement( 'label', {
					'attr': [
						['for', 'default_size']
					],
					'appendTo': td_5
				} );
				size_label.innerHTML = I18N.label_font_size;
				var size_input = CORE.createElement( 'select', {
					'attr': [
						['id', 'default_size'],
						['name', 'default_size']
					],
					'appendTo': td_6
				} );
				for( i = 0, l = sizes.length; i < l; i++ ) {
					var attr = [
						[ 'value', sizes[ i ][1] ]
					];
					if ( 0 === i ) {
						attr.push( ['selected', 'selected'] );
					}
					var option = CORE.createElement( 'option', {
						'attr': attr,
						'appendTo': size_input
					} );
					option.innerHTML = sizes[ i ][0];
				}

				var color_label = CORE.createElement( 'label', {
					'attr': [
						['for', 'default_font_color']
					],
					'appendTo': td_3
				} );
				color_label.innerHTML = I18N.label_font_color;
				CORE.createElement( 'input', {
					'attr': [
						['id', 'default_font_color'],
						['name', 'default_font_color'],
						['type', 'text'],
						['maxlength', 7],
						['placeholder', I18N.hex_value],
						['data-default-color', '#000000'],
						['value', '#000000']
					],
					'appendTo': td_4
				} );

				CORE.createElement( 'div', {
					'attr':  [
						['id', 'default_fallback-color-picker']
					],
					'appendTo': td_4
				} );

				// Heading Defaults
				var h1_font_row = CORE.createElement( 'tr', { 'appendTo': defaults_body } );
				var h1_size_row = CORE.createElement( 'tr', { 'appendTo': defaults_body } );
				var h1_color_row = CORE.createElement( 'tr', { 'appendTo': defaults_body } );
				var h1_td_1 = CORE.createElement( 'td', { 'appendTo': h1_font_row } );
				var h1_td_2 = CORE.createElement( 'td', { 'appendTo': h1_font_row } );
				var h1_td_3 = CORE.createElement( 'td', { 'appendTo': h1_color_row } );
				var h1_td_4 = CORE.createElement( 'td', { 'appendTo': h1_color_row } );
				var h1_td_5 = CORE.createElement( 'td', { 'appendTo': h1_size_row } );
				var h1_td_6 = CORE.createElement( 'td', { 'appendTo': h1_size_row } );
				var h1_font_label = CORE.createElement( 'label', {
					'attr': [
						['for', 'default_font']
					],
					'appendTo': h1_td_1
				} );
				h1_font_label.innerHTML = I18N.label_h1_font;
				var h1_font_input = CORE.createElement( 'select', {
					'attr': [
						['id', 'default_h1_font'],
						['name', 'default_h1_font']
					],
					'appendTo': h1_td_2
				} );
				for ( var j = 0, k = fonts.length; j < k; j ++ ) {
					var h1_opt = CORE.createElement( 'option', {
						'attr': [
							['value', fonts[ j ] ]
						],
						'appendTo' : h1_font_input
					} );
					h1_opt.innerHTML = fonts[ j ];
				}

				var h1_size_label = CORE.createElement( 'label', {
					'attr': [
						['for', 'default_h1_size']
					],
					'appendTo': h1_td_5
				} );
				h1_size_label.innerHTML = I18N.label_h1_font_size;
				var h1_size_input = CORE.createElement( 'select', {
					'attr': [
						['id', 'default_h1_size'],
						['name', 'default_h1_size']
					],
					'appendTo': h1_td_6
				} );
				for( j = 0, k = sizes.length; j < k; j++ ) {
					var h1_attr = [
						[ 'value', sizes[ j ][1] ]
					];
					if ( 6 === j ) {
						h1_attr.push( ['selected', 'selected'] );
					}
					var h1_option = CORE.createElement( 'option', {
						'attr': h1_attr,
						'appendTo': h1_size_input
					} );
					h1_option.innerHTML = sizes[ j ][0];
				}

				var h1_color_label = CORE.createElement( 'label', {
					'attr': [
						['for', 'default_h1_font_color']
					],
					'appendTo': h1_td_3
				} );
				h1_color_label.innerHTML = I18N.label_h1_font_color;
				CORE.createElement( 'input', {
					'attr': [
						['id', 'default_h1_font_color'],
						['name', 'default_h1_font_color'],
						['type', 'text'],
						['maxlength', 7],
						['placeholder', I18N.hex_value],
						['data-default-color', '#000000'],
						['value', '#000000']
					],
					'appendTo': h1_td_4
				} );

				CORE.createElement( 'div', {
					'attr':  [
						['id', 'default_h1_fallback-color-picker']
					],
					'appendTo': h1_td_4
				} );
			}

			var slide_editor = CORE.createElement( 'div', {
				'class': 'seoslides',
				'attr': [
					['id', 'slide-editor'],
					['data-slide_id', 'slide-default']
				],
				'appendTo': preview_frame
			} );

			var content_description = CORE.createElement( 'p', {
				'class':    'description',
				'appendTo': preview_frame
			} );
			content_description.innerHTML = I18N.right_click;

			var $tabs = $( [] ).add( preview_tab ).add( defaults_tab ),
				$frames = $( [] ).add( preview_frame ).add( defaults_frame ).add( layouts );

			$tabs.on( 'click', function( e ) {
				e.preventDefault();

				$tabs.toggleClass( 'active' );
				$frames.toggleClass( 'hidden' );
			} );

			/* Toolbar element for containing Save buttons */
			{
				var toolbar = CORE.createElement( 'div', {
					'class': 'seoslides-modal-toolbar',
					'appendTo': content
				} );

				var toolbar_content = CORE.createElement( 'div', {
					'class': 'seoslides-toolbar-content',
					'appendTo': toolbar
				} );

				var saveButton = CORE.createElement( 'a', {
					'class':    'button button-primary button-large',
					'attr':     [
						['href', '#']
					],
					'appendTo': toolbar_content
				} );
				saveButton.innerHTML = I18N.save_master;

				//<span style="float: right;margin-top: 1.3em;" class="spinner"></span>
				var spinner = CORE.createElement( 'span', {
					'class':    'spinner',
					'attr':     [
						['style', 'float: right;margin-top: 20px;']
					],
					'appendTo': toolbar_content
				} );

				$( saveButton ).on( 'click', function ( e ) {
					e.preventDefault();

					var $spinner = $( spinner );
					$spinner.show();

					var saver = saveData();

					saver.done( function() {
						CORE.Events.doAction( 'modal.saved' );

						$spinner.hide();
						modal.close();
					} );
				} );
			}

			return content;
		}

		var args = {
			callback:          function ( modal ) {
				CORE.Bucket.initialize( document.getElementById( 'slide-editor' ) );
				CORE.Bucket.loadSlide( 'slide-default', INTERNALS.slideset );
			},
			speed:             500,
			backgroundOpacity: 0.7,
			modalClass:        'seoslides-modal seoslides-overview',
			overlayClass:      'seoslides-overlay',
			content:           createContent()
		};

		modal = new CORE.Modal( args );
		modal.show();
	}

	// When a user clicks on the edit link for a slide, open it in the modal editor.
	// Unless the edit link is wrapping a video. Then don't.
	table.on( 'click', '.editslide', function ( e ) {
		e.preventDefault();
		if ( $( this ).find( '.mejs-container' ).length !== 0 ) {
			return;
		}

		var slide_id = this.getAttribute( 'data-id' );

		if ( 'master' === slide_id || 'slide-default' === slide_id ) {
			editOverview();
		} else {
			editSlide( slide_id );
		}
	} );

	function addNewSlideRow( slide_id ) {
		// Insert the slide at the end of the slide table
		var row = CORE.slideBuilder.createSlide(
			{
				'id':              slide_id,
				'title':           '',
				'seo_description': '',
				'notes':           ''
			},
			rowTemplate
		);

		table.find( 'tbody' ).append( '<tr class="slide-' + slide_id + '">' + row.html() + '</tr>' );
	}
	CORE.Events.addAction( 'seoslides.slideAdded', addNewSlideRow );

	// When user clicks Add New, create a new slide and open it in the modal editor.
	$( '#add-slide' ).on( 'click', function ( e ) {
		e.preventDefault();

		var options = {
			'data':   {
				'action':   'new-slide',
				'_nonce':   INTERNALS.create_nonce,
				'slideset': INTERNALS.slideset
			}
		};

		CORE.ajax( options ).done( function( data ) {
			var slide_id = data.id;

			CORE.Events.doAction( 'seoslides.slideAdded', slide_id );

			editSlide( slide_id );
		} );
	} );

	// Fetch slides from WordPress
	CORE.post( 'get-slides', { slideset: INTERNALS.slideset } ).done( createListTable );

	/**
	 * Queue up the color pickers
	 */
	function modalColorPicker() {
		var modalPicker = $( document.getElementById( 'modal_color_picker_hex' ) ),
			defaultPicker = $( document.getElementById( 'default_font_color' ) ),
			h1_defaultPicker = $( document.getElementById( 'default_h1_font_color' ) );

		function pickerChange( target ) {
			return function( e, ui ) {
				var newColor = ui.color.toCSS();
				target.val( newColor );
			};
		}

		// Start the color pickers
		modalPicker.wpColorPicker({
			change: pickerChange( modalPicker )
		});

		if ( defaultPicker.length > 0 ) {
			defaultPicker.wpColorPicker({
				change: pickerChange( defaultPicker )
			});
		}

		if ( h1_defaultPicker.length > 0 ) {
			h1_defaultPicker.wpColorPicker({
				change: pickerChange( h1_defaultPicker )
			});
		}
	}
	CORE.Events.addAction( 'modal.open', modalColorPicker );

	// Populate the editable fields of the slide modal when we have data
	function populateFields( data ) {
		if ( 'object' !== typeof data ) {
			return;
		}

		var bucket = document.querySelector( '.bucket-slide' );

		document.getElementById( 'seoslides_slide_title' ).value = data.title;
		document.getElementById( 'seoslides_slide_description' ).value = data.seo_description;
		document.getElementById( 'seoslides_slide_keywords' ).value = data.seo_keywords;
		document.getElementById( 'seoslides_video_oembed' ).value = data.oembed;
		var notes_editor = window.CKEDITOR.instances[ 'seoslides_slide_notes' ];

		if ( undefined !== notes_editor && null !== notes_editor ) {
			notes_editor.setData( data.presenter_notes );
		}

		var color_picker = $( document.getElementById( 'modal_color_picker_hex' ) );
		color_picker.wpColorPicker( 'color', data.fill_color );
		color_picker.wpColorPicker( 'defaultColor', data.fill_color );
		color_picker.on( 'irischange', function( e, d ) {
				bucket.style.backgroundColor = d.color.toCSS();
			} );

		bucket.style.backgroundColor = data.fill_color;

		if ( undefined !== data.bg_image && null !== data.bg_image && '' !== data.bg_image.trim() ) {
			document.getElementById( 'modal_seoslides_image_src' ).value = data.bg_image;
			var picker = document.getElementById( 'modal_seoslides_image_picker' );
			picker.value = I18N.remove_media;
			picker.className = picker.className.replace( /choose/, 'unchoose' );
			$( document.getElementById( 'modal_seoslides_image_preview' ) ).css( 'background-image', 'url("' + data.bg_image + '")' ).html( '' ).backstretchShort();

			bucket.style.backgroundImage = 'url(' + data.bg_image + ')';
			$( bucket ).backstretchShort();
		}

		// Add slide objects to bucket
		if ( undefined !== data.objects ) {
			// Remove existing bucket objects
			$( '.slide-object', CORE.Bucket.getCurrentSlideElement() ).remove();

			for ( var i = 0; i < data.objects.length; i++ ) {
				var object = data.objects[i];
				object = window.decodeURIComponent( object );
				object = window.JSON.parse( object );
				CORE.slideBuilder.pluginManager.load( object );
			}
		}

		// Update text editor defaults, if they exist
		if ( undefined !== data.text_defaults ) {
			var default_picker = $( document.getElementById( 'default_font_color' ) );
			var default_h1_picker = $( document.getElementById( 'default_h1_font_color' ) );
			default_picker.wpColorPicker( 'color', data.text_defaults.color );
			default_picker.wpColorPicker( 'defaultColor', data.text_defaults.color );
			default_h1_picker.wpColorPicker( 'color', data.header_defaults.color );
			default_h1_picker.wpColorPicker( 'defaultColor', data.header_defaults.color );

			document.getElementById( 'default_size' ).value = data.text_defaults.font_size;
			document.getElementById( 'default_font' ).value = data.text_defaults.font;

			document.getElementById( 'default_h1_size' ).value = data.header_defaults.font_size;
			document.getElementById( 'default_h1_font' ).value = data.header_defaults.font;
		}

		if ( undefined !== data.defaults ) {
			bucket.setAttribute( 'data-default_font', data.defaults.font );
			bucket.setAttribute( 'data-default_size', data.defaults.size );
			bucket.setAttribute( 'data-default_font_color', data.defaults.color );
			bucket.setAttribute( 'data-default_h1_font', data.defaults.h1_font );
			bucket.setAttribute( 'data-default_h1_size', data.defaults.h1_size );
			bucket.setAttribute( 'data-default_h1_font_color', data.defaults.h1_color );
		}
	}
	CORE.Events.addAction( 'slide.receivedData', populateFields );

	/**
	 * Queue up the image selector in the modal
	 */
	function modalBackgroundPicker() {
		var picker = $( document.getElementById( 'modal_seoslides_image_picker' ) ),
			label = I18N.set_media,
			preview = $( document.getElementById( 'modal_seoslides_image_preview' ) ),
			target = 'modal_seoslides_image_src';

		var backgroundPicker = new CORE.ImagePicker( label, picker );

		function send_to_editor( html ) {
			var mediaPath = jQuery( html ).attr( 'href' );

			if ( backgroundPicker.isImage( mediaPath ) ) {
				preview.css( 'background-image', 'url("' + mediaPath + '")' ).html( '' ).backstretchShort();
			} else {
				preview.css( 'background-image', '' ).html( 'Video' );
			}

			document.getElementById( target ).value = mediaPath;

			picker.removeClass( 'choose' ).addClass( 'unchoose' );
			picker.val( picker.data( 'chosen' ) );

			window.tb_remove();

			// Restore original handler
			window.send_to_editor = backgroundPicker.editor_store;
			backgroundPicker.ifWindow.fileQueued = backgroundPicker.fileQueued;

			// Trigger internal change event
			changed( mediaPath );
		}

		function launchOverlay( e ) {
			e.preventDefault();

			if( picker.hasClass( 'choose' ) ) {
				// Save a reference to the handler for later
				backgroundPicker.editor_store = window.send_to_editor;

				window.send_to_editor = send_to_editor;

				window.formfield = target;
				window.tb_show( label, 'media-upload.php?type=image&TB_iframe=1&width=640&height=263' );

				$( 'iframe#TB_iframeContent' ).load( loaded );
			} else {
				preview.css( 'background-image', '' ).html( preview.data( 'none' ) );
				document.getElementById( target ).value = '';

				picker.removeClass( 'unchoose' ).addClass( 'choose' );
				picker.val( picker.data( 'unchosen') );
			}
		}

		function changed( newUri ) {
			var bucket = document.querySelector( '.bucket-slide' );

			if ( backgroundPicker.isImage( newUri ) ) {
				bucket.style.backgroundImage = "url(" + newUri + ")";
				$( bucket ).backstretchShort();
			} else {
				bucket.style.backgroundImage = '';
			}
		}

		function loaded() {
			backgroundPicker.ifWindow = document.getElementById('TB_iframeContent').contentWindow;
			backgroundPicker.fileQueued = backgroundPicker.ifWindow.fileQueued;

			var filter = new CORE.ImagePicker.MediaFilter( backgroundPicker.ifWindow );

			var notImage = backgroundPicker.ifWindow.document.getElementById( 'not-image' );
			if ( null !== notImage ) {
				notImage.nextSibling.nodeValue = I18N.video_only;
			}

			// Hide audio selection
			var ifStyle = backgroundPicker.ifWindow.document.createElement( 'style' );
			ifStyle.type = 'text/css';
			ifStyle.innerHTML = '#filter li:first-child,#filter li:nth-child(3) {display: none;}';
			backgroundPicker.ifWindow.document.getElementsByTagName('head')[0].appendChild( ifStyle );

			// Hide elements we don't want to show
			var els = ['post_title','image_alt','post_excerpt','post_content','url','align','image-size'];

			for ( var i = 0; i < els.length; i++ ) {
				var el = els[ i ];

				var nodes = backgroundPicker.ifWindow.document.querySelectorAll( 'tr.' + el );
				for ( var j = 0; j < nodes.length; j++ ) {
					nodes[ j ].style.display = 'none';
				}
			}

			var submits = backgroundPicker.ifWindow.document.querySelectorAll( 'td.savesend input[type="submit"]' );
			for ( var k = 0; k < submits.length; k++ ) {
				submits[ k ].value = I18N.use_media;
			}

			// Set new fileQueued handler
			backgroundPicker.ifWindow.fileQueued = function( fileObj ) {
				// If we're good, go for it!
				if ( backgroundPicker.isImage( fileObj.name ) || backgroundPicker.isVideo( fileObj.name ) ) {
					backgroundPicker.fileQueued( fileObj );

					return;
				}

				// If we've gotten this far, someone's trying to do something nasty. Stop them!
				window.alert( I18N.not_image_or_video );
			};

			// Intercept video source changes
			var srcInput = backgroundPicker.ifWindow.document.getElementById( 'src' );

			if ( null !== srcInput ) {
				backgroundPicker.ifWindow.document.getElementById( 'insertonlybutton' ).style.color = '#bbb';
				var oldBlur = srcInput.onblur;

				srcInput.onblur = function() {
					var table = backgroundPicker.ifWindow.document.querySelector( 'table.describe' ),
						$table = $( table );

					if ( $table.hasClass( 'not-image' ) ) {
						filter.getData();
					} else {
						oldBlur();
					}
				};
			}
		}

		backgroundPicker.launchOverlay = launchOverlay;
		backgroundPicker.changed = changed;
		backgroundPicker.loaded = loaded;

		picker.on( 'click', launchOverlay );
	}
	CORE.Events.addAction( 'modal.open', modalBackgroundPicker );

	CORE.Events.addAction( 'slideList.resize', function( context ) {
		$( context ).find( '.seoslides_responsive' ).responsiveText();

		CORE.Events.debouncer.debounceAction( 'slideList.resize', 'canvas.resize', context );
	} );

	// Keep the 'use this' link from redirection the page.
	function use_in_post( e ) {
		e.preventDefault();

		var $this = $( this ),
			presentation_id = this.getAttribute( 'data-presentation' ),
			nonce = this.getAttribute( 'data-nonce' );

		// Tell WordPress to create a new post and automatically embed the current presentation using its shortcode.
		// When the post is ready, forcably redirect the browser URL.
		var options = {
			'data':   {
				'action':   'post-from-presentation',
				'_nonce':   nonce,
				'slideset': presentation_id
			}
		};

		CORE.ajax( options ).done( function( data ) {
			var redirect = data.edit_url;

			window.location.href = redirect;
		} );
	}
	$( document.getElementById( 'use_in_post' ) ).on( 'click', use_in_post );
})( this, jQuery );
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