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
		if ( '' !== $this->bg_image ) {
			$image = $this->bg_image;

			if ( function_exists( 'jetpack_photon_url' ) ) {
				$image = jetpack_photon_url( $this->bg_image, array(), '//' );
			}

			$style .= 'background-image:url(' . $image . ');';
		} elseif ( 'noimage' === $this->bg_image ) {
			// Pull out the background image from the presentation if it exists.
			// Get presentation fill color
			$default = get_post_meta( $this->slideset, '_default_slide', true );
			$this->fill_color = $default->bg_image;
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


		$image_id = SEOSlides_Core::get_attachment_id_from_url( $this->bg_image );
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
	 * @param string $class CSS class to apply to the <section>
	 * @param bool   $echo  Flag whether to echo or return the content
	 *
	 * @return string|void
	 */
	public function render( $class = 'deck-before', $echo = false ) {
		$section = "<section class='slide {$class}' data-id='{$this->ID}' id='{$this->slug}' {$this->style}>\r\n";

		$section .= "\t<div class='slide-body'>\r\n";

		if ( ! empty( $this->oembed ) ) {
			$embed_url = self::get_embed_url( $this->oembed );
			$thumb_url = self::get_embed_thumbnail( $this->oembed );

			if ( ! is_wp_error( $thumb_url ) ) {
				$section .= "\r\r<img class=\"seoslides_iframe_thumb\" src=\"" . $thumb_url . "\" />";
			}

			if ( ! is_wp_error( $embed_url ) ) {
				$section .= "\r\r<iframe class=\"seoslides_iframe\" src=\"" . $embed_url . "\" frameborder=\"0\" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>";
			}
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

		$section .= "\t</div>\r\n";
		$section .= '<span class="slide-button"></span>';
		$section .= '<span class="embed-button"></span>';

		$section .= $this->render_embed_overlay();

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
		$tabs = array();
		$asides = array();
		$actions = array();

		// Presenter notes tab and aside
		if ( ! empty( $this->presenter_notes ) ) {
			$tabs[]   = array( 'class' => 'notes-li', 'child' => 'note', 'label' => __( 'Notes', 'seoslides_translate' ) );
			$asides[] = array( 'class' => 'note', 'content' => "<div class='note-container'>{$this->presenter_notes}</div>" );
		}

		// Script embed tab and aside
		$tabs[]   = array( 'class' => 'embed-script-li', 'child' => 'script-embed-instructions', 'label' => __( 'Embed Script', 'seoslides_translate' ) );
		$asides[] = array( 'class' => 'script-embed-instructions', 'content' => '<p>' . __( 'Insert the script tag below where you would like the presentation to appear.', 'seoslides_translate' ) . '</p>' );

		// Shortcode embed tab and aside
		$tabs[]   = array( 'class' => 'shortcode-li', 'child' => 'wordpress-embed-instructions', 'label' => __( 'WordPress Shortcode', 'seoslides_translate' ) );
		$asides[] = array( 'class' => 'wordpress-embed-instructions', 'content' => '<p>' . __( 'Install the <span class="pseudolink" onclick="javascript:window.open(\'http://wordpress.org/plugins/seoslides\',\'_blank\');">seoslides plugin</span> on your WordPress site. Then copy the shortcode below into any post or page.', 'seoslides_translate' ) . '</p>' );

		$slideset_link = get_post_meta( $this->slideset, '_slideset_link', true );

		// Default actions
		if ( ! empty( $slideset_link ) ) {
			$actions[] = array( 'class' => 'overview', 'alt' => $this->parent( 'title' ), 'href' => esc_attr( $slideset_link ) );
		}
		$actions[] = array( 'class' => 'full-screen', 'alt' => __( 'Full screen', 'seoslides_translate' ), 'href' => '' );

		// Filter the tabs and asides to allow plugins to hook in and modify things
		$tabs = apply_filters( 'seoslides_embed_tabs', $tabs, $this, $this->post );
		$asides = apply_filters( 'seoslides_embed_asides', $asides, $this, $this->post );
		$actions = apply_filters( 'seoslides_embed_actions', $actions, $this, $this->post );

		// Build out the embed container
		$embed = '<div class="embed-container">';
		$embed .= '<ul class="embed-tabs">';
		foreach( $tabs as $tab ) {
			$class = $tab['class'] . ( $tab === $tabs[0] ? ' current default' : '' );
			$embed .= '<li class="' . $class . '" data-child="aside.' . $tab['child'] . '">' . $tab['label'] . '</li>';
		}
		$embed .= '</ul>';

		$embed .= '<div class="embed-actions">';
		foreach( $actions as $action ) {
			$embed .= '<span class="' . $action['class'] . ' action-icon" title="' . $action['alt'] . '" alt="' . $action['alt'] . '" data-href="' . $action['href'] . '">&nbsp;</span>';
		}
		$embed .= '</div>';

		foreach( $asides as $aside ) {
			$class =  $aside['class'] . ( $aside === $asides[0] ? ' child default' : ' child hidden' );
			$embed .= '<aside class="' . $class . '">' . $aside['content'] . '</aside>';
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

		$data = get_transient( $cache_key );
		if ( false === $data ) {
			require_once( ABSPATH . WPINC . '/class-oembed.php' );
			$oembed = _wp_oembed_get_object();
			$provider = $oembed->discover( $raw_url );
			$data = $oembed->fetch( $provider, $raw_url );

			if ( false === $data ) {
				return new WP_Error( 'badurl', __( 'Invalid ombed url.', 'seoslides_translate' ) );
			}

			set_transient( $cache_key, $data, 24 * 60 * 60 );
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

		$data = get_transient( $cache_key );
		if ( false === $data ) {
			require_once( ABSPATH . WPINC . '/class-oembed.php' );
			$oembed = _wp_oembed_get_object();
			$provider = $oembed->discover( $raw_url );
			$data = $oembed->fetch( $provider, $raw_url );

			if ( false === $data ) {
				return new WP_Error( 'badurl', __( 'Invalid ombed url.', 'seoslides_translate' ) );
			}

			set_transient( $cache_key, $data, 24 * 60 * 60 );
		}

		return $data->thumbnail_url;
	}
}
