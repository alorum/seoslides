(function (window, $, tinymce, undefined) {
	window.seoslides_mce_plugin = window.seoslides_mce_plugin || {};
	var $window = $( window ),
		SELF = window.seoslides_mce_plugin,
		inputs = {},
		rivers = {},
		document = window.document,
		timeToTriggerRiver = 150,
		minRiverAJAXDuration = 200,
		riverBottomThreshold = 5,
		keySensitivity = 100,
		seoslides_embed, River, Query;

	River = function( element, search ) {
		var self = this;
		this.element = element;
		this.ul = element.children( 'ul' );
		this.waiting = element.find( '.river-waiting' );

		this.change( search );
		this.refresh();

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
				response = seoslides_embed.delayedCallback( function( results, params ) {
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
					list += '<input type="hidden" class="item-shortcode" value="' + this['shortcode'] + '" />';
					list += '<span class="item-title">';
					list += this['title'] ? this['title'] : window.wpLinkL10n.noTitle;
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
		ajax:  function ( callback ) {
			var self = this,
				query = {
					action: 'seoslides-embed-ajax',
					page:   this.page,
					nonce:  inputs.nonce
				};

			if ( this.search ) {
				query.search = this.search;
			}

			this.querying = true;

			$.post( window.ajaxurl, query, function ( r ) {
				self.page ++;
				self.querying = false;
				self.allLoaded = ! r;
				callback( r, query );
			}, "json" );
		}
	} );

	seoslides_embed = {
		init: function () {
			inputs.dialog = $(document.getElementById('seoslides-embed'));
			inputs.submit = $(document.getElementById('seoslides-embed-submit'));
			inputs.textarea = $(document.getElementById('seoslides-embed-textarea'));
			inputs.nonce = document.getElementById( 'seoslides-embed-nonce' ).value;
			inputs.search = $( document.getElementById( 'seoslides-search-field' ) );
			$(document.getElementById('seoslides-embed-cancel')).click(function (event) {
				event.preventDefault();
				seoslides_embed.close();
			});
			inputs.submit.click(function (event) {
				event.preventDefault();
				seoslides_embed.update();
			});

			// Build rivers
			rivers.search = new River( $( document.getElementById( 'seoslides-search-results' ) ) );
			rivers.recent = new River( $( document.getElementById( 'seoslides-recent-results' ) ) );
			rivers.elements = $( '.query-results', inputs.dialog );

			// Bind event handlers
			inputs.dialog.on( 'click', '.toggle-arrow', toggle_search );
			inputs.dialog.on( 'wpdialogrefresh', seoslides_embed.refresh );
			inputs.search.on( 'keyup', seoslides_embed.searchInternalLinks );
			rivers.elements.on( 'river-select', seoslides_embed.updateFields );
		},

		refresh: function() {
			// Refresh rivers
			rivers.search.refresh();
			rivers.recent.refresh();

			// Load the most recent results if this is the first time opening the panel.
			if ( ! rivers.recent.ul.children().length ) {
				rivers.recent.ajax();
			}
		},

		searchInternalLinks : function() {
			var t = $( this ),
				waiting,
				search = t.val();

			if ( search.length > 2 ) {
				rivers.recent.hide();
				rivers.search.show();

				// Don't search if the keypress didn't change the title.
				if ( seoslides_embed.lastSearch === search ) {
					return;
				}

				seoslides_embed.lastSearch = search;
				waiting = t.parent().find('.spinner').show();

				rivers.search.change( search );
				rivers.search.ajax( function(){ waiting.hide(); });
			} else {
				rivers.search.hide();
				rivers.recent.show();
			}
		},

		cleanTags: function (text) {
			return text.replace(/<[^>\n]+>/g, function () {
				return '';
			});
		},

		onOpen: function (windowManager, features, params) {
			if (features && features.wpDialog && features.id && features.id === 'seoslides-embed') {
				inputs.textarea.val('');
				var embed = SELF.get_embed(windowManager.editor.selection.getNode());
				if (embed) {
					windowManager.editor.selection.select(embed);
					var shortcode = windowManager.editor.selection.getContent();
					inputs.textarea.val(seoslides_embed.cleanTags(shortcode));
				}
			}
		},

		updateFields: function( e, li, originalEvent ) {
			inputs.textarea.val( li.children( '.item-shortcode' ).val() );
			if ( originalEvent && originalEvent.type === 'click' ) {
				inputs.textarea.focus();
			}
		},

		update: function () {
			var tinyMCEPopup = window.tinyMCEPopup,
					editor = tinyMCEPopup.editor,
					code = inputs.textarea.val(),
					embed = SELF.to_embed(code);

			tinyMCEPopup.restoreSelection();

			if (embed !== code) {
				tinyMCEPopup.execCommand('mceBeginUndoLevel');

				tinyMCEPopup.execCommand('mceInsertRawHtml', true, embed);

				tinyMCEPopup.execCommand('mceEndUndoLevel');
			}

			seoslides_embed.close();
			inputs.textarea.val('');
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
		},

		close: function () {
			window.tinyMCEPopup.close();
			inputs.textarea.val('');
		}
	};

	$(document).ready(seoslides_embed.init);

	/**
	 * Display the form for listing existing presentations.
	 *
	 * @param {Event} e
	 */
	function toggle_search( e ) {
		var $this = $( this ),
			panel = $( document.getElementById( 'seoslides-search-panel' ) ),
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

	function embed_command(editor) {
		editor.windowManager.open({
			id      : 'seoslides-embed',
			width   : 360,
			height  : 'auto',
			wpDialog: true,
			title   : editor.getLang('seoslides.window_title')
		}, {
			plugin_url: SELF.url
		});
	}

	SELF.embed_command = embed_command;

	var old_init = SELF.init || SELF.noop;

	SELF.init = function (editor, src_url) {
		old_init(editor, src_url);

		editor.addCommand('seoslides', function () {
			embed_command(editor);
		});

		editor.addButton('seoslides', {
			title: 'seoslides.button_desc',
			cmd  : 'seoslides',
			image: SELF.image_url('tinymce-button.png')
		});

		editor.onNodeChange.add(function (editor, controlManager, node) {
			var embed = SELF.get_embed(node),
					is_embed = !!embed;
			controlManager.setActive('seoslides', is_embed);
			if (is_embed) {
				controlManager.setActive('link', false);
			}
		});

		editor.onBeforeRenderUI.add(function () {
			editor.windowManager.onOpen.add(seoslides_embed.onOpen);
		});
	};
}(this, this.jQuery, this.tinymce || {}));