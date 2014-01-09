<?php
/**
 * Module Name: SEOSlides Ajax
 * Activation:  hidden
 * Description: Ajax module for SEOSlides functionality
 * Version:     0.1
 * Author:      10up
 */

/**
 * Core Ajax functionality for SEOSlides
 *
 * @package SEOSlides
 * @subpackage SEOSlides_Ajax
 * @since 0.1
 */
class SEOSlides_Ajax {
	/**
	 * Default constructor, wires up Ajax functionality
	 */
	public function __construct() {
		// Wire actions
		add_action( 'wp_ajax_new-slide',                 array( $this, 'new_slide' ) );
		add_action( 'wp_ajax_get-slides',                array( $this, 'get_slides' ) );
		add_action( 'wp_ajax_get-slide',                 array( $this, 'get_slide' ) );
		add_action( 'wp_ajax_get-slide-sections',        array( $this, 'get_slide_sections' ) );
		add_action( 'wp_ajax_nopriv_get-slide-sections', array( $this, 'get_slide_sections' ) );
		add_action( 'wp_ajax_save-slide',                array( $this, 'save_slide' ) );
		add_action( 'wp_ajax_update-presentation-meta',  array( $this, 'update_presentation' ) );
		add_action( 'wp_ajax_update-positions',          array( $this, 'update_positions' ) );
		add_action( 'wp_ajax_delete-slide',              array( $this, 'delete_slide' ) );
		add_action( 'wp_ajax_trash-slide',               array( $this, 'trash_slide' ) );
		add_action( 'wp_ajax_restore-slide',             array( $this, 'restore_slide' ) );
		add_action( 'wp_ajax_check_omebed',              array( $this, 'check_oembed' ) );
		add_action( 'wp_ajax_post-from-presentation',    array( $this, 'post_from_slideset' ) );
	}

	/**
	 * Fetch the slide collection for a given slideset
	 *
	 * @uses $_POST['slideset'] Identifies presentation based on slideset ID.
	 */
	public function get_slides() {
		$slideset_id = intval( $_POST['slideset'] );

		// $response = array(
		//     'success' => true/false,
		//     'data'    => array(
		//         $child_array_1,
		//         $child_array_2
		//         ...
		//     )
		// }
		$response = array();

		if ( 0 === $slideset_id ) {
			$response['success'] = false;
		} else {
			/** @var SEOSlides_Slideset $slideset */
			$slideset = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slideset( $slideset_id );

			$child_data = array();

			// Build an array containing each slide in a separate associative array
			/** @var SEOSlides_Slide $slide */
			foreach( $slideset->slides as $slide ) {
				$bg_image = $slide->bg_image;
				$bg_id = SEOSlides_Core::get_attachment_id_from_url( $bg_image );
				if ( false !== $bg_id ) {
					$bg_arr = wp_get_attachment_image_src( $bg_id, 'seoslides-thumb' );
					$bg_image = $bg_arr[0];
				}

				$data = array(
					'id'              => $slide->ID,
					'title'           => stripslashes( $slide->title ),
					'content'         => $slide->content,
					'image'           => stripslashes( $slide->image ),
					'bg_image'        => $bg_image,
					'style'           => $slide->style,
					'position'        => $slide->position,
					'preview'         => $slide->preview,
					'fill_color'      => $slide->fill_color,
					'seo_title'       => $slide->seo_title,
					'seo_description' => $slide->seo_description,
					'seo_keywords'    => $slide->seo_keywords,
					'presenter_notes' => wp_trim_words( $slide->presenter_notes, 50, ' [&hellip;]' ),
					'status'          => $slide->status,
				);

				if ( isset( $data['bg-image'] ) && function_exists( 'jetpack_photon_url' ) ) {
					$data['bg-image'] = jetpack_photon_url( $data['bg-image'], array(), '//' );
				}

				$oembed = SEOSlides_Slide::get_embed_url( $slide->oembed );
				$oembed_thumb = SEOSlides_Slide::get_embed_thumbnail( $slide->oembed );

				if ( ! is_wp_error( $oembed ) && ! is_wp_error( $oembed_thumb ) ) {
					$data['oembed'] = $oembed;
					$data['oembed_thumb'] = $oembed_thumb;
				}

				// Build out canvas objects
				$data['objects'] = array_map(
					array( $this, 'sanitize_slide_object' ),
					$slide->objects
				);

				// Add the object
				$child_data[] = $data;
			}

			$response['success'] = true;
			$response['data'] = $child_data;
		}

		wp_send_json( $response );
	}

	/**
	 * Fetch a specific slide from the server
	 */
	public function get_slide() {
		$response = array();

		if ( 'slide-default' === $_POST['slide'] ) {
			if ( 0 !== $slideset_id = (int) $_POST['slideset'] ) {
				/** @var SEOSlides_Slideset $slideset */
				$slideset = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slideset( $slideset_id );

				$default = $slideset->default_slide();

				$default->objects = array_map(
					array( $this, 'sanitize_slide_object' ),
					$default->objects
				);

				// Expand the default H1 font
				$header_size = floatval( $slideset->default_header_size );
				$header_size = $header_size * 2.4;
				$header_size .= 'em';

				// Text editor defaults
				$default->text_defaults = array();
				$default->text_defaults['font'] = $slideset->default_font;
				$default->text_defaults['font_size'] = $slideset->default_size;
				$default->text_defaults['color'] = $slideset->default_font_color;
				$default->header_defaults['font'] = $slideset->default_header_font;
				$default->header_defaults['font_size'] = $header_size;
				$default->header_defaults['color'] = $slideset->default_header_font_color;

				$response['success'] = true;
				$response['data'] = $default;
			} else {
				$response['success'] = false;
			}
		} else if ( 0 !== $slide_id = (int) $_POST['slide'] ) {
			/** @var SEOSlides_Slide $slide */
			$slide = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slide( $slide_id );

			$slide->title = stripslashes( $slide->title );

			$slide->objects = array_map(
				array( $this, 'sanitize_slide_object' ),
				$slide->objects
			);

			$slide->defaults = array(
				'font'  => $slide->parent( 'default_font' ),
				'size'  => $slide->parent( 'default_size' ),
				'color' => $slide->parent( 'default_font_color' ),
				'h1_font'  => $slide->parent( 'default_header_font' ),
				'h1_size'  => $slide->parent( 'default_header_size' ),
				'h1_color' => $slide->parent( 'default_header_font_color' ),
			);

			$response['success'] = true;
			$response['data'] = $slide;
		} else {
			$response['success'] = false;
		}

		wp_send_json( $response );
	}

	/**
	 * Encode the slide object for front-end usage.
	 *
	 * @param SEOSlides_CanvasObject $object
	 *
	 * @return string
	 */
	protected function sanitize_slide_object( $object ) {
		return rawurlencode( json_encode( $object ) );
	}

	/**
	 * Fetch the slide collection for a given slideset as <section> blocks
	 *
	 * @uses $_POST['slideset'] Identifies presentation based on slideset ID.
	 */
	public function get_slide_sections() {
		$slideset_id = intval( $_POST['slideset'] );

		$response = array();

		if ( 0 == $slideset_id ) {
			$response['success'] = false;
		} else {
			/** @var SEOSlides_Slideset $slideset  */
			$slideset = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slideset( $slideset_id );

			$sections = '';

			$slide_number = 1;
			/** @var SEOSlides_Slide $slide */
			foreach( $slideset->slides as $slide ) {
				if ( 'publish' !== $slide->status ) {
					continue;
				}

				$sections .= $slide->render();

				$slide_number++;
			}

			$sections .= $slideset->last_slide();

			$response['success'] = true;
			$response['sections'] = $sections;
		}

		wp_send_json( $response );
	}

	/**
	 * Update the information of a particular slide in the database
	 */
	public function save_slide() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_update' ) ) {
			die (-1);
		}

		if ( 'slide-default' === $_POST['slide_id'] ) {
			if ( 0 !== $slideset_id = (int) $_POST['slideset'] ) {
				$default = new stdClass;
				$default->id = 'slide-default';
				$default->title = sanitize_text_field( $_POST[ 'title' ] );
				$default->seo_description = sanitize_text_field( $_POST['seo_description'] );
				$default->seo_keywords = sanitize_text_field( $_POST['seo_keywords'] );
				$default->fill_color = sanitize_text_field( $_POST['fill_color'] );
				$default->bg_image = sanitize_text_field( $_POST['bg_image'] );
				$default->slideset = $slideset_id;
				$default->objects = array();
				$default->oembed = esc_url_raw( $_POST['oembed'] );

				if ( isset( $_POST['objects'] ) && $_POST['objects'] === (array) $_POST['objects'] ) {
					foreach( (array) $_POST['objects'] as $object ) {
						$parsed = new SEOSlides_CanvasObject( $object );
						$default->objects[] = $parsed;
					}
				}

				if ( false === add_post_meta( $slideset_id, '_default_slide', $default, true ) ) {
					update_post_meta( $slideset_id, '_default_slide', $default );
				}

				$response['success'] = true;
			} else {
				$response['success'] = false;
			}
		} else if ( 0 !== $slide_id = (int) $_POST['slide_id'] ) {
			$slide = new SEOSlides_Slide( $slide_id );

			// Update basic information
			$slide->title = sanitize_text_field( $_POST[ 'title' ] );
			$slide->slug = sanitize_title( $slide->title );
			$slide->presenter_notes = apply_filters( "pre_post_content", $_POST['presenter_notes'] );
			$slide->presenter_notes = apply_filters( "post_content_save_pre", $slide->presenter_notes );
			if ( ! empty( $slide->presenter_notes ) ) {
				do_action( 'seoslides_presstrends_event', 'Slide Notes Created' );
			}

			$slide->oembed = esc_url_raw( $_POST['oembed'] );

			// Background information
			$fill_color = sanitize_text_field( $_POST['fill_color'] );
			$slide->fill_color = ( $fill_color === $slide->fill_color ) ? '' : $fill_color;
			$slide->bg_image = sanitize_text_field( $_POST['bg_image'] );

			// Update SEO
			$slide->seo_title = $slide->title;
			$slide->seo_description = sanitize_text_field( $_POST['seo_description'] );
			$slide->seo_keywords = sanitize_text_field( $_POST['seo_keywords'] );

			// Update Objects
			$slide->objects = array();
			if ( isset( $_POST['objects'] ) && $_POST['objects'] === (array) $_POST['objects'] ) {
				foreach( (array) $_POST['objects'] as $object ) {
					$parsed = new SEOSlides_CanvasObject( $object );
					$slide->objects[] = $parsed;
				}
			}

			// Update the slide in the database
			$updated = $slide->update();

			if ( is_wp_error( $updated ) ) {
				$response['success'] = false;
			} else {
				$response['success'] = $updated;
			}
		} else {
			$response['success'] = false;
		}

		wp_send_json( $response );
	}

	/**
	 * Update the presentation's meta information.
	 *
	 * This includes:
	 * - Presentation SEO Title
	 * - Presentation SEO Description
	 * - Presentation SEO Keywords
	 * - Presentation Overview
	 * - Default fill color
	 * - Default background image
	 */
	public function update_presentation() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_update' ) ) {
			die (-1);
		}

		$slideset_id = (int) $_POST['slideset'];
		$slideset = new SEOSlides_Slideset( $slideset_id );

		// Update SEO
		$slideset->seo_title = sanitize_text_field( $_POST['seo_title'] );
		$slideset->seo_description = sanitize_text_field( $_POST['seo_description'] );
		$slideset->seo_keywords = sanitize_text_field( $_POST['seo_keywords'] );

		// Calculate H1 font size
		$header_size = floatval( $_POST['header_size'] );
		$header_size = $header_size / 2.4;
		$header_size .= 'em';

		// Update slide defaults
		$slideset->default_fill_color = sanitize_text_field( $_POST['fill_color'] );
		$slideset->default_bg_image = sanitize_text_field( $_POST['bg_image'] );
		$slideset->default_font = sanitize_text_field( $_POST['default_font'] );
		$slideset->default_size = sanitize_text_field( $_POST['default_size'] );
		$slideset->default_font_color = sanitize_text_field( $_POST['default_color'] );
		$slideset->default_header_font = sanitize_text_field( $_POST['header_font'] );
		$slideset->default_header_size = sanitize_text_field( $header_size );
		$slideset->default_header_font_color = sanitize_text_field( $_POST['header_color'] );

		// Update presentation theme
		if ( isset( $_POST['seoslides_theme'] ) ) {
			$theme = sanitize_text_field( $_POST['seoslides_theme'] );
			update_post_meta( $slideset_id, '_slideset_theme', $theme );
		}

		// Persist changes
		$updated = $slideset->update();

		if ( is_wp_error( $updated ) ) {
			$response['success'] = false;
		} else {
			/** @var SEOSlides_Core $core */
			$core = SEOSlides_Module_Provider::get( 'SEOSlides Core' );
			$themes = $core->presentation_theme( $slideset_id );

			$response['success'] = $updated;
			$response['data'] = array( 'themes' => $themes );
		}

		wp_send_json( $response );
	}

	/**
	 * Create a new slide in the collection
	 */
	public function new_slide() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_create' ) ) {
			$response['success'] = false;
			wp_send_json( $response );
		}
		$slideset_id = (int) $_POST['slideset'];

		$slideset = new SEOSlides_Slideset( $slideset_id );
		$defaults = $slideset->default_slide();

		$content = array(
			'title'    => $defaults->title,
			'content'  => '',
			'image'    => '',
			'bg-image' => 'noimage',
		);

		// Create the slide
		$slide = wp_insert_post(
			array(
			     'post_parent'  => $slideset_id,
			     'post_type'    => 'seoslides-slide',
			     'menu_order'   => count( $slideset->slides ), // Insert at the end of the presentation
			     'post_status'  => 'publish',
			     'post_content' => serialize( $content )
			)
		);

		if ( 0 !== $slide && ! is_wp_error( $slide ) ) {
			update_post_meta( $slide, 'seoslides_fillcolor', '' );
			update_post_meta( $slide, 'seoslides_oembed', $defaults->oembed );

			// Update SEO
			$seo = array(
				'title'       => $defaults->title,
				'description' => $defaults->seo_description,
				'keywords'    => $defaults->seo_keywords
			);
			update_post_meta( $slide, 'seoslides_seo_settings', $seo );

			/** @var SEOSlides_CanvasObject $object */
			foreach( $defaults->objects as $object ) {
				add_post_meta( $slide, 'seoslides_canvas_object', $object );
			}

			$response['data'] = array( 'id' => $slide );
			$response['success'] = true;
		} else {
			$response['success'] = false;
		}

		// Track that a slide was created.
		do_action( 'seoslides_presstrends_event', 'Slide Created' );

		wp_send_json( $response );
	}

	/**
	 * Update the positions of each slide in the slideset.
	 */
	public function update_positions() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_update' ) ) {
			die (-1);
		}
		$slideset_id = (int) $_POST['slideset'];

		$slideset = new SEOSlides_Slideset( $slideset_id );
		/** @var SEOSlides_Slide $slide */
		foreach( $slideset->slides as $slide ) {
			if ( isset( $_POST['positions'][ $slide->ID ] ) ) {
				$slide->position = (int) $_POST['positions'][ $slide->ID ];

				$slide->update();
			}
		}

		$response['success'] = true;

		wp_send_json( $response );
	}

	/**
	 * Permanently remove a slide from the collection
	 */
	public function delete_slide() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_delete' ) ) {
			$response['success'] = false;
			wp_send_json( $response );
		}
		$slideset_id = (int) $_POST['slideset'];
		$slide_id = (int) $_POST['id'];

		$slide = get_post( $slide_id );

		if ( null === $slide ) {
			$response['success'] = false;
			wp_send_json( $response );
		}

		$deleted = wp_delete_post( $slide->ID, true );

		if ( false === $deleted ) {
			$response['success'] = false;
			wp_send_json( $response );
		}

		// Success, the post is gone!
		$response['success'] = true;
		wp_send_json( $response );
	}

	/**
	 * Move a slide into the trash
	 */
	public function trash_slide() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_trash' ) ) {
			$response['success'] = false;
			wp_send_json( $response );
		}
		$slide_id = (int) $_POST['id'];

		$slide = get_post( $slide_id );

		if ( null === $slide ) {
			$response['success'] = false;
			wp_send_json( $response );
		}

		$slide->post_status = 'trash';

		$updated = wp_update_post( $slide );

		if ( is_wp_error( $updated ) ) {
			$response['success'] = false;
			wp_send_json( $response );
		}

		// Success, the post is in the trash!
		$response['success'] = true;
		wp_send_json( $response );
	}

	/**
	 * Move a slide out of the trash
	 */
	public function restore_slide() {
		$response = array();

		if ( ! isset( $_POST['_nonce'] ) || ! wp_verify_nonce( $_POST['_nonce'], 'seoslides_restore' ) ) {
			$response['success'] = false;
			wp_send_json( $response );
		}
		$slide_id = (int) $_POST['id'];

		$slide = get_post( $slide_id );

		if ( null === $slide ) {
			$response['success'] = false;
			wp_send_json( $response );
		}

		$slide->post_status = 'publish';

		$updated = wp_update_post( $slide );

		if ( is_wp_error( $updated ) ) {
			$response['success'] = false;
			wp_send_json( $response );
		}

		// Success, the post is in the trash!
		$response['success'] = true;
		wp_send_json( $response );
	}

	/**
	 * Helper function to determine if an array field is set and non-empty.
	 *
	 * @param string      $key   Array key to check
	 * @param array|bool  $array Array to check. $_POST if not provided
	 *
	 * @return bool
	 */
	private function valid( $key, $array = false ) {
		if ( false === $array ) {
			$array = $_POST;
		}

		return isset( $array[ $key ] ) && ! empty( $array[ $key ] );
	}

	/**
	 * Validate an oembed endpoint.
	 *
	 * Result will be cached by the server for future lookup.
	 */
	public function check_oembed() {
		$valid = array( 'success' => false );

		$embed = SEOSlides_Slide::get_embed_url( $_POST['seoslides_video_oembed'] );

		if ( ! is_wp_error( $embed ) ) {
			$valid = array( 'success' => true );
		}

		wp_send_json( $valid );
	}

	/**
	 * Automatically create a post and embed the specified presentation.
	 */
	public function post_from_slideset() {
		$response = array();
		$response['success'] = false;

		if ( ! wp_verify_nonce( $_POST['_nonce'], 'use_in_post' ) ) {
			wp_send_json( $response );
		}

		// First, get our embed code
		$slideset_id = (int) $_POST['slideset'];
		$slideset = new SEOSlides_Slideset( $slideset_id );

		$embed_id = $slideset->get_embed_id();
		$embed_url = SEOSlides_Module_Provider::get( 'SEOSlides Embed' )->get_embed_url( $slideset_id, $slideset->first_slide()->slug );

		$embed = '[seoslides embed_id="' . $embed_id . '"';
		$embed .= ' script_src="' . preg_replace( '/\/(slides|embeds)\//', '/embed-script/', $embed_url ) . '"';
		$embed .= ' overview_src="' . get_permalink( $slideset_id ) . '"';
		$embed .= ' title="' . get_the_title( $slideset_id ) . '"';
		$embed .= ' site_src="' . get_home_url() . '"';
		$embed .= ' site_title="' . get_bloginfo( 'name' ) . '"';
		$embed .= ' /]';

		// Build out the new post
		$post = wp_insert_post(
			array(
			     'post_status'  => 'draft',
			     'post_type'    => 'post',
			     'post_content' => $embed,
			)
		);

		if ( is_wp_error( $post ) || 0 === $post ) {
			wp_send_json( $response );
		}

		// Build the edit post url
		$edit_url = admin_url( 'post.php' );
		$edit_url = add_query_arg(
			array(
			     'post'   => $post,
			     'action' => 'edit'
			),
			$edit_url
		);

		$response['success'] = true;
		$response['data'] = array(
			'post_id'   => $post,
			'permalink' => get_permalink( $post ),
			'edit_url'  => $edit_url
		);

		wp_send_json( $response );
	}
}
