(function (window, undefined) {
	window.SEOSlides = window.SEOSlides || {};
	var SEOSlides = window.SEOSlides,
			document = window.document;
	SEOSlides.Embed = SEOSlides.Embed || (function () {
		var embeds = {};

		function Embed(id, url) {
			var SELF = this;
			SELF.id = id.replace(/[^a-zA-Z0-9_\-]/, '');
			SELF.url = url;
			SELF.script = document.getElementById(SELF.id);
			SEOSlides.DOM.ready(function () {
				SELF.insert_iframe.call(SELF);
				SELF.set_frame_attributes.call(SELF);
			});
		}

		Embed.prototype.insert_iframe = function () {
			if ( null !== this.script && ! this.script.hasAttribute( 'processed' ) ) {
				this.frame = document.createElement('iframe');
				this.script.setAttribute( 'processed', 'processed' );
				this.script.parentNode.insertBefore( this.frame, this.script.nextSibling );
			}
		};

		Embed.prototype.set_frame_attributes = function () {
			this.frame.id = this.id + '-embed';
			this.frame.src = this.url;

			if ( this.script.hasAttribute( 'data-height' ) && this.script.hasAttribute( 'data-width' ) ) {
				this.frame.style.width = window.parseInt( this.script.getAttribute( 'data-width' ), 10 ) + 'px';
				this.frame.style.height = window.parseInt( this.script.getAttribute( 'data-height' ), 10 ) + 'px';
			} else {
				this.frame.style.width = '100%';
				this.frame.style.height = Math.ceil( this.frame.offsetWidth / 16 * 9 ) + 'px';
			}

			this.frame.style.border = 0 + 'px';
			this.computedWidth = Math.ceil( this.frame.offsetWidth / 16 * 9 );
			this.frame.frameborder = '0';
			this.frame.marginHeight = '0';
			this.frame.marginWidth = '0';
			this.frame.scrolling = 'no';

			this.frame.setAttribute('allowfullscreen', '');
			this.frame.setAttribute('mozallowfullscreen', '');
			this.frame.setAttribute('webkitallowfullscreen', '');
		};

		Embed.prototype.request_fullscreen = function () {
			this.frame.style.height = '100%';
			this.frame.style.position = 'fixed';
			this.frame.style.top = '0';
			this.frame.style.left = '0';
			this.frame.style.zIndex = 100001;
			var html = document.getElementsByTagName('html')[0];
			this.htmlScroll = html.style.overflow;
			html.style.overflow = 'hidden';
		};

		Embed.prototype.cancel_fullscreen = function () {
			this.frame.style.height = this.computedWidth + 'px';
			this.frame.style.removeProperty('position');
			this.frame.style.removeProperty('top');
			this.frame.style.removeProperty('left');
			this.frame.style.removeProperty('zIndex');
			if (this.htmlScroll) {
				document.getElementsByTagName('html')[0].style.overflow = this.htmlScroll;
			} else {
				document.getElementsByTagName('html')[0].style.removeProperty('overflow');
			}
		};

		var fullscreenHandler = function (event) {
			if (!event) {
				event = window.event;
			}
			var keycode = event['key'] || event['which'];
			if (keycode !== 122) {
				return;
			}
			var el = document.activeElement;
			if (undefined === embeds[el.id.replace(/-embed$/, '')]) {
				return;
			}
			if (document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled) {
				event.preventDefault();
			}
		};

		return {

			init: function (id, url) {
				embeds[id] = embeds[id] || new Embed(id, url);
			},

			fullscreen: function (id, customOnly) {
				if (undefined === embeds[id]) {
					return function () {};
				}
				customOnly = (undefined !== customOnly && customOnly);
				var func;
				if (document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled) {
					if (customOnly) {
						return function () {};
					}
					if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement) {
						func = document.cancelFullscreen || document.mozCancelFullScreen || document.webkitCancelFullScreen;
					} else {
						var frame = embeds[id].frame;
						func = function () {
							(document.cancelFullscreen || document.mozCancelFullScreen || document.webkitCancelFullScreen).call(document);
							(frame.requestFullscreen || frame.mozRequestFullScreen || frame.webkitRequestFullscreen).call(frame);
						};
					}
				} else {
					var classes = embeds[id].frame.className.split(' '),
							classIndex = classes.indexOf('seoslides_fullscreen');
					if (classIndex === -1) {
						classes.push('seoslides_fullscreen');
						func = function () {
							embeds[id].request_fullscreen.call(embeds[id]);
						};
					} else {
						classes = classes.slice(0, classIndex).concat(classes.slice(classIndex + 1));
						func = function () {
							embeds[id].cancel_fullscreen.call(embeds[id]);
						};
					}
					embeds[id].frame.className = classes.join(' ');
				}
				return func;
			}

		};
	}());
	SEOSlides.Embed.init('%%EMBED_ID%%', '%%EMBED_URL%%');
}(this));