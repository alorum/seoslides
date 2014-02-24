/*! seoslides - v1.3.2
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
		var control = '',
			content = data.settings.content.trim();

		if ( I18N.layout_image === content ) {
			control = defaultControl;
		} else {
			var url = isUrlValid( content ) ? content : '';

			control += '<div style="position:absolute;top:0;bottom:0;left:0;right:0;">';
			control += '<img style="height:100%;width:100%;" class="plugin-image" data-content="' + content + '" src="' + url + '" />';
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
				image.setAttribute( 'data-contnet', newUri );

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

	function handleResize( element, height, width ) {
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
	}
	CORE.Events.addAction( 'plugin.resize.' + UUID, handleResize );

	function handleCanvasResize( $slide ) {
		$( '.plugin-image', $slide ).each( function( i, el ) {
			var $el = $( el ),
				$parent = $el.parent();

			$el.css( {
				'height': $parent.height(),
				'width':  $parent.width()
			} );
		} );
	}
	CORE.Events.addAction( 'debounced.canvas.resize', handleCanvasResize, 11 );

	/**
	 * Get the plugin's size from the canvas element.
	 *
	 * @param {Object} $element
	 * @param {Object} $slide
	 * @returns {{w: number, h: number}}
	 */
	function getPluginSize( $element, $slide ) {
		$slide = $slide || CORE.Bucket.getCurrentSlideElement();

		return {
			w : 1600 / $slide.width() * $element.width(),
			h : 900 / $slide.height() * $element.height()
		};
	}

	/**
	 * Validate a url
	 *
	 * @param {string} maybeValid
	 * @returns {boolean}
	 */
	function isUrlValid( maybeValid ) {
		var regExp = /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

		return regExp.test( maybeValid );
	}
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
				if ( undefined !== slide['bg_image'] && typeof slide['bg_image'] === 'string' && '' !== slide['bg_image'].trim() && 'noimage' !== slide['bg_image'].trim() ) {
					slideEl.style.backgroundImage = 'url(' + slide['bg_image'] + ')';
				}
			}

			slideEl.style.backgroundColor = slide.fill_color;

			if ( slide.title === '' ) {
				slide.title = I18N.label_notitle;
			}

			var title = '<div class="title"><a data-id="' + slide.id + '" class="editslide" href="javascript:void;" title="' + I18N.label_edit_slide + '">' + slide.title + '</a></div>';
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

( function ( window, $, undefined ) {
	var CORE = window.SEO_Slides;

	$( '.slide' ).each( function( i, el ) {
		CORE.slideBuilder.parseSlide( el );

		CORE.slideBuilder.resize( el );

		$( '> div', el ).backstretchShort();
	} );
} )( this, jQuery );

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