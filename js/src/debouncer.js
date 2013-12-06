/*global window, document, _, jQuery, Backbone, seoslides */
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