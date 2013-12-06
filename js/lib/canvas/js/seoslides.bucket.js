( function( window, $, undefined ) {
	var document = window.document;

	var Bucket = function( CORE ) {
		var SELF = this;
		var UI = {};
		var CURRENT_SLIDES = {
			left : false,
			middle : false,
			right : false
		};
		var ANIMATION_TIME = 500;
		var SIDE_SLIDE_WIDTH = 20;
		var MOUSE_POS = { x : 0, y : 0 };

		SELF.initialize = function( container ) {
			UI.BUCKET = container;
			UI.$BUCKET = $( container );
			_bindEvents();
			_resizeBucket();
			//_createControls();

			CORE.Events.doAction( 'core.init' );
		};

		SELF.getBucketElement = function() {
			return UI.$BUCKET;
		};

		SELF.addToCurrentSlide = function( thing ) {
			if( CURRENT_SLIDES.middle === false ) {
				return;
			}

			// insert the HTML into the slide
			CURRENT_SLIDES.middle.getElement().append( thing );
		};

		SELF.getCurrentSlideElement = function() {
			if( CURRENT_SLIDES.middle === false ) {
				return false;
			}

			return CURRENT_SLIDES.middle.getElement();
		};

		SELF.loadSlide = function( slide_id, slideset_id ) {
			CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id, slideset_id );
		};

		var _bindEvents = function() {
			CORE.addEvent( 'resize', window, _resizeBucket );
			CORE.addEvent( 'click', UI.BUCKET, _fireClickEvent );
			CORE.addEvent( 'contextmenu', UI.BUCKET, _fireContextMenu );
			CORE.addEvent( 'mousedown', window, _fireMouseDown );
			CORE.addEvent( 'mouseup', window, _fireMouseUp );
			CORE.addEvent( 'mousemove', window, _fireMouseMove );
		};

		var _fireMouseDown = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			CORE.Events.doAction( 'bucket.mouse.down', e, target );
		};

		var _fireMouseUp = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			CORE.Events.doAction( 'body.mouse.up', e, target );
		};

		var _fireMouseMove = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;

			// calculate the difference
			var diffX = e.clientX - MOUSE_POS.x;
			var diffY = e.clientY - MOUSE_POS.y;
			MOUSE_POS.x = e.clientX;
			MOUSE_POS.y = e.clientY;

			CORE.Events.doAction( 'body.mouse.move', e, target, diffX, diffY );
		};

		var _createControls = function() {
			var controls = document.createElement( 'div' );
			controls.className = 'seoslides-bucket-controls';
			var html = '';// '<div class="button bucket-show-slides">View Slides</div>';
			html += '<div class="button bucket-add-slide">Add Slide</div>';
			controls.innerHTML = html;

			UI.BUCKET.appendChild( controls );
			UI.CONTROLS = controls;
		};

		var _fireContextMenu = function( e ) {
			e = e || window.event;
			var target = e.srcElement || e.target;
			CORE.Events.doAction( 'bucket.context.menu', e, target );
			CORE.killEvent( e );
		};

		var _fireClickEvent = function( e ) {
			e = e || window.event;
			var target = e.target || e.srcElement;

			if( CORE.hasClass( target, 'bucket-add-slide' ) === true ) {
				var slide_id = CORE.Events.applyFilter( 'bucket.createSlide', 0 );

				_createNewSlide( slide_id );
			}
			else if( CORE.hasClass( target, 'bucket-slide' ) === true && CORE.hasClass( target, 'left' ) === true ) {
				_shiftSlidesRight();
			}
			else if( CORE.hasClass( target, 'bucket-slide' ) === true && CORE.hasClass( target, 'right' ) === true ) {
				_shiftSlidesLeft();
			}

			CORE.Events.doAction( 'bucket.click', e, target );
		};

		var _shiftSlidesRight = function() {
			//
		};

		var _shiftSlidesLeft = function() {
			//
		};

		var _createNewSlide = function( slide_id ) {
			// left and middle slides exist
			if( CURRENT_SLIDES.left !== false && CURRENT_SLIDES.middle !== false ) {
				CURRENT_SLIDES.left.getElement().stop( true, true ).animate( { width : 0 }, ANIMATION_TIME, function(){
					$( this ).remove();
				} );
				CURRENT_SLIDES.middle.getElement().stop( true, true ).animate( { left : 0, width: SIDE_SLIDE_WIDTH, opacity : 0.7 }, ANIMATION_TIME, function() {
					CURRENT_SLIDES.left = CURRENT_SLIDES.middle;
					CURRENT_SLIDES.left.setBucketPosition( 'left' );
					this.className = 'bucket-slide left';
					CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id );
				} );
			}

			// only middle slide showing
			else if( CURRENT_SLIDES.left === false && CURRENT_SLIDES.middle !== false && CURRENT_SLIDES.right === false ) {
				CURRENT_SLIDES.middle.getElement().stop( true, true ).animate( { left : 0, width : SIDE_SLIDE_WIDTH, opacity : 0.7 }, ANIMATION_TIME, function() {
					CURRENT_SLIDES.left = CURRENT_SLIDES.middle;
					CURRENT_SLIDES.left.setBucketPosition( 'left' );
					this.className = 'bucket-slide left';
					CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id );
				} );
			}

			// no slides exist
			else if( CURRENT_SLIDES.left === false && CURRENT_SLIDES.middle === false && CURRENT_SLIDES.right === false ) {
				CURRENT_SLIDES.middle = new CORE.Slide( CORE, UI.BUCKET, slide_id );
			}
		};

		var _resizeBucket = function() {
			var ratio = 16 / 9,
				$parent = $( UI.BUCKET.parentNode ),
				maxWidth = $parent.width(),
				maxHeight = $parent.height(),
				height, width;

			if ( ( maxWidth / maxHeight ) > ratio ) {
				// Parent container is wider than required, scale to height
				height = maxHeight;
				width = height * ratio;
			} else {
				// Parent container is taller than required, scale to width
				width = maxWidth;
				height = width / ratio;
			}

			// Set the bucket's styles
			var style = UI.BUCKET.style;
			style.width = width + 'px';
			style.height = height + 'px';

			// might need to hide the UI here and then resize and show UI after done - don't want slide to be super heavy
			// on resize
			CORE.Events.doAction( 'bucket.resize', 1.77778 );
		};
	};

	window.SEO_Slides = window.SEO_Slides || {};
	window.SEO_Slides.Bucket = new Bucket( window.SEO_Slides );
} )( window, jQuery );