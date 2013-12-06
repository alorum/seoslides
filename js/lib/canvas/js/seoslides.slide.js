( function( window, $, undefined ) {
	var document = window.document;

	var Slide = function( CORE, BUCKET, SLIDE_ID, SLIDESET ) {
		var SELF = this;
		var FULL_SIZE = { height: 0, width: 0 };
		var ELEMENT = false;
		var $ELEMENT = false;
		var BUCKET_POSITION = 'middle';
		var ANIMATION_TIME = 250;
		var LOADED_AND_ANIMATED = false;
		var SIDE_SLIDE_WIDTH = 20;
		var SLIDE = false;

		var _initialize = function() {
			_getSlideFromServer();
			_resizeSlide();
			_createSlide();
			_bindEvents();
		};
		var _bindEvents = function() {
			CORE.Events.addAction( 'bucket.resize', _resizeSlide );
		};
		var _createSlide = function() {
			var slide = document.createElement( 'div' );
			slide.className = 'bucket-slide';

			// find the center of the bucket, etc
			var bucketWidth = parseInt( BUCKET.style.width, 10 );
			var bucketHeight = parseInt( BUCKET.style.height, 10 );
			var left = ( ( bucketWidth / 2 ) - ( FULL_SIZE.width / 2 ) );
			var top = ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) );

			slide.style.cssText = 'height: ' + FULL_SIZE.height + 'px;width: ' + FULL_SIZE.width + 'px;left:' + left + 'px;top:' + top + 'px;';
			BUCKET.appendChild( slide );

			// cache this slide's main element
			ELEMENT = slide;
			$ELEMENT = $( slide );

			// now animate it to the fullsize
			$ELEMENT.css( 'opacity', 0.00 ).animate( {
				//height:  FULL_SIZE.height,
				//width:   FULL_SIZE.width,
				//top:     ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) ),
				//left:    ( ( bucketWidth / 2 ) - ( FULL_SIZE.width / 2 ) ),
				opacity: 1.00
			}, ANIMATION_TIME, 'linear', function () {
				$( document.querySelector( '.bucket-slide' ) ).backstretchShort();
				CORE.Events.doAction( 'slide.receivedData', SLIDE );
				CORE.Events.doAction( 'slide.resized', SLIDE );
			} );
		};
		var _resizeSlide = function() {
			var bucketHeight = parseInt( BUCKET.style.height, 10 );
			var bucketWidth = parseInt( BUCKET.style.width, 10 );
			var widthMargin = 50;
			var style = ELEMENT.style;

			if( BUCKET_POSITION === 'middle' ) {
				FULL_SIZE.width = bucketWidth - ( widthMargin * 2 );
				FULL_SIZE.height = FULL_SIZE.width / 1.77778;

				if( ELEMENT !== false ) {
					style.left = ( ( bucketWidth / 2 ) - ( FULL_SIZE.width / 2 ) ) + 'px';
					style.top = ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) ) + 'px';
				}
			}
			else if( BUCKET_POSITION === 'left' ) {
				FULL_SIZE.width = SIDE_SLIDE_WIDTH;
				FULL_SIZE.height = ( bucketWidth - ( widthMargin * 2 ) ) / 1.77778;

				if( ELEMENT !== false ) {
					style.top = ( ( bucketHeight / 2 ) - ( FULL_SIZE.height / 2 ) ) + 'px';
				}
			}

			if( ELEMENT !== false ) {
				style.width = FULL_SIZE.width + 'px';
				style.height = FULL_SIZE.height + 'px';
			}
		};
		var _getSlideFromServer = function() {
			var options = {
				'data': {
					'action': 'get-slide',
					'slide': SLIDE_ID,
					'slideset': SLIDESET
				}
			};

			CORE.ajax( options ).done( function( data ) {
				SLIDE = data;

				CORE.Events.doAction( 'slide.receivedData', data );
			} );
		};

		SELF.getElement = function() {
			return $ELEMENT;
		};
		SELF.setBucketPosition = function( position ) {
			BUCKET_POSITION = position;
		};

		_initialize();
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Slide = Slide;
} )( window, jQuery );