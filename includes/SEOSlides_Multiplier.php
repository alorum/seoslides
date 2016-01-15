<?php
/**
 * Module Name: SEOSlides Multiplier
 * Activation:  disabled
 * Description: Functionality to handle pushing content to the SEOSlides remote.
 * Version:     0.3
 * Author:      10up
 */

require_once( ABSPATH . WPINC . '/class-IXR.php' );
require_once( ABSPATH . WPINC . '/class-wp-http-ixr-client.php' );

/**
 * Class SEOSlides_Multiplier
 *
 * @property-read object             $embed
 * @property-read WP_HTTP_IXR_Client $client
 * @property-read string             $host
 */
class SEOSlides_Multiplier {
	/**
	 * @var string
	 */
	protected $domain;

	/**
	 * @var bool|string
	 */
	protected $api_key;

	/**
	 * @var bool|WP_HTTP_IXR_Client
	 */
	protected $_client = false;

	public function __construct() {
		// Multiplier actions
		add_action( 'post_submitbox_misc_actions', array( $this, 'multiplier_misc_actions' ) );
		add_action( 'save_post',                   array( $this, 'save_post' ) );
		add_action( 'admin_enqueue_scripts',       array( $this, 'admin_enqueue_scripts' ) );

		// AJAX
		add_action( 'wp_ajax_push_remote_now',     array( $this, 'push_remote_now' ) );
		add_action( 'wp_ajax_delete_remote_now',   array( $this, 'delete_remote_now' ) );

		// Build the site domain
		$url = get_bloginfo( 'url' );
		$url = parse_url( $url );
		$this->domain = $url['host'];
		if ( isset( $url['path'] ) ) {
			$this->domain .= $url['path'];
		}
		$this->domain = apply_filters( 'catalyst_domain', $this->domain );

		// Get API key
		$this->api_key = get_option( 'seoslides_api_key' );
	}

	/**
	 * Lazy property loader.
	 *
	 * @param string $field
	 *
	 * @return null|object
	 */
	public function __get( $field ) {
		switch( $field ) {
			case 'embed':
				return SEOSlides_Module_Provider::get( 'SEOSlides Embed' );
			case 'client':
				if ( false === $this->_client ) {
					$this->_client = new WP_HTTP_IXR_Client( $this->host );
				}

				return $this->_client;
			case 'host':
				return apply_filters( 'seoslides_mutliplier_host', 'http://seoslid.es/xmlrpc.php' );
		}

		return null;
	}

	/**
	 * Enqueue the scripts needed by the Mutliplier module.
	 */
	public function admin_enqueue_scripts() {
		$current_screen = get_current_screen();
		if ( 'seoslides-slideset' !== $current_screen->post_type || 'post' !== $current_screen->base ) {
			return;
		}

		if ( defined( 'SCRIPT_DEBUG' ) && true === SCRIPT_DEBUG ) {
			wp_enqueue_script( 'seoslides_multiplier', SEOSLIDES_URL . "js/seoslides_multiplier.src.js", array( 'jquery-ui-dialog' ), SEOSLIDES_VERSION . time(), true );
		} else {
			wp_enqueue_script( 'seoslides_multiplier', SEOSLIDES_URL . "js/seoslides_multiplier.min.js", array( 'jquery-ui-dialog' ), SEOSLIDES_VERSION, true );
		}

		wp_localize_script(
			'seoslides_multiplier',
			'multiplier',
			array(
			     'ajaxurl'                => admin_url( 'admin-ajax.php' ),
			     'label_auto_published'   => __( 'Shared and Updating', 'seoslides_translate' ),
			     'label_published'        => __( 'Shared', 'seoslides_translate' ),
			     'label_not_published'    => __( 'Not Shared', 'seoslides_translate' ),
			     'button_ok'              => __( 'Ok', 'seoslides_translate' ),
			     'notice_free_subscriber' => '',
			)
		);

		wp_enqueue_style( 'wp-jquery-ui-dialog' );
	}

	/**
	 * Add a Multiplier section to the Publish Box
	 *
	 * @since 0.2
	 */
	public function multiplier_misc_actions() {
		$post = get_post();
		$post_type_object = get_post_type_object( $post->post_type );

		if ( 'seoslides-slideset' != $post->post_type )
			return;

		$can_publish = current_user_can( $post_type_object->cap->publish_posts );
		$meta = get_post_custom( $post->ID );

		$remote_id = isset( $meta['_seoslides_remote_id'] ) ? $meta['_seoslides_remote_id'] : false;
		$auto_checked = isset( $meta['_seoslides_multiplier_auto'] ) ? $meta['_seoslides_multiplier_auto'] : false;

		$hide_if_remote = $remote_id ? 'display:none;' : '';
		$show_if_remote = $remote_id ? '' : 'display:none;';

		if ( 'publish' == $post->post_status ) {
			if ( $remote_id && $auto_checked )
				$status = __( 'Shared and Updating', 'seoslides_translate' );
			elseif ( $remote_id && ! $auto_checked )
				$status = __( 'Shared', 'seoslides_translate' );
			elseif ( ! $remote_id )
				$status = __( 'Not Shared', 'seoslides_translate' );
		} // Multiplier Stati

		if ( 'publish' == $post->post_status ) {
		?>
		<div class="misc-pub-section" id="multiplier">
			<label for="seoslides_multiplier"><?php _e( 'seoslid.es:', 'seoslides_translate' ) ?></label>
			<span id="multiplier-status"><?php echo $status; ?></span>
			<a href="#" class="edit-multiplier-status hide-if-no-js"><?php _e( 'Edit', 'seoslides_translate' ); ?></a>
			<a href="#" class="close-multiplier-status hide-if-js"><?php _e( 'Close', 'seoslides_translate' ); ?></a>
			<div id="multiplier_controls" class="hide-if-js">
				<input type="hidden" id="post_ID" value="<?php echo get_the_ID(); ?>" />
				<fieldset style="margin-bottom:5px;">
					<?php wp_nonce_field( 'seo-nonces', 'seoslides-multiplier-push-nonce' ); ?>
					<input type="button" id="seoslides_multiplier_push" name="seoslides_multiplier_push" class="button" value="<?php _e( 'Share on seoslid.es now', 'seoslides_translate' ); ?>" style="width:80%;<?php echo $hide_if_remote; ?>" />

					<?php wp_nonce_field( 'seo-nonces', 'seoslides-multiplier-remove-nonce' ); ?>
					<input type="button" id="seoslides_multiplier_delete" name="seoslides_multiplier_delete" class="button" value="<?php _e( 'Remove from seoslid.es now', 'seoslides_translate' ); ?>" style="<?php echo $show_if_remote; ?>width:80%;" />
					<img src="<?php echo admin_url( '/images/wpspin_light.gif' ); ?>" id="seoslides-spinner" style="display:none;" />
				</fieldset>

				<?php wp_nonce_field( 'seo-nonces', 'seoslides-multiplier-auto-nonce' ); ?>
				<label for="seoslides_multiplier_auto" style="<?php echo $show_if_remote; ?>" id="multiplier_auto_label">
					<input type="checkbox" id="seoslides_multiplier_auto" name="seoslides_multiplier_auto" value="1" <?php checked( get_post_meta( get_the_ID(), '_seoslides_multiplier_auto', true ) ); ?> style="<?php echo $show_if_remote; ?>" />
					<?php _e( 'Sync updates automatically', 'seoslides_translate' ); ?>
				</label>
			</div><!-- #multiplier-controls -->
		</div><!-- #multiplier -->
		<?php } // Published
	}

	/**
	 * Save post for Multiplier
	 *
	 * @since 0.1
	 *
	 * @param int $post_id The post id.
	 */
	public function save_post( $post_id ) {
		if ( isset( $_POST['seoslides-multiplier-auto-nonce'] ) && wp_verify_nonce( $_POST['seoslides-multiplier-auto-nonce'], 'seo-nonces' ) ) {
			empty( $_POST['seoslides_multiplier_auto'] ) ? delete_post_meta( $post_id, '_seoslides_multiplier_auto' ) : update_post_meta( $post_id, '_seoslides_multiplier_auto', true );

			$auto_checked = get_post_meta( $post_id, '_seoslides_multiplier_auto', true );
			$remote_id = get_post_meta( $post_id, '_seoslides_remote_id', true );

			if ( ! $remote_id && $auto_checked ) { // New
				$remote_id = $this->push_remote_slideset( $post_id );
				if ( null != $remote_id )
					update_post_meta( $post_id, '_seoslides_remote_id', $remote_id );
				else
					delete_post_meta( $post_id, '_seoslides_multiplier_auto' );
			} elseif ( $remote_id && $auto_checked ) {
				$response = $this->update_remote_slideset( $post_id, $remote_id );
			}

			$post = get_post( $post_id );
			if ( 'publish' != $post->post_status ) {
				delete_post_meta( $post_id, '_seoslides_multiplier_auto' );
				$this->delete_remote_slideset( $post_id, $remote_id );
			}
		}
	}

	/**
	 * Build the Slideset Embed Code
	 *
	 * @since 0.2
	 *
	 * @param int $post_id The Slideset ID.
	 *
	 * @return string A formed script embed code.
	 */
	public function build_embed_code( $post_id ) {
		$post = get_post( $post_id );

		$data = get_post_meta( $post_id, 'data', true );

		$slide = $this->get_first_slide( $post_id );
		$id = $this->embed->get_embed_unique_id( $post->ID, $slide->slug );

		$src = $this->embed->get_embed_url( $post->ID, $slide->slug, true );

		$embed = '<script type="text/javascript" id="%1$s" src="%2$s"></script>';

		$embed_code = sprintf(
			$embed,
			esc_attr( $id ),
			esc_url( $src )
		);

		return $embed_code;
	}

	/**
	 * Get the first slide object
	 *
	 * @since 0.3
	 *
	 * @param int $post_id The Slideset ID.
	 *
	 * @return object The current slide object.
	 */
	public function get_first_slide( $post_id ) {
		$slideset = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slideset( $post_id );

		if ( $slideset->slides )
			return current( array_values( $slideset->slides ) );
		else
			return array( 'id' => 0, 'slug' => '' );
	}

	/**
	 * Get the remote Slideset
	 *
	 * @since 0.2
	 *
	 * @param int $post_id The post id.
	 *
	 * @return int The remote post id.
	 */
	public function get_remote_slideset( $post_id ) {
		$remote_id = get_post_meta( $post_id, '_seoslides_remote_id', true );
		$remote_slideset = $this->client->query(
			'seoslides.getSlideset',
			array(
			     0,
			     $remote_id,
			     $this->api_key
			),
			$this->domain
		);
		if ( ! $this->client->isError() )
			return $remote_slideset;

		return false;
	}

	/**
	 * Push a new remote Slideset
	 *
	 * @since 0.2
	 *
	 * @param int $post_id The presentation id.
	 *
	 * @return mixed|null
	 */
	public function push_remote_slideset( $post_id ) {
		$post = get_post( $post_id );

		$this->client->query(
			'seoslides.newSlideset',
			array(
			     0,
			     $this->api_key,
			     array(
				     'post_type'      => 'seoslides-remotes',
				     'post_title'     => apply_filters( 'the_title', $post->post_title ),
				     'post_status'    => 'queued',
				     'comment_status' => 'closed',
				     'terms_names'    => array(
					     'seoslides-site' => array( get_bloginfo( 'name' ) ),
				     ),
				     'custom_fields'  => array(
					     array(
						     'key'   => 'data',
						     'value' => array(
							     'author'        => get_the_author_meta( 'display_name', $post->post_author ),
							     'overview_link' => get_post_meta( $post->ID, '_slideset_link', true ),
							     'permalink'     => get_permalink( $post->ID ),
							     'site_url'      => get_home_url( '/' ),
							     'seo_data'      => get_post_meta( $post->ID, 'seoslides_seo_settings', true ),
							     'embed'         => $this->build_embed_code( $post->ID )
						     )
					     )
				     )
			     ),
			     $this->domain,
			)
		);

		do_action( 'seoslides_presstrends_event', 'Presentation shared on seoslid.es' );

		if ( ! $this->client->isError() ) {
			return $this->client->getResponse();
		} else {
			return null;
		}
	}

	/**
	 * Update an existing remote Slideset
	 *
	 * @since 0.2
	 *
	 * @param int $post_id The presentation id.
	 * @param int $remote_id The remote Slideset id.
	 *
	 * @return mixed|null
	 */
	public function update_remote_slideset( $post_id, $remote_id ) {
		$post = get_post( $post_id );
		$this->client->query(
			'seoslides.editSlideset',
			array(
			     1,
			     $remote_id,
			     $this->api_key,
			     array(
				     'post_title'    => apply_filters( 'the_title', $post->post_title ),
				     'custom_fields' => array(
					     array(
						     'key'   => 'data',
						     'value' => array(
							     'author'        => get_the_author_meta( 'display_name', $post->post_author ),
							     'overview_link' => get_post_meta( $post->ID, '_slideset_link', true ),
							     'permalink'     => get_permalink( $post->ID ),
							     'site_url'      => get_home_url( '/' ),
							     'seo_data'      => get_post_meta( $post->ID, 'seoslides_seo_settings', true ),
							     'embed'         => $this->build_embed_code( $post->ID )
						     )
					     )
				     )
			     ),
			     $this->domain,
			)
		);

		if ( ! $this->client->isError() )
			return $this->client->getResponse();
		else
			return null;
	}

	/**
	 * Delete an existing remote Slideset
	 *
	 * @since 0.2
	 *
	 * @param int $post_id The presentation id.
	 * @param int $remote_id The remote Slideset id.
	 *
	 * @return array
	 */
	public function delete_remote_slideset( $post_id, $remote_id ) {
		$this->client->query(
			'seoslides.deleteSlideset',
			array(
			     0,
			     $remote_id,
			     $this->api_key,
			     $this->domain,
			)
		);

		if ( ! $this->client->isError() ) {
			delete_post_meta( $post_id, '_seoslides_multiplier_auto' );
			delete_post_meta( $post_id, '_seoslides_remote_id' );
		}

		$response = $this->client->getResponse();
		return $response;
	}

	/**
	 *  AJAX action to push up a presentation to the Multiplier site
	 *
	 * @since 0.2
	 */
	public function push_remote_now() {
		if ( ! wp_verify_nonce( $_REQUEST['nonce'], 'seo-nonces' ) )
			die( -1 );

		if ( isset( $_REQUEST['post_id'] ) )
			$post_id = (int) $_REQUEST['post_id'];
		else
			die( -1 );

		if ( $remote = get_post_meta( $post_id, '_seoslides_remote_id', true ) || empty( get_post( $post_id )->post_title ) )
			die( 0 );

		$remote = $this->push_remote_slideset( $post_id );

		if ( ! $this->client->isError() )
			update_post_meta( $post_id, '_seoslides_remote_id', $remote );

		die();
	}

	/**
	 * AJAX action to delete a remote Slideset on the Multiplier site
	 *
	 * @since 0.2
	 */
	public function delete_remote_now() {
		if ( ! wp_verify_nonce( $_REQUEST['nonce'], 'seo-nonces' ) )
			wp_send_json( 'nonce_error' );

		if ( isset( $_REQUEST['post_id'] ) )
			$post_id = $_REQUEST['post_id'];
		else
			wp_send_json( 'post_id error' );

		if ( $remote_id = get_post_meta( $post_id, '_seoslides_remote_id', true ) ) {
			$response = $this->delete_remote_slideset( $post_id, $remote_id );
			wp_send_json( array( 'remote_response' => $response, 'post_id' => $post_id, 'remote_id' => $remote_id ) );
		}

		wp_send_json( 'remote_id error' );
	}

} // SEOSlides_Multiplier
