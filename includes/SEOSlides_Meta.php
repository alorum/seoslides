<?php
/**
 * Module Name: SEOSlides Meta
 * Activation:  hidden
 * Description: Meta box functionality for the presentation page.
 * Version:     0.1
 * Author:      10up
 */

/**
 * Core meta boxes for presentation creation/editing.
 *
 * @package SEOSlides
 * @subpackage SEOSlides_Meta
 * @since 0.1
 */
class SEOSlides_Meta {
	/**
	 * Default object constructor
	 *
	 * @since 0.1
	 */
	public function __construct() {
		// Wire actions
		add_action( 'add_meta_boxes',         array( $this, 'add_meta_boxes' ) );
		add_action( 'save_post',              array( $this, 'save_meta' ) );
		add_action( 'edit_form_after_editor', array( $this, 'slide_list_metabox' ) );

		// Wire filters
		add_filter( 'get_sample_permalink_html', array( $this, 'presentation_button' ), 10, 2 );
	}

	/**
	 * Save new meta information on the post.
	 *
	 * @param int $slideset_id
	 */
	public function save_meta( $slideset_id ) {
		// Verify this isn't an autosave
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		// Verify this came from our page
		if ( ! isset( $_POST['seoslides_nonce']) || ! wp_verify_nonce( $_POST['seoslides_nonce'], plugin_basename( __FILE__ ) ) ) {
			return;
		}

		// Verify user has permissions
		if ( ! current_user_can( 'edit_post', $slideset_id ) ) {
			return;
		}

		// Keep calm and carry on ...

		// Slideset link
		$oldlink = get_post_meta( $slideset_id, '_slideset_link' );
		$link = sanitize_text_field( $_POST['seoslides_link'] );
		if ( $link !== $oldlink ) {
			do_action( 'seoslides_presstrends_event', 'Updated Presentation Backlink' );
		}
		update_post_meta( $slideset_id, '_slideset_link', $link );
	}

	/**
	 * Add core meta boxes to display.
	 */
	public function add_meta_boxes( $post_type ) {
		if ( 'seoslides-slideset' != $post_type )
			return;

		// First remove the Publish meta box and re-add it so it's in the right place
		remove_meta_box( 'submitdiv', 'seoslides-slideset', 'side' );

		add_meta_box(
			'submitdiv',
			__( 'Publish' ),
			'post_submit_meta_box',
			'seoslides-slideset',
			'side',
			'high'
		);

		// Now add other meta boxes as needed.

		add_meta_box(
			'slideset-link',
			__( 'Embed Backlink', 'seoslides_translate' ),
			array( $this, 'presentation_link' ),
			'seoslides-slideset',
			'side',
			'high'
		);
	}

	/**
	 * Display the presentation backlink in a sidebar meta box.
	 *
	 * @param WP_Post $post Current presentation
	 */
	public function presentation_link( $post ) {
		wp_nonce_field(  plugin_basename( __FILE__ ), 'seoslides_nonce' );

		$link = get_post_meta( $post->ID, '_slideset_link', true );
		?>
		<div>
			<label class="screen-reader-text" for="seoslides_link"><?php _e( 'Embed Backlink', 'seoslides_translate' ); ?></label>
			<div class="linkhint" style=""><?php _e( 'Add Embed Backlink', 'seoslides_translate' ); ?></div>
			<p class="description"><?php _e( 'When embedded on other sites, this link will be included with the presentation, if set:', 'seoslides_translate' ); ?></p>
			<p><input readonly="true" editable="false" content-editable="false" type="text" id="seoslides_link" name="seoslides_link" class="form-input-tip" size="16" autocomplete="off" value="<?php echo esc_attr( $link ); ?>"></p>
			<div class="link-actions">
				<div class="seoslides_link_clear"><a id="seoslides_link_clear" href="#clear_link"><?php _e( 'Clear Backlink', 'seoslides_translate' ); ?></a></div>
				<input type="button" class="button seoslides_link" value="<?php _e( 'Edit Backlink', 'seoslides_translate' ) ?>" />
				<div class="clear"></div>
			</div>
		</div>

		<style>
			#seoslides-linker {
				background-color: #f5f5f5;
				line-height: 1.4em;
				font-size: 12px;
			}

			#seoslides-link-update {
				line-height: 23px;
				float: right;
			}

			#seoslides-linker .submitbox {
				padding: 5px 10px;
				font-size: 11px;
				overflow: auto;
				height: 29px;
			}

			#seoslides-link-details {
				padding: 10px 0 14px;
				border-bottom: 1px solid #dfdfdf;
				margin: 0 6px 14px;
			}

			#seoslides-link-input {
				width: 100%;
			}

			#seoslides-linker p.howto {
				margin: 3px;
			}

			#seoslides-link-search .toggle-arrow {
				padding-left: 18px;
				cursor: pointer;
				display: inline-block;
				height: 23px;
				line-height: 23px;
				background: transparent url(<?php echo includes_url( 'images/toggle-arrow.png' ); ?>) top left no-repeat;
			}

			#seoslides-link-search .toggle-arrow-active {
				background-position: center left;
			}

			#seoslides-link-panel label span.search-label {
				display: inline-block;
				width: 80px;
				text-align: right;
				padding-right: 5px;
			}

			#seoslides-link-panel .query-notice {
				clear: both;
				margin-bottom: 0;
				border-bottom: 1px solid #f1f1f1;
				color: #333;
				padding: 4px 6px;
				cursor: pointer;
				position: relative;
			}

			#seoslides-link-panel li:hover {
				background: #eaf2fa;
				color: #151515;
			}

			#seoslides-link-panel li.unselectable {
				border-bottom: 1px solid #dfdfdf;
			}

			#seoslides-link-panel li.unselectable:hover {
				background: #fff;
				cursor: auto;
				color: #333;
			}

			#seoslides-link-panel li.selected {
				background: #ddd;
				color: #333;
			}

			#seoslides-link-panel li.selected .item-title {
				font-weight: bold;
			}

			#seoslides-link-panel .item-title {
				display: inline-block;
				width: 80%;
			}

			#seoslides-link-panel ul {
				list-style: none;
				margin: 0;
				padding: 0;
			}

			#seoslides-link-panel li {
				clear: both;
				margin-bottom: 0;
				border-bottom: 1px solid #f1f1f1;
				color: #333;
				padding: 4px 6px;
				cursor: pointer;
				position: relative;
			}

			#seoslides-link-results {
				display: none;
			}

			#seoslides-link-search .query-results {
				border: 1px #dfdfdf solid;
				margin: 0 5px 5px;
				background: #fff;
				height: 185px;
				overflow: auto;
				position: relative;
			}
		</style>

		<div style="display:none;">
			<div id="seoslides-linker">
				<?php wp_nonce_field( 'internal-linking', '_ajax_linking_nonce', false ); ?>
				<div id="seoslides-link-details">
					<p class="howto"><?php _e( 'Paste your presentation embed backlink in the field below.', 'seoslides_translate' ) ?></p>
					<input id="seoslides-link-input" name="seoslides-link-input" type="text"/>
				</div>

				<div id="seoslides-link-search">
					<p class="howto toggle-arrow"><?php _e( 'Or link to existing content', 'seoslides_translate' ); ?></p>
					<div id="seoslides-link-panel" style="display: none;">
						<div class="link-search-wrapper">
							<label>
								<span class="search-label"><?php _e( 'Search' ); ?></span>
								<input type="search" id="seoslides-link-field" class="seoslides-search-field" autocomplete="off">
								<span class="spinner"></span>
							</label>
						</div>
						<div id="seoslides-link-results" class="query-results">
							<ul></ul>
							<div class="river-waiting">
								<span class="spinner"></span>
							</div>
						</div>
						<div id="seoslides-recent-links" class="query-results">
							<div class="query-notice">
								<em><?php _e( 'No search term specified. Showing recent items.' ); ?></em></div>
							<ul></ul>
							<div class="river-waiting">
								<span class="spinner"></span>
							</div>
						</div>
					</div>
				</div>

				<div class="submitbox">
					<div id="seoslides-link-update">
						<input type="submit"
						       value="<?php esc_attr_e( 'Use this link', 'seoslides_translate' ); ?>"
						       class="button-primary"
						       id="seoslides-link-submit"
						       name="seoslides-link-submit">
					</div>
					<div id="seoslides-link-cancel">
						<a class="submitdelete deletion" href="#"><?php _e( 'Cancel', 'seoslides_translate' ); ?></a>
					</div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Markup to display all slides.
	 */
	public function slide_list_metabox() {
		$current_screen = get_current_screen();
		if ( 'seoslides-slideset' !== $current_screen->post_type ) {
			return;
		}

	?>
	<div id="seoslides-list">
		<script type="text/template" id="slide-row">
			<tr>
				<td class="slide-preview"></td>
				<td class="slide-title"></td>
				<td class="slide-notes"></td>
			</tr>
		</script>
		<div class="slide-container">
			<table class="slide-table widefat">
				<thead>
				<tr>
					<th><?php _e( 'Preview', 'seoslides_translate' ); ?></th>
					<th><?php _e( 'Title', 'seoslides_translate' ); ?></th>
					<th><?php _e( 'Notes', 'seoslides_translate' ); ?></th>
				</tr>
				</thead>
			</table>
		</div>
		<a class="button" href="" id="add-slide"><span class="slideset-add-button-icon"></span><?php _e( 'Add Slide', 'seoslides_translate' ); ?></a>
		<a class="button" href="" id="add-from-media"><span class="dashicons dashicons-images-alt2 slideset-add-from-media"></span><?php _e( 'Add Image Slide(s)', 'seoslides_translate' ); ?></a>
		<a class="button" href="" id="toggle-trash"><span class="slideset-toggle-trash-icon"></span><?php _e( 'Show Trashed Slides', 'seoslides_translate' ); ?></a>
	</div>
		<?php
	}

	/**
	 * Render the "Use Presentation" button.
	 *
	 * @param string $return
	 * @param int    $id
	 *
	 * @return string
	 */
	public function presentation_button( $return, $id ) {
		if ( 'seoslides-slideset' !== get_post_type( $id ) ) {
			return $return;
		}

		if ( 'publish' === get_post_status( $id ) ) {
			$return .= "<span id='use-presentation-btn'><a data-nonce=" . wp_create_nonce( 'use_in_post' ) . " data-presentation=" . esc_attr( $id ) . " data-action='use_in_post' href='" . esc_url( get_permalink( $id ) . '#use_in_post' ) . "' class='button button-small'>" . __( 'Post Presentation', 'seoslides_translate' ) . "</a></span>\n";
		} else {
			$return = preg_replace( '/<span id=\'view-post-btn\'.+<\/span>/', '', $return );
		}

		return $return;
	}
}
