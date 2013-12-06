<?php
/**
 * Module Name: SEOSlides Shortcode
 * Activation:  hidden
 * Description: Functionality to handle slideshow shortcodes.
 * Version:     0.1
 * Author:      10up
 */

/**
 * Core functionality to handle slideshow shortcodes.
 *
 * @package    SEOSlides
 * @subpackage SEOSlides_Shortcode
 * @since      0.1
 */
class SEOSlides_Shortcode {

	/**
	 * Wire up actions and filters
	 */
	public function __construct() {
		add_action( 'init', array( $this, 'init' ) );
	}

	/**
	 * Registers the seoslides shortcode
	 */
	public function init() {
		add_shortcode( 'seoslides', array( $this, 'shortcode_handler' ) );
	}

	/**
	 * Generate the output for our shortcode
	 *
	 * @param array  $attributes
	 * @param string $content
	 *
	 * @return string
	 */
	public function shortcode_handler( $attr, $content ) {
		$attributes = shortcode_atts( array(
			'embed_id'     => false,
			'script_src'   => false,
			'overview_src' => false,
			'title'        => '',
			'site_src'     => false,
			'site_title'   => false,
		), $attr );

		$id         = $attributes['embed_id'];
		$script_src = $attributes['script_src'];
		$overview   = $attributes['overview_src'];
		$title      = $attributes['title'];
		$site_src   = $attributes['site_src'];
		$site_title = $attributes['site_title'];

		$link_format        = '<a href="%s">%s</a>';
		$presentation_title = sprintf( $link_format, esc_url( $overview ), esc_html( $title ) );
		$presentation_site  = sprintf( $link_format, esc_url( $site_src ), esc_html( $site_title ) );

		$text = sprintf(
			_x(
				'%1$s from %2$s',
				'(Presentation Title) from (presentation site)',
				'seoslides_translate'
			),
			$presentation_title,
			$presentation_site
		);

		$format = '<script id="%1$s" type="text/javascript" src="%2$s"></script>';
		$format .= '<span id="seoslides-embed-%1$s">%3$s</span>';
		$output = sprintf(
			$format,
			esc_attr( $id ),
			esc_url( $script_src ),
			$text
		);
		return $output;
	}

}