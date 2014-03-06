<?php
/**
 *
 *
 * @package SEOSlides
 * @subpackage Objects
 */
class SEOSlides_Slideset {
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
	 * @var string
	 */
	public $description;

	/**
	 * @var string
	 */
	public $excerpt;

	/**
	 * @var string
	 */
	public $last_updated;

	/**
	 * @var string
	 */
	public $last_updated_gmt;

	/**
	 * @var array
	 */
	public $slides = array();

	/**
	 * @var string
	 */
	public $seo_title;

	/**
	 * @var string
	 */
	public $seo_description;

	/**
	 * @var string
	 */
	public $seo_keywords;

	/**
	 * @var string
	 */
	public $html_notes;

	/**
	 * @var string
	 */
	public $short_notes;

	/**
	 * @var string
	 */
	public $default_fill_color;

	/**
	 * @var string
	 */
	public $default_bg_image;

	/**
 * @var string
 */
	public $default_font;

	/**
	 * @var string
	 */
	public $default_size;

	/**
	 * @var string
	 */
	public $default_font_color;

	/**
	 * @var string
	 */
	public $default_header_font;

	/**
	 * @var string
	 */
	public $default_header_size;

	/**
	 * @var string
	 */
	public $default_header_font_color;

	/**
	 * Create a new Slideset instance from a given WordPress Post.
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

		$this->setup_postdata( $post );

		// Store a reference to the WordPress post object.
		$this->post = $post;

		$this->ID = $post->ID;
		$this->title = $post->post_title;
		$this->description = $post->post_content;
		$this->excerpt = get_the_excerpt();
		$this->last_updated = $post->post_modified;
		$this->last_updated_gmt = $post->post_modified_gmt;

		$this->get_slides();

		// Get SEO Data
		$seo_settings = get_post_meta( $this->ID, 'seo_settings', true );
		$defaults = array(
			'title'       => '',
			'description' => '',
			'keywords'    => '',
		);
		$seo_settings = wp_parse_args( $seo_settings, $defaults );

		$this->seo_title = $seo_settings['title'];
		$this->seo_description = $seo_settings['description'];
		$this->seo_keywords = $seo_settings['keywords'];

		// Set up notes
		$this->html_notes = get_the_content();
		$this->short_notes = get_the_excerpt();

		// Set up defaults
		$slide_defaults = get_post_meta( $this->ID, 'slide_defaults', true );
		$defaults = array(
			'fill_color'   => '#ffffff',
			'bg_image'     => '',
			'font'         => 'Arial',
			'size'         => '1.077em',
			'color'        => '#000000',
			'header_font'  => 'Arial',
			'header_size'  => '0.8333em',
			'header_color' => '#000000',
		);
		$slide_defaults = wp_parse_args( $slide_defaults, $defaults );

		$this->default_fill_color = $slide_defaults['fill_color'];
		$this->default_bg_image = $slide_defaults['bg_image'];
		$this->default_font = $slide_defaults['font'];
		$this->default_size = $slide_defaults['size'];
		$this->default_font_color = $slide_defaults['color'];
		$this->default_header_font = $slide_defaults['header_font'];
		$this->default_header_size = $slide_defaults['header_size'];
		$this->default_header_font_color = $slide_defaults['header_color'];

		$this->reset_postdata();
	}

	/**
	 * Updates the slideset's stored meta in the database.
	 *
	 * DOES NOT affect slides belonging to the slideset!
	 *
	 * @return bool|WP_Error
	 */
	public function update() {
		// Update the underlying post
		$this->post->post_title = $this->title;
		$this->post->post_content = $this->description;

		$updated = wp_update_post( $this->post );

		if ( is_wp_error( $updated ) ) {
			return $updated;
		}

		// Now, update calculated properties on the slideset
		$this->setup_postdata( $this->post );
		$this->last_updated = $this->post->post_modified;
		$this->last_updated_gmt = $this->post->post_modified_gmt;
		$this->html_notes = get_the_content();
		$this->short_notes = get_the_excerpt();
		$this->reset_postdata();

		// Update SEO
		$seo = array(
			'title'       => $this->seo_title,
			'description' => $this->seo_description,
			'keywords'    => $this->seo_keywords
		);
		update_post_meta( $this->ID, 'seo_settings', $seo );

		// Update slide defauls
		$defaults = array(
			'fill_color'   => $this->default_fill_color,
			'bg_image'     => $this->default_bg_image,
			'font'         => $this->default_font,
			'size'         => $this->default_size,
			'color'        => $this->default_font_color,
			'header_font'  => $this->default_header_font,
			'header_size'  => $this->default_header_size,
			'header_color' => $this->default_header_font_color,
		);
		update_post_meta( $this->ID, 'slide_defaults', $defaults );

		return true;
	}

	/**
	 * Build out a default slide for the slideset
	 *
	 * @return SEOSlides_Slide
	 */
	public function default_slide() {
		/** @var bool|SEOSlides_Slide $default */
		$default = get_post_meta( $this->ID, '_default_slide', true );

		// If no default exists, create one
		if ( empty( $default ) ) {
			$default = new stdClass;
			$default->id = 'slide-default';
			$default->title = ! empty( $this->seo_title ) ? $this->seo_title : $this->title;
			$default->seo_description = $this->seo_description;
			$default->seo_keywords = $this->seo_keywords;
			$default->fill_color = '';
			$default->bg_image = 'noimage';
			$default->slideset = $this->ID;
			$default->objects = array();
			$default->oembed = '';

			add_post_meta( $this->ID, '_default_slide', $default, true );
		}

		return $default;
	}

	/**
	 * Specifically grab the first slide from the slideset. Since the internal slides array is not numerically-indexed,
	 * we have to do this manually.  It's done often enough to necessitate a class method.
	 *
	 * @return SEOSlides_Slide
	 */
	public function first_slide() {
		$slides = array_filter( $this->slides, array( 'SEOSlides_Slide', 'slide_is_published' ) );
		reset( $slides );
		$first_id = key( $slides );

		/** @var SEOSlides_Slide $first  */
		$first = $slides[ $first_id ];

		return $first;
	}

	/**
	 * Set up the global Post object so we can use loop functions outside the loop.
	 *
	 * @param WP_Post $new_post
	 */
	protected function setup_postdata( $new_post ) {
		global $post;
		$this->global_post = $post;
		$post = $new_post;
		setup_postdata( $post );
	}

	/**
	 * Reset the global Post object back to its initial state if we've overridden things.
	 */
	protected function reset_postdata() {
		if ( ! isset( $this->global_post ) ) {
			return;
		}

		global $post;
		$post = $this->global_post;
		unset( $this->global_post );
		wp_reset_postdata();
	}

	/**
	 * Populate the slide array.
	 *
	 * @return void
	 */
	protected function get_slides() {
		// Get the slideset's children
		$slides = get_children(
			array(
			     'post_parent' => $this->ID,
			     'post_type'   => 'seoslides-slide',
			     'post_status' => array( 'publish', 'trash' ),
			     'numberposts' => -1,
			     'orderby'     => 'menu_order',
			     'order'       => 'ASC'
			)
		);

		if ( false === $slides ) {
			return;
		}

		$this->slides = array_map( array( $this, 'convert_raw_slides' ), $slides );
	}

	/**
	 * Convert slides from the database to usable objects.
	 *
	 * @param WP_Post $slide
	 *
	 * @return SEOSlides_Slide
	 */
	protected function convert_raw_slides( $slide ) {
		return new SEOSlides_Slide( $slide );
	}

	/**
	 * Get a slideset's embed ID
	 *
	 * @return string
	 */
	public function get_embed_id() {
		return SEOSlides_Module_Provider::get( 'SEOSlides Embed' )->get_embed_unique_id( $this->ID, $this->first_slide()->slug );
	}
}
