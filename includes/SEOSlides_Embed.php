<?php
/**
 * Module Name: SEOSlides Embed
 * Activation:  hidden
 * Description: Functionality to handle embedding slideshows in 3rd party sites.
 * Version:     0.1
 * Author:      10up
 */

/**
 * Core functionality to handle generation of the embed script and the embedded slideshow.
 *
 * @package SEOSlides
 * @subpackage SEOSlides_Embed
 * @since 0.1
 */
class SEOSlides_Embed {

	/**
	 * Wire up actions and filters
	 */
	public function __construct() {
		add_action( 'seoslides_register_cpts', array( $this, 'register_endpoint' ) );
		add_action( 'wp',                      array( $this, 'maybe_do_embed_script' ) );

		add_filter( 'wp_headers', array( $this, 'maybe_filter_headers' ), 10, 2 );
	}

	/**
	 * We're not using a true endpoint permalink, since that registers the rewrite rule
	 * too far down the rewrite hierarchy; functionally, it's the same, though.
	 *
	 * @since 0.1
	 */
	public function register_endpoint() {
		global $wp;
		$wp->add_query_var( 'seoslides-embed' );
		$wp->add_query_var( 'seoslides-embed-slide' );
		add_rewrite_rule( '^embed-script/([^/]+)(/(.*))?/?$', 'index.php?seoslides-slideset=$matches[1]&seoslides-embed-slide=$matches[3]&seoslides-embed=script', 'top' );
		add_rewrite_rule( '^embeds/([^/]+)(/(.*))?/?$', 'index.php?seoslides-slideset=$matches[1]&seoslides-embed-slide=$matches[3]&seoslides-embed=1', 'top' );
	}

	/**
	 * If this is an embed script request, filter the headers to tell the browser we're
	 * sending javascript.
	 *
	 * @since 0.1
	 *
	 * @param array $headers
	 * @param WP    $wp
	 *
	 * @return array
	 */
	public function maybe_filter_headers( $headers, $wp ) {
		if ( isset( $wp->query_vars['seoslides-embed'] ) && $wp->query_vars['seoslides-embed'] === 'script' ) {
			$headers['Content-Type'] = 'application/x-javascript; charset=UTF-8';
		}
		return $headers;
	}

	/**
	 * Check if this is a request to serve an embed script. If so, send it and exit
	 *
	 * @since 0.1
	 *
	 * @param WP $wp
	 */
	public function maybe_do_embed_script( $wp ) {
		if ( ! isset( $wp->query_vars['seoslides-embed'] ) || $wp->query_vars['seoslides-embed'] !== 'script' ) {
			return;
		}

		$slideset = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slideset( get_queried_object_id() );
		if ( ! $slideset ) {
			wp_die( __( 'That presentation does not exist!', 'seoslides_translate' ) );
		}
		$slide = $this->get_embedded_slide( $slideset->slides, get_query_var( 'seoslides-embed-slide' ) );

		$output = wp_cache_get( $slideset->ID . ".{$slide->slug}", 'seoslides-embed-scripts' );

		if ( ! $output ) {
			ob_start();
			$extension = defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? 'src.js' : 'min.js';
			require SEOSLIDES_PATH . "js/seoslides_embed.$extension";
			$output = ob_get_clean();

			$embed_url = $this->get_embed_url( $slideset->ID, $slide->slug );
			$unique_id = $this->get_embed_unique_id( $slideset->ID, $slide->slug );
			$output    = str_replace(
				array( '%%EMBED_ID%%', '%%EMBED_URL%%' ),
				array(  $unique_id,     $embed_url ),
				$output
			);

			wp_cache_set( $slideset->ID . ".{$slide->slug}", $output, 'seoslides-embed-scripts' );
		}

		echo $output;
		exit;
	}

	/**
	 * Get's a slide object to set as the start point of the embedded presentation
	 *
	 * If the first argument is a falsy value or if no match is found for the slug, a "null slide"
	 * will be returned. This is just an object of stdClass with an ID property of 0 and a slug
	 * property of an empty string.
	 *
	 * If $slug is empty, the first slide in the slides array will be returned.
	 *
	 * @since 0.1
	 *
	 * @param array  $slides Array of slides from a slideset
	 * @param string $slug   The slug from the url
	 *
	 * @return object The slide object. Could be a "null slide" (see above)
	 */
	private function get_embedded_slide( $slides, $slug = '' ) {
		$null_slide = (object) array( 'ID' => 0, 'slug' => '' );
		if ( ! $slides ) {
			return $null_slide;
		}
		if ( ! $slug ) {
			// Re-initialize the array so we know current will return the first slide
			return current( array_values( $slides ) );
		}
		foreach ( $slides as $slide ) {
			if ( $slide->slug === $slug ) {
				return $slide;
			}
		}
		return $null_slide;
	}

	/**
	 * Get the (all-but) unique identifier for this presentation's embed script
	 *
	 * @since 0.1
	 *
	 * @param int    $id    The slideset ID
	 * @param string $slide The slide slug. Default is an empty string
	 *
	 * @return string The embed's unique identifier
	 */
	public function get_embed_unique_id( $id, $slide = '' ) {
		$meta = "seoslides-unique-embed-id-$slide";
		$unique_id = get_post_meta( $id, $meta, true );
		if ( ! $unique_id ) {
			$unique_id = substr( md5( "$id " . $this->get_embed_url( $id, $slide ) ), -12 );
			update_post_meta( $id, $meta, $unique_id );
		}
		return $unique_id;
	}

	/**
	 * Get a working link to the slideset's embed view
	 *
	 * This will return a pretty permalink if the site uses them or url arguments if not.
	 *
	 * @since 0.1
	 *
	 * @param int    $id    The slideset ID.
	 * @param string $slide The slide slug.
	 * @param bool   $script Whether to return the script url instead
	 *
	 * @return string The embed URL
	 */
	public function get_embed_url( $id, $slide = '', $script = false ) {
		$parts = array(
			home_url(),
			'embeds',
			get_post_field( 'post_name', $id ),
			$slide,
		);
		$parts = array_filter( array_map( 'trim', $parts, array_fill( 0, 4, '/' ) ) );
		$url = implode( '/', $parts ) . '/';

		if ( $script )
			$url = str_replace( '/embeds/', '/embed-script/', $url );

		return $url;
	}

}
