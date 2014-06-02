/*global window, document, _, jQuery, Backbone, seoslides */
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

		var title = '<div class="title"><strong><a data-id="master" class="editslide" href="javascript:void;" title="' + I18N.label_master + '">' + I18N.label_master + '</a></strong></div>';
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
				'title':    $( document.getElementById( 'titlewrap' ) ).find( 'input[name="post_title"]' ).val(),
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

		if ( undefined !== data.bg_image && null !== data.bg_image && '' !== data.bg_image.trim() && 'noimage' !== data.bg_image.trim() ) {
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

	function ModalContainer() {
		// Container for the media modal created to add from the gallery
		var modal;

		/**
		 * Ensure the modal exists - if not, create it.
		 *
		 * @private
		 */
		function _ensureModal() {
			if ( undefined === modal ) {
				modal = window.wp.media( {
					title: I18N.modal_title,
					button: {
						text: I18N.modal_button
					},
					multiple: 'add'
				} );
			}
		}

		/**
		 * Open the modal
		 */
		function openModal() {
			_ensureModal();
			modal.open();
		}

		/**
		 * Add a callback to the modal for selection purposes.
		 *
		 * @param {Function} callback
		 */
		function addModalCallback( callback ) {
			_ensureModal();
			modal.on( 'select', _wrapModalCallback( callback ) );
		}

		/**
		 * Wrap a callback function.
		 *
		 * @param {Function} callback
		 *
		 * @returns {Function}
		 * @private
		 */
		function _wrapModalCallback( callback ) {
			return function() {
				callback( modal.state().get( 'selection' ).toJSON() );
			};
		}

		return {
			open: openModal,
			addCallback: addModalCallback
		};
	}

	$( document.getElementById( 'add-from-media' ) ).on( 'click', function ( e ) {
		e.preventDefault();

		var modal_container = new ModalContainer();

		// After the images are added, we'll build an array of image IDs and POST them back
		// to WordPress for slide generation.
		modal_container.addCallback( function( elements ) {
			var element_ids = [];

			$.map( elements, function( item ) {
				element_ids.push( item.id );
			} );

			var options = {
				'data':   {
					'action':   'create-media-slides',
					'slides':   element_ids,
					'_nonce':   INTERNALS.media_nonce,
					'slideset': INTERNALS.slideset
				}
			};

			CORE.ajax( options ).done( function( data ) {
				for( var i = 0; i < data.length; i++ ) {
					var slide = data[ i ],
						slide_id = slide.id;

					CORE.Events.doAction( 'seoslides.slideAdded', slide_id );
				}
			} );
		} );
		modal_container.open();
	} );

})( this, jQuery );