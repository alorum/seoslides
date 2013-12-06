/*global jQuery */
( function( window, $, undefined ) {
	var document = window.document,
		CORE = window.SEO_Slides,
		INTERNALS = window.seoslides;

	/**
	 * Image Picker object
	 *
	 * Uses WordPress Thickbox JS overlay.
	 *
	 * @param {String} label
	 * @param {Object} picker
	 * @constructor
	 */
	CORE.ImagePicker = function( label, picker ) {
		var SELF = this;

		SELF.editor_store = undefined;
		SELF.ifWindow = undefined;
		SELF.fileQueued = undefined;

		/**
		 * Handle the selection of an image.
		 *
		 * @param {String} html
		 */
		function send_handler( html ) {
			var mediaPath = jQuery( html ).attr( 'href' );

			// Remove the modal overlay
			window.tb_remove();

			// Restore original handlers
			window.send_to_editor = SELF.editor_store;
			SELF.ifWindow.fileQueued = SELF.fileQueued;

			// Trigger internal change event
			SELF.changed( mediaPath );
		}

		/**
		 * Our custom click event handler
		 *
		 * @param {Event} e
		 */
		SELF.launchOverlay = function( e ) {
			e.preventDefault();

			SELF.editor_store = window.send_to_editor;

			// Set up our new handler
			window.send_to_editor = send_handler;

			// Show the overlay
			window.tb_show( label, 'media-upload.php?type=image&TB_iframe=1&width=640&height=263' );

			$( 'iframe#TB_iframeContent' ).load( SELF.loaded );
		};

		/**
		 * Override this function to do some magic after an image is selected.
		 *
		 * @param {String} newUri The new image URL.
		 *
		 * @return {Boolean}
		 */
		SELF.changed = function( newUri ) {
			return false;
		};

		/**
		 * Override this function to do some magic after the iFrame is loaded
		 *
		 * @returns {Boolean}
		 */
		SELF.loaded = function() {
			return false;
		};
	};

	/**
	 * Check if a file extension is inclided in a particular array.
	 *
	 * @param {Array}  extArray
	 * @param {String} src
	 * @returns {Boolean}
	 */
	function isExtensionMatch( extArray, src ) {
		var ext = src.split( '.' ).pop();
		ext = ext.toLowerCase();

		for ( var i = 0; i < extArray.length; i++ ) {
			var extension = extArray[i];

			if ( ext === extension ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Check if a file name is that of an image.
	 *
	 * @param {String} src
	 * @returns {Boolean}
	 */
	CORE.ImagePicker.prototype.isImage = function( src ) {
		var extensions = [ 'jpg', 'jpeg', 'png', 'gif' ];
		extensions = CORE.Events.applyFilter( 'media.image.extensions', extensions );

		return isExtensionMatch( extensions, src );
	};

	/**
	 * Check if a file name is that of a video.
	 *
	 * @param {String} src
	 * @returns {Boolean}
	 */
	CORE.ImagePicker.prototype.isVideo = function( src ) {
		var extensions = [ 'mp4', 'm4v', 'webm', 'ogv', 'wmv', 'flv' ];
		extensions = CORE.Events.applyFilter( 'media.video.extensions', extensions );

		return isExtensionMatch( extensions, src );
	};

	/**
	 * Object that intercepts the input of remote file URLs and verifies they are actually video URLs.
	 * Used to override the default onblur event of the 'src' element in Thickbox.
	 *
	 * @constructor
	 */
	CORE.ImagePicker.MediaFilter = function( ifWindow ) {
		var SELF = this;

		SELF.getData = function() {
			var src = ifWindow.document.forms[0].src.value,
				img = ifWindow.document.getElementById( 'status_img' );

			if ( ! src ) {
				SELF.reset();
				return false;
			}

			img.innerHTML = '<img src="' + INTERNALS.thickbox_spinner + '" alt="" width="16" />';

			if ( CORE.ImagePicker.prototype.isVideo( src ) ) {
				SELF.update();
			} else {
				SELF.reset();
			}
		};

		SELF.update = function() {
			ifWindow.document.getElementById( 'insertonlybutton' ).style.color = '#333';
			ifWindow.document.getElementById( 'status_img' ).innerHTML = '<img src="' + INTERNALS.thickbox_yes + '" alt="" />';
		};

		SELF.reset = function() {
			var img = ifWindow.document.getElementById( 'status_img' );

			ifWindow.document.getElementById( 'insertonlybutton' ).style.color = '#bbb';

			if ( ! ifWindow.document.forms[0].src.value ) {
				img.innerHTML = '*';
			} else {
				img.innerHTML = '<img src="' + INTERNALS.thickbox_noimage + '" alt="" />';
			}
		};
	};
} )( this, jQuery );