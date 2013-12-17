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