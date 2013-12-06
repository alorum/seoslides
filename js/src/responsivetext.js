/*global jQuery */
(function (window, $, undefined) {
	var elements = [],
			CORE = null,
			resize = function (base_size) {
				if (CORE === null) {
					CORE = window['SEO_Slides'] || {};
					if (CORE.Bucket && !CORE.Bucket.getCurrentSlideElement()) {
						CORE = {};
					}
				}
				var element = $(this),
						slide = CORE.Bucket ? CORE.Bucket.getCurrentSlideElement() : element.closest('.slide').get(0),
						factor = $(slide).width() / 1600;
				if (!slide) {
					return;
				}
				element.data('responsivetext.base', base_size);
				var new_font_size = Math.ceil(base_size * factor);
				element.css("font-size", Math.max(1, new_font_size) + 'px');
				return elements.push(element);
			};

	/**
	 * jQuery plugin for scaling text built specifically for wpslidepost
	 *
	 * Must be used on a child of a slide.
	 *
	 * This will update the font-size of any elements selected in the jQuery object
	 * by multiplying the base_size (defaults to 28; units in pixels) by the ratio
	 * of the slide's width (in pixels) to 1600. It will round up if it is a float
	 * and will always be at least 1. This should be used on containers and any
	 * text elements inside the container should be sized in em values so they will
	 * automatically scale with the changing font-size of the container.
	 *
	 * @param base_size The base size that gets scaled up or down
	 * @returns jQuery the jQuery object
	 */
	$.fn.responsiveText = function (base_size) {
		base_size = base_size || 28;
		return this.each(function () {
			resize.call(this, base_size);
		});
	};
	return $(window).on("resize", function () {
		var $elements = $(elements);
		elements = [];
		return $elements.each(function () {
			resize.call(this, $(this).data('responsivetext.base'));
		});
	});
}(this, jQuery));