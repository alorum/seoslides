<?php

/**
 * Static utility class (pseudo-namespace for PHP 5.2 compatibility)
 */
class SEOSlides_Util {
	/**
	 * Redirect the current query to WoordPress' 404 template.
	 *
	 * @global WP_Query $wp_query
	 *
	 * @uses get_query_template()
	 */
	public static function redirect_404() {
		// Display a 404 page since we don't have overviews
		global $wp_query;
		$wp_query->is_404 = true;
		$wp_query->is_single = false;
		$wp_query->is_page = false;

		include( get_query_template( '404' ) );
		exit();
	}

	/**
	 * Generate a random GUID/UUID.
	 *
	 * @return string
	 */
	public static function generate_guid() {
		$charid = strtoupper( md5( uniqid( rand(), true ) ) );
		$hyphen = chr( 45 ); // "-"
		$uuid   = substr( $charid, 0, 8 ) . $hyphen
			. substr( $charid, 8, 4 ) . $hyphen
			. substr( $charid, 12, 4 ) . $hyphen
			. substr( $charid, 16, 4 ) . $hyphen
			. substr( $charid, 20, 12 );

		return $uuid;
	}

	/**
	 * Get the ID for a given attachment.
	 *
	 * @param string $attachment_url
	 *
	 * @global wpdb $wpdb
	 *
	 * @return bool|int
	 */
	public static function get_attachment_id_from_url( $attachment_url = '' ) {
		global $wpdb;
		$attachment_id = false;

		// If there is no url, return.
		if ( '' == $attachment_url ) {
			return $attachment_id;
		}

		// Get the upload directory paths
		$upload_dir_paths = wp_upload_dir();

		// Make sure the upload path base directory exists in the attachment URL, to verify that we're working with a media library image
		if ( false !== strpos( $attachment_url, $upload_dir_paths['baseurl'] ) ) {

			// If this is the URL of an auto-generated thumbnail, get the URL of the original image
			$attachment_url = preg_replace( '/-\d+x\d+(?=\.(jpg|jpeg|png|gif)$)/i', '', $attachment_url );

			// Remove the upload path base directory from the attachment URL
			$attachment_url = str_replace( $upload_dir_paths['baseurl'] . '/', '', $attachment_url );

			// Finally, run a custom database query to get the attachment ID from the modified attachment URL
			$attachment_id = $wpdb->get_var( $wpdb->prepare( "SELECT wposts.ID FROM $wpdb->posts wposts, $wpdb->postmeta wpostmeta WHERE wposts.ID = wpostmeta.post_id AND wpostmeta.meta_key = '_wp_attached_file' AND wpostmeta.meta_value = '%s' AND wposts.post_type = 'attachment'", $attachment_url ) );

		}

		return $attachment_id;
	}

	/**
	 * Build a navigation permalink.
	 *
	 * @param string               $direction
	 * @param null|SEOSlides_Slide $slide
	 *
	 * @return string
	 */
	public static function slide_nav_link( $direction, $slide = null ) {
		if ( null !== $slide ) {
			return $slide->permalink( $direction );
		}

		return '#';
	}
}