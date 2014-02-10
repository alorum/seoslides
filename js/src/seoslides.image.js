/*global jQuery */
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
			var url = isUrlValid( data.settings.content ) ? data.settings.content : '';

			control += '<div style="position:absolute;top:0;bottom:0;left:0;right:0;">';
			control += '<img style="height:100%;width:100%;" class="plugin-image" data-content="' + data.settings.content + '" src="' + url + '" />';
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
