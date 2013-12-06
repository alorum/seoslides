<?php
/**
 * Module Name: SEOSlides TinyMCE
 * Activation:  hidden
 * Description: Functionality to handle TinyMCE magic.
 * Version:     0.1
 * Author:      10up
 */

/**
 * Core functionality to handle TinyMCE Magic.
 *
 * @package    SEOSlides
 * @subpackage SEOSlides_TinyMCE
 * @since      0.1
 */
class SEOSlides_TinyMCE {

	private $dialog_rendered = false;

	/**
	 * Wire up actions and filters
	 */
	public function __construct() {
		add_action( 'wp_ajax_seoslides-embed-ajax', array( $this, 'handle_search' ) );

		add_filter( 'mce_external_plugins', array( $this, 'plugins' ) );
		add_filter( 'mce_buttons', array( $this, 'button' ) );
		add_filter( 'mce_external_languages', array( $this, 'languages' ) );
	}

	/**
	 * Handle the AJAX call to search for publications.
	 *
	 * @global $_POST
	 */
	public function handle_search() {
		check_ajax_referer( 'seoslides-embed', 'nonce' );

		$args = array();

		if ( isset( $_POST['search'] ) ) {
			$args['s'] = stripslashes( $_POST['search'] );
		}
		$args['pagenum'] = ! empty( $_POST['page'] ) ? absint( $_POST['page'] ) : 1;

		$results = $this->publication_query( $args );

		if ( ! isset( $results ) || 0 === count( $results ) ) {
			wp_send_json( 0 );
		}

		wp_send_json( $results );
	}

	/**
	 * Search for publications.
	 *
	 * @param array $args
	 * @return array
	 */
	private function publication_query( $args = array() ) {
		$query = array(
			'post_type'              => 'seoslides-slideset',
			'suppress_filters'       => true,
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
			'post_status'            => 'publish',
			'order'                  => 'DESC',
			'orderby'                => 'post_date',
			'posts_per_page'         => 20,
		);

		$args['pagenum'] = isset( $args['pagenum'] ) ? absint( $args['pagenum'] ) : 1;

		if ( isset( $args['s'] ) ) {
			$query['s'] = $args['s'];
		}

		$query['offset'] = $args['pagenum'] > 1 ? $query['posts_per_page'] * ( $args['pagenum'] - 1 ) : 0;

		// Run the query
		$get_posts = new WP_Query;
		$posts = $get_posts->query( $query );

		$results = array();
		if ( 0 === $get_posts->post_count ) {
			return $results;
		}

		// Populate results
		foreach( $posts as $post ) {
			// Get the embed ID for the first slide in the presentation
			$slideset = new SEOSlides_Slideset( $post->ID );

			/** @var SEOSlides_Embed $embed */
			$embed = SEOSlides_Module_Provider::get( 'SEOSlides Embed' );
			$embed_id = $embed->get_embed_unique_id( $post->ID, $slideset->first_slide()->slug );
			$embed_url = $embed->get_embed_url( $post->ID, $slideset->first_slide()->slug );

			$shortcode = '[seoslides embed_id="' . $embed_id . '"';
			$shortcode .= ' script_src="' . preg_replace( '/\/(slides|embeds)\//', '/embed-script/', $embed_url ) . '"';
			$shortcode .= ' overview_src="' . get_permalink( $post ) . '"';
			$shortcode .= ' title="' . get_the_title( $post ) . '"';
			$shortcode .= ' site_src="' . get_home_url() . '"';
			$shortcode .= ' site_title="' . get_bloginfo( 'name' ) . '"';
			$shortcode .= ' /]';

			$results[] = array(
				'ID'        => $post->ID,
				'title'     => trim( esc_html( strip_tags( get_the_title( $post ) ) ) ),
				'shortcode' => esc_attr( $shortcode ),
				'info'      => mysql2date( __( 'Y/m/d' ), $post->post_date ),
			);
		}

		return $results;
	}

	public function plugins( $plugins ) {
		$file = 'js/editor_plugin';
		$file .= defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ? '_src' : '';
		$file .= '.js';
		$plugins['seoslides'] = trailingslashit( SEOSLIDES_URL ) . $file;
		return $plugins;
	}

	public function button( $buttons ) {
		array_push( $buttons, 'separator', 'seoslides' );
		if ( did_action( 'admin_footer' ) ) {
			$this->embed_dialog();
		} else {
			add_action( 'admin_footer', array( $this, 'embed_dialog' ) );
		}
		return $buttons;
	}

	public function languages( $languages ) {
		$languages['seoslides'] = dirname( __FILE__ ) . '/objects/SEOSlides_TinyMCE_Languages.php';
		return $languages;
	}

	public function embed_dialog() {
		if ( ! $this->dialog_rendered ) {
			$this->dialog_rendered = true;
			?>
			<style>
				#seoslides-embed {
					background-color: #f5f5f5;
					line-height: 1.4em;
					font-size: 12px;
				}

				#seoslides-embed-update {
					line-height: 23px;
					float: right;
				}

				#seoslides-embed .submitbox {
					padding: 5px 10px;
					font-size: 11px;
					overflow: auto;
					height: 29px;
				}

				#seoslides-embed-details {
					padding: 10px 0 14px;
					border-bottom: 1px solid #dfdfdf;
					margin: 0 6px 14px;
				}

				#seoslides-embed-textarea {
					width: 100%;
					height: 100px;
				}

				#seoslides-embed p.howto {
					margin: 3px;
				}

				#seoslides-embed-search .toggle-arrow {
					padding-left: 18px;
					cursor: pointer;
					display: inline-block;
					height: 23px;
					line-height: 23px;
					background: transparent url(<?php echo includes_url( 'images/toggle-arrow.png' ); ?>) top left no-repeat;
				}

				#seoslides-embed-search .toggle-arrow-active {
					background-position: center left;
				}

				#seoslides-search-panel label span.search-label {
					display: inline-block;
					width: 80px;
					text-align: right;
					padding-right: 5px;
				}

				#seoslides-search-panel .query-notice {
					clear: both;
					margin-bottom: 0;
					border-bottom: 1px solid #f1f1f1;
					color: #333;
					padding: 4px 6px;
					cursor: pointer;
					position: relative;
				}

				#seoslides-search-panel ul {
					list-style: none;
					margin: 0;
					padding: 0;
				}

				#seoslides-search-panel li {
					clear: both;
					margin-bottom: 0;
					border-bottom: 1px solid #f1f1f1;
					color: #333;
					padding: 4px 6px;
					cursor: pointer;
					position: relative;
				}

				#seoslides-search-panel .item-title {
					display: inline-block;
					width: 80%;
				}

				#seoslides-search-panel .item-info {
					text-transform: uppercase;
					color: #666;
					font-size: 11px;
					position: absolute;
					right: 5px;
					top: 4px;
					bottom: 0;
				}

				#seoslides-search-results {
					display: none;
				}

				#seoslides-embed-search .query-results {
					border: 1px #dfdfdf solid;
					margin: 0 5px 5px;
					background: #fff;
					height: 185px;
					overflow: auto;
					position: relative;
				}
			</style>
			<div style="display: none;">
				<form id="seoslides-embed">
					<?php wp_nonce_field( 'seoslides-embed', 'seoslides-embed-nonce' ); ?>
					<div id="seoslides-embed-details">
						<p class="howto"><?php _e( 'Paste your seoslides embed shortcode in the box below.', 'seoslides_translate' ) ?></p>
						<textarea id="seoslides-embed-textarea"></textarea>
					</div>

					<div id="seoslides-embed-search">
						<p class="howto toggle-arrow"><?php _e( 'Or embed an existing presentation', 'seoslides_translate' ); ?></p>
						<div id="seoslides-search-panel" style="display: none;">
							<div class="link-search-wrapper">
								<label>
									<span class="search-label"><?php _e( 'Search' ); ?></span>
									<input type="search" id="seoslides-search-field" class="seoslides-search-field" autocomplete="off">
									<span class="spinner"></span>
								</label>
							</div>
							<div id="seoslides-search-results" class="query-results">
								<ul></ul>
								<div class="river-waiting">
									<span class="spinner"></span>
								</div>
							</div>
							<div id="seoslides-recent-results" class="query-results">
								<div class="query-notice"><em><?php _e( 'No search term specified. Showing recent items.' ); ?></em></div>
								<ul></ul>
								<div class="river-waiting">
									<span class="spinner"></span>
								</div>
							</div>
						</div>
					</div>

					<div class="submitbox">
						<div id="seoslides-embed-update">
							<input type="submit" value="<?php esc_attr_e( 'Embed Slideshow', 'seoslides_translate' ); ?>" class="button-primary" id="seoslides-embed-submit" name="seoslides-embed-submit">
						</div>
						<div id="seoslides-embed-cancel">
							<a class="submitdelete deletion" href="#"><?php _e( 'Cancel', 'seoslides_translate' ); ?></a>
						</div>
					</div>
				</form>
			</div>
		<?php
		}
	}

}