/*! seoslides - v1.7.0
 * https://seoslides.com
 * Copyright (c) 2016 Alroum; * Licensed GPLv2+ */
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

/**
 * See (http://jquery.com/).
 * @name $
 * @class
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 */

/**
 * See (http://jquery.com/)
 * @name fn
 * @class
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 * @memberOf $
 */



(function ($) {
	"use strict";

	//Constants
	var LEFT = "left",
		RIGHT = "right",
		UP = "up",
		DOWN = "down",
		IN = "in",
		OUT = "out",

		NONE = "none",
		AUTO = "auto",

		SWIPE = "swipe",
		PINCH = "pinch",
		TAP = "tap",
		DOUBLE_TAP = "doubletap",
		LONG_TAP = "longtap",

		HORIZONTAL = "horizontal",
		VERTICAL = "vertical",

		ALL_FINGERS = "all",

		DOUBLE_TAP_THRESHOLD = 10,

		PHASE_START = "start",
		PHASE_MOVE = "move",
		PHASE_END = "end",
		PHASE_CANCEL = "cancel",

		SUPPORTS_TOUCH = 'ontouchstart' in window,

		PLUGIN_NS = 'TouchSwipe';



	/**
	 * The default configuration, and available options to configure touch swipe with.
	 * You can set the default values by updating any of the properties prior to instantiation.
	 * @name $.fn.swipe.defaults
	 * @namespace
	 * @property {int} [fingers=1] The number of fingers to detect in a swipe. Any swipes that do not meet this requirement will NOT trigger swipe handlers.
	 * @property {int} [threshold=75] The number of pixels that the user must move their finger by before it is considered a swipe.
	 * @property {int} [cancelThreshold=null] The number of pixels that the user must move their finger back from the original swipe direction to cancel the gesture.
	 * @property {int} [pinchThreshold=20] The number of pixels that the user must pinch their finger by before it is considered a pinch.
	 * @property {int} [maxTimeThreshold=null] Time, in milliseconds, between touchStart and touchEnd must NOT exceed in order to be considered a swipe.
	 * @property {int} [fingerReleaseThreshold=250] Time in milliseconds between releasing multiple fingers.  If 2 fingers are down, and are released one after the other, if they are within this threshold, it counts as a simultaneous release.
	 * @property {int} [longTapThreshold=500] Time in milliseconds between tap and release for a long tap
	 * @property {int} [doubleTapThreshold=200] Time in milliseconds between 2 taps to count as a doubletap
	 * @property {function} [swipe=null] A handler to catch all swipes. See {@link $.fn.swipe#event:swipe}
	 * @property {function} [swipeLeft=null] A handler that is triggered for "left" swipes. See {@link $.fn.swipe#event:swipeLeft}
	 * @property {function} [swipeRight=null] A handler that is triggered for "right" swipes. See {@link $.fn.swipe#event:swipeRight}
	 * @property {function} [swipeUp=null] A handler that is triggered for "up" swipes. See {@link $.fn.swipe#event:swipeUp}
	 * @property {function} [swipeDown=null] A handler that is triggered for "down" swipes. See {@link $.fn.swipe#event:swipeDown}
	 * @property {function} [swipeStatus=null] A handler triggered for every phase of the swipe. See {@link $.fn.swipe#event:swipeStatus}
	 * @property {function} [pinchIn=null] A handler triggered for pinch in events. See {@link $.fn.swipe#event:pinchIn}
	 * @property {function} [pinchOut=null] A handler triggered for pinch out events. See {@link $.fn.swipe#event:pinchOut}
	 * @property {function} [pinchStatus=null] A handler triggered for every phase of a pinch. See {@link $.fn.swipe#event:pinchStatus}
	 * @property {function} [tap=null] A handler triggered when a user just taps on the item, rather than swipes it. If they do not move, tap is triggered, if they do move, it is not.
	 * @property {function} [doubleTap=null] A handler triggered when a user double taps on the item. The delay between taps can be set with the doubleTapThreshold property. See {@link $.fn.swipe.defaults#doubleTapThreshold}
	 * @property {function} [longTap=null] A handler triggered when a user long taps on the item. The delay between start and end can be set with the longTapThreshold property. See {@link $.fn.swipe.defaults#doubleTapThreshold}
	 * @property {boolean} [triggerOnTouchEnd=true] If true, the swipe events are triggered when the touch end event is received (user releases finger).  If false, it will be triggered on reaching the threshold, and then cancel the touch event automatically.
	 * @property {boolean} [triggerOnTouchLeave=false] If true, then when the user leaves the swipe object, the swipe will end and trigger appropriate handlers.
	 * @property {string} [allowPageScroll='auto'] How the browser handles page scrolls when the user is swiping on a touchSwipe object. See {@link $.fn.swipe.pageScroll}.  <br/><br/>
	 <code>"auto"</code> : all undefined swipes will cause the page to scroll in that direction. <br/>
	 <code>"none"</code> : the page will not scroll when user swipes. <br/>
	 <code>"horizontal"</code> : will force page to scroll on horizontal swipes. <br/>
	 <code>"vertical"</code> : will force page to scroll on vertical swipes. <br/>
	 * @property {boolean} [fallbackToMouseEvents=true] If true mouse events are used when run on a non touch device, false will stop swipes being triggered by mouse events on non tocuh devices.
	 * @property {string} [excludedElements="button, input, select, textarea, a, .noSwipe"] A jquery selector that specifies child elements that do NOT trigger swipes. By default this excludes all form, input, select, button, anchor and .noSwipe elements.

	 */
	var defaults = {
		fingers: 1,
		threshold: 75,
		cancelThreshold:null,
		pinchThreshold:20,
		maxTimeThreshold: null,
		fingerReleaseThreshold:250,
		longTapThreshold:500,
		doubleTapThreshold:200,
		swipe: null,
		swipeLeft: null,
		swipeRight: null,
		swipeUp: null,
		swipeDown: null,
		swipeStatus: null,
		pinchIn:null,
		pinchOut:null,
		pinchStatus:null,
		click:null, //Deprecated since 1.6.2
		tap:null,
		doubleTap:null,
		longTap:null,
		triggerOnTouchEnd: true,
		triggerOnTouchLeave:false,
		allowPageScroll: "auto",
		fallbackToMouseEvents: true,
		excludedElements:"button, input, select, textarea, a, .noSwipe"
	};



	/**
	 * Applies TouchSwipe behaviour to one or more jQuery objects.
	 * The TouchSwipe plugin can be instantiated via this method, or methods within
	 * TouchSwipe can be executed via this method as per jQuery plugin architecture.
	 * @see TouchSwipe
	 * @class
	 * @param {Mixed} method If the current DOMNode is a TouchSwipe object, and <code>method</code> is a TouchSwipe method, then
	 * the <code>method</code> is executed, and any following arguments are passed to the TouchSwipe method.
	 * If <code>method</code> is an object, then the TouchSwipe class is instantiated on the current DOMNode, passing the
	 * configuration properties defined in the object. See TouchSwipe
	 *
	 */
	$.fn.swipe = function (method) {
		var $this = $(this),
			plugin = $this.data(PLUGIN_NS);

		//Check if we are already instantiated and trying to execute a method	
		if (plugin && typeof method === 'string') {
			if (plugin[method]) {
				return plugin[method].apply(this, Array.prototype.slice.call(arguments, 1));
			} else {
				$.error('Method ' + method + ' does not exist on jQuery.swipe');
			}
		}
		//Else not instantiated and trying to pass init object (or nothing)
		else if (!plugin && (typeof method === 'object' || !method)) {
			return init.apply(this, arguments);
		}

		return $this;
	};

	//Expose our defaults so a user could override the plugin defaults
	$.fn.swipe.defaults = defaults;

	/**
	 * The phases that a touch event goes through.  The <code>phase</code> is passed to the event handlers.
	 * These properties are read only, attempting to change them will not alter the values passed to the event handlers.
	 * @namespace
	 * @readonly
	 * @property {string} PHASE_START Constant indicating the start phase of the touch event. Value is <code>"start"</code>.
	 * @property {string} PHASE_MOVE Constant indicating the move phase of the touch event. Value is <code>"move"</code>.
	 * @property {string} PHASE_END Constant indicating the end phase of the touch event. Value is <code>"end"</code>.
	 * @property {string} PHASE_CANCEL Constant indicating the cancel phase of the touch event. Value is <code>"cancel"</code>.
	 */
	$.fn.swipe.phases = {
		PHASE_START: PHASE_START,
		PHASE_MOVE: PHASE_MOVE,
		PHASE_END: PHASE_END,
		PHASE_CANCEL: PHASE_CANCEL
	};

	/**
	 * The direction constants that are passed to the event handlers.
	 * These properties are read only, attempting to change them will not alter the values passed to the event handlers.
	 * @namespace
	 * @readonly
	 * @property {string} LEFT Constant indicating the left direction. Value is <code>"left"</code>.
	 * @property {string} RIGHT Constant indicating the right direction. Value is <code>"right"</code>.
	 * @property {string} UP Constant indicating the up direction. Value is <code>"up"</code>.
	 * @property {string} DOWN Constant indicating the down direction. Value is <code>"cancel"</code>.
	 * @property {string} IN Constant indicating the in direction. Value is <code>"in"</code>.
	 * @property {string} OUT Constant indicating the out direction. Value is <code>"out"</code>.
	 */
	$.fn.swipe.directions = {
		LEFT: LEFT,
		RIGHT: RIGHT,
		UP: UP,
		DOWN: DOWN,
		IN : IN,
		OUT: OUT
	};

	/**
	 * The page scroll constants that can be used to set the value of <code>allowPageScroll</code> option
	 * These properties are read only
	 * @namespace
	 * @readonly
	 * @see $.fn.swipe.defaults#allowPageScroll
	 * @property {string} NONE Constant indicating no page scrolling is allowed. Value is <code>"none"</code>.
	 * @property {string} HORIZONTAL Constant indicating horizontal page scrolling is allowed. Value is <code>"horizontal"</code>.
	 * @property {string} VERTICAL Constant indicating vertical page scrolling is allowed. Value is <code>"vertical"</code>.
	 * @property {string} AUTO Constant indicating either horizontal or vertical will be allowed, depending on the swipe handlers registered. Value is <code>"auto"</code>.
	 */
	$.fn.swipe.pageScroll = {
		NONE: NONE,
		HORIZONTAL: HORIZONTAL,
		VERTICAL: VERTICAL,
		AUTO: AUTO
	};

	/**
	 * Constants representing the number of fingers used in a swipe.  These are used to set both the value of <code>fingers</code> in the
	 * options object, as well as the value of the <code>fingers</code> event property.
	 * These properties are read only, attempting to change them will not alter the values passed to the event handlers.
	 * @namespace
	 * @readonly
	 * @see $.fn.swipe.defaults#fingers
	 * @property {string} ONE Constant indicating 1 finger is to be detected / was detected. Value is <code>1</code>.
	 * @property {string} TWO Constant indicating 2 fingers are to be detected / were detected. Value is <code>1</code>.
	 * @property {string} THREE Constant indicating 3 finger are to be detected / were detected. Value is <code>1</code>.
	 * @property {string} ALL Constant indicating any combination of finger are to be detected.  Value is <code>"all"</code>.
	 */
	$.fn.swipe.fingers = {
		ONE: 1,
		TWO: 2,
		THREE: 3,
		ALL: ALL_FINGERS
	};

	/**
	 * Initialise the plugin for each DOM element matched
	 * This creates a new instance of the main TouchSwipe class for each DOM element, and then
	 * saves a reference to that instance in the elements data property.
	 * @internal
	 */
	function init(options) {
		//Prep and extend the options
		if (options && (options.allowPageScroll === undefined && (options.swipe !== undefined || options.swipeStatus !== undefined))) {
			options.allowPageScroll = NONE;
		}

		//Check for deprecated options
		//Ensure that any old click handlers are assigned to the new tap, unless we have a tap
		if(options.click!==undefined && options.tap===undefined) {
			options.tap = options.click;
		}

		if (!options) {
			options = {};
		}

		//pass empty object so we dont modify the defaults
		options = $.extend({}, $.fn.swipe.defaults, options);

		//For each element instantiate the plugin
		return this.each(function () {
			var $this = $(this);

			//Check we havent already initialised the plugin
			var plugin = $this.data(PLUGIN_NS);

			if (!plugin) {
				plugin = new TouchSwipe(this, options);
				$this.data(PLUGIN_NS, plugin);
			}
		});
	}

	/**
	 * Main TouchSwipe Plugin Class.
	 * Do not use this to construct your TouchSwipe object, use the jQuery plugin method $.fn.swipe(); {@link $.fn.swipe}
	 * @private
	 * @name TouchSwipe
	 * @param {DOMNode} element The HTML DOM object to apply to plugin to
	 * @param {Object} options The options to configure the plugin with.  @link {$.fn.swipe.defaults}
	 * @see $.fh.swipe.defaults
	 * @see $.fh.swipe
	 * @class
	 */
	function TouchSwipe(element, options) {
		var useTouchEvents = (SUPPORTS_TOUCH || !options.fallbackToMouseEvents),
			START_EV = useTouchEvents ? 'touchstart' : 'mousedown',
			MOVE_EV = useTouchEvents ? 'touchmove' : 'mousemove',
			END_EV = useTouchEvents ? 'touchend' : 'mouseup',
			LEAVE_EV = useTouchEvents ? null : 'mouseleave', //we manually detect leave on touch devices, so null event here
			CANCEL_EV = 'touchcancel';



		//touch properties
		var distance = 0,
			direction = null,
			duration = 0,
			startTouchesDistance = 0,
			endTouchesDistance = 0,
			pinchZoom = 1,
			pinchDistance = 0,
			pinchDirection = 0,
			maximumsMap=null;



		//jQuery wrapped element for this instance
		var $element = $(element);

		//Current phase of th touch cycle
		var phase = "start";

		// the current number of fingers being used.
		var fingerCount = 0;

		//track mouse points / delta
		var fingerData=null;

		//track times
		var startTime = 0,
			endTime = 0,
			previousTouchEndTime=0,
			previousTouchFingerCount=0,
			doubleTapStartTime=0;

		//Timeouts
		var singleTapTimeout=null;

		// Add gestures to all swipable areas if supported
		try {
			$element.bind(START_EV, touchStart);
			$element.bind(CANCEL_EV, touchCancel);
		}
		catch (e) {
			$.error('events not supported ' + START_EV + ',' + CANCEL_EV + ' on jQuery.swipe');
		}

		//
		//Public methods
		//

		/**
		 * re-enables the swipe plugin with the previous configuration
		 * @function
		 * @name $.fn.swipe#enable
		 * @return {DOMNode} The Dom element that was registered with TouchSwipe
		 * @example $("#element").swipe("enable");
		 */
		this.enable = function () {
			$element.bind(START_EV, touchStart);
			$element.bind(CANCEL_EV, touchCancel);
			return $element;
		};

		/**
		 * disables the swipe plugin
		 * @function
		 * @name $.fn.swipe#disable
		 * @return {DOMNode} The Dom element that is now registered with TouchSwipe
		 * @example $("#element").swipe("disable");
		 */
		this.disable = function () {
			removeListeners();
			return $element;
		};

		/**
		 * Destroy the swipe plugin completely. To use any swipe methods, you must re initialise the plugin.
		 * @function
		 * @name $.fn.swipe#destroy
		 * @return {DOMNode} The Dom element that was registered with TouchSwipe
		 * @example $("#element").swipe("destroy");
		 */
		this.destroy = function () {
			removeListeners();
			$element.data(PLUGIN_NS, null);
			return $element;
		};


		/**
		 * Allows run time updating of the swipe configuration options.
		 * @function
		 * @name $.fn.swipe#option
		 * @param {String} property The option property to get or set
		 * @param {Object} [value] The value to set the property to
		 * @return {Object} If only a property name is passed, then that property value is returned.
		 * @example $("#element").swipe("option", "threshold"); // return the threshold
		 * @example $("#element").swipe("option", "threshold", 100); // set the threshold after init
		 * @see $.fn.swipe.defaults
		 *
		 */
		this.option = function (property, value) {
			if(options[property]!==undefined) {
				if(value===undefined) {
					return options[property];
				} else {
					options[property] = value;
				}
			} else {
				$.error('Option ' + property + ' does not exist on jQuery.swipe.options');
			}
		}

		//
		// Private methods
		//

		//
		// EVENTS
		//
		/**
		 * Event handler for a touch start event.
		 * Stops the default click event from triggering and stores where we touched
		 * @inner
		 * @param {object} jqEvent The normalised jQuery event object.
		 */
		function touchStart(jqEvent) {
			//If we already in a touch event (a finger already in use) then ignore subsequent ones..
			if( getTouchInProgress() )
				return;

			//Check if this element matches any in the excluded elements selectors,  or its parent is excluded, if so, DONT swipe
			if( $(jqEvent.target).closest( options.excludedElements, $element ).length>0 )
				return;

			//As we use Jquery bind for events, we need to target the original event object
			//If these events are being programatically triggered, we dont have an orignal event object, so use the Jq one.
			var event = jqEvent.originalEvent ? jqEvent.originalEvent : jqEvent;

			var ret,
				evt = SUPPORTS_TOUCH ? event.touches[0] : event;

			phase = PHASE_START;

			//If we support touches, get the finger count
			if (SUPPORTS_TOUCH) {
				// get the total number of fingers touching the screen
				fingerCount = event.touches.length;
			}
			//Else this is the desktop, so stop the browser from dragging the image
			else {
				jqEvent.preventDefault(); //call this on jq event so we are cross browser
			}

			//clear vars..
			distance = 0;
			direction = null;
			pinchDirection=null;
			duration = 0;
			startTouchesDistance=0;
			endTouchesDistance=0;
			pinchZoom = 1;
			pinchDistance = 0;
			fingerData=createAllFingerData();
			maximumsMap=createMaximumsData();
			cancelMultiFingerRelease();


			// check the number of fingers is what we are looking for, or we are capturing pinches
			if (!SUPPORTS_TOUCH || (fingerCount === options.fingers || options.fingers === ALL_FINGERS) || hasPinches()) {
				// get the coordinates of the touch
				createFingerData( 0, evt );
				startTime = getTimeStamp();

				if(fingerCount==2) {
					//Keep track of the initial pinch distance, so we can calculate the diff later
					//Store second finger data as start
					createFingerData( 1, event.touches[1] );
					startTouchesDistance = endTouchesDistance = calculateTouchesDistance(fingerData[0].start, fingerData[1].start);
				}

				if (options.swipeStatus || options.pinchStatus) {
					ret = triggerHandler(event, phase);
				}
			}
			else {
				//A touch with more or less than the fingers we are looking for, so cancel
				ret = false;
			}

			//If we have a return value from the users handler, then return and cancel
			if (ret === false) {
				phase = PHASE_CANCEL;
				triggerHandler(event, phase);
				return ret;
			}
			else {
				setTouchInProgress(true);
			}
		};



		/**
		 * Event handler for a touch move event.
		 * If we change fingers during move, then cancel the event
		 * @inner
		 * @param {object} jqEvent The normalised jQuery event object.
		 */
		function touchMove(jqEvent) {

			//As we use Jquery bind for events, we need to target the original event object
			//If these events are being programatically triggered, we dont have an orignal event object, so use the Jq one.
			var event = jqEvent.originalEvent ? jqEvent.originalEvent : jqEvent;

			//If we are ending, cancelling, or within the threshold of 2 fingers being released, dont track anything..
			if (phase === PHASE_END || phase === PHASE_CANCEL || inMultiFingerRelease())
				return;

			var ret,
				evt = SUPPORTS_TOUCH ? event.touches[0] : event;


			//Update the  finger data 
			var currentFinger = updateFingerData(evt);
			endTime = getTimeStamp();

			if (SUPPORTS_TOUCH) {
				fingerCount = event.touches.length;
			}

			phase = PHASE_MOVE;

			//If we have 2 fingers get Touches distance as well
			if(fingerCount==2) {

				//Keep track of the initial pinch distance, so we can calculate the diff later
				//We do this here as well as the start event, incase they start with 1 finger, and the press 2 fingers
				if(startTouchesDistance==0) {
					//Create second finger if this is the first time...
					createFingerData( 1, event.touches[1] );

					startTouchesDistance = endTouchesDistance = calculateTouchesDistance(fingerData[0].start, fingerData[1].start);
				} else {
					//Else just update the second finger
					updateFingerData(event.touches[1]);

					endTouchesDistance = calculateTouchesDistance(fingerData[0].end, fingerData[1].end);
					pinchDirection = calculatePinchDirection(fingerData[0].end, fingerData[1].end);
				}


				pinchZoom = calculatePinchZoom(startTouchesDistance, endTouchesDistance);
				pinchDistance = Math.abs(startTouchesDistance - endTouchesDistance);
			}


			if ( (fingerCount === options.fingers || options.fingers === ALL_FINGERS) || !SUPPORTS_TOUCH || hasPinches() ) {

				direction = calculateDirection(currentFinger.start, currentFinger.end);

				//Check if we need to prevent default evnet (page scroll / pinch zoom) or not
				validateDefaultEvent(jqEvent, direction);

				//Distance and duration are all off the main finger
				distance = calculateDistance(currentFinger.start, currentFinger.end);
				duration = calculateDuration();

				//Cache the maximum distance we made in this direction
				setMaxDistance(direction, distance);


				if (options.swipeStatus || options.pinchStatus) {
					ret = triggerHandler(event, phase);
				}


				//If we trigger end events when threshold are met, or trigger events when touch leves element
				if(!options.triggerOnTouchEnd || options.triggerOnTouchLeave) {

					var inBounds = true;

					//If checking if we leave the element, run the bounds check (we can use touchleave as its not supported on webkit)
					if(options.triggerOnTouchLeave) {
						var bounds = getbounds( this );
						inBounds = isInBounds( currentFinger.end, bounds );
					}

					//Trigger end handles as we swipe if thresholds met or if we have left the element if the user has asked to check these..
					if(!options.triggerOnTouchEnd && inBounds) {
						phase = getNextPhase( PHASE_MOVE );
					}
					//We end if out of bounds here, so set current phase to END, and check if its modified 
					else if(options.triggerOnTouchLeave && !inBounds ) {
						phase = getNextPhase( PHASE_END );
					}

					if(phase==PHASE_CANCEL || phase==PHASE_END)	{
						triggerHandler(event, phase);
					}
				}
			}
			else {
				phase = PHASE_CANCEL;
				triggerHandler(event, phase);
			}

			if (ret === false) {
				phase = PHASE_CANCEL;
				triggerHandler(event, phase);
			}
		}



		/**
		 * Event handler for a touch end event.
		 * Calculate the direction and trigger events
		 * @inner
		 * @param {object} jqEvent The normalised jQuery event object.
		 */
		function touchEnd(jqEvent) {
			//As we use Jquery bind for events, we need to target the original event object
			var event = jqEvent.originalEvent;


			//If we are still in a touch with another finger return
			//This allows us to wait a fraction and see if the other finger comes up, if it does within the threshold, then we treat it as a multi release, not a single release.
			if (SUPPORTS_TOUCH) {
				if(event.touches.length>0) {
					startMultiFingerRelease();
					return true;
				}
			}

			//If a previous finger has been released, check how long ago, if within the threshold, then assume it was a multifinger release.
			//This is used to allow 2 fingers to release fractionally after each other, whilst maintainig the event as containg 2 fingers, not 1
			if(inMultiFingerRelease()) {
				fingerCount=previousTouchFingerCount;
			}

			//call this on jq event so we are cross browser 
			jqEvent.preventDefault();

			//Set end of swipe
			endTime = getTimeStamp();

			//Get duration incase move was never fired
			duration = calculateDuration();

			//If we trigger handlers at end of swipe OR, we trigger during, but they didnt trigger and we are still in the move phase
			if(didSwipeBackToCancel()) {
				phase = PHASE_CANCEL;
				triggerHandler(event, phase);
			} else if (options.triggerOnTouchEnd || (options.triggerOnTouchEnd == false && phase === PHASE_MOVE)) {
				phase = PHASE_END;
				triggerHandler(event, phase);
			}
			//Special cases - A tap should always fire on touch end regardless,
			//So here we manually trigger the tap end handler by itself
			//We dont run trigger handler as it will re-trigger events that may have fired already
			else if (!options.triggerOnTouchEnd && hasTap()) {
				//Trigger the pinch events...
				phase = PHASE_END;
				triggerHandlerForGesture(event, phase, TAP);
			}
			else if (phase === PHASE_MOVE) {
				phase = PHASE_CANCEL;
				triggerHandler(event, phase);
			}

			setTouchInProgress(false);
		}



		/**
		 * Event handler for a touch cancel event.
		 * Clears current vars
		 * @inner
		 */
		function touchCancel() {
			// reset the variables back to default values
			fingerCount = 0;
			endTime = 0;
			startTime = 0;
			startTouchesDistance=0;
			endTouchesDistance=0;
			pinchZoom=1;

			//If we were in progress of tracking a possible multi touch end, then re set it.
			cancelMultiFingerRelease();

			setTouchInProgress(false);
		}


		/**
		 * Event handler for a touch leave event.
		 * This is only triggered on desktops, in touch we work this out manually
		 * as the touchleave event is not supported in webkit
		 * @inner
		 */
		function touchLeave(jqEvent) {
			var event = jqEvent.originalEvent;

			//If we have the trigger on leve property set....
			if(options.triggerOnTouchLeave) {
				phase = getNextPhase( PHASE_END );
				triggerHandler(event, phase);
			}
		}

		/**
		 * Removes all listeners that were associated with the plugin
		 * @inner
		 */
		function removeListeners() {
			$element.unbind(START_EV, touchStart);
			$element.unbind(CANCEL_EV, touchCancel);
			$element.unbind(MOVE_EV, touchMove);
			$element.unbind(END_EV, touchEnd);

			//we only have leave events on desktop, we manually calcuate leave on touch as its not supported in webkit
			if(LEAVE_EV) {
				$element.unbind(LEAVE_EV, touchLeave);
			}

			setTouchInProgress(false);
		}


		/**
		 * Checks if the time and distance thresholds have been met, and if so then the appropriate handlers are fired.
		 */
		function getNextPhase(currentPhase) {

			var nextPhase = currentPhase;

			// Ensure we have valid swipe (under time and over distance  and check if we are out of bound...)
			var validTime = validateSwipeTime();
			var validDistance = validateSwipeDistance();
			var didCancel = didSwipeBackToCancel();

			//If we have exceeded our time, then cancel	
			if(!validTime || didCancel) {
				nextPhase = PHASE_CANCEL;
			}
			//Else if we are moving, and have reached distance then end
			else if (validDistance && currentPhase == PHASE_MOVE && (!options.triggerOnTouchEnd || options.triggerOnTouchLeave) ) {
				nextPhase = PHASE_END;
			}
			//Else if we have ended by leaving and didnt reach distance, then cancel
			else if (!validDistance && currentPhase==PHASE_END && options.triggerOnTouchLeave) {
				nextPhase = PHASE_CANCEL;
			}

			return nextPhase;
		}


		/**
		 * Trigger the relevant event handler
		 * The handlers are passed the original event, the element that was swiped, and in the case of the catch all handler, the direction that was swiped, "left", "right", "up", or "down"
		 * @param {object} event the original event object
		 * @param {string} phase the phase of the swipe (start, end cancel etc) {@link $.fn.swipe.phases}
		 * @inner
		 */
		function triggerHandler(event, phase) {

			var ret = undefined;

			// SWIPE GESTURES
			if(didSwipe() || hasSwipes()) { //hasSwipes as status needs to fire even if swipe is invalid
				//Trigger the swipe events...
				ret = triggerHandlerForGesture(event, phase, SWIPE);
			}

			// PINCH GESTURES (if the above didnt cancel)
			else if((didPinch() || hasPinches()) && ret!==false) {
				//Trigger the pinch events...
				ret = triggerHandlerForGesture(event, phase, PINCH);
			}

			// CLICK / TAP (if the above didnt cancel)
			if(didDoubleTap() && ret!==false) {
				//Trigger the tap events...
				ret = triggerHandlerForGesture(event, phase, DOUBLE_TAP);
			}

			// CLICK / TAP (if the above didnt cancel)
			else if(didLongTap() && ret!==false) {
				//Trigger the tap events...
				ret = triggerHandlerForGesture(event, phase, LONG_TAP);
			}

			// CLICK / TAP (if the above didnt cancel)
			else if(didTap() && ret!==false) {
				//Trigger the tap event..
				ret = triggerHandlerForGesture(event, phase, TAP);
			}



			// If we are cancelling the gesture, then manually trigger the reset handler
			if (phase === PHASE_CANCEL) {
				touchCancel(event);
			}

			// If we are ending the gesture, then manually trigger the reset handler IF all fingers are off
			if(phase === PHASE_END) {
				//If we support touch, then check that all fingers are off before we cancel
				if (SUPPORTS_TOUCH) {
					if(event.touches.length==0) {
						touchCancel(event);
					}
				}
				else {
					touchCancel(event);
				}
			}

			return ret;
		}



		/**
		 * Trigger the relevant event handler
		 * The handlers are passed the original event, the element that was swiped, and in the case of the catch all handler, the direction that was swiped, "left", "right", "up", or "down"
		 * @param {object} event the original event object
		 * @param {string} phase the phase of the swipe (start, end cancel etc) {@link $.fn.swipe.phases}
		 * @param {string} gesture the gesture to triger a handler for : PINCH or SWIPE {@link $.fn.swipe.gestures}
		 * @return Boolean False, to indicate that the event should stop propagation, or void.
		 * @inner
		 */
		function triggerHandlerForGesture(event, phase, gesture) {

			var ret=undefined;

			//SWIPES....
			if(gesture==SWIPE) {
				//Trigger status every time..

				//Trigger the event...
				$element.trigger('swipeStatus', [phase, direction || null, distance || 0, duration || 0, fingerCount]);

				//Fire the callback
				if (options.swipeStatus) {
					ret = options.swipeStatus.call($element, event, phase, direction || null, distance || 0, duration || 0, fingerCount);
					//If the status cancels, then dont run the subsequent event handlers..
					if(ret===false) return false;
				}




				if (phase == PHASE_END && validateSwipe()) {
					//Fire the catch all event
					$element.trigger('swipe', [direction, distance, duration, fingerCount]);

					//Fire catch all callback
					if (options.swipe) {
						ret = options.swipe.call($element, event, direction, distance, duration, fingerCount);
						//If the status cancels, then dont run the subsequent event handlers..
						if(ret===false) return false;
					}

					//trigger direction specific event handlers	
					switch (direction) {
						case LEFT:
							//Trigger the event
							$element.trigger('swipeLeft', [direction, distance, duration, fingerCount]);

							//Fire the callback
							if (options.swipeLeft) {
								ret = options.swipeLeft.call($element, event, direction, distance, duration, fingerCount);
							}
							break;

						case RIGHT:
							//Trigger the event
							$element.trigger('swipeRight', [direction, distance, duration, fingerCount]);

							//Fire the callback
							if (options.swipeRight) {
								ret = options.swipeRight.call($element, event, direction, distance, duration, fingerCount);
							}
							break;

						case UP:
							//Trigger the event
							$element.trigger('swipeUp', [direction, distance, duration, fingerCount]);

							//Fire the callback
							if (options.swipeUp) {
								ret = options.swipeUp.call($element, event, direction, distance, duration, fingerCount);
							}
							break;

						case DOWN:
							//Trigger the event
							$element.trigger('swipeDown', [direction, distance, duration, fingerCount]);

							//Fire the callback
							if (options.swipeDown) {
								ret = options.swipeDown.call($element, event, direction, distance, duration, fingerCount);
							}
							break;
					}
				}
			}


			//PINCHES....
			if(gesture==PINCH) {
				//Trigger the event
				$element.trigger('pinchStatus', [phase, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom]);

				//Fire the callback
				if (options.pinchStatus) {
					ret = options.pinchStatus.call($element, event, phase, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom);
					//If the status cancels, then dont run the subsequent event handlers..
					if(ret===false) return false;
				}

				if(phase==PHASE_END && validatePinch()) {

					switch (pinchDirection) {
						case IN:
							//Trigger the event
							$element.trigger('pinchIn', [pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom]);

							//Fire the callback
							if (options.pinchIn) {
								ret = options.pinchIn.call($element, event, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom);
							}
							break;

						case OUT:
							//Trigger the event
							$element.trigger('pinchOut', [pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom]);

							//Fire the callback
							if (options.pinchOut) {
								ret = options.pinchOut.call($element, event, pinchDirection || null, pinchDistance || 0, duration || 0, fingerCount, pinchZoom);
							}
							break;
					}
				}
			}





			if(gesture==TAP) {
				if(phase === PHASE_CANCEL || phase === PHASE_END) {


					//Cancel any existing double tap
					clearTimeout(singleTapTimeout);

					//If we are also looking for doubelTaps, wait incase this is one...
					if(hasDoubleTap() && !inDoubleTap()) {
						//Cache the time of this tap
						doubleTapStartTime = getTimeStamp();

						//Now wait for the double tap timeout, and trigger this single tap
						//if its not cancelled by a double tap
						singleTapTimeout = setTimeout($.proxy(function() {
							doubleTapStartTime=null;
							//Trigger the event
							$element.trigger('tap', [event.target]);


							//Fire the callback
							if(options.tap) {
								ret = options.tap.call($element, event, event.target);
							}
						}, this), options.doubleTapThreshold );

					} else {
						doubleTapStartTime=null;

						//Trigger the event
						$element.trigger('tap', [event.target]);


						//Fire the callback
						if(options.tap) {
							ret = options.tap.call($element, event, event.target);
						}
					}
				}
			}

			else if (gesture==DOUBLE_TAP) {
				if(phase === PHASE_CANCEL || phase === PHASE_END) {
					//Cancel any pending singletap 
					clearTimeout(singleTapTimeout);
					doubleTapStartTime=null;

					//Trigger the event
					$element.trigger('doubletap', [event.target]);

					//Fire the callback
					if(options.doubleTap) {
						ret = options.doubleTap.call($element, event, event.target);
					}
				}
			}

			else if (gesture==LONG_TAP) {
				if(phase === PHASE_CANCEL || phase === PHASE_END) {
					//Cancel any pending singletap (shouldnt be one)
					clearTimeout(singleTapTimeout);
					doubleTapStartTime=null;

					//Trigger the event
					$element.trigger('longtap', [event.target]);

					//Fire the callback
					if(options.longTap) {
						ret = options.longTap.call($element, event, event.target);
					}
				}
			}

			return ret;
		}




		//
		// GESTURE VALIDATION
		//

		/**
		 * Checks the user has swipe far enough
		 * @return Boolean if <code>threshold</code> has been set, return true if the threshold was met, else false.
		 * If no threshold was set, then we return true.
		 * @inner
		 */
		function validateSwipeDistance() {
			var valid = true;
			//If we made it past the min swipe distance..
			if (options.threshold !== null) {
				valid = distance >= options.threshold;
			}

			return valid;
		}

		/**
		 * Checks the user has swiped back to cancel.
		 * @return Boolean if <code>cancelThreshold</code> has been set, return true if the cancelThreshold was met, else false.
		 * If no cancelThreshold was set, then we return true.
		 * @inner
		 */
		function didSwipeBackToCancel() {
			var cancelled = false;
			if(options.cancelThreshold !== null && direction !==null)  {
				cancelled =  (getMaxDistance( direction ) - distance) >= options.cancelThreshold;
			}

			return cancelled;
		}

		/**
		 * Checks the user has pinched far enough
		 * @return Boolean if <code>pinchThreshold</code> has been set, return true if the threshold was met, else false.
		 * If no threshold was set, then we return true.
		 * @inner
		 */
		function validatePinchDistance() {
			if (options.pinchThreshold !== null) {
				return pinchDistance >= options.pinchThreshold;
			}
			return true;
		}

		/**
		 * Checks that the time taken to swipe meets the minimum / maximum requirements
		 * @return Boolean
		 * @inner
		 */
		function validateSwipeTime() {
			var result;
			//If no time set, then return true

			if (options.maxTimeThreshold) {
				if (duration >= options.maxTimeThreshold) {
					result = false;
				} else {
					result = true;
				}
			}
			else {
				result = true;
			}

			return result;
		}


		/**
		 * Checks direction of the swipe and the value allowPageScroll to see if we should allow or prevent the default behaviour from occurring.
		 * This will essentially allow page scrolling or not when the user is swiping on a touchSwipe object.
		 * @param {object} jqEvent The normalised jQuery representation of the event object.
		 * @param {string} direction The direction of the event. See {@link $.fn.swipe.directions}
		 * @see $.fn.swipe.directions
		 * @inner
		 */
		function validateDefaultEvent(jqEvent, direction) {
			if (options.allowPageScroll === NONE || hasPinches()) {
				jqEvent.preventDefault();
			} else {
				var auto = options.allowPageScroll === AUTO;

				switch (direction) {
					case LEFT:
						if ((options.swipeLeft && auto) || (!auto && options.allowPageScroll != HORIZONTAL)) {
							jqEvent.preventDefault();
						}
						break;

					case RIGHT:
						if ((options.swipeRight && auto) || (!auto && options.allowPageScroll != HORIZONTAL)) {
							jqEvent.preventDefault();
						}
						break;

					case UP:
						if ((options.swipeUp && auto) || (!auto && options.allowPageScroll != VERTICAL)) {
							jqEvent.preventDefault();
						}
						break;

					case DOWN:
						if ((options.swipeDown && auto) || (!auto && options.allowPageScroll != VERTICAL)) {
							jqEvent.preventDefault();
						}
						break;
				}
			}

		}


		// PINCHES
		/**
		 * Returns true of the current pinch meets the thresholds
		 * @return Boolean
		 * @inner
		 */
		function validatePinch() {
			var hasCorrectFingerCount = validateFingers();
			var hasEndPoint = validateEndPoint();
			var hasCorrectDistance = validatePinchDistance();
			return hasCorrectFingerCount && hasEndPoint && hasCorrectDistance;

		}

		/**
		 * Returns true if any Pinch events have been registered
		 * @return Boolean
		 * @inner
		 */
		function hasPinches() {
			//Enure we dont return 0 or null for false values
			return !!(options.pinchStatus || options.pinchIn || options.pinchOut);
		}

		/**
		 * Returns true if we are detecting pinches, and have one
		 * @return Boolean
		 * @inner
		 */
		function didPinch() {
			//Enure we dont return 0 or null for false values
			return !!(validatePinch() && hasPinches());
		}




		// SWIPES
		/**
		 * Returns true if the current swipe meets the thresholds
		 * @return Boolean
		 * @inner
		 */
		function validateSwipe() {
			//Check validity of swipe
			var hasValidTime = validateSwipeTime();
			var hasValidDistance = validateSwipeDistance();
			var hasCorrectFingerCount = validateFingers();
			var hasEndPoint = validateEndPoint();
			var didCancel = didSwipeBackToCancel();

			// if the user swiped more than the minimum length, perform the appropriate action
			// hasValidDistance is null when no distance is set 
			var valid =  !didCancel && hasEndPoint && hasCorrectFingerCount && hasValidDistance && hasValidTime;

			return valid;
		}

		/**
		 * Returns true if any Swipe events have been registered
		 * @return Boolean
		 * @inner
		 */
		function hasSwipes() {
			//Enure we dont return 0 or null for false values
			return !!(options.swipe || options.swipeStatus || options.swipeLeft || options.swipeRight || options.swipeUp || options.swipeDown);
		}


		/**
		 * Returns true if we are detecting swipes and have one
		 * @return Boolean
		 * @inner
		 */
		function didSwipe() {
			//Enure we dont return 0 or null for false values
			return !!(validateSwipe() && hasSwipes());
		}

		/**
		 * Returns true if we have matched the number of fingers we are looking for
		 * @return Boolean
		 * @inner
		 */
		function validateFingers() {
			//The number of fingers we want were matched, or on desktop we ignore
			return ((fingerCount === options.fingers || options.fingers === ALL_FINGERS) || !SUPPORTS_TOUCH);
		}

		/**
		 * Returns true if we have an end point for the swipe
		 * @return Boolean
		 * @inner
		 */
		function validateEndPoint() {
			//We have an end value for the finger
			return fingerData[0].end.x !== 0;
		}

		// TAP / CLICK
		/**
		 * Returns true if a click / tap events have been registered
		 * @return Boolean
		 * @inner
		 */
		function hasTap() {
			//Enure we dont return 0 or null for false values
			return !!(options.tap) ;
		}

		/**
		 * Returns true if a double tap events have been registered
		 * @return Boolean
		 * @inner
		 */
		function hasDoubleTap() {
			//Enure we dont return 0 or null for false values
			return !!(options.doubleTap) ;
		}

		/**
		 * Returns true if any long tap events have been registered
		 * @return Boolean
		 * @inner
		 */
		function hasLongTap() {
			//Enure we dont return 0 or null for false values
			return !!(options.longTap) ;
		}

		/**
		 * Returns true if we could be in the process of a double tap (one tap has occurred, we are listening for double taps, and the threshold hasn't past.
		 * @return Boolean
		 * @inner
		 */
		function validateDoubleTap() {
			if(doubleTapStartTime==null){
				return false;
			}
			var now = getTimeStamp();
			return (hasDoubleTap() && ((now-doubleTapStartTime) <= options.doubleTapThreshold));
		}

		/**
		 * Returns true if we could be in the process of a double tap (one tap has occurred, we are listening for double taps, and the threshold hasn't past.
		 * @return Boolean
		 * @inner
		 */
		function inDoubleTap() {
			return validateDoubleTap();
		}


		/**
		 * Returns true if we have a valid tap
		 * @return Boolean
		 * @inner
		 */
		function validateTap() {
			return ((fingerCount === 1 || !SUPPORTS_TOUCH) && (isNaN(distance) || distance === 0));
		}

		/**
		 * Returns true if we have a valid long tap
		 * @return Boolean
		 * @inner
		 */
		function validateLongTap() {
			//slight threshold on moving finger
			return ((duration > options.longTapThreshold) && (distance < DOUBLE_TAP_THRESHOLD));
		}

		/**
		 * Returns true if we are detecting taps and have one
		 * @return Boolean
		 * @inner
		 */
		function didTap() {
			//Enure we dont return 0 or null for false values
			return !!(validateTap() && hasTap());
		}


		/**
		 * Returns true if we are detecting double taps and have one
		 * @return Boolean
		 * @inner
		 */
		function didDoubleTap() {
			//Enure we dont return 0 or null for false values
			return !!(validateDoubleTap() && hasDoubleTap());
		}

		/**
		 * Returns true if we are detecting long taps and have one
		 * @return Boolean
		 * @inner
		 */
		function didLongTap() {
			//Enure we dont return 0 or null for false values
			return !!(validateLongTap() && hasLongTap());
		}




		// MULTI FINGER TOUCH
		/**
		 * Starts tracking the time between 2 finger releases, and keeps track of how many fingers we initially had up
		 * @inner
		 */
		function startMultiFingerRelease() {
			previousTouchEndTime = getTimeStamp();
			previousTouchFingerCount = event.touches.length+1;
		}

		/**
		 * Cancels the tracking of time between 2 finger releases, and resets counters
		 * @inner
		 */
		function cancelMultiFingerRelease() {
			previousTouchEndTime = 0;
			previousTouchFingerCount = 0;
		}

		/**
		 * Checks if we are in the threshold between 2 fingers being released
		 * @return Boolean
		 * @inner
		 */
		function inMultiFingerRelease() {

			var withinThreshold = false;

			if(previousTouchEndTime) {
				var diff = getTimeStamp() - previousTouchEndTime
				if( diff<=options.fingerReleaseThreshold ) {
					withinThreshold = true;
				}
			}

			return withinThreshold;
		}


		/**
		 * gets a data flag to indicate that a touch is in progress
		 * @return Boolean
		 * @inner
		 */
		function getTouchInProgress() {
			//strict equality to ensure only true and false are returned
			return !!($element.data(PLUGIN_NS+'_intouch') === true);
		}

		/**
		 * Sets a data flag to indicate that a touch is in progress
		 * @param {boolean} val The value to set the property to
		 * @inner
		 */
		function setTouchInProgress(val) {

			//Add or remove event listeners depending on touch status
			if(val===true) {
				$element.bind(MOVE_EV, touchMove);
				$element.bind(END_EV, touchEnd);

				//we only have leave events on desktop, we manually calcuate leave on touch as its not supported in webkit
				if(LEAVE_EV) {
					$element.bind(LEAVE_EV, touchLeave);
				}
			} else {
				$element.unbind(MOVE_EV, touchMove, false);
				$element.unbind(END_EV, touchEnd, false);

				//we only have leave events on desktop, we manually calcuate leave on touch as its not supported in webkit
				if(LEAVE_EV) {
					$element.unbind(LEAVE_EV, touchLeave, false);
				}
			}


			//strict equality to ensure only true and false can update the value
			$element.data(PLUGIN_NS+'_intouch', val === true);
		}


		/**
		 * Creates the finger data for the touch/finger in the event object.
		 * @param {int} index The index in the array to store the finger data (usually the order the fingers were pressed)
		 * @param {object} evt The event object containing finger data
		 * @return finger data object
		 * @inner
		 */
		function createFingerData( index, evt ) {
			var id = evt.identifier!==undefined ? evt.identifier : 0;

			fingerData[index].identifier = id;
			fingerData[index].start.x = fingerData[index].end.x = evt.pageX||evt.clientX;
			fingerData[index].start.y = fingerData[index].end.y = evt.pageY||evt.clientY;

			return fingerData[index];
		}

		/**
		 * Updates the finger data for a particular event object
		 * @param {object} evt The event object containing the touch/finger data to upadte
		 * @return a finger data object.
		 * @inner
		 */
		function updateFingerData(evt) {

			var id = evt.identifier!==undefined ? evt.identifier : 0;
			var f = getFingerData( id );

			f.end.x = evt.pageX||evt.clientX;
			f.end.y = evt.pageY||evt.clientY;

			return f;
		}

		/**
		 * Returns a finger data object by its event ID.
		 * Each touch event has an identifier property, which is used
		 * to track repeat touches
		 * @param {int} id The unique id of the finger in the sequence of touch events.
		 * @return a finger data object.
		 * @inner
		 */
		function getFingerData( id ) {
			for(var i=0; i<fingerData.length; i++) {
				if(fingerData[i].identifier == id) {
					return fingerData[i];
				}
			}
		}

		/**
		 * Creats all the finger onjects and returns an array of finger data
		 * @return Array of finger objects
		 * @inner
		 */
		function createAllFingerData() {
			var fingerData=[];
			for (var i=0; i<=5; i++) {
				fingerData.push({
					start:{ x: 0, y: 0 },
					end:{ x: 0, y: 0 },
					identifier:0
				});
			}

			return fingerData;
		}

		/**
		 * Sets the maximum distance swiped in the given direction.
		 * If the new value is lower than the current value, the max value is not changed.
		 * @param {string}  direction The direction of the swipe
		 * @param {int}  distance The distance of the swipe
		 * @inner
		 */
		function setMaxDistance(direction, distance) {
			distance = Math.max(distance, getMaxDistance(direction) );
			maximumsMap[direction].distance = distance;
		}

		/**
		 * gets the maximum distance swiped in the given direction.
		 * @param {string}  direction The direction of the swipe
		 * @return int  The distance of the swipe
		 * @inner
		 */
		function getMaxDistance(direction) {
			return maximumsMap[direction].distance;
		}

		/**
		 * Creats a map of directions to maximum swiped values.
		 * @return Object A dictionary of maximum values, indexed by direction.
		 * @inner
		 */
		function createMaximumsData() {
			var maxData={};
			maxData[LEFT]=createMaximumVO(LEFT);
			maxData[RIGHT]=createMaximumVO(RIGHT);
			maxData[UP]=createMaximumVO(UP);
			maxData[DOWN]=createMaximumVO(DOWN);

			return maxData;
		}

		/**
		 * Creates a map maximum swiped values for a given swipe direction
		 * @param {string} The direction that these values will be associated with
		 * @return Object Maximum values
		 * @inner
		 */
		function createMaximumVO(dir) {
			return {
				direction:dir,
				distance:0
			}
		}


		//
		// MATHS / UTILS
		//

		/**
		 * Calculate the duration of the swipe
		 * @return int
		 * @inner
		 */
		function calculateDuration() {
			return endTime - startTime;
		}

		/**
		 * Calculate the distance between 2 touches (pinch)
		 * @param {point} startPoint A point object containing x and y co-ordinates
		 * @param {point} endPoint A point object containing x and y co-ordinates
		 * @return int;
		 * @inner
		 */
		function calculateTouchesDistance(startPoint, endPoint) {
			var diffX = Math.abs(startPoint.x - endPoint.x);
			var diffY = Math.abs(startPoint.y - endPoint.y);

			return Math.round(Math.sqrt(diffX*diffX+diffY*diffY));
		}

		/**
		 * Calculate the zoom factor between the start and end distances
		 * @param {int} startDistance Distance (between 2 fingers) the user started pinching at
		 * @param {int} endDistance Distance (between 2 fingers) the user ended pinching at
		 * @return float The zoom value from 0 to 1.
		 * @inner
		 */
		function calculatePinchZoom(startDistance, endDistance) {
			var percent = (endDistance/startDistance) * 1;
			return percent.toFixed(2);
		}


		/**
		 * Returns the pinch direction, either IN or OUT for the given points
		 * @return string Either {@link $.fn.swipe.directions.IN} or {@link $.fn.swipe.directions.OUT}
		 * @see $.fn.swipe.directions
		 * @inner
		 */
		function calculatePinchDirection() {
			if(pinchZoom<1) {
				return OUT;
			}
			else {
				return IN;
			}
		}


		/**
		 * Calculate the length / distance of the swipe
		 * @param {point} startPoint A point object containing x and y co-ordinates
		 * @param {point} endPoint A point object containing x and y co-ordinates
		 * @return int
		 * @inner
		 */
		function calculateDistance(startPoint, endPoint) {
			return Math.round(Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)));
		}

		/**
		 * Calculate the angle of the swipe
		 * @param {point} startPoint A point object containing x and y co-ordinates
		 * @param {point} endPoint A point object containing x and y co-ordinates
		 * @return int
		 * @inner
		 */
		function calculateAngle(startPoint, endPoint) {
			var x = startPoint.x - endPoint.x;
			var y = endPoint.y - startPoint.y;
			var r = Math.atan2(y, x); //radians
			var angle = Math.round(r * 180 / Math.PI); //degrees

			//ensure value is positive
			if (angle < 0) {
				angle = 360 - Math.abs(angle);
			}

			return angle;
		}

		/**
		 * Calculate the direction of the swipe
		 * This will also call calculateAngle to get the latest angle of swipe
		 * @param {point} startPoint A point object containing x and y co-ordinates
		 * @param {point} endPoint A point object containing x and y co-ordinates
		 * @return string Either {@link $.fn.swipe.directions.LEFT} / {@link $.fn.swipe.directions.RIGHT} / {@link $.fn.swipe.directions.DOWN} / {@link $.fn.swipe.directions.UP}
		 * @see $.fn.swipe.directions
		 * @inner
		 */
		function calculateDirection(startPoint, endPoint ) {
			var angle = calculateAngle(startPoint, endPoint);

			if ((angle <= 45) && (angle >= 0)) {
				return LEFT;
			} else if ((angle <= 360) && (angle >= 315)) {
				return LEFT;
			} else if ((angle >= 135) && (angle <= 225)) {
				return RIGHT;
			} else if ((angle > 45) && (angle < 135)) {
				return DOWN;
			} else {
				return UP;
			}
		}


		/**
		 * Returns a MS time stamp of the current time
		 * @return int
		 * @inner
		 */
		function getTimeStamp() {
			var now = new Date();
			return now.getTime();
		}



		/**
		 * Returns a bounds object with left, right, top and bottom properties for the element specified.
		 * @param {DomNode} The DOM node to get the bounds for.
		 */
		function getbounds( el ) {
			el = $(el);
			var offset = el.offset();

			var bounds = {
				left:offset.left,
				right:offset.left+el.outerWidth(),
				top:offset.top,
				bottom:offset.top+el.outerHeight()
			}

			return bounds;
		}


		/**
		 * Checks if the point object is in the bounds object.
		 * @param {object} point A point object.
		 * @param {int} point.x The x value of the point.
		 * @param {int} point.y The x value of the point.
		 * @param {object} bounds The bounds object to test
		 * @param {int} bounds.left The leftmost value
		 * @param {int} bounds.right The righttmost value
		 * @param {int} bounds.top The topmost value
		 * @param {int} bounds.bottom The bottommost value
		 */
		function isInBounds(point, bounds) {
			return (point.x > bounds.left && point.x < bounds.right && point.y > bounds.top && point.y < bounds.bottom);
		};


	}




	/**
	 * A catch all handler that is triggered for all swipe directions.
	 * @name $.fn.swipe#swipe
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user swiped in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user swiped
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 */




	/**
	 * A handler that is triggered for "left" swipes.
	 * @name $.fn.swipe#swipeLeft
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user swiped in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user swiped
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 */

	/**
	 * A handler that is triggered for "right" swipes.
	 * @name $.fn.swipe#swipeRight
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user swiped in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user swiped
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 */

	/**
	 * A handler that is triggered for "up" swipes.
	 * @name $.fn.swipe#swipeUp
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user swiped in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user swiped
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 */

	/**
	 * A handler that is triggered for "down" swipes.
	 * @name $.fn.swipe#swipeDown
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user swiped in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user swiped
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 */

	/**
	 * A handler triggered for every phase of the swipe. This handler is constantly fired for the duration of the pinch.
	 * This is triggered regardless of swipe thresholds.
	 * @name $.fn.swipe#swipeStatus
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {string} phase The phase of the swipe event. See {@link $.fn.swipe.phases}
	 * @param {string} direction The direction the user swiped in. This is null if the user has yet to move. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user swiped. This is 0 if the user has yet to move.
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 */

	/**
	 * A handler triggered for pinch in events.
	 * @name $.fn.swipe#pinchIn
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user pinched in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user pinched
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 * @param {int} zoom The zoom/scale level the user pinched too, 0-1.
	 */

	/**
	 * A handler triggered for pinch out events.
	 * @name $.fn.swipe#pinchOut
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user pinched in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user pinched
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 * @param {int} zoom The zoom/scale level the user pinched too, 0-1.
	 */

	/**
	 * A handler triggered for all pinch events. This handler is constantly fired for the duration of the pinch. This is triggered regardless of thresholds.
	 * @name $.fn.swipe#pinchStatus
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {int} direction The direction the user pinched in. See {@link $.fn.swipe.directions}
	 * @param {int} distance The distance the user pinched
	 * @param {int} duration The duration of the swipe in milliseconds
	 * @param {int} fingerCount The number of fingers used. See {@link $.fn.swipe.fingers}
	 * @param {int} zoom The zoom/scale level the user pinched too, 0-1.
	 */

	/**
	 * A click handler triggered when a user simply clicks, rather than swipes on an element.
	 * This is deprecated since version 1.6.2, any assignment to click will be assigned to the tap handler.
	 * You cannot use <code>on</code> to bind to this event as the default jQ <code>click</code> event will be triggered.
	 * Use the <code>tap</code> event instead.
	 * @name $.fn.swipe#click
	 * @event
	 * @deprecated since version 1.6.2, please use {@link $.fn.swipe#tap} instead
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {DomObject} target The element clicked on.
	 */

	/**
	 * A click / tap handler triggered when a user simply clicks or taps, rather than swipes on an element.
	 * @name $.fn.swipe#tap
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {DomObject} target The element clicked on.
	 */

	/**
	 * A double tap handler triggered when a user double clicks or taps on an element.
	 * You can set the time delay for a double tap with the {@link $.fn.swipe.defaults#doubleTapThreshold} property.
	 * Note: If you set both <code>doubleTap</code> and <code>tap</code> handlers, the <code>tap</code> event will be delayed by the <code>doubleTapThreshold</code>
	 * as the script needs to check if its a double tap.
	 * @name $.fn.swipe#doubleTap
	 * @see  $.fn.swipe.defaults#doubleTapThreshold
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {DomObject} target The element clicked on.
	 */

	/**
	 * A long tap handler triggered when a user long clicks or taps on an element.
	 * You can set the time delay for a long tap with the {@link $.fn.swipe.defaults#longTapThreshold} property.
	 * @name $.fn.swipe#longTap
	 * @see  $.fn.swipe.defaults#longTapThreshold
	 * @event
	 * @default null
	 * @param {EventObject} event The original event object
	 * @param {DomObject} target The element clicked on.
	 */

})(jQuery);
(function ( $, window, undefined ) {
	var CORE = window.SEO_Slides,
		document = window.document,
		notesOverlay = document.querySelector( '.deck-notes-overlay' ),
		$d = $( document ),
		$html = $( 'html' ),
		$body = $( 'body' ),
		youtube_players = [],
		vimeo_players = [];

	CORE.isEmbeded = false;
	if ( window.self !== window.top ) {
		CORE.isEmbeded = true;

		var body = document.getElementsByTagName( 'body' )[0];
		body.className += ' embeded';

		var head  = window.document.getElementsByTagName('head')[0],
			title = window.document.getElementsByTagName('title')[0],
			base  = window.document.createElement('base');

		base.target = '_parent';
		head.insertBefore(base, title.nextSibling);
	}

	/**
	 * Process slide content upon navigation.
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function process_content( e, from, to ) {
		$.deck( '.slide' );

		CORE.resizeCanvas();

		$( 'section.slide' ).each( function () {
			var $this = $( this ).backstretchShort();

			CORE.processPlugins( $( '.slide-body > div', $this ) );
		} );
	}

	/**
	 * If Google Analytics tracking is installed, fire a pageview event.
	 *
	 * @global {Object} _gaq
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function google_track( e, from, to ) {
		if ( undefined === window._gaq ) {
			return;
		}

		var location = window.location.pathname;

		// Track the pageview
		window._gaq.push( ['_trackPageView', location ] );
	}

	/**
	 * Stop all playing videos.
	 *
	 * @param {Event}  e
	 * @param {Number} from
	 * @param {Number} to
	 */
	function kill_videos( e, from, to ) {

		var command = window.JSON.stringify( { event: 'command', func: 'pauseVideo', method: 'pause' } );

		$( '.seoslides-iframe-video' ).each( function( i, player ) {
			if ( null === player.contentWindow ) {
				return;
			}

			player.contentWindow.postMessage( command, 'https://www.youtube.com' );
		} );
	}

	function loadContent() {
		process_content();

		var presentation_url = $( 'link[rel=canonical]' ).attr( 'href' ),
			lastChar = presentation_url.substr( -1 ),
			allslides_url;

		if ( '/' === lastChar ) {
			allslides_url = presentation_url + 'allslides/';
		} else {
			allslides_url = presentation_url + '/allslides/';
		}

		// By default, the single page *only* contains the content of the current slide.  We asynchronously load the content
		// of the entire slide deck before firing the rest of the system.
		$.ajax( {
			'type': 'GET',
			'url': allslides_url
		} ).done( function ( data ) {
				if ( true === data.success ) {
					var container = $( '.deck-container' );

					$( document.querySelectorAll( '.overview' ) ).removeClass( 'overview' );
					container.find( 'section' ).remove();
					container.prepend( data.sections );

					process_content();

					var interstitial = document.getElementById( 'loading-interstitial' );
					$( interstitial ).fadeOut( 300, function() {
						interstitial.parentNode.removeChild( interstitial );
					} );
				}
			} );

		// Detect the keypress of F11 so we can detect fullscreen
		$d.unbind( 'keyup.fullscreen' ).bind( 'keyup.fullscreen', function(e) {
			var $body = $( 'body' );
			if ( 122 === e.which && !CORE.isEmbeded ) {
				$body.toggleClass('fullscreen');
				CORE.resizeCanvas();
			}
		} );

		// Set up jQuery events
		$d.on( 'deck.change', google_track );
		$d.on( 'deck.change', kill_videos );
	}

	/**
	 * Make sure dynamically-sized elements are resized after we change the size of the canvas.
	 *
	 * This will involve embeded iframes, the notes container, and embedded branding.
	 *
	 * @param {*} context
	 */
	function resize_elements( context ) {
		$( '.seoslides_responsive', context ).responsiveText();

		var node = document.querySelector( '.deck-current' );
		if ( null !== node ) {
			var $node = $( node ),
				left = $node.offset().left + 5, // Left offset + Padding
				width = $node.width(),
				height = $node.height();

			// Resize iframes
			var images = document.querySelectorAll( '.seoslides_iframe_thumb' );
			for ( var i = 0, l = images.length; i < l; i++ ) {
				var image = images[ i ];

				$( image ).siblings( 'p.video-no-mobile' ).css( 'display', 'none' );
			}

			// Resize notes
			var notes = document.querySelector( '.note-container' );
			if ( notes !== notes ) {
				notes.style.height = height - 130 + 'px';
			}
		}
	}

	/**
	 * Play a video in a modal overlay
	 *
	 * @param {Event} event
	 */
	function play_video( event ) {
		var $this = $( this ),
			close_video,
			video = this.getAttribute( 'data-embed' ),
			content = document.createElement( 'iframe' );

		content.width = '100%';
		content.height = '100%';
		content.src = video;
		content.className = 'seoslides-iframe-video';

		var overlay = CORE.createElement( 'div', {
			'appendTo': document.body
		} );
		overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #000;z-index: 159900;';

		var $overlay = $( overlay );
		$overlay.css( 'opacity', 0.7 ).on( 'click', close_video );

		var modal = CORE.createElement( 'div', {
			'appendTo': document.body
		} );
		modal.style.cssText = 'position: fixed; top: 30px; left: 30px; right: 30px; bottom: 30px; background-color: #fff; z-index: 160000;';

		var closer = CORE.createElement( 'a', {
			'attr':     [
				['class', 'seoslides-iframe-close'],
				['href', '#']
			],
			'appendTo': modal
		} );
		$( closer ).on( 'click', function ( e ) { e.preventDefault(); close_video(); } );

		var closeSpan = CORE.createElement( 'span', {
			'appendTo': closer
		} );

		close_video = function() {
			$( modal ).remove();
			$overlay.remove();
		};

		modal.appendChild( content );

		$d.on( 'deck.change', close_video );
	}

	// Set up DeckJS Defaults
	$.extend( true, $.deck.defaults, {
		selectors: {
			hashLink: '.deck-permalink'
		},

		hashPrefix:            '',
		preventFragmentScroll: true
	} );

	// Set up events
	CORE.Events.addAction( 'debounced.canvas.resize', resize_elements );
	$d.on( 'click', '.seoslides_iframe_play', play_video );

	// Let's run things
	loadContent();

} )( jQuery, this );
(function ( window, $, undefined ) {
	var document = window.document,
		CORE = window.SEO_Slides,
		$d = $( document ),
		$html = $( 'html' ),
		$body = $( 'body' ),
		$footer = $d.find( '.deck-footer' ),
		$footer_height = $footer.height(),
		$extras = $d.find( '.extras' ),
		embed_code;

	/**
	 * The Embed_Code object handles all events and interactions with the standard footer overlays.
	 *
	 * It's called "embed code" because it originally only controlled the script and shortcode embeds.
	 *
	 * @constructor
	 */
	function Embed_Code() {
		var SELF = this,
			deck_container = $( 'article.deck-container' ),
			trigger = '';

		/**
		 * Get the embed script for the current slide.
		 *
		 * @param {object} data
		 * @returns {string}
		 */
		function get_code( data ) {
			var code = '<script id="' + data.embed_id + '" type="text/javascript" src="' + data.embed_url + '"></script>';
			code += '<span id="seoslides-embed-' + data.embed_id + '"><a href="' + data.overview + '">' + data.slide_title + '</a> from <a href="' + data.site_url + '">' + data.site_title + '</a>' + '</span>';
			code = CORE.Events.applyFilter( 'seoslides.embed_code', code );

			return code;
		}

		/**
		 * Get the WordPress shortcode for the current slide.
		 *
		 * @param {object} data
		 * @returns {string}
		 */
		function get_shortcode( data ) {
			var code = '[seoslides embed_id="' + data.embed_id + '"';
			code += ' script_src="' + data.embed_url + '"';
			code += ' overview_src="' + data.overview + '"';
			code += ' title="' + data.slide_title + '"';
			code += ' site_src="' + data.site_url + '"';
			code += ' site_title="' + data.site_title + '"';
			code += ' /]';

			code = CORE.Events.applyFilter( 'seoslides.embed_shortcode', code );

			return code;
		}

		/**
		 * Reset container elements to their default state.
		 *
		 * @param {object} $container
		 * @param {bool}   stay_open  Whether or not the overlay should remain open. Default assumes true.
		 */
		function reset_container( $container, stay_open ) {
			if ( undefined === stay_open || ! stay_open ) {
				$container.removeClass( 'opened' );
				$footer.removeClass( 'opened' );
				$extras.removeClass( 'opened' );
			}

			$container.find( 'aside, .embed-input' ).addClass( 'hidden' );
			$container.find( 'aside.current' ).removeClass( 'current' );
			$container.find( 'aside.default' ).addClass( 'current' );
			$container.find( 'aside.default, input.default' ).removeClass( 'hidden' );

			load_embed_code( $container[0] );
		}

		/**
		 * Load the embed code into the input field if we're on an embedable overlay.
		 *
		 * @param {HTMLElement} container
		 * @param {string}      slide_link
		 */
		function load_embed_code( container, slide_link ) {
			var input = container.querySelector( '.embed-input' ),
				$container = $( container ),
				$input = $( input ),
				embed_data;

			// If no link was passed in, try to grab it from the anchor wrapping the slide.
			if ( undefined === slide_link ) {
				slide_link = $container.closest( 'a' ).attr( 'href' );
			}

			// If no anchor is wrapping the slide, we must be actually viewing a slide. Grab the current location.
			if ( undefined === slide_link ) {
				slide_link = window.location.href;
			}

			embed_data = {
				embed_id: input.getAttribute( 'id' ),
				embed_url: slide_link.replace( /\/(slides|embeds)\//, '/embed-script/').replace( /\/share\//, '/'),
				overview: window.location.href.replace( /\/share\//, '/'),
				slide_title: input.getAttribute( 'data-title' ),
				site_title: input.getAttribute( 'data-site' ),
				site_url: input.getAttribute( 'data-siteurl' )
			};

			// Find out whether we're using the WordPress shortcode or the script embed
			var activeElement = container.querySelector( 'aside.current' );
			if ( activeElement.className.match( /(^| )wordpress-embed-instructions( |$)/ ) ) {
				$input.val( get_shortcode( embed_data ) );
			} else if ( activeElement.className.match( /(^| )script-embed-instructions( |$)/) ) {
				$input.val( get_code( embed_data ) );
			}
		}

		/**
		 * Switch from one overlay to another based on the footer button being clicked.
		 *
		 * @param {object} $container
		 * @param {object} $target
		 */
		function switchOverlay( $container, $target ) {
			$container.find( 'aside.current' ).removeClass( 'current' );

			if ( $target.hasClass( 'seoslides' ) ) {
				$container.find( 'aside.wordpress-embed-instructions' ).addClass( 'current' );
				load_embed_code( $container[0] );
				$container.find( '.embed-input' ).show();
			} else if ( $target.hasClass( 'link' ) ) {
				$container.find( 'aside.script-embed-instructions' ).addClass( 'current' );
				load_embed_code( $container[0] );
				$container.find( '.embed-input' ).show();
			} else if ( $target.hasClass( 'notes' ) ) {
				$container.find( 'aside.note' ).addClass( 'current' );
				$container.find( '.embed-input' ).hide();
			}
		}

		/**
		 * Share the presentation on one of the 3 default social networks.
		 *
		 * @param {Event} event
		 */
		SELF.sharePresentation = function( event ) {
			var $target = $( event.target ),
				me = window.self;

			// Get the URL to share
			var url = me.location.href,
				title = encodeURIComponent( document.title );

			url = url.replace( me.location.origin + '/embeds/', me.location.origin + '/slides/' );
			url = encodeURIComponent( url );

			if ( $target.hasClass( 'facebook' ) ) {
				window.open( 'https://www.facebook.com/sharer/sharer.php?s=100&p[url]=' + url + '&p[title]=' + title + '&p[summary]=' + title, 'sharer','toolbar=0,status=0,width=580,height=325' );
			} else if ( $target.hasClass( 'google' ) ) {
				window.open( 'https://plus.google.com/share?url=' + url, 'google', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600' );
			} else if ( $target.hasClass( 'twitter' ) ) {
				window.open( 'https://twitter.com/intent/tweet?url=' + url + '&text=' + title + '&via=seoslides', 'twitter', 'toolbar=0,status=0,width=580,height=250' );
			}
		};

		/**
		 * Open the overlay from a footer trigger.
		 *
		 * @param {Event} event
		 */
		SELF.open_footer_embed = function ( event ) {
			event.preventDefault();
			var container = document.querySelector( '.deck-current .embed-container' ),
				$container = $( container ),
				$target = $( event.target );

			if ( $container.hasClass( 'opened' ) ) {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
				return;
			}

			if ( $target.hasClass( 'seoslides' ) ) {
				trigger = 'seoslides';
			} else if ( $target.hasClass( 'link' ) ) {
				trigger = 'link';
			} else if ( $target.hasClass( 'notes' ) ) {
				trigger = 'notes';
			}

			reset_container( $container, false );

			// Make sure the correct element is selected
			switchOverlay( $container, $target );

			$container.addClass( 'opened' );
			$footer.addClass( 'opened' );
			$extras.addClass( 'opened' );

			$d.on( 'deck.change', function() {
				reset_container( $container );

				CORE.Events.doAction( 'embed.close', container );
			} );

			CORE.Events.doAction( 'embed.open', container );
		};

		/**
		 * Make sure that clicking on the input field for the embed code doesn't cancel out the overlay.
		 *
		 * @param {Event} event
		 */
		SELF.cancel_click_on_embed = function ( event ) {
			var srcElement = event.target || event.srcElement;

			if ( srcElement.className.match( /(^| )embed-input( |$)/ ) ) {
				event.preventDefault();
			}
		};

		/**
		 * Handle any clicks within the fotter container.
		 *
		 * @param {Event} event
		 */
		SELF.click_on_container = function( event ) {
			var container = document.querySelector( '.deck-current .embed-container' ),
				$container = $( container ),
				$target = $( event.target );

			if ( $target.hasClass( trigger ) ) {
				// Don't stop the close events
			} else if ( $container.hasClass( 'opened' ) && $target.hasClass( 'overlay' ) ) {
				event.preventDefault();
				event.stopImmediatePropagation();

				if ( $target.hasClass( 'seoslides' ) ) {
					trigger = 'seoslides';
				} else if ( $target.hasClass( 'link' ) ) {
					trigger = 'link';
				} else if ( $target.hasClass( 'notes' ) ) {
					trigger = 'notes';
				}

				switchOverlay( $container, $target );
			} else if ( $container.hasClass( 'opened' ) && $target.hasClass( 'ssi' ) && $target.hasClass( 'social' ) ) {
				SELF.sharePresentation( event );

				CORE.Events.doAction( 'embed.close', container );
			}
		};

		/**
		 * Allow viewers to close the overlay with the ESC button.
		 *
		 * @param {Event} event
		 */
		SELF.close_on_escape = function( event ) {
			if ( 27 === event.keyCode ) {
				var container = document.querySelector( '.deck-current .embed-container' ),
					$container = $( container );

				reset_container( $container, false );

				CORE.Events.doAction( 'embed.close', container );
			}
		};

		/**
		 * Handle clicks on non-overlay buttons.
		 *
		 * @param {Event} event
		 */
		SELF.click_on_action = function( event ) {
			var $this = $( this );

			if ( $this.hasClass( 'landing' ) ) {
				window.open( $this.data( 'href' ) );
			} else if ( $this.hasClass( 'embiggen' ) ) {
				var me = window.self,
					embed_url = me.location.href;
				embed_url = embed_url.replace( me.location.origin + '/embeds/', me.location.origin + '/slides/' );

				window.open( embed_url );
			} else if ( $this.hasClass( 'dismiss' ) ) {
				var container = document.querySelector( '.deck-current .embed-container' ),
					$container = $( container );

				reset_container( $container, false );

				CORE.Events.doAction( 'embed.close', container );
			}

			CORE.Events.doAction( 'embed.action', '' );
		};

		/**
		 * Capture mouse movement to make sure we open the footer when required.
		 *
		 * @param {Event} event
		 */
		SELF.mouseopen = function( event ) {
			var $footer_position = parseInt( $footer.css( 'bottom' ), 10 ),
				$window_height = $body.height(),
				threshhold = $window_height - $footer_height;

			// The footer is open. Do nothing.
			if ( $footer_position >= 0 ) {
				return;
			}

			if ( $footer_position < 0 && ! $footer.hasClass( 'sliding' ) ) {
				// bar is hidden and is not currently sliding
				$( function() {
					var nav = $( '.deck-prev-link, .deck-next-link' );

					nav.css( 'opacity', 0 );
					deck_container.addClass( 'shownav' );

					$footer.addClass( 'sliding' ).animate( {
						'bottom' : 0
					}, 200, function () {
						$footer.removeClass( 'sliding' );

						// Swap out events
						$body.off( 'mousemove.footer' );
						$body.on( 'mousemove.footer', debounce( embed_code.mouseclose, 2500 ) );
					} );
					nav.not( '.deck-nav-disabled' ).animate( {
						'opacity': 1
					}, 200, function() {
						nav.css( 'opacity', '' );
					} );
				} );
			}
		};

		/**
		 * Capture mouse movement to make sure we close the footer when required.
		 *
		 * @param {Event} event
		 */
		SELF.mouseclose = function( event ) {
			var $footer_position = parseInt( $footer.css( 'bottom' ), 10 ),
				$window_height = $body.height(),
				threshhold = $window_height - $footer_height;

			// The footer is closed. Do nothing.
			if ( $footer_position < 0 ) {
				return;
			}

			// An overlay is open, do nothing.
			if ( $footer.hasClass( 'opened' ) ) {
				return;
			}

			// If we're hovering over the footer
			if ( event.pageY >= threshhold ) {
				return;
			}

			$( function() {
				var nav = $( '.deck-prev-link, .deck-next-link' );

				$footer.stop().addClass( 'sliding' ).animate( {
					'bottom': ( $footer_height * -1 )
				}, 200, function() {
					$footer.removeClass( 'sliding' ).removeClass( 'opened' );

					// Swap out events
					$body.off( 'mousemove.footer' );
					$body.on( 'mousemove.footer', throttle( embed_code.mouseopen, 250 ) );

					CORE.Events.doAction( 'embed.close', document.querySelector( '.deck-current .embed-container' ) );
				} );

				nav.not( '.deck-nav-disabled' ).animate( {
					'opacity': 0
				}, 200, function() {
					deck_container.removeClass( 'shownav' );
					nav.css( 'opacity', '' );
				} );
			} );
		};
	}

	embed_code = new Embed_Code();

	/**
	 * Throttle events (like mousemove)
	 *
	 * @param {function} fn
	 * @param {number}   threshhold
	 * @param {*}        scope
	 *
	 * @returns {Function}
	 */
	function throttle ( fn, threshhold, scope ) {
		threshhold = threshhold || (threshhold = 250);
		var last,
			deferTimer;
		return function () {
			var context = scope || this;

			var now = + new Date(),
				args = arguments;
			if ( last && now < last + threshhold ) {
				// hold on to it
				window.clearTimeout( deferTimer );
				deferTimer = window.setTimeout( function () {
					last = now;
					fn.apply( context, args );
				}, threshhold );
			} else {
				last = now;
				fn.apply( context, args );
			}
		};
	}

	/**
	 * Debounce events (like mousemove)
	 *
	 * @param {function} fn
	 * @param {number}   delay
	 *
	 * @returns {Function}
	 */
	function debounce( fn, delay ) {
		window.timer = null;

		return function() {
			var context = this,
				args = arguments;

			window.clearTimeout( window.timer );
			window.timer = window.setTimeout( function() {
				fn.apply( context, args );
			}, delay );
		};
	}

	/**
	 * Make sure the embed input field is selected when we open the overlay to facilitate copy-paste.
	 *
	 * Do this in an action callback, though, so we aren't changing the browser focus away from the document element
	 * and thus disabling keyboard navigation.
	 */
	CORE.Events.addAction( 'embed.open', function( container ) {
		var input = container.querySelector( '.embed-input' ), $input = $( input );
		$input.select();
	} );

	$d.on( 'click.embed-input', 'section.slide', embed_code.cancel_click_on_embed );
	$d.on( 'click.embed-overlay', '.ssi, .embed-container', embed_code.click_on_container );
	$d.on( 'keyup.embed-overlay', embed_code.close_on_escape );
	$d.on( 'click.embed-code', '.ssi.social', embed_code.sharePresentation );
	$d.on( 'click.embed-code', '.ssi.overlay', embed_code.open_footer_embed );

	$d.on( 'click.embed-actions', '.ssi.embiggen, .ssi.landing, .ssi.dismiss', embed_code.click_on_action );

	if ( ! $html.hasClass( 'touch' ) ) {
		$body.on( 'mousemove.footer', debounce( embed_code.mouseclose, 2500 ) );
	}
}( this, jQuery ));