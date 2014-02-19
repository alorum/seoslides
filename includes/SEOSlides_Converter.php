<?php
/**
 * Module Name: SEOSlides Converter
 * Activation:  core
 * Description: Allow converting PDF presentation exports to SEOSlides presentations.
 * Version:     0.1
 * Author:      10up
 */

/**
 * Core functionality for the PDF-to-SEOSlides conversion service.
 *
 * @package SEOSlides
 * @subpackage SEOSlides_Converter
 * @since 0.1
 */
class SEOSlides_Converter {
	/**
	 * @var string Root url for API access
	 */
	protected $api_root;

	/**
	 * Wire up actions and filters
	 */
	public function __construct() {
		add_action( 'init',                  array( $this, 'import_post_type' ) );
		add_action( 'admin_menu',            array( $this, 'add_menu' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'admin_enqueue_scripts' ) );

		$this->api_root = apply_filters( 'seoslides_api_root', 'https://seoslides.com' );

		// Wire AJAX
		add_action( 'wp_ajax_get_presentations',         array( $this, 'get_list' ) );
		add_action( 'wp_ajax_seoslides-import',          array( $this, 'begin_queue' ) );
		add_action( 'wp_ajax_seoslides-get-slide',       array( $this, 'get_slide' ) );
		add_action( 'wp_ajax_seoslides-import-status',   array( $this, 'get_status' ) );
		add_action( 'wp_ajax_seoslides-import-complete', array( $this, 'import_cleanup' ) );
	}

	/**
	 * Enqueue scripts and styles used on the admin side of the plugin.
	 */
	public function admin_enqueue_scripts() {
		$current_screen = get_current_screen();

		if ( 'seoslides-slideset_page_seoslides_import' !== $current_screen->id ) {
			return;
		}

		if ( defined( 'SCRIPT_DEBUG' ) && true === SCRIPT_DEBUG ) {
			wp_enqueue_script( 'seoslides-converter', SEOSLIDES_URL . 'js/seoslides_converter.src.js', array( 'jquery' ), SEOSLIDES_VERSION . time(), true );
		} else {
			wp_enqueue_script( 'seoslides-converter', SEOSLIDES_URL . 'js/seoslides_converter.min.js', array( 'jquery' ), SEOSLIDES_VERSION, true );
		}

		$js_variables = array(
			'ajaxurl'        => admin_url( 'admin-ajax.php' ),
			'nonce_import'   => wp_create_nonce( __FILE__ ),
			'text_running'   => __( 'Queueing presentation(s) for import ...', 'seoslides_translate' ),
			'text_importing' => __( 'Importing slide %1% of %2% ...', 'seoslides_translate' ),
			'text_notready'  => __( 'The presentation is not yet ready for processing. Please check back later', 'seoslides_translate' ),
			'text_failure'   => sprintf( __( 'Unfortunately, something went wrong while attempting to import your slides. Please <a href="%s">contact customer support</a> to address the issue.', 'seoslides_translate' ), esc_attr( admin_url( 'edit.php?post_type=seoslides-slideset&page=seoslides_support' ) ) ),
			'confirm_navigation' => __( 'Your imports are still processing; leaving the page will cause errors.  Are you sure you wish to continue?', 'seoslides_translate' ),
		);

		wp_localize_script( 'seoslides-converter', 'ssimport', $js_variables );
	}

	/**
	 * Register the CPT to contain import data.
	 */
	public function import_post_type() {
		$display = defined( 'WP_DEBUG' ) && WP_DEBUG;

		$labels = array(
			'name'               => __( 'Imports', 'seoslides_translate' ),
			'singular_name'      => __( 'Import', 'seoslides_translate' ),
			'add_new'            => __( 'Add New', 'seoslides_translate' ),
			'add_new_item'       => __( 'Add New Import', 'seoslides_translate' ),
			'edit_item'          => __( 'Edit Import', 'seoslides_translate' ),
			'new_item'           => __( 'New Import', 'seoslides_translate' ),
			'all_items'          => __( 'All Imports', 'seoslides_translate' ),
			'view_item'          => __( 'View Import', 'seoslides_translate' ),
			'search_items'       => __( 'Search Imports', 'seoslides_translate' ),
			'not_found'          => __( 'No imports found', 'seoslides_translate' ),
			'not_found_in_trash' => __( 'No imports found in Trash', 'seoslides_translate' ),
			'parent_item_colon'  => '',
			'menu_name'          => __( 'Imports', 'seoslides_translate' )
		);

		$args = array(
			'labels'       => $labels,
			'public'       => $display,
			'show_ui'      => $display,
			'show_in_menu' => 'edit.php?post_type=seoslides-slideset',
		);

		register_post_type( 'seoslides-import', $args );
	}

	/**
	 * Add the import menu to the Presentations top-level item.
	 *
	 * @uses add_submenu_page
	 */
	public function add_menu() {
		add_submenu_page(
			'edit.php?post_type=seoslides-slideset',
			__( 'Import Presentation', 'seoslides_translate' ),
			__( 'Import Slides', 'seoslides_translate' ),
			'edit_posts',
			'seoslides_import',
			array( $this, 'menu' )
		);
	}

	/**
	 * Handle the PDF Importer menu
	 */
	public function menu() {
		// Clear the cache so we can get a fresh count
		wp_cache_delete( 'pending-imports', 'counts' );

		$step = empty( $_GET['step'] ) ? 0 : (int) $_GET['step'];
		$clear = empty( $_GET['clear_cache'] ) ? false : true;

		// The user has suggested we clear their cache, so let's do it.
		if ( $clear ) {
			$all_imports = get_posts(
				array(
				     'post_type'      => 'seoslides-import',
				     'post_status'    => 'any',
				     'posts_per_page' => -1
				)
			);

			foreach( $all_imports as $post ){
				wp_delete_post(
					$post->ID,
					true
				);
			}
		}

		if ( 1 === $step ) {
			$this->handle_upload();
		}

		$api_key = get_option( 'seoslides_api_key' );
		$upload_enabled = true;

		// Build the site domain
		$url = get_bloginfo( 'url' );
		$url = parse_url( $url );
		$domain = $url['host'];
		if ( isset( $url['path'] ) ) {
			$domain .= $url['path'];
		}
		$domain = apply_filters( 'catalyst_domain', $domain );

		/** @var SEOSlides_Core $core */
		$core = SEOSlides_Module_Provider::get( 'SEOSlides Core' );

		// If no API key is set, then show an admin notice because we can't actually do anything!
		if ( false === $api_key || empty( $api_key ) ) :
			$upload_enabled = false;
			?>
			<div class="error">
				<p><?php _e( 'The slide importer requires a license key.', 'seoslides_translate' ); ?>
					<?php _e( 'Please sign-up for a license key on the <a href="edit.php?post_type=seoslides-slideset&amp;page=seoslides_settings">settings page</a> to proceed.', 'seoslides_translate' ); ?></p>
			</div>
		<?php endif; ?>

		<?php if ( $core->get_subscription_level() < 20 ) : ?>
			<div class="updated">
				<p><?php _e( 'You can use a free license key for 3 imports. Upgrade to the <a href="https://seoslides.com/pro">pro version</a> for unlimited imports during the beta.', 'seoslides_translate' ); ?></p>
			</div>
		<?php endif; ?>

		<div class="wrap">
			<?php screen_icon(); ?>
			<h2>
				<?php _e( 'seoslides Importer', 'seoslides_translate' ); ?>
			</h2>

			<?php
			$intro  = __( 'Import PowerPoint, Keynote, or other exported to PDF format. Each PDF page is imported as a slide-sized background image. ', 'seoslides_translate' );
			$intro .= sprintf( __( 'Watch a video on <a href="%1$s" target="_new">importing</a>, or view the full <a href="%2$s" target="_new">getting started</a> presentation.', 'seoslides_translate' ),
				esc_url( 'https://seoslides.com/slides/getting-started-seoslides/uploading-video/' ),
				esc_url( 'https://seoslides.com/slides/getting-started-seoslides/seoslides-intro-videos/' )
			);
			?>
			<p style="margin-bottom: 40px;"><em><?php echo $intro; ?></em></p>
			<div class="seoslides-vistoggler">
				<h3 class="title"><?php _e( 'Step 1: Upload PDF file to seoslides for conversion' ); ?>
					<a style="font-weight:normal;font-size:.9em;"> (more info)</a>
				</h3>
				<div class="seoslides-vistogglee" style="padding:10px;border:1px solid #ccc;display:none;border-radius:3px;">
					<ul>
						<li><?php printf( __( '<a href="%s" target="_new">Instructions for exporting a PDF from Keynote</a>', 'seoslides_translate' ),esc_url( 'http://support.apple.com/kb/HT3697' ) ); ?></li>
						<li><?php printf( __( '<a href="%s" target="_new">Instructions for exporting a PDF from Powerpoint</a>', 'seoslides_translate' ), esc_url( 'http://office.microsoft.com/en-us/powerpoint-help/save-as-pdf-HA010064992.aspx' ) ); ?></li>
					</ul>
				</div>
			</div>
			<div class="narrow">
				<?php if ( false === $api_key || empty( $api_key ) ) :
					$settings_url = add_query_arg( array(
						'post_type' => 'seoslides-slideset',
						'page'      => 'seoslides_settings'
					), admin_url( 'edit.php' ) );
					?>
					<p><?php printf( __( '<strong>Please Note</strong>: You will need a license key for this step. Check out the <a href="%s">settings page</a> for info on getting a free key.', 'seoslides_translate' ), esc_url( $settings_url ) ); ?></p>
				<?php elseif ( $core->get_subscription_level() < 20 ) :
					?>
					<p><?php _e( '<strong>Please Note</strong>: Your free license key is good for 3 pdf conversions. After that, <a href="http://seoslides.com/pro" target="_new">upgrade to PRO</a> for unlimited uploads and other benefits.', 'seoslides_translate' ); ?></p>
				<?php endif; ?>

				<form enctype="multipart/form-data" id="import-upload-form" method="post" class="wp-upload-form" action="<?php echo $this->api_root; ?>/wp-admin/admin-post.php">

					<p>
						<label for="email-notification"><?php _e( 'Email:', 'seoslides_translate' ); ?></label>
						<?php $current_user = wp_get_current_user(); ?>
						<input id="email-notification" name="email-notification" type="text" class="regular-text ltr" value="<?php echo esc_attr( $current_user->user_email ); ?>" />
						<span class="seoslides-vistoggler">
							<a><?php _e( '(optional)', 'seoslides_translate' ); ?></a>
							<span class="seoslides-vistogglee" style="display:none">
								<?php _e( 'Your email address will only be used to send you an email when import processing is complete.', 'seoslides_translate' ); ?>
							</span>
						</span>
					</p>

					<p>
						<label for="upload"><?php _e( 'PDF file:', 'seoslides_translate' ); ?></label>
						<input type="file" id="upload" name="import" size="25"<?php echo $upload_enabled ? '' : ' disabled="disabled"'; ?> />
						<input id="seoslides-api_key" name="seoslides-api_key" type="hidden" value="<?php echo esc_attr( $api_key ); ?>" />
						<input id="seoslides-redirect" name="seoslides-redirect" type="hidden" value="<?php echo esc_attr( admin_url( 'edit.php?post_type=seoslides-slideset&page=seoslides_import&step=1' ) ); ?>" />
						<input id="seoslides-client_domain" name="seoslides-client_domain" type="hidden" value="<?php echo esc_attr( $domain ); ?>" />
						<input id="action" name="action" type="hidden" value="pdf-import" />
					</p>

					<?php submit_button( __( 'Upload for Conversion', 'seoslides_translate' ), 'button', 'submit', false ); ?>
				</form>
			</div>

			<div class="seoslides-vistoggler">
				<h3 class="title"><?php _e( 'Step 2: Import to your site', 'seoslides_translate' ); ?>
					<a style="font-weight:normal;font-size:.9em;"> (more info)</a>
				</h3>
				<div class="seoslides-vistogglee" style="padding:10px;border:1px solid #ccc;display:none;border-radius: 3px;">
					<p><?php _e( 'Processing can take a while. Kick back, relax, and let the seoslides servers do the heavy lifting to convert your presentation.', 'seoslides_translate' ); ?></p>
				</div>
			</div>


			<?php $pending_count = count( get_posts( array( 'post_type' => 'seoslides-import', 'post_status' => 'draft' ) ) ) - $this->count_imports(); ?>
			<div class="narrow">
				<?php if ( 0 < $pending_count ) : ?>
					<p>
						<?php echo sprintf(
							_n(
								'You currently have %s presentation being processed on the seoslides server.',
								'You currently have %s presentations being processed on the seoslides server.',
								$pending_count,
								'seoslides_translate'
							), $pending_count ); ?>
					</p>
					<?php
					$check_imports = sprintf( __( '<a ' . ( 0 !== $pending_count ? '' : 'disabled="disabled"' ) . ' class="button" href="%s">Check for completed conversions</a>', 'seoslides_translate' ),
						add_query_arg(
							array(
								'post_type' => 'seoslides-slideset',
								'page'      => 'seoslides_import'
							),
							admin_url( 'edit.php' )
						)
					);

					echo $check_imports;
					?>
				<?php endif; ?>

				<?php if( 0 === $pending_count || 0 < $this->count_imports() ) : ?>
					<div id="seoslides_import_status" style="max-height: 200px;overflow-y: scroll;">
						<p><?php echo $this->get_status( true ); ?></p>
					</div><!-- #seoslides_import_status -->

					<input id="seoslides_process" name="seoslides_process" type="submit" class="button" value="<?php _e( 'Process Imports', 'seoslides_translate' ); ?>" <?php disabled( 0 === $this->count_imports() ); ?> />
				<?php endif; ?>
			</div>

			<h3><?php _e( 'Step 3: Add slide titles and notes, then publish', 'seoslides_translate' ); ?></h3>
			<div class="narrow">
				<p><?php _e( 'New presentations can be found under &#8220;All Presentations&#8221; as drafts.', 'seoslides_translate' ); ?></p>

				<?php $drafts_url = add_query_arg( array( 'post_type' => 'seoslides-slideset', 'post_status' => 'draft' ), admin_url( 'edit.php' ) ); ?>
				<a href="<?php echo esc_url( $drafts_url ); ?>" class="button"><?php _e( 'View Draft Presentations', 'seoslides_translate' ); ?></a>
			</div>

			<?php if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) : ?>
				<h3 class="title"><?php _e( 'Debugging Options', 'seoslides_translate' ); ?></h3>
				<div class="narrow">
					<?php
					$clear_cache_url = add_query_arg( array(
						'post_type'   => 'seoslides-slideset',
						'page'        => 'seoslides_import',
						'clear_cache' => 1
					), admin_url( 'edit.php' ) );

					$all_imports_url = add_query_arg( array( 'post_type' => 'seoslides-import' ), admin_url( 'edit.php' ) );
					?>
					<span>
						<a class="button" href="<?php echo esc_url( $clear_cache_url ); ?>"><?php _e( 'Clear import cache', 'seoslides_translate' ); ?></a>
						<a class="button" href="<?php echo esc_url( $all_imports_url ); ?>"><?php _e( 'View All Imports', 'seoslides_translate' ); ?></a>
					</span>
				</div>
			<?php endif; ?>
		</div><!-- .wrap -->
	<?php
	}

	/**
	 * Count the imports ready and available.
	 *
	 * @return int
	 */
	protected function count_imports() {
		$imports = get_posts(
			array(
			     'post_type'      => 'seoslides-import',
			     'post_status'    => 'any',
			     'posts_per_page' => -1
			)
		);

		$imports = array_filter( $imports, array( $this, 'import_ready' ) );

		$count = count( $imports );

		return $count;
	}

	/**
	 * Check whether or not a specific import is ready to pull in to the site.
	 *
	 * @param WP_Post $import
	 *
	 * @return bool
	 */
	protected function import_ready( $import ) {
		if ( null === $import ) {
			return false;
		}

		$post_url = $this->api_root . '/import/' . $import->post_content . '/' . rand();

		$query = wp_remote_get( $post_url );

		if ( is_wp_error( $query ) ) {
			return false;
		}

		$files = wp_remote_retrieve_body( $query );
		$files = json_decode( $files );

		if ( count( $files ) === 0 ) {
			return false;
		}

		return true;
	}

	/**
	 * Provide feedback to the user after the upload is complete.
	 *
	 * If an error was returned, display it. Otherwise create a CPT to hold the
	 * job ID for the import so we can reference it later.
	 */
	protected function handle_upload() {
		if ( isset( $_GET['error'] ) ) : ?>
			<div class="error">
				<p><?php printf( __( 'Upload Error: %s', 'seoslides_translate' ), $_GET['error'] ); ?></p>
			</div>
			<?php return; ?>
		<?php else : ?>
			<div class="updated">
				<p><?php _e( 'Presentation queued for import!', 'seoslides_translate' ); ?></p>
			</div>
			<?php do_action( 'seoslides_presstrends_event', 'Presentation Queued for Import' ); ?>
		<?php endif;

		// If we're this far, we've alerted the user that the presentation is queued. Now, remember the Job ID so we can
		// keep querying for its status.
		$job_id = $_GET['job'];
		$post_id = (int) $_GET['id'];
		$filename = sanitize_file_name( $_GET['file'] );

		wp_insert_post(
			array(
			     'post_title' => sanitize_title( $filename . '|' . $post_id ),
			     'post_content' => $job_id,
			     'post_type' => 'seoslides-import'
			)
		);
	}

	/**
	 * Take a look at all of the pending imports, query their status, and potentially begin an import.
	 */
	public function query_pending_imports() {
		$pending = get_posts(
			array(
			     'post_type'   => 'seoslides-import',
			     'post_status' => 'any',
			     'numberposts' => -1
			)
		);

		foreach( $pending as $import ) {
			$this->query_import( $import );
		}
	}

	/**
	 * Read the data from an import, query the remote API, and sync data.
	 *
	 * @param int|WP_Post $import
	 * @param int         $slideset
	 *
	 * @return array
	 */
	protected function query_import( $import, &$slideset = 0 ) {
		$query = wp_remote_get( $this->api_root . '/import/' . $import->post_content );

		if ( is_wp_error( $query ) ) {
			return false;
		}

		// Create a Slideset
		$slideset = wp_insert_post(
			array(
			     'post_status' => 'draft',
			     'post_title'  => $import->post_title,
			     'post_type'   => 'seoslides-slideset'
			)
		);

		// Get a list of slides to import
		$files = wp_remote_retrieve_body( $query );
		$files = json_decode( $files );

		return $files;
	}

	/**
	 * Import a background image as a slide
	 *
	 * @param int    $slideset
	 * @param string $image
	 */
	protected function import_background( $slideset, $image ) {
		// Download image to temp location
		$tmp = download_url( $image );

		// Set variables for storage
		// fix file filename for query strings
		preg_match( '/import\/(.+)\//i', $image, $matches );
		$index = basename( $image );
		$import = $matches[1];

		$file_array['name'] = "{$import}-{$index}.jpg";
		$file_array['tmp_name'] = $tmp;

		// If error storing temporarily, unlink
		if ( is_wp_error( $tmp ) ) {
			@unlink($file_array['tmp_name']);
			$file_array['tmp_name'] = '';
		}

		// do the validation and storage stuff
		$id = media_handle_sideload( $file_array, $slideset, null );

		if ( is_wp_error( $id ) ) {
			@unlink( $file_array['tmp_name'] );

			return;
		}

		// Flag the image as being imported
		$flags = wp_get_post_terms( $id, 'seoslides-flag', array( 'fields' => 'names' ) );
		$flags = array_merge( $flags, array( 'imported' ) );
		wp_set_post_terms( $id, $flags, 'seoslides-flag', false );

		// Get the image source
		$src = wp_get_attachment_url( $id );

		$slideset = new SEOSlides_Slideset( $slideset );

		// Get slide position
		$position = count( $slideset->slides );

		// Slide content
		$content = array(
			'title'    => sprintf( __( 'Slide %d', 'seoslides_translate' ), ( $position + 1 ) ),
			'content'  => '',
			'image'    => '',
			'bg-image' => $src,
		);

		// Create the slide
		$slide = wp_insert_post(
			array(
			     'post_parent'  => $slideset->ID,
			     'post_type'    => 'seoslides-slide',
			     'menu_order'   => $position, // Insert at the end of the presentation
			     'post_status'  => 'publish',
			     'post_content' => serialize( $content )
			)
		);

		if ( 0 !== $slide && ! is_wp_error( $slide ) ) {
			// Update SEO
			$seo = array(
				'title'       => $slideset->title,
				'description' => '',
				'keywords'    => ''
			);
			update_post_meta( $slide, 'seoslides_seo_settings', $seo );
		}
	}

	/**************************************************/
	/*               AJAX Functionality               */
	/**************************************************/

	/**
	 * Respond to the 'get_publications' request
	 */
	public function get_list() {
		$pending = get_posts(
			array(
			     'post_type'   => 'seoslides-import',
			     'post_status' => 'any',
			     'numberposts' => -1
			)
		);

		$pending = array_filter( $pending, array( $this, 'import_ready' ) );

		$pending = wp_list_pluck( $pending, 'ID' );

		wp_send_json( $pending );
	}

	/**
	 * Query an import queue and set up the presentation to hold the incoming slides
	 */
	public function begin_queue() {
		$presentation = (int) $_POST['presentation'];
		$presentation = get_post( $presentation );

		$slideset = 0;

		$files = $this->query_import( $presentation, $slideset );

		$data = array(
			'slideset' => $slideset,
			'slides'   => $files,
			'total'    => count( $files )
		);

		do_action( 'seoslides_presstrends_event', 'Presentation Imported' );

		wp_send_json( $data );
	}

	/**
	 * Insert an individual slide into the presentation
	 */
	public function get_slide() {
		if ( ! wp_verify_nonce( $_POST['_nonce'], __FILE__ ) ) {
			die( __( 'Invalid access', 'seoslides_translate' ) );
		}

		$slideset = (int) $_POST['slideset'];
		$file = $_POST['file'];
		$position = (int) $_POST['slide'];

		$this->import_background( $slideset, $file );

		wp_send_json( true );
	}

	/**
	 * Get the import status for the UI.
	 */
	public function get_status( $return = false ) {
		$pending = wp_count_posts( 'seoslides-import' );
		$check_imports = sprintf( __( '<a href="%s">Check for new imports</a>', 'seoslides_translate' ),
			add_query_arg(
				array(
					'post_type' => 'seoslides-slideset',
					'page'      => 'import'
				),
				admin_url( 'edit.php' )
			)
		);

		if ( 0 === $this->count_imports() ) { // 0 imports ready
			$message  = __( 'You currently have 0 presentations converted and ready to import.', 'seoslides_translate' );
			$message .= '&nbsp;&nbsp;'; // . $check_imports;
		} else { // 1+ imports ready
			$message  = sprintf( _n( 'You currently have 1 presentation converted and ready for import.', 'You currently have %s presentations converted and ready for import.', (int) $this->count_imports(), 'seoslides_translate' ),
				$this->count_imports()
			);
			$message .= '&nbsp;&nbsp;'; // . $check_imports;
		}

		ob_start();
			echo $message;
		$output = ob_get_clean();

		if ( $return ) {
			return $output;
		}

		wp_send_json( $output );
	}

	/**
	 * Clean up an import that's been processed so we don't process it again.
	 */
	public function import_cleanup() {
		$import = (int) $_POST['presentation'];

		wp_delete_post( $import, true );
	}
}