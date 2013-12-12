/*global window, jQuery */
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
