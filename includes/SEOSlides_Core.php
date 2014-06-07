<?php
/**
 * Module Name: SEOSlides Core
 * Activation:  hidden
 * Description: Core module for SEOSlides functionality
 * Version:     0.1
 * Author:      10up
 */

require_once 'objects/SEOSlides_Slideset.php';
require_once 'objects/SEOSlides_Slide.php';
require_once 'objects/SEOSlides_CanvasObject.php';
if ( ! class_exists( 'Catalyst_API' ) ) {
	require_once 'objects/class-catalyst-api.php';
}

/**
 * Core Functionality of the SEOSlides plugin.
 *
 * @package SEOSlides
 * @subpackage SEOSlides_Core
 * @since 0.1
 */
class SEOSlides_Core {
	/**
	 * @var int Time the class was instantiated. Use for busting certain URL caches.
	 */
	protected $_cache_bust;

	/**
	 * Standard constructor. Wires up actions and filters.
	 */
	public function __construct() {
		// Wire actions
		add_action( 'init',                                          array( $this, 'custom_image_sizes' ) );
		add_action( 'init',                                          array( $this, 'custom_rewrites' ) );
		add_action( 'init',                                          array( $this, 'register_flags' ) );
		add_action( 'seoslides_register_cpts',                       array( $this, 'custom_rewrites' ), 11 );
		add_action( 'seoslides_register_cpts',                       array( $this, 'register_cpts' ) );
		add_action( 'admin_enqueue_scripts',                         array( $this, 'register_assets' ), 5 );
		add_action( 'wp_enqueue_scripts',                            array( $this, 'register_assets' ), 5 );
		add_action( 'admin_enqueue_scripts',                         array( $this, 'admin_enqueue_scripts' ) );
		add_action( 'wp_enqueue_scripts',                            array( $this, 'slideset_enqueue_scripts' ) );
		add_action( 'wp_print_styles',                               array( $this, 'remove_theme_styles' ) );
		add_action( 'right_now_content_table_end',                   array( $this, 'display_presentation_count' ) );
		add_action( 'dashboard_glance_items',                        array( $this, 'right_now_presentation_count' ) );
		add_action( 'manage_seoslides-slideset_posts_custom_column', array( $this, 'filter_custom_columns' ), 10, 2 );
		add_action( 'wp_headers',                                    array( $this, 'redirect_to_first' ), 10, 2 );
		add_action( 'admin_bar_menu',                                array( $this, 'presentation_toolbar' ) );
		add_action( 'admin_menu',                                    array( $this, 'add_menu' ), 100 );
		add_action( 'admin_head-post-new.php',                       array( $this, 'presentation_help_tabs' ) );
		add_action( 'admin_head-post.php',                           array( $this, 'presentation_help_tabs' ) );
		add_action( 'admin_head-edit.php',                           array( $this, 'hide_view_switcher' ), 100 );
		add_action( 'after_setup_theme',                             array( $this, 'add_thumbnail_sizes' ) );
		add_action( 'template_redirect',                             array( $this, 'endpoint_override' ) );

		// Wire filters
		add_filter( 'manage_seoslides-slideset_posts_columns',         array( $this, 'filter_list_table_columns' ) );
		add_filter( 'manage_edit-seoslides-slideset_sortable_columns', array( $this, 'filter_list_sortable_columns' ) );
		add_filter( 'post_row_actions',                                array( $this, 'remove_quick_edit' ), 10, 2 );
		add_filter( 'single_template',                                 array( $this, 'template_override' ) );
		add_filter( 'default_content',                                 array( $this, 'default_content' ), 10, 2 );
		add_filter( 'post_updated_messages',                           array( $this, 'presentation_messages' ) );
		add_filter( 'catalyst_api_key_name',                           array( $this, 'catalyst_key' ) );
		add_filter( 'default_hidden_meta_boxes',                       array( $this, 'custom_hidden_meta' ), 10, 2 );
		add_filter( 'post_row_actions',                                array( $this, 'post_row_actions' ), 10, 2 );
		add_filter( 'clean_url',                                       array( $this, 'disable_rocketloader' ) );
		add_filter( 'post_type_link',                                  array( $this, 'slide_permalink' ), 10, 2 );
		add_filter( 'admin_body_class',                                array( $this, 'body_class' ), 10, 1 );
		add_filter( 'seoslides_social_icons',                          array( $this, 'social_icons' ), 10, 1 );
		add_filter( 'pre_get_posts',                                   array( $this, 'hide_imports' ), 10, 1 );
		add_filter( 'wp_count_attachments',                            array( $this, 'hide_imports_from_count' ), 10, 2 );

		if ( defined( 'SEOSLIDES_ALPHA' ) && SEOSLIDES_ALPHA ) {
			add_filter( 'seoslides_frontend_themes', array( $this, 'alpha_themes' ), 10, 1 );
		}

		$this->install();
		$this->_cache_bust = time();
	}

	/**
	 * If the plugin is not installed, install it and set up appropriate DB values.
	 */
	public function install() {
		$installed = get_option( 'seoslides_version' );

		// Not previously installed
		if ( false === $installed ) {
			add_option( 'seoslides_version', SEOSLIDES_VERSION, '', 'no' );
			add_option( 'seoslides_logo', 'seoslides', '', 'no' );
			add_option( 'seoslides_logo_url', 'https://seoslides.com', '', 'no' );
			add_option( 'seoslides_logo_title', 'seoslides', '', 'no' );
			add_option( 'seoslides_logo_enabled', 'no', '', 'no' );
			add_option( 'seoslides_hideimports', 'yes', '', 'no' );

			// Remove default content filter and inject our template presenatation
			remove_filter( 'default_content', array( $this, 'default_content' ), 10, 2 );
			$this->insert_default_presentation();
			add_filter( 'default_content', array( $this, 'default_content' ), 10, 2 );

			return;
		}

		// Generic upgrade
		if ( version_compare( SEOSLIDES_VERSION, $installed, '>' ) ) {
			// Upgrade the option
			delete_option( 'seoslides_version' );
			add_option( 'seoslides_version', SEOSLIDES_VERSION, '', 'no' );

			// Add new options that didn't exist in legacy systems
			add_option( 'seoslides_hideimports', 'yes', '', 'no' );

			// Flush permalinks to make sure our new rules take effect
			add_action( 'init', 'flush_rewrite_rules' );

			return;
		}
	}

	/**
	 * Get the API key for the Catalyst ecommerce gateway.
	 *
	 * @param $api_index
	 *
	 * @return string
	 */
	public function catalyst_key( $api_index ) {
		return 'seoslides_api_key';
	}

	/****************************************************************/
	/**                          Structure                         **/
	/****************************************************************/

	/**
	 * Shortcut to register all CPTs
	 *
	 * @return void
	 */
	public function register_cpts() {
		$this->register_presentations();
		$this->register_slides();
	}

	/**
	 * Register the presentation post type.
	 */
	protected function register_presentations() {
		$labels = array(
			'name'               => __( 'Presentations', 'seoslides_translate' ),
			'singular_name'      => __( 'Presentation', 'seoslides_translate' ),
			'add_new'            => __( 'Add New', 'seoslides_translate' ),
			'add_new_item'       => __( 'Add New Presentation', 'seoslides_translate' ),
			'edit_item'          => __( 'Edit Presentation', 'seoslides_translate' ),
			'new_item'           => __( 'New Presentation', 'seoslides_translate' ),
			'all_items'          => __( 'All Presentations', 'seoslides_translate' ),
			'view_item'          => __( 'View Presentation', 'seoslides_translate' ),
			'search_items'       => __( 'Search Presentations', 'seoslides_translate' ),
			'not_found'          => __( 'No presentations found', 'seoslides_translate' ),
			'not_found_in_trash' => __( 'No presentations found in Trash', 'seoslides_translate' ),
			'parent_item_colon'  => '',
			'menu_name'          => __( 'Presentations', 'seoslides_translate' )
		);

		$args = array(
			'labels'             => $labels,
			'public'             => true,
			'publicly_queryable' => true,
			'show_ui'            => true,
			'show_in_menu'       => true,
			'query_var'          => true,
			'rewrite'            => array(
				'slug'       => 'slides',
				'with_front' => false,
			    'ep_mask'    => EP_PERMALINK | EP_SEOSLIDES,
			),
			'capability_type'    => 'post',
			'has_archive'        => false,
			'hierarchical'       => false,
			'menu_position'      => 20,
			'supports'           => array( 'title', 'author' )
		);

		register_post_type( 'seoslides-slideset', $args );
	}

	/**
	 * Register the slide post type.
	 */
	protected function register_slides() {
		$labels = array(
			'name'               => __( 'Presentation Slides', 'seoslides_translate' ),
			'singular_name'      => __( 'Presentation Slide', 'seoslides_translate' ),
			'add_new'            => __( 'Add New', 'seoslides_translate' ),
			'add_new_item'       => __( 'Add New Slide', 'seoslides_translate' ),
			'edit_item'          => __( 'Edit Slide', 'seoslides_translate' ),
			'new_item'           => __( 'New Slide', 'seoslides_translate' ),
			'all_items'          => __( 'All Slides', 'seoslides_translate' ),
			'view_item'          => __( 'View Slide', 'seoslides_translate' ),
			'search_items'       => __( 'Search Slides', 'seoslides_translate' ),
			'not_found'          => __( 'No slides found', 'seoslides_translate' ),
			'not_found_in_trash' => __( 'No slides found in Trash', 'seoslides_translate' ),
			'parent_item_colon'  => ''
		);

		$args = array(
			'labels'             => $labels,
			'public'             => false,
			'publicly_queryable' => false,
			'show_ui'            => false,
			'show_in_menu'       => false,
			'query_var'          => false,
			'capability_type'    => 'post',
			'has_archive'        => false,
			'hierarchical'       => false,
			'menu_position'      => null,
			'rewrite'            => false
		);

		register_post_type( 'seoslides-slide', $args );
	}

	/**
	 * Register a custom flag taxonomy.
	 *
	 * This taxonomy can be used to tag any post types to help with filtering.
	 */
	public function register_flags() {
		// Add new taxonomy, make it hierarchical (like categories)
		$labels = array(
			'name'              => __( 'Flags',         'seoslides_translate' ),
			'singular_name'     => __( 'Flag',          'seoslides_translate' ),
			'search_items'      => __( 'Search Flags',  'seoslides_translate' ),
			'all_items'         => __( 'All Flags',     'seoslides_translate' ),
			'parent_item'       => __( 'Parent Flag',   'seoslides_translate' ),
			'parent_item_colon' => __( 'Parent Flag:',  'seoslides_translate' ),
			'edit_item'         => __( 'Edit Flag',     'seoslides_translate' ),
			'update_item'       => __( 'Update Flag',   'seoslides_translate' ),
			'add_new_item'      => __( 'Add New Flag',  'seoslides_translate' ),
			'new_item_name'     => __( 'New Flag Name', 'seoslides_translate' ),
			'menu_name'         => __( 'Flag',          'seoslides_translate' ),
		);

		$args = array(
			'hierarchical'      => false,
			'labels'            => $labels,
			'show_ui'           => false,
			'show_admin_column' => false,
			'query_var'         => false,
			'rewrite'           => false,
		);

		register_taxonomy( 'seoslides-flag', array( 'attachment' ), $args );
	}

	/**
	 * Register custom image sizes.
	 */
	public function add_thumbnail_sizes() {
		add_image_size( 'seoslides-thumb', 220, 124 );
	}

	/**
	 * Register the default scripts and styles used by the plugin.
	 *
	 * @uses wp_register_script()
	 * @uses wp_register_style()
	 */
	public function register_assets() {
		// Deck JS Scripts
		wp_register_script( 'deck',            SEOSLIDES_URL . 'vendor/deck/core/deck.core.js',                        array( 'jquery' ), '1.1.0', true );
		wp_register_script( 'deck.menu',       SEOSLIDES_URL . 'vendor/deck/extensions/menu/deck.menu.js',             array( 'deck' ),   '1.1.0', true );
		wp_register_script( 'deck.goto',       SEOSLIDES_URL . 'vendor/deck/extensions/goto/deck.goto.js',             array( 'deck' ),   '1.1.0', true );
		wp_register_script( 'deck.status',     SEOSLIDES_URL . 'vendor/deck/extensions/status/deck.status.js',         array( 'deck' ),   '1.1.0', true );
		wp_register_script( 'deck.navigation', SEOSLIDES_URL . 'vendor/deck/extensions/navigation/deck.navigation.js', array( 'deck' ),   '1.1.0', true );

		// Deck JS Styles
		wp_register_style( 'deck',            SEOSLIDES_URL . 'vendor/deck/core/deck.core.css',                        array(),         '1.1.0', 'screen' );
		wp_register_style( 'deck.menu',       SEOSLIDES_URL . 'vendor/deck/extensions/menu/deck.menu.css',             array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.goto',       SEOSLIDES_URL . 'vendor/deck/extensions/goto/deck.goto.css',             array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.status',     SEOSLIDES_URL . 'vendor/deck/extensions/status/deck.status.css',         array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.navigation', SEOSLIDES_URL . 'vendor/deck/extensions/navigation/deck.navigation.css', array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.print',      SEOSLIDES_URL . 'vendor/deck/core/print.css',                            array( 'deck' ), '1.1.0', 'print'  );

		// Deck JS Transitions and Themes
		wp_register_style( 'deck.theme.neon',            SEOSLIDES_URL . 'vendor/deck/themes/style/neon.css',           array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.theme.swiss',           SEOSLIDES_URL . 'vendor/deck/themes/style/swiss.css',          array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.theme.web20',           SEOSLIDES_URL . 'vendor/deck/themes/style/web-2.0.css',        array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.transition.none',       SEOSLIDES_URL . 'css/deck.no-transition.css',                  array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.transition.fade',       SEOSLIDES_URL . 'vendor/deck/transition/fade.css',             array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.transition.horizontal', SEOSLIDES_URL . 'vendor/deck/transition/horizontal-slide.css', array( 'deck' ), '1.1.0', 'screen' );
		wp_register_style( 'deck.transition.vertical',   SEOSLIDES_URL . 'vendor/deck/transition/vertical-slide.css',   array( 'deck' ), '1.1.0', 'screen' );
	}

	/****************************************************************/
	/**                  Redirection and Rewrites                  **/
	/****************************************************************/

	/**
	 * Add custom rewrite rules to make sure individual slide URLs direct to the appropriate slideset.
	 */
	public function custom_rewrites() {
		add_rewrite_tag( '%seoslides-slide%', '(.+)' );
		add_rewrite_tag( '%seoslides-first%', '([0-9])' );

		add_rewrite_endpoint( 'allslides', EP_SEOSLIDES );

		add_rewrite_rule( '^slides/?$',           'index.php?seoslides-first=1',                                          'top' );
		//add_rewrite_rule( '^slides/(.+)/(.+)/?$', 'index.php?seoslides-slideset=$matches[1]&seoslides-slide=$matches[2]', 'top' );
		add_rewrite_rule( '^slides/(.+)/((?!allslides).+)/?$', 'index.php?seoslides-slideset=$matches[1]&seoslides-slide=$matches[2]', 'top' );
	}

	/**
	 * If the seoslides-first query arg is set, redirect to the most recent published presentation.
	 *
	 * @param array $headers
	 * @param WP    $wp
	 *
	 * @return array
	 */
	public function redirect_to_first( $headers, $wp ) {
		if ( ! isset( $wp->query_vars['seoslides-first'] ) || 1 !== (int) $wp->query_vars['seoslides-first'] ) {
			return;
		}

		// Get the most resent publication
		$sets = get_posts(
			array(
				'post_type'   => 'seoslides-slideset',
			    'post_status' => 'publish',
			    'numberposts' => 1,
			)
		);

		if ( 0 === count( $sets ) ) {
			return;
		}

		$slideset = new SEOSlides_Slideset( $sets[0] );

		header( 'Location: '.  trailingslashit( trailingslashit( get_permalink( $slideset->ID ) ) . $slideset->first_slide()->slug ), true, 307 );

		SEOSlides_Core::force_exit();
	}

	/**
	 * Intercept the template redirect request and inject the one bundled by the plugin if it's not set by the theme.
	 *
	 * If there is no global $post, or if the post type for the global $post is not 'seoslides-slideset,' skip any changes.
	 * Also, if the theme defines a template for 'seoslides-slideset,' skip changes and use that template instead.
	 *
	 * @param string $template Template file.
	 *
	 * @return string
	 */
	public function template_override( $template ) {
		global $post;

		if ( null === $post || 'seoslides-slideset' !== $post->post_type  ) {
			return $template;
		}

		// Remove the admin bar since, really, we don't want it
		$this->remove_incompatible_third_party_hooks();

		if ( strpos( $template, 'seoslides-slideset' ) > 0 ) {
			return $template;
		}

		return SEOSLIDES_PATH . 'templates/single-seoslides-slideset.php';
	}

	/**
	 * Intercept a request for the entire presentation markup (the AJAX request for "allslides") and return all slides
	 *
	 * @global WP_Query $wp_query
	 */
	public function endpoint_override() {
		global $wp_query;

		// if this is not a request for all slides or a singular object then bail
		if ( ! isset( $wp_query->query_vars['allslides'] ) || ! is_singular() ) {
			return;
		}

		// Set our content type
		header( 'Content-Type: application/json' );

		$slideset = new SEOSlides_Slideset( get_queried_object() );

		$sections = SEOSlides_Module_Provider::get( 'SEOSlides Ajax' )->render_slide_sections( $slideset );
		$response = array(
			'success'  => true,
		    'sections' => $sections,
		);

		wp_send_json( $response );
	}

	/****************************************************************/
	/**                    Scripts and Styles                      **/
	/****************************************************************/

	/**
	 * Build out the strings needed for JS to display properly in a local language.
	 *
	 * @uses wp_localize_script()
	 *
	 * @param string $handle Script we're localizing
	 */
	protected function script_translations( $handle ) {
		$strings = array(
			'label_no_bg'         => __( 'None', 'seoslides_translate' ),
			'label_edit'          => __( 'Edit', 'seoslides_translate' ),
			'label_edit_slide'    => __( 'Edit this slide', 'seoslides_translate' ),
			'label_delete'        => __( 'Delete', 'seoslides_translate' ),
			'label_delete_slide'  => __( 'Delete this slide', 'seoslides_translate' ),
			'label_trash'         => __( 'Trash', 'seoslides_translate' ),
			'label_trash_slide'   => __( 'Move slide to trash', 'seoslides_translate' ),
			'label_restore'       => __( 'Restore', 'seoslides_translate' ),
			'label_restore_slide' => __( 'Restore slide from trash', 'seoslides_translate' ),
			'message_show_trash'  => __( 'Show Trashed Slides', 'seoslides_translate' ),
			'label_master'        => __( 'Slide Master', 'seoslides_translate' ),
			'label_notitle'       => __( '(no title)', 'seoslides_translate' ),
			'save_master'         => __( 'Save Slide Master', 'seoslides_translate' ),
			'label_overview'      => __( 'Default Slide Layout', 'seoslides_translate' ),
			'label_defaults'      => __( 'Text Editor Defaults', 'seoslides_translate' ),
			'layout_image'        => __( 'Double-click to Insert Image', 'seoslides_translate' ),
			'layout_text'         => __( 'Click to Insert Text', 'seoslides_translate' ),
			'layout_headline'     => __( 'Click to Insert Headline', 'seoslides_translate' ),
			'layout_subheading'   => __( 'Click to Insert Subtitle', 'seoslides_translate' ),
			'edit_slide'          => __( 'Edit Slide', 'seoslides_translate' ),
			'save_slide'          => __( 'Save Slide', 'seoslides_translate' ),
			'slide_notes'         => __( 'Slide Notes', 'seoslides_translate' ),
			'layout_title'        => __( 'Title and Subtitle Layout', 'seoslides_translate' ),
			'layout_standard'     => __( 'Title and Text Layout', 'seoslides_translate' ),
			'layout_textonly'     => __( 'Text Layout', 'seoslides_translate' ),
			'layout_imageonly'    => __( 'Image Layout', 'seoslides_translate' ),
			'layout_rightimage'   => __( 'Text with Image on Right Layout', 'seoslides_translate' ),
			'layout_leftimage'    => __( 'Text with Image on Left Layout', 'seoslides_translate' ),
			'remove_media'        => __( 'Remove Media', 'seoslides_translate' ),
			'use_media'           => __( 'Use as Background Media', 'seoslides_translate' ),
			'set_media'           => __( 'Set Background Media', 'seoslides_translate' ),
			'wysiwyg_textarea'    => __( 'Textarea', 'seoslides_translate' ),
			'wysiwyg_menu'        => __( 'Insert Text', 'seoslides_translate' ),
			'wysiwyg_icon'        => SEOSLIDES_URL . '/img/text-mp6-16.png',
			'image_name'          => __( 'Image', 'seoslides_translate' ),
			'image_menu'          => __( 'Insert Image', 'seoslides_translate' ),
			'image_icon'          => SEOSLIDES_URL . '/img/img-mp6-16.png',
			'image_select'        => __( 'Select Image', 'seoslides_translate' ),
			'close'               => __( 'Close', 'seoslides_translate' ),
			'seo_title'           => __( 'Title:', 'seoslides_translate' ),
			'seo_description'     => __( 'Description:', 'seoslides_translate' ),
			'seo_keywords'        => __( 'Keywords:', 'seoslides_translate' ),
			'background'          => __( 'Background Settings', 'seoslides_translate' ),
			'transitions'         => __( 'Slide Transition', 'seoslides_translate' ),
			'hex_value'           => __( 'Hex Value', 'seoslides_translate' ),
			'choose_media'        => __( 'Embed Image/Video', 'seoslides_translate' ),
			'not_image'           => __( "Sorry, that file doesn't appear to be an image.", 'seoslides_translate' ),
			'not_image_or_video'  => __( "Sorry, that file doesn't appear to be an image or a video.", 'seoslides_translate' ),
			'video_only'          => __( ' Video', 'seoslides_translate' ),
			'right_click'         => __( 'Right-click on the canvas above to add elements to the slide.', 'seoslides_translate' ),
			'no_title'            => __( '(no title)', 'seoslides_translate' ),
			'oembed_video'        => __( 'YouTube/Vimeo Source', 'seoslides_translate' ),
			'oembed_valid'        => sprintf( '%s - <span class="valid">%s</span>', __( 'YouTube/Vimeo Source', 'seoslides_translate' ), __( 'Format Valid', 'seoslides_translate' ) ),
			'oembed_invalid'      => sprintf( '%s - <span class="invalid">%s</span>', __( 'YouTube/Vimeo Source', 'seoslides_translate' ), __( 'Invalid URL', 'seoslides_translate' ) ),
			'oembed_helper'       => __( 'Paste the URL to a YouTube or Vimeo video.', 'seoslides_translate' ),
			'label_font'          => __( 'Default Body Font', 'seoslides_translate' ),
			'label_font_size'     => __( 'Default Body Font Size', 'seoslides_translate' ),
			'label_font_color'    => __( 'Default Body Font Color', 'seoslides_translate' ),
			'label_h1_font'       => __( 'Default Header Font', 'seoslides_translate' ),
			'label_h1_font_size'  => __( 'Default Header Font Size', 'seoslides_translate' ),
			'label_h1_font_color' => __( 'Default Header Font Color', 'seoslides_translate' ),
			'insert_link'         => __( 'Save Backlink', 'seoslides_translate' ),
			'link_title'          => __( 'Insert/Edit Embed Backlink', 'seoslides_translate' ),
			'close_modal_conf'    => __( 'You have unsaved changes on this slide. Are you sure you wish to close the window?', 'seoslides_translate' ),
		    'modal_title'         => __( 'Insert Slides from the Media Gallery', 'seoslides_translate' ),
		    'modal_button'        => __( 'Insert', 'seoslides_translate' ),
		);

		wp_localize_script( $handle, 'seoslides_i18n', $strings );
	}

	/**
	 * Enqueue the mediaelement JS library, with a fallback in case we're not using WordPress 3.6.
	 */
	protected function enqueue_mediaelement() {
		if ( 1 === version_compare( '3.6', get_bloginfo( 'version' ) ) ) {
			wp_register_script( 'mediaelement', SEOSLIDES_URL . 'vendor/mediaelement/mediaelement-and-player.js', array( 'jquery' ), '2.11.3', 1 );
			wp_register_script( 'wp-mediaelement', SEOSLIDES_URL . 'vendor/mediaelement/wp-mediaelement.js', array( 'mediaelement' ), false, 1 );

			wp_register_style( 'mediaelement', SEOSLIDES_URL . 'vendor/mediaelement/mediaelementplayer.css' );
			wp_register_style( 'wp-mediaelement', SEOSLIDES_URL . 'vendor/mediaelement/wp-mediaelement.css', array( 'mediaelement' ) );
		}
		wp_enqueue_script( 'wp-mediaelement' );
		wp_enqueue_style( 'wp-mediaelement' );
	}

	/**
	 * Enqueue a plugin script file.
	 *
	 * @param string $handle
	 * @param array  $deps
	 * @param bool   $footer
	 */
	protected function enqueue_script( $handle, $deps = array(), $footer = false ) {
		if ( defined( 'SCRIPT_DEBUG' ) && true === SCRIPT_DEBUG ) {
			wp_enqueue_script( $handle, SEOSLIDES_URL . "js/{$handle}.src.js", $deps, SEOSLIDES_VERSION . $this->_cache_bust, $footer );
		} else {
			wp_enqueue_script( $handle, SEOSLIDES_URL . "js/{$handle}.min.js", $deps, SEOSLIDES_VERSION, $footer );
		}
	}

	/**
	 * Enqueue scripts and styles used on the admin side of the plugin.
	 */
	public function admin_enqueue_scripts() {
		$current_screen = get_current_screen();

		if ( 'seoslides-slideset' === $current_screen->post_type ) {
			wp_register_style( 'seoslides-iconography', SEOSLIDES_URL . 'css/seoslides-iconography.css', array(), SEOSLIDES_VERSION );
			wp_enqueue_style( 'seoslides-iconography' );

			if ( 'post' === $current_screen->base ) {
				$admin_deps = array( 'utils', 'jquery', 'wp-mediaelement', 'wpdialogs', );

				wp_enqueue_script( 'wp-color-picker' );
				wp_enqueue_style( 'wp-color-picker' );
				wp_enqueue_style( 'wp-jquery-ui-dialog' );
				wp_enqueue_media();

				// Thickbox for selecting background images
				wp_enqueue_script( 'media-upload' );
				wp_enqueue_style( 'thickbox' );

				$this->enqueue_mediaelement();

				$this->enqueue_script( 'poly_fill', null );
				$this->enqueue_script( 'seoslides_admin', $admin_deps, true );

				$slideset = new SEOSlides_Slideset( get_the_ID() );

				$js_variables = array(
					'ajaxurl'          => admin_url( 'admin-ajax.php' ),
					'slideset'         => get_the_ID(),
					'slideset_data'    => $slideset,
					'slide_default'    => $slideset->default_slide(),
					'create_nonce'     => wp_create_nonce( 'seoslides_create' ),
					'update_nonce'     => wp_create_nonce( 'seoslides_update' ),
					'delete_nonce'     => wp_create_nonce( 'seoslides_delete' ),
					'trash_nonce'      => wp_create_nonce( 'seoslides_trash' ),
					'restore_nonce'    => wp_create_nonce( 'seoslides_restore' ),
					'media_nonce'      => wp_create_nonce( 'seoslides-media' ),
					'menu_order_nonce' => wp_create_nonce( 'seoslides_order' ),
					'thickbox_noimage' => esc_url( admin_url( 'images/no.png' ) ),
					'thickbox_spinner' => esc_url( admin_url( 'images/wpspin_light.gif' ) ),
					'thickbox_yes'     => esc_url( admin_url( 'images/yes.png' ) ),
					'themes'           => $this->presentation_theme( get_the_ID() ),
				);

				wp_localize_script( 'seoslides_admin', 'seoslides', $js_variables );
				wp_localize_script( 'seoslides_admin', 'CKEDITOR_BASEPATH', SEOSLIDES_URL . 'vendor/ckeditor/' );
				$this->script_translations( 'seoslides_admin' );

				wp_enqueue_script( 'ckeditor', SEOSLIDES_URL . 'vendor/ckeditor/ckeditor.js', null, SEOSLIDES_VERSION, true );
			} else {
				$js_variables = array(
					'ajaxurl' => admin_url( 'admin-ajax.php' ),
				);

				$this->enqueue_script( 'seoslides_list', array( 'jquery' ), true );
				wp_localize_script( 'seoslides_list', 'seoslides', $js_variables );
				$this->script_translations( 'seoslides_list' );
			}

			wp_enqueue_style( 'seoslides-admin-slides', SEOSLIDES_URL . '/css/admin-styles-slides.css', array(), SEOSLIDES_VERSION, 'all' );
		}

		if ( 'post' === $current_screen->post_type ) {
			wp_enqueue_script( 'wpdialogs' );
			wp_enqueue_style( 'wp-jquery-ui-dialog' );
		}
		wp_enqueue_style( 'seoslides-bucket', SEOSLIDES_URL . '/js/lib/canvas/css/bucket.css', array(), SEOSLIDES_VERSION, 'all' );
		wp_enqueue_style( 'seoslides-admin', SEOSLIDES_URL . '/css/admin-styles.css', array(), SEOSLIDES_VERSION, 'all' );
	}

	/**
	 * Get the markup for a specific presentation theme.
	 *
	 * @param int $post_id
	 *
	 * @return string
	 */
	public function presentation_theme( $post_id ) {
		$theme = get_post_meta( $post_id, '_slideset_theme', true );

		$theme = empty( $theme ) ? 'swiss-horizontal' : $theme;

		$available_themes = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->available_themes();

		$output = '<div>';
		$output .= '<p><select id="seoslides_theme" name="seoslides_theme">';

		foreach( $available_themes as $name => $meta ) :
			$output .= '<option value="' . esc_attr( $name ) . '" ' . selected( $theme, $name, false ) . '>' . esc_html( $meta['name'] ) . '</option>';
		endforeach;

		$output .= '</select></p>';
		$output .= '</div>';
		$output .= '</div>';

		return $output;
	}

	/**
	 * Enqueue scripts and styles only for the presentations.
	 */
	public function slideset_enqueue_scripts() {
		if ( ! is_singular( 'seoslides-slideset' ) ) {
			return;
		}

		wp_register_script( 'seoslides-modernizr',               SEOSLIDES_URL . 'js/lib/modernizr.js',                             array(),                                                   '2.6.2' );
		wp_register_script( 'seoslides-mobile-detect',           SEOSLIDES_URL . 'vendor/mobile-detect/mobile-detect.min.js',       array(),                                                   '0.1.1' );
		wp_register_script( 'seoslides-mobile-detect-modernizr', SEOSLIDES_URL . 'vendor/mobile-detect/mobile-detect-modernizr.js', array( 'seoslides-modernizr', 'seoslides-mobile-detect' ), '0.1.1' );

		// Get presentation theme
		$theme_name = get_post_meta( get_the_ID(), '_slideset_theme', true );
		$theme_name = empty( $theme_name ) ? 'swiss-horizontal' : $theme_name;
		$all_themes = $this->available_themes();
		$theme = isset( $all_themes[ $theme_name ] ) ? $all_themes[ $theme_name ] : $all_themes[ 'swiss-horizontal'];

		// Styles
		if ( null !== $theme['theme'] ) wp_enqueue_style( 'seoslides-theme-' . $theme_name, $theme['theme'], array( 'deck', 'deck.menu', 'deck.goto', 'deck.status', 'deck.navigation' ), SEOSLIDES_VERSION, 'screen' );
		if ( null !== $theme['transition'] ) wp_enqueue_style( 'seoslides-transition-' . $theme_name, $theme['transition'], array( 'deck', 'deck.menu', 'deck.goto', 'deck.status', 'deck.navigation' ), SEOSLIDES_VERSION, 'screen' );
		wp_enqueue_style( 'seoslides-front', SEOSLIDES_URL . 'css/front-end.css', array( 'deck', 'deck.menu', 'deck.goto', 'deck.status', 'deck.navigation' ), SEOSLIDES_VERSION, 'screen' );
		wp_enqueue_style( 'seoslides-print', SEOSLIDES_URL . 'css/print.css', array(), SEOSLIDES_VERSION, 'print' );
		wp_register_style( 'dashicons', SEOSLIDES_URL . 'css/dashicons.css', array(), SEOSLIDES_VERSION );
		wp_register_style( 'seoslides-iconography', SEOSLIDES_URL . 'css/seoslides-iconography.css', array(), SEOSLIDES_VERSION );
		wp_enqueue_style( 'dashicons' );
		wp_enqueue_style( 'seoslides-iconography' );

		// Video
		$this->enqueue_mediaelement();

		// Scripts
		$this->enqueue_script( 'seoslides_front', array( 'jquery', 'seoslides-mobile-detect-modernizr', 'wp-mediaelement', 'deck', 'deck.menu', 'deck.goto', 'deck.status', 'deck.navigation' ), true );
		$this->script_translations( 'seoslides_front' );

		$embedID = '';
		if ( get_query_var( 'seoslides-embed' ) ) {
			$slide   = get_query_var( 'seoslides-embed-slide' ) ? get_query_var( 'seoslides-embed-slide' ) : '';
			$embedID = SEOSlides_Module_Provider::get( 'SEOSlides Embed' )->get_embed_unique_id( get_the_ID(), $slide );
		}

		wp_localize_script(
			'seoslides_front',
			'seoslides',
			array(
				'ajaxurl'    => admin_url( 'admin-ajax.php' ),
				'slideset'   => get_the_ID(),
				'embedID'    => $embedID,
				'photon_url' => function_exists( 'jetpack_photon_url' ) ? 'enabled' : 'disabled',
			)
		);
	}

	/**
	 * Forcably remove theme styles.
	 */
	public function remove_theme_styles() {
		if ( ! is_singular( 'seoslides-slideset' ) ) {
			return;
		}

		global $wp_styles, $wp_scripts;

		$theme_ss_uri = get_stylesheet_directory_uri();
		$child_ss_uri = get_template_directory_uri();

		foreach( $wp_styles->queue as $queued ) {
			if ( ! isset( $wp_styles->registered[ $queued ] ) ) {
				continue;
			}

			$sheet = $wp_styles->registered[ $queued ];

			if ( false !== strpos( $sheet->src, $theme_ss_uri ) || false !== strpos( $sheet->src, $child_ss_uri ) ) {
				$wp_styles->dequeue( $queued );
			}
		}

		foreach( $wp_scripts->queue as $queued ) {
			if ( ! isset( $wp_scripts->registered[ $queued ] ) ) {
				continue;
			}

			$script = $wp_scripts->registered[ $queued ];

			if ( false !== strpos( $script->src, $theme_ss_uri ) || false !== strpos( $script->src, $child_ss_uri ) ) {
				$wp_scripts->dequeue( $queued );
			}
		}
	}

	/**
	 * Unhook some scripts and styles that are known to cause issues with the front-end.
	 */
	protected function remove_incompatible_third_party_hooks() {
		// WordPress admin toolbar
		if ( wp_script_is( 'admin-bar', 'enqueued' ) ) {
			wp_dequeue_script( 'admin-bar' );
			wp_dequeue_style( 'admin-bar' );
		}

		remove_action( 'wp_footer', 'wp_admin_bar_render', 1000 );
		remove_action( 'wp_head',   'wp_admin_bar_header'       );
		remove_action( 'wp_head',   '_admin_bar_bump_cb'        );

		// Remove some known incompatibilities with Genesis Framework themes
		remove_filter( 'wp_title', 'genesis_doctitle_wrap', 20 );
		remove_filter( 'wp_title', 'genesis_default_title', 10, 3 );
	}

	/****************************************************************/

	/**
	 * Force a PHP exit. Useful for wiring to action hooks.
	 */
	public static function force_exit() {
		exit();
	}

	/**
	 * Add the number of presentations in the system to the Dashboard's Right Now widget.
	 */
	public function display_presentation_count() {
		$num_pres = wp_count_posts( 'seoslides-slideset' );

		$num = number_format_i18n( $num_pres->publish );
		$text = _n( 'Presentation', 'Presentations', intval( $num_pres->publish ), 'seoslides_translate' );

		if (  current_user_can( 'edit_posts' ) ) {
			$num = "<a href='edit.php?post_type=seoslides-slideset'>$num</a>";
			$text = "<a href='edit.php?post_type=seoslides-slideset'>$text</a>";
		}

		echo '<tr><td class="first b b">' . $num . '</td>';
		echo '<td class="t">' . $text . '</td></tr>';
	}

	/**
	 * Add presentations to the At a Glance widget in WordPress.
	 */
	public function right_now_presentation_count() {
		if ( current_user_can( 'edit_posts' ) ) {
			$num_pres = wp_count_posts( 'seoslides-slideset' );

			$text = _n( '%s Presentation', '%s Presentations', intval( $num_pres->publish ), 'seoslides_translate' );
			$text = sprintf( $text, number_format_i18n( $num_pres->publish ) );

			printf( "<li class='presentation-count'><a href='edit.php?post_type=seoslides-slideset'>%s</a></li>", $text );
		}
	}

	/**
	 * Set up the columns for the Presentation list page.
	 *
	 * @param array $post_columns
	 *
	 * @return array
	 */
	public function filter_list_table_columns( $post_columns ) {
		$columns = array(
			'cb'           => '<input type="checkbox" />',
			'thumbnail'    => __( 'Preview', 'seoslides_translate' ),
			'title'        => __( 'Title', 'seoslides_translate' ),
			'slide_count'  => __( 'Slides', 'seoslides_translate' ),
			'author'       => __( 'Author', 'seoslides_translate' ),
			'date'         => __( 'Date', 'seoslides_translate' ),
			'updated'      => __( 'Updated', 'seoslides_translate' )
		);

		return $columns;
	}

	/**
	 * Filter the display of the custom Presentation columns.
	 *
	 * @param string $column
	 * @param int    $slideset_id
	 *
	 * @return void
	 */
	public function filter_custom_columns( $column, $slideset_id ) {
		switch( $column ) {
			case 'thumbnail':
				$slideset = new SEOSlides_Slideset( $slideset_id );
				$title = $slideset->title;

				$slides = array_filter( $slideset->slides, array( 'SEOSlides_Slide', 'slide_is_published' ) );

				if ( count( $slides ) > 0 ) {
					$cover = $slideset->first_slide();

					if ( current_user_can( 'edit_post', $slideset_id ) )
						echo '<a href="' . get_edit_post_link( $slideset_id ) . '">';

					echo '<div class="list thumbnail">';

					if ( false === $cover->preview || 'false' === $cover->preview ) {
						// There is no preview thumbnail for this image, so we'll try to create one instead

						// First, build out the inline style, using auto-generated thumbnail images
						// Build out inline style
						$style = ' style="';
						if ( '' !== $cover->bg_image ) {
							$image = $cover->bg_image;
							$image_id = SEOSlides_Util::get_attachment_id_from_url( $cover->bg_image );

							if ( false === $image_id ) {
								if ( function_exists( 'jetpack_photon_url' ) ) {
									$image = jetpack_photon_url( $cover->bg_image, array(), '//' );
								}
							} else {
								$image_arr = wp_get_attachment_image_src( $image_id, 'seoslides-thumb' );
								$image = $image_arr[0];
							}

							$style .= 'background-image:url(' . $image . ');';
						}
						$style .= 'background-color:' . $cover->fill_color . ';"';

						echo "<section class='slide'><div class='slide-body' {$style}>";

						if ( ! empty( $cover->oembed ) ) {
							$embed_url = SEOSlides_Slide::get_embed_url( $cover->oembed );
							$thumb_url = SEOSlides_Slide::get_embed_thumbnail( $cover->oembed );

							if ( ! is_wp_error( $embed_url ) && ! is_wp_error( $thumb_url )) {
								echo '<img class="seoslides_iframe_thumb" src="' . $thumb_url . '" />';
								echo '<iframe class="seoslides_iframe" src="' . $embed_url . '" frameborder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
							}
						}

						foreach( $cover->objects as $object ) {
							echo '<div ';
							echo "data-element='{$object->element_id}' ";
							echo "data-plugin='{$object->plugin_id}' ";
							echo "data-width='{$object->settings->size->w}' ";
							echo "data-height='{$object->settings->size->h}' ";
							echo "data-top='{$object->settings->position->top}' ";
							echo "data-left='{$object->settings->position->left}' ";

							$style = 'position:absolute; ';
							$style .= 'top:' . $object->settings->position->top . 'px; ';
							$style .= 'left:' . $object->settings->position->left . 'px; ';
							$style .= 'width:' . $object->settings->size->w . 'px; ';
							$style .= 'height:' . $object->settings->size->h . 'px;';

							echo "style='{$style}'";

							echo '>';
							if ( isset( $object->settings->content ) ) {
								echo $object->settings->content;
							}
							echo '</div>';
						}

						echo '</div></section>';
					} else {
						echo "<img src=\"{$cover->preview}\" title=\"{$cover->title}\" />";
					}

					echo '</div>';

					if ( current_user_can( 'edit_post', $slideset_id ) )
						echo '</a>';
				}

				break;
			case 'description':
				$slideset = $this->get_slideset( $slideset_id );

				echo $slideset->excerpt;
				break;
			case 'slide_count':
				echo self::get_slide_count( $slideset_id );
				break;
			case 'updated':
				$slideset = $this->get_slideset( $slideset_id );
				$updated = mysql2date( 'G', $slideset->last_updated_gmt, false );
				$diff = time() - $updated;

				if ( $diff > 0 && $diff < DAY_IN_SECONDS ) {
					$time = sprintf( __( '%s ago' ), human_time_diff( $updated ) );
				} else {
					$time = mysql2date( __( 'Y/m/d' ), $slideset->last_updated );
				}

				echo $time;
				break;
		}
	}

	/**
	 * Make the Updated column to be sortable
	 *
 	* @param array $columns
	 *
 	* @return array
 	*/
	public function filter_list_sortable_columns( $columns ) {
		$columns['updated'] = 'modified';
		return $columns;
	}

	/**
	 * Remove the Quick Edit option from the list table.
	 *
	 * @param array  $actions
	 * @param object $post
	 *
	 * @return array
	 */
	public function remove_quick_edit( $actions, $post ) {
		if ( 'seoslides-slideset' == $post->post_type ) {
			unset( $actions['inline hide-if-no-js'] );
		}

		return $actions;
	}

	/**
	 * Get the total number of slides assigned to a particular presentation.
	 *
	 * @param int $slideset_id
	 *
	 * @return int
	 */
	public static function get_slide_count( $slideset_id ) {
		$cache_key = 'slideset_' . $slideset_id;

		$count = wp_cache_get( $cache_key, 'counts' );

		if ( false !== $count ) {
			return $count;
		}

		$slideset = new SEOSlides_Slideset( $slideset_id );

		$slides = array_filter( $slideset->slides, array( 'SEOSlides_Slide', 'slide_is_published' ) );

		$count = count( $slides );

		wp_cache_set( $cache_key, $count, 'counts' );

		return $count;
	}

	/**
	 * Register custom image sizes so appropriate thumbnails are available when needed.
	 *
	 * @uses add_image_size()
	 */
	public function custom_image_sizes() {
		add_image_size( 'seoslides-bg-thumb', 160, 90 );
	}

	/**
	 * Filter the default content of a new post.
	 *
	 * @param string  $post_content
	 * @param WP_Post $post
	 *
	 * @return string
	 */
	public function default_content( $post_content, $post ) {
		switch( $post->post_type ) {
			case 'seoslides-slideset':
				// Build out default customized CSS
				$default_css = "section.slide {}\r\n.deck-status {}";
				$default_css = apply_filters( 'seoslides_default_css', $default_css );

				add_post_meta( $post->ID, '_seoslides_custom_css', $default_css, true );

				// Build first slide and add it to the presentation
				$this->insert_default_slide( $post );

				// Track new presentation creation
				do_action( 'seoslides_presstrends_event', 'Presentation Created' );
				break;
		}

		return $post_content;
	}

	/**
	 * Insert the first, default slide upon creating a new presentation.
	 *
	 * @param WP_Post $parent WordPress post object representing the presentation.
	 */
	protected function insert_default_slide( $parent ) {
		$slide_title = sprintf( __ ( 'A %s presentation', 'seoslides_translate' ), get_bloginfo( 'name' ) );
		$slide_title = __ ( 'Hello World', 'seoslides_translate' );
		$content = array (
			'title'    => $slide_title,
			'content'  => '',
			'image'    => '',
			'bg-image' => '',
		);

		$slide = wp_insert_post (
			array (
			      'post_title'   => $slide_title,
			      'post_parent'  => $parent->ID,
			      'post_type'    => 'seoslides-slide',
			      'menu_order'   => 0,
			      'post_status'  => 'publish',
			      'post_content' => serialize ( $content ),
			)
		);

		$seo = array (
			'title'       => $slide_title,
			'description' => '',
			'keywords'    => ''
		);
		update_post_meta( $slide, 'seoslides_seo_settings', $seo );

		// Build and insert slide Headline
		$headline = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id'  => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings'   => array(
				'size'     => array(
					'w' => 1500,
					'h' => 150,
				),
				'position' => array(
					'top'  => 295,
					'left' => 50
				),
				'content'  => '<h1 style="text-align:center"><span style="font-size:0.8333em">' . $slide_title . '</span></h1>'
			)
		);
		$headline = new SEOSlides_CanvasObject( $headline );
		add_post_meta( $slide, 'seoslides_canvas_object', $headline );

		// Build the author byline
		$byline = sprintf( __( 'Presentation by %s', 'seoslides_translate' ), get_bloginfo( 'name' ) );

		// Build and insert slide Subheading
		$sub_headline = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id' => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings' => array(
				'size' => array(
					'w' => 1500,
					'h' => 150,
				),
				'position' => array(
					'top' => 455,
					'left' => 50
				),
				'content' => '<h2 style="text-align:center"><span style="font-size:1.077em">' . $byline . '</span></h2>'
			)
		);
		$sub_headline = new SEOSlides_CanvasObject( $sub_headline );
		add_post_meta( $slide, 'seoslides_canvas_object', $sub_headline );

		// Add a powered byline
		$powered_by = sprintf( __( 'powered by <a href="%s">seoslides</a>', 'seoslides_translate' ), esc_url( 'https://seoslides.com/' ) );

		// Build and insert slide Subheading
		$sub_headline = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id' => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings' => array(
				'size' => array(
					'w' => 1500,
					'h' => 150,
				),
				'position' => array(
					'top' => 615,
					'left' => 50
				),
				'content' => '<h4 style="text-align:center"><span style="font-size:1.077em">' . $powered_by . '</span></h4>'
			)
		);
		$sub_headline = new SEOSlides_CanvasObject( $sub_headline );
		add_post_meta( $slide, 'seoslides_canvas_object', $sub_headline );
	}

	/**
	 * Fetch a presentation from the database.
	 *
	 * @param int $slideset_id
	 *
	 * @return null|SEOSlides_Slideset
	 */
	public function get_slideset( $slideset_id ) {
		// Sanitize slideset ID
		$slideset_id = (int) $slideset_id ;

		$slideset = new SEOSlides_Slideset( $slideset_id );

		if ( 0 === $slideset->ID ) {
			return null;
		}

		return $slideset;
	}

	/**
	 * Get a specific slide from the database.
	 *
	 * @param int $slide_id
	 *
	 * @return object|null
	 */
	public function get_slide( $slide_id ) {
		// Sanitize slide id
		$slide_id = (int) $slide_id;

		$slide = new SEOSlides_Slide( $slide_id );

		if ( 0 === $slide->ID ) {
			return null;
		}

		return $slide;
	}

	/**
	 * Add messages specific to slideset save/error actions.
	 *
	 * @param array $messages
	 *
	 * @global WP_Post $post
	 * @global int     $post_ID
	 *
	 * @return array
	 */
	public function presentation_messages( $messages = array() ) {
		global $post, $post_ID;

		$use_in_post = ' ' . sprintf( __( 'Use presentatation <a data-nonce="%s" data-presentation="%s" data-action="%s" href="%s">in a new post</a>.', 'seoslides_translate' ), wp_create_nonce( 'use_in_post' ), $post_ID, 'use_in_post', esc_url( get_permalink( $post_ID ) . '#use_in_post' ) );

		$messages['seoslides-slideset'] = array(
			0  => '', // Unused. Messages start at index 1.
			1  => sprintf( __( 'Presentation updated. <a href="%s">View presentation</a>.', 'seoslides_translate' ), esc_url( get_permalink( $post_ID ) ) ) . $use_in_post,
			2  => __( 'Custom field updated.' ),
			3  => __( 'Custom field deleted.' ),
			4  => __( 'Presentation updated.', 'seoslides_translate' ),
			/* translators: %s: date and time of the revision */
			5  => isset( $_GET['revision'] ) ? sprintf( __( 'Presentation restored to revision from %s', 'seoslides_translate' ), wp_post_revision_title( (int) $_GET['revision'], false ) ) : false,
			6  => sprintf( __( 'Presentation published. <a href="%s">View presentation</a>', 'seoslides_translate' ), esc_url( get_permalink( $post_ID ) ) ) . $use_in_post,
			7  => __( 'Presentation saved.', 'seoslides_translate' ),
			8  => sprintf( __( 'Presentation submitted.', 'seoslides_translate' ), esc_url( add_query_arg( 'preview', 'true', get_permalink( $post_ID ) ) ) ),
			9  => sprintf( __( 'Presentation scheduled for: <strong>%1$s</strong>.', 'seoslides_translate' ),
				// translators: Publish box date format, see http://php.net/date
				date_i18n( __( 'M j, Y @ G:i' ), strtotime( $post->post_date ) ), esc_url( get_permalink( $post_ID ) ) ) . $use_in_post,
			10 => sprintf( __( 'Presentation draft updated.', 'seoslides_translate' ), esc_url( add_query_arg( 'preview', 'true', get_permalink( $post_ID ) ) ) ),
		);

		return $messages;
	}

	/**
	 * Adds a Presentations link to the front-end Toolbar
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The admin bar global instance.
	 */
	public function presentation_toolbar( $wp_admin_bar ) {
		if ( ! is_admin() ) {
			$wp_admin_bar->add_menu( array(
				'parent' => 'appearance',
				'id'     => 'presentations',
				'title'  => __( 'Presentations' ),
				'href'   => add_query_arg( 'post_type', 'seoslides-slideset', admin_url( 'edit.php' ) ),
			) );
		}
	}

	/**
	 * Add the import menu to the Presentations top-level item.
	 *
	 * @uses add_submenu_page
	 */
	public function add_menu() {
		add_submenu_page(
			'edit.php?post_type=seoslides-slideset',
			__( 'Settings', 'seoslides_translate' ),
			__( 'Settings', 'seoslides_translate' ),
			'edit_posts',
			'seoslides_settings',
			array( $this, 'menu' )
		);

		if ( $this->get_subscription_level() < 20 ) {
			global $submenu;

			$submenu['edit.php?post_type=seoslides-slideset'][50] = array( __( 'Upgrade', 'seoslides_translate' ), 'manage_options', 'https://seoslides.com/sign-up/#plan-comparison' );
		}

		add_submenu_page(
			'edit.php?post_type=seoslides-slideset',
			__( 'Support', 'seoslides_translate' ),
			__( 'Support', 'seoslides_translate' ),
			'edit_posts',
			'seoslides_support',
			array( $this, 'support' )
		);
	}

	/**
	 * Handle the core settings menu
	 */
	public function menu() {
		$this->process_postback();
		$api_key = get_option( 'seoslides_api_key', '' );
		$product_key = get_option( 'seoslides_product_key', '' );
		$hideimports = 'yes' === get_option( 'seoslides_hideimports', 'yes' );

		settings_errors( 'seoslides' );

		if ( $this->get_subscription_level() < 20 ) : ?>
			<div class="updated">
				<p><?php _e( 'You can use a free license key for 3 imports. Upgrade to the <a href="https://seoslides.com/pro">pro version</a> for unlimited imports during the beta.', 'seoslides_translate' ); ?></p>
			</div>
		<?php endif; ?>

		<div class="wrap">
			<?php screen_icon(); ?>
			<h2>
				<?php _e( 'seoslides Settings', 'seoslides_translate' ); ?>
			</h2>

			<h3>
				<?php _e( 'General Settings', 'seoslides_translate' ); ?>
			</h3>
			<form id="seoslides_settings" method="post">
				<?php wp_nonce_field( __FILE__, '_seoslides_nonce' ); ?>
				<table class="form-table">
					<tbody>

					<?php do_action( 'seoslides_settings_form_top_rows' ); ?>

					<tr valign="top">
						<th scope="row">
							<label for="api_key"><?php _e( 'License Key', 'seoslides_translate' ); ?></label>
						</th>
						<td>
							<input name="api_key" type="text" id="api_key" value="<?php echo esc_attr( $api_key ); ?>" class="regular-text" />
							<span id="api_key_indicator" class="<?php echo empty( $api_key ) ? 'unset' : 'valid'; ?>"></span>
							<p class="description"><?php _e( "Don't have a license key? Click <a href=\"https://seoslides.com/free\" class=\"popup\">here</a>.", 'seoslides_translate' ); ?></p>
						</td>
					</tr>

					<tr valign="top">
						<th scope="row">
							<label for="product_key"><?php _e( 'Product Key (optional)', 'seoslides_translate' ); ?></label>
						</th>
						<td>
							<input name="product_key" type="text" id="product_key" value="<?php echo esc_attr( $product_key ); ?>" class="regular-text" />
						</td>
					</tr>

					<tr valign="top">
						<th scope="row">
							<?php _e( 'Show Imported Slide Backgrounds', 'seoslides_translate' ); ?>
						</th>
						<td>
							<label for="showimports">
								<input name="showimports" type="checkbox" id="showimports" <?php checked( $hideimports, false, true ); ?>/>
								<?php _e( 'Show imported slide backgrounds in the media library.', 'seoslides_translate' ); ?>
							</label>
						</td>
					</tr>

					<?php do_action( 'seoslides_settings_form_bottom_rows' ); ?>

					</tbody>
				</table>

				<p class="submit"><input type="submit" name="submit" id="submit" class="button button-primary" value="<?php _e( 'Save Changes', 'seoslides_translate' ); ?>"></p>
			</form>
		</div>
<?php
	}

	/**
	 * Handle the user support menu
	 */
	public function support() {
		$step = empty( $_GET['step'] ) ? 0 : (int) $_GET['step'];
?>
		<?php if ( 1 === $step ) : ?>
			<div class="updated">
				<p>
					<?php _e( 'We\'ve got it! Someone from our support team will be in touch soon.', 'seoslides_translate' ); ?>
				</p>
			</div>
		<?php endif; ?>

		<?php $api_key = get_option( 'seoslides_api_key' ); ?>
		<?php $api_root = apply_filters( 'seoslides_api_root', 'https://seoslides.com' ); ?>
		<div class="wrap">
			<?php screen_icon(); ?>
			<h2>
				<?php _e( 'seoslides Support', 'seoslides_translate' ); ?>
			</h2>

			<form id="support-form" method="post" action="<?php echo $api_root; ?>/wp-admin/admin-post.php">
				<input id="seoslides-api_key" name="seoslides-api_key" type="hidden" value="<?php echo esc_attr( $api_key ); ?>" />
				<input id="seoslides-redirect" name="seoslides-redirect" type="hidden" value="<?php echo esc_attr( admin_url( 'edit.php?post_type=seoslides-slideset&page=seoslides_support&step=1' ) ); ?>" />
				<input id="action" name="action" type="hidden" value="support-request" />

				<p><?php echo sprintf( __( 'Please check our <a href="%s">comprehensive list of FAQs</a>.', 'seoslides_translate' ), 'https://seoslides.com/faq/'); ?></p>
				<p><?php _e( 'Still need help?', 'seoslides_translate' ); ?></p>
				<table class="form-table">
					<tbody>
						<?php do_action( 'seoslides_support_form_top_rows' ); ?>
						<tr valign="top">
							<th scope="row">
								<label for="message"><?php _e( 'How can we assist you?', 'seoslides_translate' ); ?></label>
							</th>
							<td>
								<textarea id="message" name="message" rows="6" cols="45" class="large-text ltr"></textarea>
							</td>
						</tr>

						<?php $current_user = wp_get_current_user(); ?>

						<tr valign="top">
							<th scope="row">
								<label for="name"><?php _e( 'Name', 'seoslides_translate' ); ?></label>
							</th>
							<td>
								<input id="name" name="name" type="text" class="regular-text ltr" value="<?php echo esc_attr( $current_user->user_firstname ); ?>" />
							</td>
						</tr>
						<tr valign="top">
							<th scope="row">
								<label for="contact"><?php _e( 'Email', 'seoslides_translate' ); ?></label>
							</th>
							<td>
								<input id="contact" name="contact" type="text" class="regular-text ltr" value="<?php echo esc_attr( $current_user->user_email ); ?>" />
							</td>
						</tr>
						<tr valign="top">
							<th scope="row">
								<label for="site_url"><?php _e( 'Site URL', 'seoslides_translate' ); ?></label>
							</th>
							<td>
								<input id="site_url" name="site_url" type="text" class="regular-text ltr" value="<?php echo esc_attr( get_bloginfo( 'url' ) ); ?>" />
							</td>
						</tr>
						<?php do_action( 'seoslides_support_form_bottom_rows' ); ?>
					</tbody>
				</table>

				<?php submit_button( __( 'Send Support Request', 'seoslides_translate' ), 'button button-primary' ); ?>

			</form>
		</div>
<?php
	}

	/**
	 * Process data from the posted form
	 */
	protected function process_postback() {
		if ( ! isset( $_POST['submit'] ) ) {
			return;
		}

		if ( ! isset( $_POST['_seoslides_nonce'] ) || ! wp_verify_nonce( $_POST['_seoslides_nonce'], __FILE__ ) ) {
			return;
		}

		// This test must pass before checking the api_key since the product_key is used in the validate_key() request.
		if ( isset( $_POST['product_key'] ) ) {
			$old_key = get_option( 'seoslides_product_key' );
			$new_key = sanitize_text_field( $_POST['product_key'] );

			if ( $old_key !== $new_key ) {
				if ( $old_key !== false ) {
					update_option( 'seoslides_product_key', $new_key );
				} else {
					add_option( 'seoslides_product_key', $new_key, '', 'no' );
				}
			}
		}

		if ( isset( $_POST['api_key'] ) ) {
			delete_transient( 'seoslides_level' );

			$old_key = get_option( 'seoslides_api_key' );
			$api_key = sanitize_text_field( $_POST['api_key'] );

			if ( $old_key !== $api_key ) {
				// Now validate the key against the remote API
				$catalyst = Catalyst_API::instance();
				$catalyst->set_api_key( $api_key );
				$valid = $catalyst->validate_key();

				if ( $valid ) {
					add_settings_error( 'seoslides', 'settings_updated', __( 'Settings Saved!', 'seoslides_translate' ), 'updated' );
				} elseif( ! empty( $catalyst->request_error ) ) {
					add_settings_error( 'seoslides', 'invalid_key', __( 'Could Not Validate Key.', 'seoslides_translate' ) . " <span style=\"font-style: italic;font-weight: normal;float: right;\">({$catalyst->request_error})</span>", 'error' );
				} else {
					add_settings_error( 'seoslides', 'invalid_key', __( 'Invalid License Key!', 'seoslides_translate' ), 'error' );
				}

				if ( $old_key !== false ) {
					update_option( 'seoslides_api_key', $api_key );
				} else {
					add_option( 'seoslides_api_key', $api_key, '', 'no' );
				}
			}
		}

		$hideimports = ( isset( $_POST['showimports'] ) && 'on' === $_POST['showimports'] ) ? 'no' : 'yes';
		update_option( 'seoslides_hideimports', $hideimports );

		do_action( 'seoslides_settings_postback' );
	}

	/**
	 * Hide the Custom CSS meta box by default.
	 *
	 * @param array     $hidden
	 * @param WP_Screen $screen
	 *
	 * @return array
	 */
	public function custom_hidden_meta( $hidden, $screen ) {
		if ( 'seoslides-slideset' !== $screen->id ) {
			return $hidden;
		}

		$hidden[] = 'seoslides_custom_css';

		return $hidden;
	}

	/**
	 * Get the site's subscription level, either from the cache or from the remote API.
	 *
	 * 0 - unregistered
	 * 10 - free
	 * 20 - premium
	 *
	 * @return int
	 */
	public function get_subscription_level() {
		$level = get_transient( 'seoslides_level' );

		if ( false === $level ) {
			$level = 0;
			$api_key = get_option( 'seoslides_api_key', '' );

			if ( ! empty( $api_key ) ) {
				$catalyst = Catalyst_API::instance();
				$catalyst->set_api_key( $api_key );
				$subscriptions = $catalyst->get_subscription_plans();

				if ( in_array( 'c8c8ee061df0601b7eb9ef90946100eded29e3d1e68b4dbe82e05aabb6042f8a', $subscriptions ) ) {
					$level = 20;
				} elseif ( in_array( 'e41a557640b1b8c2e73b5abe0460d10c56fd6052d30da96511ba80acf9fe0ccf', $subscriptions ) ) {
					$level = 10;
				}
			}

			set_transient( 'seoslides_level', $level, 60 * 60 );
		}

		return (int) $level;
	}

	public function presentation_help_tabs() {
		global $typenow;
		if ( is_admin() && 'seoslides-slideset' == $typenow ) {
			$basics  = '<p>' . __( 'This is the Presentation Editing screen. From here, you can:', 'seoslides_translate' ) . '</p>';
			$basics .= '<ul><li>' . __( 'Edit or create a new presentation', 'seoslides_translate' ) . '</li>';
			$basics .= '<li>'     . __( 'Customize the look and feel with CSS', 'seoslides_translate' ) . '</li>';
			$basics .= '<li>'     . __( 'Publish to seoslid.es', 'seoslides_translate' ) . '</li>';
			$basics .= '<li>'     . __( 'Modify your Embed Backlink', 'seoslides_translate' ) . '</li></ul>';
			$basics .= '<p>' . __( 'For a more in-depth look at how to edit your presentations, check out the other tabs in this panel. If you&#8217;re still stuck, we&#8217;re here to help &mdash; <a href="">Contact Support</a>.', 'seoslides_translate' ) . '</p>';

			get_current_screen()->add_help_tab( array(
				'id'      => 'seoslides-basics',
				'title'   => _x( 'Basics', 'general help tab', 'seoslides_translate' ),
				'content' => $basics
			) );

			$editing_help  = '<p>' . __( 'seoslides&#8217; editor enables you to create rich, SEO-friendly slideshow presentations with ease.', 'seoslides_translate' ) . '</p>';
			$editing_help .= '<p>' . __( 'In the slide editor you can:', 'seoslides_translate' ) . '</p>';
			$editing_help .= '<ul><li>' . __( 'Choose layouts', 'seoslides_translate' ) . '</li>';
			$editing_help .= '<li>'     . __( 'Add or edit text', 'seoslides_translate' ) . '</li>';
			$editing_help .= '<li>'     . __( 'Embed rich media such as audio or video', 'seoslides_translate' ) . '</li>';
			$editing_help .= '<li>'     . __( 'Change colors, and more!', 'seoslides_translate' ) . '</li></ul>';
			$editing_help .= '<p>' . __( 'Each presentation has a special &#8220;Slide Master&#8221; at the top of the slide list. This slide serves as a template for all of the other slides you add.', 'seoslides_translate' ) . '</p>';
			$editing_help .= '<p>' . __( 'To edit a specific slide, <strong>click that slide&#8217;s preview image or Edit link</strong> in the slides list.', 'seoslides_translate' ) . '</p>';

			get_current_screen()->add_help_tab( array(
				'id'      => 'seoslides-editing',
				'title'   => __( 'Editing Slides', 'seoslides_translate' ),
				'content' => $editing_help
			) );

			$stylesheet_url = plugin_dir_url( __FILE__ );
			$stylesheet_url = str_replace( 'includes/', 'css/front-end.css', $stylesheet_url );

			$multiplier_help  = '<p>' . __( 'Depending on your subscription level, you may have the option to share your presentations remotely on <a href="http://seoslid.es">seoslide.es</a>. A copy of your presentation will be embedded there and will link back to your site.', 'seoslides_translate' ) . '</p>';
			$multiplier_help .= '<p>' . __( 'seoslides Pro users may remotely share an <strong>unlimited</strong> number of presentatations, while free users are limited to <strong>just one</strong> remote publication. If you&#8217;ve already exhausted your free allowance, <a href="https://seoslides.com/pro/" target="_blank">upgrade to Pro today!</a>', 'seoslides_translate' ) . '</p>';
			$multiplier_help .= '<p>' . __( 'Sharing on seoslid.es:', 'seoslides_translate' ) . '</p>';
			$multiplier_help .= '<ol><li>' . __( 'First, publish your presentation on your site by <strong>clicking the blue Publish button</strong>', 'seoslides_translate' ) . '</li>';
			$multiplier_help .= '<li>'     . __( 'In the Publish meta box, <strong>click the Edit link, next to &#8220;seoslid.es&#8221;</strong>', 'seoslides_translate' ) . '</li>';
			$multiplier_help .= '<li>'     . __( '<strong>Click the &#8220;Share on seoslid.es now&#8221; button</strong> to send your presentation to the remote server. That&#8217;s it!', 'seoslides_translate' ) . '</li></ol>';
			$multiplier_help .= '<p>' . __( 'Other Options:', 'seoslides_translate' ) . '</p>';
			$multiplier_help .= '<ul><li>' . __( '<strong>Select the &#8220;Sync updates automatically&#8221; checkbox</strong> to auto-update the remote server whenever you update your presentation', 'seoslides_translate' ) . '</li>';
			$multiplier_help .= '<li>'     . __( '<strong>Click the &#8220;Remove from seoslid.es now&#8221; button</strong> to remove your presentation from the remote server', 'seoslides_translate' ) . '</li>';
			$multiplier_help .= '<li>'     . __( 'If your presentation has been shared remotely, removing it on your own site will also remove it from <a href="http://seoslid.es/">seoslid.es</a>', 'seoslides_translate' ) . '</li></ul>';

			get_current_screen()->add_help_tab( array(
				'id'      => 'seoslides-multiplier',
				'title'   => __( 'Using seoslid.es', 'seoslides_translate' ),
				'content' => $multiplier_help
			) );

			$presentation_help  = '<p>' . __( 'If the Embed Backlink is set, it will be included in the Presentation&#8217;s Extras popup as a slide button, adjacent to the &#8220;fullscreen&#8221; button. It can be accessed by clicking the &#8220;+&#8221; button at the lower right corner of the presentation.', 'seoslides_translate' ) . '</p>';

			get_current_screen()->add_help_tab( array(
				'id'      => 'seoslides-backlink',
				'title'   => __( 'Embed Backlink', 'seoslides_translate' ),
				'content' => $presentation_help
			) );
		} elseif ( is_admin() && 'post' == $typenow ) {
			$embed_presentations  = '<p>' . __( 'Embed a presentation from this or another site in a few simple steps:', 'seoslides_translate' ) . '</p>';
			$embed_presentations .= '<ol><li>' . __( 'Navigate to the Visual tab in the editor, and click the red and orange seoslides button.', 'seoslides_translate' ) . '</li>';
			$embed_presentations .= '<li>' . __( 'In the popup menu, paste an seoslides shortcode into the provided box, or, search for and select an existing presentation from the list.', 'seoslides_translate' ) . '</li>';
			$embed_presentations .= '<li>' . __( 'Once you&#8217;ve copied and pasted a shortcode, or made a selection from the list, click the &#8220;Embed Presentation&#8221; button to insert it into the editor.', 'seoslides_translate' ) . '</li>';
			$embed_presentations .= '<li>' . __( 'You&#8217;re finished!', 'seoslides_translate' ) . '</li></ol>';

			get_current_screen()->add_help_tab( array(
				'id'      => 'seoslides-embed',
				'title'   => __( 'Embed Presentations', 'seoslides_embed' ),
				'content' => $embed_presentations
			) );
		}
	}

	/**
	 * Filter out the Preview link from presentation drafts.
	 *
	 * @param array   $actions
	 * @param WP_Post $post
	 *
	 * @return array
	 */
	public function post_row_actions( $actions, $post ) {
		if ( 'seoslides-slideset' === $post->post_type && 'draft' === $post->post_status ) {
			unset( $actions['view'] );
		}

		return $actions;
	}

	/**
	 * Hide the view switcher from the All Presentations list table.
	 */
	public function hide_view_switcher() {
		if ( 'seoslides-slideset' == get_current_screen()->post_type ) :
			?>
			<style type="text/css">
				.view-switch {
					display: none;
				}
			</style>
		<?php
		endif;
	}

	/**
	 * Add CloudFlare tags to the main script as an attribute so RocketLoader ignores it.
	 *
	 * @param string $url URL to filter
	 *
	 * @return string
	 */
	public function disable_rocketloader( $url ) {
		// Build out the front script
		if ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) {
			$front_script = SEOSLIDES_URL . 'js/seoslides_front.src.js?ver=' . SEOSLIDES_VERSION . $this->_cache_bust;
		} else {
			$front_script = SEOSLIDES_URL . 'js/seoslides_front.min.js?ver=' . SEOSLIDES_VERSION;
		}


		if ( $front_script === $url ) {
			$url = "$url' data-cfasync='false";
		}

		return $url;
	}

	/**
	 * Filter the slide permalinks such that they return something useful.
	 *
	 * @since 1.0.3
	 *
	 * @param string  $url  Original permalink
	 * @param WP_Post $post Post object
	 *
	 * @return string
	 */
	public function slide_permalink( $url, $post ) {
		if ( 'seoslides-slide' !== get_post_type( $post ) ) {
			return $url;
		}

		// Build pretty permalink
		$slide = new SEOSlides_Slide( $post );
		$url = trailingslashit( get_permalink( $slide->parent( 'ID' ) ) ) . $slide->slug . '/';

		return $url;
	}

	/**
	 * Insert the "Hello World" presentation when the plugin is first installed.
	 */
	public function insert_default_presentation() {
		$presentation = wp_insert_post(
			array(
			     'post_type' => 'seoslides-slideset',
			     'post_status' => 'publish',
			     'post_title' => __( 'Hello World!', 'seoslides_translate' ),
			)
		);

		// Slide notes
		$notes = __( '<p>Even if all you are saying is "hello", notes are a great way to add additional SEO rich keywords.</p><p>Oh... and to cover details that are not on the slide.</p><p>Viewers of your presentation can see these notes by clicking the "+" in the lower right corner.</p>', 'seoslides_translate' );
		$notes = apply_filters( 'seoslides_welcome_presentation_notes', $notes );

		// Set up slide defaults
		$defaults = array(
			'fill_color'   => '#cccccc',
			'bg_image'     => SEOSLIDES_URL . 'img/welcome-internal.jpg',
			'font'         => 'Arial',
			'size'         => '1.077em',
			'color'        => '#ffffff',
			'header_font'  => 'Arial',
			'header_size'  => '0.705em',
			'header-color' => '#f36f21'
		);
		add_post_meta( $presentation, 'slide_defaults', $defaults, true );

		// Build out title slide
		$title_slide_title = __( 'Hello World!', 'seoslodes_translate' );
		$title_slide_content = array(
			'title'    => $title_slide_title,
			'content'  => '',
			'image'    => '',
			'bg-image' => SEOSLIDES_URL . 'img/welcome-title.jpg',
		);

		$title_slide = wp_insert_post(
			array(
			     'post_title'   => $title_slide_title,
			     'post_parent'  => $presentation,
			     'post_type'    => 'seoslides-slide',
			     'menu_order'   => 0,
			     'post_status'  => 'publish',
			     'post_content' => serialize ( $title_slide_content ),
			)
		);

		$title_seo = array (
			'title'       => $title_slide_title,
			'description' => '',
			'keywords'    => ''
		);
		update_post_meta( $title_slide, 'seoslides_seo_settings', $title_seo );

		$title_headline = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id' => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings' => array(
				'size' => array(
					'w' => 1500,
					'h' => 150,
				),
				'position' => array(
					'top' => 295,
					'left' => 50
				),
				'content' => '<h1 style="text-align:center"><span style="color:#ffac46"><span style="font-size:1.846em">' . $title_slide_title . '</span></span></h1>'
			)
		);
		$title_headline = new SEOSlides_CanvasObject( $title_headline );
		add_post_meta( $title_slide, 'seoslides_canvas_object', $title_headline );

		$title_sub_headline = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id' => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings' => array(
				'size' => array(
					'w' => 1000,
					'h' => 150,
				),
				'position' => array(
					'top' => 600,
					'left' => 500
				),
				'content' => '<h2 style="text-align:center"><em><span style="color:#ffffff;"><span style="font-size:1.077em">' . __( 'by the seoslides team', 'seoslides_translate' ) . '</span></span></em></h2>'
			)
		);
		$title_sub_headline = new SEOSlides_CanvasObject( $title_sub_headline );
		add_post_meta( $title_slide, 'seoslides_canvas_object', $title_sub_headline );

		add_post_meta( $title_slide, 'seoslides_notes', $notes, true );

		// Build out second slide
		$first_slide_title = __( 'Welcome to seoslides!' );
		$first_slide_content = array(
			'title'    => $first_slide_title,
			'content'  => '',
			'image'    => '',
			'bg-image' => SEOSLIDES_URL . 'img/welcome-internal.jpg',
		);

		$first_slide = wp_insert_post(
			array(
			     'post_title'   => $first_slide_title,
			     'post_parent'  => $presentation,
			     'post_type'    => 'seoslides-slide',
			     'menu_order'   => 1,
			     'post_status'  => 'publish',
			     'post_content' => serialize( $first_slide_content ),
			)
		);

		$first_seo = array (
			'title'       => $first_slide_title,
			'description' => '',
			'keywords'    => ''
		);
		update_post_meta( $first_slide, 'seoslides_seo_settings', $first_seo );

		$first_headline = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id' => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings' => array(
				'size' => array(
					'w' => 1500,
					'h' => 150,
				),
				'position' => array(
					'top' => 0,
					'left' => 50
				),
				'content' => '<h1 style="text-align:center"><span style="color:#ffac46"><span style="font-size:1em">' . $title_slide_title . '</span></span></h1>'
			)
		);
		$first_headline = new SEOSlides_CanvasObject( $first_headline );
		add_post_meta( $first_slide, 'seoslides_canvas_object', $first_headline );

		$first_content_text = '<p><span style="color:#ffffff"><span style="font-size:2.769em">' . __( 'This is your first presentation.', 'seoslides_translate' ) . '</span></span></p>';
		$first_content_text .= '<p><span style="color:#ffffff"><span style="font-size:2.769em">' . __( 'Edit or delete it', 'seoslides_translate' ) . '</span></span></p>';
		$first_content_text .= '<p><span style="color:#ffffff"><span style="font-size:2.769em">' . __( 'Then start presenting!', 'seoslides_translate' ) . '</span></span></p>';

		$first_content = array(
			'element_id' => SEOSlides_Util::generate_guid(),
			'plugin_id' => '1798dfc0-8695-11e2-9e96-0800200c9a66',
			'settings' => array(
				'size' => array(
					'w' => 1400,
					'h' => 650,
				),
				'position' => array(
					'top' => 200,
					'left' => 150
				),
				'content' => $first_content_text,
			)
		);
		$first_content = new SEOSlides_CanvasObject( $first_content );
		add_post_meta( $first_slide, 'seoslides_canvas_object', $first_content );

		add_post_meta( $first_slide, 'seoslides_notes', $notes, true );
	}

	/**
	 * Get an array of available themes for the presentation
	 *
	 * @uses apply_filters Allows plugin developers to add new themes with the 'seoslides_frontend_themes' filter
	 *
	 * @return array
	 */
	public function available_themes() {
		$themes = array();

		// Swiss styled theme
		$themes['swiss-horizontal'] = array(
			'name'       => __( 'Horizontal Slide (Default)', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/swiss.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/horizontal-slide.css',
		);
		$themes['swiss-vertical'] = array(
			'name'       => __( 'Vertical Slide', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/swiss.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/vertical-slide.css',
		);
		$themes['swiss-fade'] = array(
			'name'       => __( 'Fade', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/swiss.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/fade.css',
		);
		$themes['swiss-none'] = array(
			'name'       => __( 'No Transition', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/swiss.css',
			'transition' => SEOSLIDES_URL . 'css/deck.no-transition.css',
		);

		return apply_filters( 'seoslides_frontend_themes', $themes );
	}

	/**
	 * Add some extra themes for alpha-level testers.
	 *
	 * @param array $themes
	 *
	 * @return array
	 */
	public function alpha_themes ( $themes ) {
		// First, remove the old Swiss themes
		$old = array();
		$old['swiss-horizontal'] = $themes['swiss-horizontal'];
		$old['swiss-vertical'] = $themes['swiss-vertical'];
		$old['swiss-fade'] = $themes['swiss-fade'];
		$old['swiss-none'] = $themes['swiss-none'];
		unset( $themes['swiss-horizontal'] );
		unset( $themes['swiss-vertical'] );
		unset( $themes['swiss-fade'] );
		unset( $themes['swiss-none'] );

		// Neon styled theme
		$themes['neon-horizontal'] = array(
			'name'       => __( 'Neon - Horizontal Slide', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/neon.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/horizontal-slide.css',
		);
		$themes['neon-vertical']   = array(
			'name'       => __( 'Neon - Vertical Slide', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/neon.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/vertical-slide.css',
		);
		$themes['neon-fade']       = array(
			'name'       => __( 'Neon - Fade', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/neon.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/fade.css',
		);
		$themes['neon-none']       = array(
			'name'       => __( 'Neon - No Transition', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/neon.css',
			'transition' => SEOSLIDES_URL . 'css/deck.no-transition.css',
		);

		// Swiss styled theme
		$themes = array_merge( $themes, $old );

		// No styled theme
		$themes['none-horizontal'] = array(
			'name'       => __( 'No Theme - Horizontal Slide', 'seoslides_translate' ),
			'theme'      => null,
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/horizontal-slide.css',
		);
		$themes['none-vertical']   = array(
			'name'       => __( 'No Theme - Vertical Slide', 'seoslides_translate' ),
			'theme'      => null,
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/vertical-slide.css',
		);
		$themes['none-fade']       = array(
			'name'       => __( 'No Theme - Fade', 'seoslides_translate' ),
			'theme'      => null,
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/fade.css',
		);
		$themes['none-none']       = array(
			'name'       => __( 'No Theme - No Transition', 'seoslides_translate' ),
			'theme'      => null,
			'transition' => SEOSLIDES_URL . 'css/deck.no-transition.css',
		);

		// Web 2.0 styled theme
		$themes['web-horizontal'] = array(
			'name'       => __( 'Web 2.0 - Horizontal Slide', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/web-2.0.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/horizontal-slide.css',
		);
		$themes['web-vertical']   = array(
			'name'       => __( 'Web 2.0 - Vertical Slide', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/web-2.0.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/vertical-slide.css',
		);
		$themes['web-fade']       = array(
			'name'       => __( 'Web 2.0 - Fade', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/web-2.0.css',
			'transition' => SEOSLIDES_URL . 'vendor/deck/themes/transition/fade.css',
		);
		$themes['web-none']       = array(
			'name'       => __( 'Web 2.0 - No Transition', 'seoslides_translate' ),
			'theme'      => SEOSLIDES_URL . 'vendor/deck/themes/style/web-2.0.css',
			'transition' => SEOSLIDES_URL . 'css/deck.no-transition.css',
		);

		return $themes;
	}

	/**
	 * Filter body classes to detect MP6 or WordPress 3.8 so we can substitute the correct styles.
	 *
	 * @param string $classes
	 *
	 * @global $wp_version
	 *
	 * @return array
	 */
	public function body_class( $classes ) {
		global $wp_version;

		$classes = explode( " ", $classes );

		if ( in_array( 'mp6', $classes ) || version_compare( $wp_version, '3.8', '>=' ) ) {
			$classes[] = 'flaticons';
		}

		return implode( " ", $classes );
	}

	/**
	 * Add the default social sharing icons.
	 *
	 * All icons must be added as an array with the following elements:
	 * - Icon reference
	 * - Title to use in links
	 * - Text for share link
	 * - Actual share link
	 *
	 * For the share link, the ordered parameters will be:
	 * 1. Presentation URL
	 * 2. Share text (without URL)
	 *
	 * @param array $icons
	 *
	 * @return array
	 */
	public function social_icons( $icons ) {
		// seoslides
		$icons['seoslides'] = array(
			SEOSLIDES_URL . 'img/social_seoslides_blue.png',       // Icon
			__( 'Embed with seoslides', 'seoslides_translate' ),   // Link Title
			__( 'embed', 'seoslides_translate' ),                  // Link Text
			'#',                                                   // Share Link
		);

		// Facebook
		$icons['facebook'] = array(
			SEOSLIDES_URL . 'img/social_facebook.png',                        // Icon
			__( 'Share on Facebook', 'seoslides_translate' ),                 // Link Title
			__( 'share', 'seoslides_translate' ),                             // Link Text
			'https://facebook.com/sharer.php?s=100&p[url]=%s&p[title]=%s',    // Share Link
		);

		// Google
		$icons['google'] = array(
			SEOSLIDES_URL . 'img/social_google.png',          // Icon
			__( 'Share on Google+', 'seoslides_translate' ),  // Link Title
			__( '+1', 'seoslides_translate' ),                // Link Text
			'https://plus.google.com/share?url=%s',           // Share Link
		);

		// Twitter
		$icons['twitter'] = array(
			SEOSLIDES_URL . 'img/social_twitter.jpg',                            // Icon
			__( 'Tweet on Twitter', 'seoslides_translate' ),                     // Link Title
			__( 'tweet', 'seoslides_translate' ),                                // Link Text
			'https://twitter.com/intent/tweet?&url=%s&text=%s&via=seoslides',    // Share Link
		);

		// LinkedIn
		$icons['linkedin'] = array(
			SEOSLIDES_URL . 'img/social_linkedin.jpg',                          // Icon
			__( 'Share on LinkedIn', 'seoslides_translate' ),                   // Link Title
			__( 'share', 'seoslides_translate' ),                               // Link Text
			'http://www.linkedin.com/shareArticle?mini=true&url=%s&title=%s',   // Share Link
		);

		// Pinterest
		/*$icons['pinterest'] = array(
			'', // Icon
			__( 'Pin on Pinterest', 'seoslides_translate' ),                               // Link Title
			__( 'pin presentation on <a href="%s">pinterest</a>', 'seoslides_translate' ), // Link Text
			'http://pinterest.com/pin/create/button/?url=%s$1&media={URI-encoded URL of the image to pin}&description=%s2$', // Share Link
		);*/

		return $icons;
	}

	/**
	 * Filter the post query on the attachment page so we can hide imports.
	 *
	 * @param WP_Query $query
	 *
	 * @return WP_Query
	 */
	public function hide_imports( $query ) {
		// If we're not in the admin, bail.
		if ( ! is_admin() || 'attachment' !== $query->query['post_type'] ) {
			return $query;
		}

		// If we're not hiding imports, bail.
		if ( 'yes' !== get_option( 'seoslides_hideimports', 'yes' ) ) {
			return $query;
		}

		$tax_query = $query->get( 'tax_query' );
		if ( empty( $tax_query ) ) {
			$tax_query = array();
		}

		// Create the new tax query
		$tax_query[] = array(
			'taxonomy' => 'seoslides-flag',
			'terms'    => array( 'imported' ),
			'field'    => 'slug',
			'operator' => 'NOT IN',
		);

		// Update the tax query
		$query->set( 'tax_query', $tax_query );

		return $query;
	}

	/**
	 * Filter out hidden attachments from the UI where we count attachments.
	 *
	 * @param stdClass $counts
	 * @param string   $mime_type
	 *
	 * @return stdClass
	 */
	public function hide_imports_from_count( $counts, $mime_type ) {

		// If we're not hiding imports, bail.
		if ( 'yes' !== get_option( 'seoslides_hideimports', 'yes' ) ) {
			return $counts;
		}

		// We're hiding posts, so let's figure out how many attachments we really have in each status
		// The following logic is drawn directly from wp_count_attachments() in WordPress core.
		global $wpdb;

		// Get the term ID for the 'imported' taxonomy term
		$imported = get_term_by( 'name', 'imported', 'seoslides-flag' );
		if ( false === $imported ) {
			return $counts;
		}

		$imported = $imported->term_taxonomy_id;

		$and = wp_post_mime_type_where( $mime_type );
		$hide_and = $wpdb->prepare( "AND ( {$wpdb->posts}.ID NOT IN ( SELECT object_id FROM {$wpdb->term_relationships} WHERE term_taxonomy_id IN (%d) ) )", $imported );
		$count = $wpdb->get_results( "SELECT post_mime_type, COUNT( * ) AS num_posts FROM $wpdb->posts WHERE post_type = 'attachment' AND post_status != 'trash' $hide_and $and GROUP BY post_mime_type", ARRAY_A );

		$counts = array();
		foreach( (array) $count as $row ) {
			$counts[ $row['post_mime_type'] ] = $row['num_posts'];
		}
		$counts['trash'] = $wpdb->get_var( "SELECT COUNT( * ) FROM $wpdb->posts WHERE post_type = 'attachment' AND post_status = 'trash' $hide_and $and");

		return $counts;
	}
}
