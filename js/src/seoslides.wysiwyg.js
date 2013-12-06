/*global jQuery */
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
						}
					}
				}
			);

			SEO_Slides.inline_editors.push( editor_instance );
		} )( $element );
	};

} )( this, jQuery );