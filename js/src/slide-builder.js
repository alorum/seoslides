/*global jQuery */
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
