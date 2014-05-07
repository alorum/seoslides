<?php
/**
 * Object wrapper for slides stored in the database
 *
 * @package SEOSlides
 * @subpackage Objects
 */
class SEOSlides_Slide {
	/**
	 * @var object|WP_Post
	 */
	private $post;

	/**
	 * @var int
	 */
	public $ID;

	/**
	 * @var string
	 */
	public $title;

	/**
	 * @var string;
	 */
	public $content;

	/**
	 * @var string;
	 */
	public $image;

	/**
	 * @var string;
	 */
	public $bg_image;

	/**
	 * @var string
	 */
	public $bg_thumb = '';

	/**
	 * @var string;
	 */
	public $style;

	/**
	 * @var int
	 */
	public $position = 0;

	/**
	 * @var bool|string
	 */
	public $preview = false;

	/**
	 * @var string;
	 */
	public $fill_color = '#ffffff';

	/**
	 * @var array
	 */
	public $objects = array();

	/**
	 * @var string;
	 */
	public $seo_title;

	/**
	 * @var string;
	 */
	public $seo_description;

	/**
	 * @var string;
	 */
	public $seo_keywords;

	/**
	 * @var string
	 */
	public $slug;

	/**
	 * @var string
	 */
	public $presenter_notes;

	/**
	 * @var int
	 */
	public $slideset;

	/**
	 * @var SEOSlides_Slideset
	 */
	protected $_parent;

	/**
	 * @var string
	 */
	public $status;

	/**
	 * @var string
	 */
	public $oembed;

	/**
	 * Default constructor.  Takes in a WordPress Post object and converts it into a slide.
	 *
	 * @param int|object|WP_Post $post
	 */
	public function __construct( $post ) {
		if ( ! is_object( $post ) && ! is_a( $post, 'WP_Post' ) ) {
			$post_id = (int) $post;

			$post = get_post( $post_id );
		}

		if ( null === $post ) {
			// Invalid post, so return something expressing an error.
			$this->ID = 0;
			return;
		}

		// Store a reference to the WordPress post object.
		$this->post = $post;

		// Build out normal fields
		$this->ID = $post->ID;
		$this->slug = $post->post_name;
		$this->position = $post->menu_order;
		$this->slideset = $post->post_parent;
		$this->status = $post->post_status;

		// Build out older static content
		$this->legacy_content();

		// Build out meta information
		$this->populate_meta();

		// Build out inline style
		$style = ' style="';
		$image = $this->get_bg_image();
		if ( '' !== $image && 'noimage' !== $image ) {
			$style .= 'background-image:url(' . $image . ');';
		} elseif ( 'noimage' === $image ) {
			// Pull out the background image from the presentation if it exists.
			// Get presentation fill color
			$default = get_post_meta( $this->slideset, '_default_slide', true );
			if ( empty( $this->fill_color ) ) {
				$this->fill_color = ( ! empty( $default->fill_color ) ) ? $default->fill_color : '#ffffff';
			}
		}
		$style .= 'background-color:' . $this->fill_color . ';"';
		$this->style = $style;

		$this->populate_seo();
	}

	/**
	 * Build out old-style static content
	 *
	 * @return void
	 */
	protected function legacy_content() {
		$slide_content = unserialize( $this->post->post_content );
		$this->title = isset( $slide_content['title'] ) ? $slide_content['title'] : '';
		$this->content = isset( $slide_content['text'] ) ? $slide_content['text'] : '';
		$this->image = isset( $slide_content['image'] ) ? $slide_content['image'] : '';
		$this->bg_image = isset( $slide_content['bg-image'] ) ? $slide_content['bg-image'] : null;


		$image_id = SEOSlides_Util::get_attachment_id_from_url( $this->bg_image );
		if ( false !== $image_id ) {
			$image_arr = wp_get_attachment_image_src( $image_id, 'seoslides-thumb' );
			$this->bg_thumb = $image_arr[0];
		}
	}

	/**
	 * Build out slide meta information
	 *
	 * @return void
	 */
	protected function populate_meta() {
		$preview = get_post_meta( $this->ID, 'seoslides_preview', true );
		$fill_color = get_post_meta( $this->ID, 'seoslides_fillcolor', true );
		$objects = get_post_meta( $this->ID, 'seoslides_canvas_object' );
		$notes = get_post_meta( $this->ID, 'seoslides_notes', true );

		$this->preview = empty( $preview ) ? false : $preview;
		$this->presenter_notes = $notes;
		$this->objects = $objects;
		$this->oembed = get_post_meta( $this->ID, 'seoslides_oembed', true );

		if ( empty( $fill_color ) ) {
			// Get presentation fill color
			$default = get_post_meta( $this->slideset, '_default_slide', true );
			$this->fill_color = isset( $default->fill_color ) ? $default->fill_color : '#ffffff';
		} else {
			$this->fill_color = $fill_color;
		}
	}

	/**
	 * Build out SEO meta information.
	 *
	 * @return void
	 */
	protected function populate_seo() {
		$seo = get_post_meta( $this->ID, 'seoslides_seo_settings', true );
		$seo = wp_parse_args(
			$seo,
			array(
			     'title'       => $this->title,
			     'description' => '',
			     'keywords'    => ''
			)
		);

		$this->seo_title = $seo['title'];
		$this->seo_description = $seo['description'];
		$this->seo_keywords = $seo['keywords'];
	}

	/**
	 * Build the <section> containing the slide and all of its related markup.
	 *
	 * @param string $class   CSS class to apply to the <section>
	 * @param bool   $echo    Flag whether to echo or return the content
	 * @param bool   $overlay Include slide buttons and overlay elements
	 *
	 * @return string|void
	 */
	public function render( $class = 'deck-before', $echo = false, $overlay = true ) {
		$section = "<section class='slide {$class}' data-id='{$this->ID}' id='{$this->slug}' {$this->style}>\r\n";

		$section .= "<div class='slide-body'>";

		if ( ! empty( $this->oembed ) ) {
			$embed_url = self::get_embed_url( $this->oembed );
			$embed_url = add_query_arg( array( 'enablejsapi' => true, 'api' => true, 'autoplay' => true ), $embed_url );
			$embed_url = str_replace( '//player.vimeo.com', 'https://player.vimeo.com', $embed_url );
			$thumb_url = self::get_embed_thumbnail( $this->oembed );

			if ( ! is_wp_error( $thumb_url ) ) {
				$section .= "<span class=\"seoslides_iframe_play\" data-embed=\"" . esc_attr( $embed_url ) . "\"></span>";
				$section .= "<img class=\"seoslides_iframe_thumb\" src=\"" . esc_url( $thumb_url ) . "\" />";
			}

			$section .= "<p class=\"video-no-mobile\">" . __( 'Videos are unavailable on mobile.', 'seoslides_translate' ) . '<br />';
			$section .= sprintf( __( 'Please <a href="%s" target="_blank">click here</a> to watch the video.', 'seoslides_translate' ), esc_attr( $this->oembed ) ) . '</p>';
		}

		if ( count ( $this->objects ) > 0 ) {
			/** @var SEOSlides_CanvasObject $object */
			foreach( $this->objects as $object ) {
				$section .= "\t\t<div ";
				$section .= 'data-element="' . $object->element_id . '" ';
				$section .= 'data-plugin="' . $object->plugin_id . '" ';
				$section .= 'data-width="' . $object->settings->size->w . '" ';
				$section .= 'data-height="' . $object->settings->size->h . '" ';
				$section .= 'data-top="' . $object->settings->position->top . '" ';
				$section .= 'data-left="' . $object->settings->position->left . '" ';

				$section .= 'style="postion:absolute;';
				$section .= 'top:' . $object->settings->position->top . 'px; ';
				$section .= 'left:' . $object->settings->position->left . 'px; ';
				$section .= 'width:' . $object->settings->size->w . 'px; ';
				$section .= 'height:' . $object->settings->size->h . 'px;';

				$section .= '">';

				$section .= "\t\t\t<div class='slide-object-unparsed-content'>";
				$section .= $object->settings->content;
				$section .= "\t\t\t</div>";

				$section .= "\t\t</div>";
			}
		}

		$section .= "</div>";

		if ( $overlay ) {
			$section .= '<span class="slide-button"></span>';
			$section .= '<span class="embed-button"></span>';

			$section .= $this->render_embed_overlay();
		}

		$section .= "</section>";

		if ( $echo ) {
			echo $section;
		} else {
			return $section;
		}
	}

	/**
	 * Get a slide permalink.
	 *
	 * @param string $type 'self' or 'previous' or 'next'
	 *
	 * @return string
	 */
	public function permalink( $type = 'self' ) {
		$permalink = '#';

		switch( $type ) {
			case 'previous':
				$slides = $this->parent( 'slides' );

				// Get this slide's position in the deck.
				$index = array_search( $this->ID, array_keys( $slides ) );
				$slides = array_values( $slides );

				if ( false === $index || 0 === $index ) {
					$permalink = '#';
				} else {
					/** @var SEOSlides_Slide $previous */
					$previous = $slides[ $index - 1 ];
					$permalink = get_permalink( $previous->ID );
				}
				break;
			case 'next':
				$slides = $this->parent( 'slides' );

				// Get this slide's position in the deck.
				$index = array_search( $this->ID, array_keys( $slides ) );
				$slides = array_values( $slides );


				if ( false === $index || ( count( $slides ) - 1 ) === $index ) {
					$permalink = '#';
				} else {
					/** @var SEOSlides_Slide $next */
					$next = $slides[ $index + 1 ];
					$permalink = get_permalink( $next->ID );
				}
				break;
			case 'self':
			default:
				$permalink = get_permalink( $this->ID );
		}

		return $permalink;
	}

	/**
	 * Render the markup for the embed overlay.
	 *
	 * @uses apply_filters Filters 'seoslides_embed_tabs' passing the tabs array, the Slide instance, and its underlying post.
	 * @uses apply_filters Filters 'seoslides_embed_asides' passing the asides array, the Slide instance, and its underlying post.
	 * @uses apply_filters Filters 'seoslides_embed_actions' passing the button actions array, the Slide instance, and its underlying post.
	 *
	 * @return string Embed overlay markup
	 */
	public function render_embed_overlay() {
		$asides = array();

		// Shortcode embed tab and aside
		$asides['wordpress-embed-instructions'] = '<h2 class="overlay-label">' . sprintf( __( 'Embed with seoslides: %s', 'seoslides_translate' ), esc_html( $this->parent( 'title' ) ) ) . '</h2><p>' . __( 'Install the <span class="pseudolink" onclick="javascript:window.open(\'http://wordpress.org/plugins/seoslides\',\'_blank\');">seoslides plugin</span> on your WordPress site. Then, to embed this presentation from this slide, copy the shortcode below into any post or page.', 'seoslides_translate' ) . '</p>';

		// Script embed tab and aside
		$asides['script-embed-instructions'] =  '<h2 class="overlay-label">' . sprintf( __( 'Embed: %s', 'seoslides_translate' ), esc_html( $this->parent( 'title' ) ) ) . '</h2><p>' . __( 'To embed this presentation from this slide, insert the script tag below where you would like the presentation to appear.', 'seoslides_translate' ) . '</p>';

		// Presenter notes tab and aside
		$asides['note'] = "<div class='note-container'><h2 class='overlay-label'>" . sprintf( __( 'Notes: %s', 'seoslides_translate' ),  esc_html( $this->title ) ) . "</h2>" . ( empty( $this->presenter_notes ) ? __( 'Notes are not available for this slide.', 'seoslides_translate' ) : wp_kses_post( $this->presenter_notes ) ) . "</div>";

		// Filter asides so other plugins can hook in to add their own overlays
		$asides = apply_filters( 'seoslides_embed_asides', $asides, $this, $this->post );

		// Build out the embed container
		$embed = '<div class="embed-container">';

		reset( $asides );
		$first_item = key( $asides );
		foreach( $asides as $aside_class => $content ) {
			$class =  $aside_class . ( $aside_class === $first_item ? ' default current' : '' );
			$embed .= '<aside class="' . $class . '">' . $content . '</aside>';
		}

		$embed_id = SEOSlides_Module_Provider::get( 'SEOSlides Embed' )->get_embed_unique_id( $this->post->post_parent, $this->slug );
		if ( ! empty( $this->presenter_notes ) ) {
			$embed .= '<input class="embed-input hidden" data-title="' . get_the_title( $this->slideset ) . '" data-site="' . get_bloginfo( 'name' ) . '" data-siteurl="' . get_bloginfo( 'url' ) . '" id="' . $embed_id . '" />';
		} else {
			$embed .= '<input class="embed-input default" data-title="' . get_the_title( $this->slideset ) . '" data-site="' . get_bloginfo( 'name' ) . '" data-siteurl="' . get_bloginfo( 'url' ) . '" id="' . $embed_id . '" />';
		}

		$embed .= '</div>';

		return $embed;
	}

	/**
	 * Updates the slide in the database.
	 *
	 * @return bool|WP_Error
	 */
	public function update() {
		// Refetch old serialized content to update it
		$slide_content = unserialize( $this->post->post_content );
		$slide_content['title'] = $this->title;
		$slide_content['bg-image'] = $this->bg_image;

		// Update the underlying post
		$this->post->post_title = $this->title;
		$this->post->post_name = $this->slug;
		$this->post->menu_order = $this->position;
		$this->post->post_content = serialize( $slide_content );
		$updated = wp_update_post( $this->post );

		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		update_post_meta( $this->ID, 'seoslides_fillcolor', $this->fill_color );
		update_post_meta( $this->ID, 'seoslides_notes', $this->presenter_notes );
		update_post_meta( $this->ID, 'seoslides_oembed', $this->oembed );

		// Update SEO
		$seo = array(
			'title'       => $this->title,
			'description' => $this->seo_description,
			'keywords'    => $this->seo_keywords
		);
		update_post_meta( $this->ID, 'seoslides_seo_settings', $seo );

		// Update objects
		delete_post_meta( $this->ID, 'seoslides_canvas_object' );
		/** @var SEOSlides_CanvasObject $object */
		foreach( $this->objects as $object ) {
			add_post_meta( $this->ID, 'seoslides_canvas_object', $object );
		}

		return true;
	}

	/**
	 * Get a property from the slide's parent slideset.
	 *
	 * @param string $property
	 *
	 * @return mixed
	 */
	public function parent( $property ) {
		if ( ! isset( $this->_parent ) ) {
			$this->_parent = new SEOSlides_Slideset( $this->slideset );
		}

		return $this->_parent->$property;
	}

	/**
	 * Get the background image for the slide.
	 *
	 * @return string
	 */
	public function get_bg_image() {
		$image = $this->bg_image;

		// If the image is not set, then grab it from the parent presentation.
		if ( 'noimage' === $image ) {
			$default = get_post_meta( $this->slideset, '_default_slide', true );
			if ( isset( $default->bg_image ) && '' !== $default->bg_image && 'noimage' !== $default->bg_image ) {
				$image = $default->bg_image;
			}
		}

		if ( '' !== $image && 'noimage' !== $image && function_exists( 'jetpack_photon_url') ) {
			$image = jetpack_photon_url( $image, array(), '//' );
		}

		return $image;
	}

	/**
	 * Helper function for array filter
	 *
	 * @param SEOSlides_Slide $slide
	 *
	 * @return bool
	 */
	public static function slide_is_published( $slide ) {
		return 'publish' === $slide->status;
	}

	/**
	 * Get and cache the oEmbed data for a given URL.
	 *
	 * @param string $raw_url
	 *
	 * @return WP_Error|string
	 */
	public static function get_embed_url( $raw_url ) {
		$raw_url = trim( $raw_url );

		if ( empty( $raw_url ) ) {
			return '';
		}

		$cache_key = '_seoslides_oembed_' . wp_hash( $raw_url );

		if ( false === ( $data = get_transient( $cache_key ) ) ) {
			require_once( ABSPATH . WPINC . '/class-oembed.php' );
			$oembed = _wp_oembed_get_object();
			$provider = $oembed->discover( $raw_url );
			$data = $oembed->fetch( $provider, $raw_url );

			if ( false === $data ) {
				return new WP_Error( 'badurl', __( 'Invalid ombed url.', 'seoslides_translate' ) );
			}

			set_transient( $cache_key, $data );
		}

		$html = $data->html;
		preg_match( '/src="(.*?)"/', $html, $matches );

		return $matches[1];
	}

	/**
	 * Get the thumbnail url for a given video.
	 *
	 * @param string $raw_url
	 *
	 * @return WP_Error|string
	 */
	public static function get_embed_thumbnail( $raw_url ) {
		$raw_url = trim( $raw_url );

		if ( empty( $raw_url ) ) {
			return '';
		}

		$cache_key = '_seoslides_oembed_' . wp_hash( $raw_url );

		if ( false === ( $data = get_transient( $cache_key ) ) ) {
			require_once( ABSPATH . WPINC . '/class-oembed.php' );
			$oembed = _wp_oembed_get_object();
			$provider = $oembed->discover( $raw_url );
			$data = $oembed->fetch( $provider, $raw_url );

			if ( false === $data ) {
				return new WP_Error( 'badurl', __( 'Invalid ombed url.', 'seoslides_translate' ) );
			}

			set_transient( $cache_key, $data );
		}

		return $data->thumbnail_url;
	}
}
