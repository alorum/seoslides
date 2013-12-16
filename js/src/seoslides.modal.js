/*global jQuery */
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

		window.SEO_Slides.Events.addAction( 'plugin.setData', function() {
			clean = false;
		} );

		window.SEO_Slides.Events.addAction( 'modal.saved', function() {
			clean = true;
		} );

		setDefaults();
	};
} )( this, jQuery );
