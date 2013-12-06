<?php
/**
 * SEOSlides Module List Table class.
 *
 * @package SEOSlides
 * @subpackage SEOSlides_Modules
 * @since 0.1
 * @access private
 */
class SEOSlides_Module_List_Table extends WP_List_Table {

	function __construct( $args = array() ) {
		global $status, $page;

		parent::__construct(
			array(
			     'plural' => 'modules',
			     'screen' => 'seoslides_modules',
			)
		);

		$status = 'all';
		if ( isset( $_REQUEST['module_status'] ) && in_array( $_REQUEST['module_status'], array( 'active', 'inactive', 'recently_activated', 'upgrade', 'search' ) ) ) {
			$status = $_REQUEST['module_status'];
		}

		if ( isset($_REQUEST['s']) ) {
			$_SERVER['REQUEST_URI'] = add_query_arg('s', stripslashes($_REQUEST['s']) );
		}

		$page = $this->get_pagenum();
	}

	function get_table_classes() {
		return array( 'widefat', $this->_args['plural'] );
	}

	function ajax_user_can() {
		return current_user_can('activate_plugins');
	}

	function prepare_items() {
		global $status, $seoslides_modules, $totals, $page, $orderby, $order, $s;

		wp_reset_vars( array( 'orderby', 'order', 's' ) );

		$seoslides_modules = array(
			'all' => apply_filters( 'all_seoslides_modules', SEOSlides_Module_Provider::get_modules() ),
			'search' => array(),
			'active' => array(),
			'inactive' => array(),
			'recently_activated' => array(),
			'upgrade' => array(),
		);

		$screen = $this->screen;

		set_transient( 'seoslides_module_slugs', array_keys( $seoslides_modules['all'] ), DAY_IN_SECONDS );

		$recently_activated = get_option( 'seoslides_recently_activated', array() );

		foreach ( $recently_activated as $key => $time ) {
			if ( $time + WEEK_IN_SECONDS < time() ) {
				unset( $recently_activated[$key] );
			}
		}
		update_option( 'recently_activated', $recently_activated );

		foreach ( (array) $seoslides_modules['all'] as $module_file => $module_data ) {
			// Filter into individual sections
			if ( SEOSlides_Module_Provider::is_module_active( $module_file ) || $module_data->auto_load() ) {
				$seoslides_modules['active'][ $module_file ] = $module_data;
			} else {
				if ( isset( $recently_activated[ $module_file ] ) ) // Was the module recently activated?
				$seoslides_modules['recently_activated'][ $module_file ] = $module_data;
				$seoslides_modules['inactive'][ $module_file ] = $module_data;
			}
		}

		if ( $s ) {
			$status = 'search';
			$seoslides_modules['search'] = array_filter( $seoslides_modules['all'], array( &$this, '_search_callback' ) );
		}

		$totals = array();
		foreach ( $seoslides_modules as $type => $list ) {
			$totals[ $type ] = count( $list );
		}

		if ( empty( $seoslides_modules[ $status ] ) && !in_array( $status, array( 'all', 'search' ) ) ) {
			$status = 'all';
		}

		$this->items = array();
		foreach ( $seoslides_modules[ $status ] as $plugin_file => $plugin_data ) {
			// Translate, Don't Apply Markup, Sanitize HTML
			$this->items[$plugin_file] = $this->_get_plugin_data_markup_translate( $plugin_file, $plugin_data, false, true );
		}

		$total_this_page = $totals[ $status ];

		if ( $orderby ) {
			$orderby = ucfirst( $orderby );
			$order = strtoupper( $order );

			uasort( $this->items, array( &$this, '_order_callback' ) );
		}

		$plugins_per_page = $this->get_items_per_page( str_replace( '-', '_', $screen->id . '_per_page' ), 999 );

		$start = ( $page - 1 ) * $plugins_per_page;

		if ( $total_this_page > $plugins_per_page ) {
			$this->items = array_slice( $this->items, $start, $plugins_per_page );
		}

		$this->set_pagination_args(
			array(
			     'total_items' => $total_this_page,
			     'per_page'    => $plugins_per_page,
			)
		);
	}

	/**
	 * Display the markup for the search box. For now, this feature is hidden.
	 *
	 * @param string $text
	 * @param string $input_id
	 */
	function search_box( $text, $input_id ) {
		return;
	}

	function _search_callback( $plugin ) {
		static $term;
		if ( is_null( $term ) )
			$term = stripslashes( $_REQUEST['s'] );

		foreach ( $plugin as $value )
			if ( stripos( $value, $term ) !== false )
				return true;

		return false;
	}

	function _order_callback( $plugin_a, $plugin_b ) {
		global $orderby, $order;

		$a = $plugin_a[$orderby];
		$b = $plugin_b[$orderby];

		if ( $a == $b )
			return 0;

		if ( 'DESC' == $order )
			return ( $a < $b ) ? 1 : -1;
		else
			return ( $a < $b ) ? -1 : 1;
	}

	function no_items() {
		global $seoslides_modules;

		if ( !empty( $seoslides_modules['all'] ) ) {
			_e( 'No modules found.', 'seoslides_translate' );
		} else {
			_e( 'You do not appear to have any modules available at this time.', 'seoslides_translate' );
		}
	}

	function get_columns() {
		global $status;

		return array(
			'cb'          => !in_array( $status, array( 'hidden' ) ) ? '<input type="checkbox" />' : '',
			'name'        => __( 'Module', 'seoslides_translate' ),
			'description' => __( 'Description', 'seoslides_translate' ),
		);
	}

	function get_sortable_columns() {
		return array();
	}

	function get_views() {
		global $totals, $status;

		$status_links = array();
		foreach ( $totals as $type => $count ) {
			if ( !$count ) {
				continue;
			}

			switch ( $type ) {
				case 'all':
					$text = _nx( 'All <span class="count">(%s)</span>', 'All <span class="count">(%s)</span>', $count, 'seoslides_translate' );
					break;
				case 'active':
					$text = _nx( 'Active <span class="count">(%s)</span>', 'Active <span class="count">(%s)</span>', $count, 'seoslides_translate' );
					break;
				case 'recently_activated':
					$text = _nx( 'Recently Active <span class="count">(%s)</span>', 'Recently Active <span class="count">(%s)</span>', $count, 'seoslides_translate' );
					break;
				case 'inactive':
					$text = _nx( 'Inactive <span class="count">(%s)</span>', 'Inactive <span class="count">(%s)</span>', $count, 'seoslides_translate' );
					break;
				case 'hidden':
					$text = _nx( 'Must-Use <span class="count">(%s)</span>', 'Must-Use <span class="count">(%s)</span>', $count, 'seoslides_translate' );
					break;
				case 'upgrade':
					$text = _nx( 'Update Available <span class="count">(%s)</span>', 'Update Available <span class="count">(%s)</span>', $count, 'seoslides_translate' );
					break;
			}

			if ( 'search' != $type ) {
				$url = add_query_arg(
					array(
					     'post_type' => 'seoslides-slideset',
					     'page' => 'seoslides_modules',
					     'module_status' => $type
					),
					'edit.php'
				);

				$status_links[$type] = sprintf( "<a href='%s' %s>%s</a>",
					$url,
					( $type == $status ) ? ' class="current"' : '',
					sprintf( $text, number_format_i18n( $count ) )
				);
			}
		}

		return $status_links;
	}

	function get_bulk_actions() {
		global $status;

		$actions = array();

		if ( 'active' != $status ) {
			$actions['activate-selected'] = __( 'Activate' );
		}

		if ( 'inactive' != $status && 'recent' != $status ) {
			$actions['deactivate-selected'] = __( 'Deactivate' );
		}

		if ( current_user_can( 'update_plugins' ) ) {
			$actions['update-selected'] = __( 'Update' );
		}

		if ( current_user_can( 'delete_plugins' ) && ( 'active' != $status ) ) {
			$actions['delete-selected'] = __( 'Delete' );
		}

		return $actions;
	}

	function bulk_actions() {
		global $status;

		// Remove bulk actions for now since they don't make sense
		return;

		if ( in_array( $status, array( 'hidden' ) ) ) {
			return;
		}

		parent::bulk_actions();
	}

	/**
	 * Normally this would handle the table navigation. For now, it just hides the feature since it's not necessary.
	 *
	 * @param string $which
	 */
	function display_tablenav( $which ) {
		return;
	}

	function extra_tablenav( $which ) {
		global $status;

		if ( ! in_array($status, array('recently_activated', 'hidden' ) ) ) {
			return;
		}

		echo '<div class="alignleft actions">';

		if ( 'recently_activated' === $status ) {
			submit_button( __( 'Clear List', 'seoslides_translate' ), 'button', 'clear-recent-list', false );
		} elseif ( 'top' === $which && 'hidden' === $status ) {
			echo '<p>' . sprintf( __( 'Files in the <code>%s</code> directory are executed automatically.' ), str_replace( ABSPATH, '/', WPMU_PLUGIN_DIR ) ) . '</p>';
		}

		echo '</div>';
	}

	function current_action() {
		if ( isset($_POST['clear-recent-list']) ) {
			return 'clear-recent-list';
		}

		return parent::current_action();
	}

	function display_rows() {
		global $status;

		foreach ( $this->items as $module_file => $module_data ) {
			$this->single_row( array( $module_file, $module_data ) );
		}
	}

	function single_row( $item ) {
		global $status, $page, $s, $totals;

		list( $module_file, $module_data ) = $item;
		$context = $status;
		$screen = $this->screen;

		// preorder
		$actions = array(
			'deactivate' => '',
			'activate' => '',
			'edit' => '',
			'delete' => '',
		);

		if ( 'hidden' === $context ) {
			$is_active = true;
			$is_core = true;
		} else {
			$is_active = SEOSlides_Module_Provider::is_module_active( $module_file );
			$is_core = SEOSlides_Module_Provider::is_core_module( $module_file );
		} // end if $context

		if ( $is_active && ! $is_core ) {
			$actions['deactivate'] = '<a href="' . wp_nonce_url('edit.php?post_type=seoslides-slideset&amp;page=seoslides_modules&amp;action=deactivate&amp;module=' . $module_file . '&amp;module_status=' . $context . '&amp;paged=' . $page . '&amp;s=' . $s, 'deactivate-module_' . $module_file) . '" title="' . esc_attr__('Deactivate this module') . '">' . __('Deactivate') . '</a>';
		} elseif ( ! $is_core ) {
			$actions['activate'] = '<a href="' . wp_nonce_url('edit.php?post_type=seoslides-slideset&amp;page=seoslides_modules&amp;action=activate&amp;module=' . $module_file . '&amp;module_status=' . $context . '&amp;paged=' . $page . '&amp;s=' . $s, 'activate-module_' . $module_file) . '" title="' . esc_attr__('Activate this module') . '" class="edit">' . __('Activate') . '</a>';
		} // end if $is_active

		$actions = apply_filters( 'module_action_links', array_filter( $actions ), $module_file, $module_data, $context );
		$actions = apply_filters( "module_action_links_$module_file", $actions, $module_file, $module_data, $context );

		$class = $is_active ? 'active' : 'inactive';
		$checkbox_id =  "checkbox_" . md5($module_data['Name']);

		if ( $is_core ) {
			$checkbox = '';
		} else {
			$checkbox = "<label class='screen-reader-text' for='" . $checkbox_id . "' >" . sprintf( __( 'Select %s' ), $module_data['Name'] ) . "</label>"
				. "<input type='checkbox' name='checked[]' value='" . esc_attr( $module_file ) . "' id='" . $checkbox_id . "' />";
		}

		$description = '<p>' . ( $module_data['Description'] ? $module_data['Description'] : '&nbsp;' ) . '</p>';
		$module_name = $module_data['Name'];

		$id = sanitize_title( $module_name );
		if ( ! empty( $totals['upgrade'] ) && ! empty( $plugin_data['update'] ) ) {
			$class .= ' update';
		}

		echo "<tr id='$id' class='$class'>";

		list( $columns, $hidden ) = $this->get_column_info();

		foreach ( $columns as $column_name => $column_display_name ) {
			$style = '';
			if ( in_array( $column_name, $hidden ) )
				$style = ' style="display:none;"';

			switch ( $column_name ) {
				case 'cb':
					echo "<th scope='row' class='check-column'>$checkbox</th>";
					break;
				case 'name':
					echo "<td class='plugin-title'$style><strong>$module_name</strong>";
					echo $this->row_actions( $actions, true );
					echo "</td>";
					break;
				case 'description':
					echo "<td class='column-description desc'$style>
						<div class='plugin-description'>$description</div>
						<div class='$class second plugin-version-author-uri'>";

					$module_meta = array();
					if ( !empty( $module_data['Version'] ) )
						$module_meta[] = sprintf( __( 'Version %s' ), $module_data['Version'] );
					if ( !empty( $module_data['Author'] ) ) {
						$author = $module_data['Author'];
						if ( !empty( $module_data['AuthorURI'] ) )
							$author = '<a href="' . $module_data['AuthorURI'] . '" title="' . esc_attr__( 'Visit author homepage' ) . '">' . $module_data['Author'] . '</a>';
						$module_meta[] = sprintf( __( 'By %s' ), $author );
					}
					if ( ! empty( $module_data['PluginURI'] ) )
						$module_meta[] = '<a href="' . $module_data['PluginURI'] . '" title="' . esc_attr__( 'Visit plugin site' ) . '">' . __( 'Visit plugin site' ) . '</a>';

					$module_meta = apply_filters( 'plugin_row_meta', $module_meta, $module_file, $module_data, $status );
					echo implode( ' | ', $module_meta );

					echo "</div></td>";
					break;
				default:
					echo "<td class='$column_name column-$column_name'$style>";
					do_action( 'manage_modules_custom_column', $column_name, $module_file, $module_data );
					echo "</td>";
			}
		}

		echo "</tr>";

		do_action( 'after_plugin_row', $module_file, $module_data, $status );
		do_action( "after_plugin_row_$module_file", $module_file, $module_data, $status );
	}

	/**
	 * Sanitizes plugin data, optionally adds markup, optionally translates.
	 *
	 * @param                  $plugin_file
	 * @param SEOSlides_Module $plugin_data
	 * @param bool             $markup
	 * @param bool             $translate
	 *
	 * @return array
	 */
	protected function _get_plugin_data_markup_translate( $plugin_file, $plugin_data, $markup = true, $translate = true ) {
		$data = array();

		// Translate fields
		if ( $translate ) {
			/*foreach ( array( 'Name', 'PluginURI', 'Description', 'Author', 'AuthorURI', 'Version' ) as $field ) {
				$plugin_data[ $field ] = translate( $plugin_data[ $field ], 'seoslides_translate' );
			}*/
		}

		// Sanitize fields
		$allowed_tags = $allowed_tags_in_links = array(
			'abbr'    => array( 'title' => true ),
			'acronym' => array( 'title' => true ),
			'code'    => true,
			'em'      => true,
			'strong'  => true,
		);
		$allowed_tags['a'] = array( 'href' => true, 'title' => true );

		// Name is marked up inside <a> tags. Don't allow these.
		// Author is too, but some plugins have used <a> here (omitting Author URI).
		$data['Name']        = wp_kses( $plugin_data->Name,        $allowed_tags_in_links );
		$data['Author']      = wp_kses( $plugin_data->Author,      $allowed_tags );

		$data['Description'] = wp_kses( $plugin_data->Description, $allowed_tags );
		$data['Version']     = wp_kses( $plugin_data->Version,     $allowed_tags );

		$data['Title']      = $plugin_data->Name;
		$data['AuthorName'] = $plugin_data->Author;

		// Apply markup
		if ( $markup ) {
			$data['Description'] = wptexturize( $data['Description'] );

			if ( $data['Author'] ) {
				$data['Description'] .= ' <cite>' . sprintf( __('By %s.', 'seoslides_translate' ), $data['Author'] ) . '</cite>';
			}
		}

		return $data;
	}
}
