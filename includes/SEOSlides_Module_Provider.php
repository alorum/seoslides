<?php
/**
 * Wrapper for loading and instantiating code modules for SEOSlides.
 *
 * @since 0.1
 * @package SEOSlides
 * @subpackage SEOSlides_Modules
 */
class SEOSlides_Module_Provider {
	/**
	 * Container for a list of available modules.
	 *
	 * @var array
	 */
	private static $available_modules = array();

	private static $core_modules = array();

	/**
	 * Container for instantiated modules.
	 *
	 * @var array
	 */
	private static $modules = array();

	/**
	 * Initialize the module provider.
	 *
	 * @uses do_action Calls 'seoslides_modules_load' to indicate modules are loaded.
	 */
	public static function initialize() {
		$modules = self::get_modules_to_load();

		foreach( $modules as $module ) {
			self::load( $module->name(), $module->classname(), $module->include_file() );

			if ( $module->auto_load() ) {
				self::$core_modules[ basename( $module->include_file() ) ] = $module;
			}
		}

		do_action( 'seoslides_modules_load' );

		if ( defined( 'SEOSLIDES_ALPHA' ) && SEOSLIDES_ALPHA ) {
			add_action( 'admin_menu', array( 'SEOSlides_Module_Provider', 'register_menus' ) );
		}
	}

	/**
	 * Merge the array of auto-loading modules with user-activated modules and return module information for parsing.
	 *
	 * @return array
	 */
	protected static function get_modules_to_load() {
		$to_load = array();

		// Populate available modules
		self::$available_modules = self::get_modules();
		foreach( self::$available_modules as $module ) {
			if ( $module->auto_load() ) {
				$to_load[] = $module;
			}
		}

		// Activate any modules that are available and should be active
		$active_modules = (array) get_option( 'seoslides_active_modules', array() );

		foreach( $active_modules as $module ) {
			if ( isset( self::$available_modules[ $module ] ) ) {
				$to_load[] = self::$available_modules[ $module ];
			}
		}

		return $to_load;
	}

	/**
	 * Get all modules from either the cache or by parsing the /includes directory.
	 *
	 * @return array
	 */
	public static function get_modules() {
		if ( ! $cache_modules = wp_cache_get( 'seoslides_modules', 'seoslides' ) ){
			$cache_modules = array();
		}

		if ( count( $cache_modules ) > 0 ) {
			return $cache_modules;
		}

		$module_file_list = array();

		// Module Directories
		$module_directories = array( trailingslashit( SEOSLIDES_PATH ) . 'includes', trailingslashit( WP_CONTENT_DIR ) . 'seoslides_modules' );
		foreach( $module_directories as $directory ) {
			$modules_dir = @opendir( $directory );
			if ( $modules_dir ) {
				while ( ( $file = readdir( $modules_dir ) ) !== false ) {
					if ( substr( $file, 0, 1 ) == '.' ) {
						continue;
					}

					if ( substr( $file, -4 ) == '.php' ) {
						$module_file_list[] = array( $directory, $file );
					}
				}
				closedir( $modules_dir );
			}
		}

		foreach( $module_file_list as $module_array ) {
			$directory = $module_array[0];
			$module_file = $module_array[1];
			$module = new SEOSlides_Module( $directory . '/' . $module_file );

			if ( $module->is_valid() ) {
				$cache_modules[ $module_file ] = $module;
			}
		}

		wp_cache_set( 'seoslides_modules', $cache_modules, 'seoslides', 10 * 60 );

		return $cache_modules;
	}

	/**
	 * Get an instance of the named module.  If the instance already exists, return the stored one.
	 *
	 * @param string $module_name Name of the module to return.
	 *
	 * @return object Module instance
	 * @throws SEOSlides_Module_Exception
	 */
	public static function get( $module_name ) {
		if ( ! isset( self::$modules[ $module_name ] ) ) {
            if ( ! isset( self::$available_modules[ $module_name ] ) ) {
	            throw new SEOSlides_Module_Exception( sprintf( __( 'Get %s - No module by that name exists.', 'seoslides_translate' ), $module_name ) );
            }

			$module = self::$available_modules[ $module_name ];
			require_once( $module['path'] );

			self::$modules[ $module_name ] = new $module['class'];

			do_action( 'seoslides_module_instantiate', $module_name, self::$modules[ $module_name ] );
		}

		return self::$modules[ $module_name ];
	}

	/**
	 * Register a module with the provider.
	 *
	 * @param string $class Name of the class to register
	 * @param string $path  PHP include path
	 * @param string $name  Unique name for the module
	 *
	 * @throws SEOSlides_Module_Exception
	 */
	public static function register( $class, $path, $name = false ) {
		if ( false === $name ) {
			$name = $class;
		}

		if ( isset( self::$available_modules[ $name ] ) ) {
			throw new SEOSlides_Module_Exception( __( 'That module name is already reserved.', 'seoslides_translate' ) );
		}

		self::$available_modules[ $name ] = array(
			'path'  => $path,
			'class' => $class
		);
	}

	/**
	 * Load a module and immediately return its instance
	 *
	 * @param      $class
	 * @param      $path
	 * @param bool $name
	 *
	 * @return object
	 */
	public static function load( $name, $class = false, $path = false ) {
		if ( ! isset( self::$available_modules[ $name ] ) ) {
			if ( false === $class || false === $path ) {
				throw new SEOSlides_Module_Exception( __( 'Error loading unregistered module.', 'seoslides_translate' ) );
			}

			self::register( $class, $path, $name );
		}

		return self::get( $name );
	}

	/**
	 * Remove a module from the provider.
	 *
	 * @param string $name Class name of the module to remove.
	 */
	public static function unregister( $name ) {
		unset( self::$available_modules[ $name ] );
	}

	/**
	 * Check whether or not a specific module is active.
	 *
	 * @param string $module
	 *
	 * @return bool
	 */
	public static function is_module_active( $module ) {
		$active = in_array( $module, (array) get_option( 'seoslides_active_modules', array() ) );

		return $active || self::is_core_module( $module );
	}

	/**
	 * Check whether or not we're dealing with a core module.
	 *
	 * @param string $module
	 *
	 * @return bool
	 */
	public static function is_core_module( $module ) {
		$core_modules = array_keys( self::$core_modules );
		return in_array( $module, $core_modules );
	}

	/**
	 * Register the submenu page for the module loader.
	 */
	public static function register_menus() {
		static $initialized = false;

		if ( $initialized ) {
			return;
		}

		$initialized = true;

		add_submenu_page(
			'edit.php?post_type=seoslides-slideset',
			__( 'seoslides Modules', 'seoslides_translate' ),
			__( 'Modules', 'seoslides_translate' ),
			'install_plugins',
			'seoslides_modules',
			array( 'SEOSlides_Module_Provider', 'menu' )
		);
	}

	/**
	 * Actually output the module loader menu page.
	 */
	public static function menu() {
		global $status, $page;

		require_once __DIR__ . '/objects/SEOSlides_Module_List_Table.php';

		$wp_list_table = new SEOSlides_Module_List_Table();
		$pagenum = $wp_list_table->get_pagenum();

		$action = $wp_list_table->current_action();

		$module = isset( $_REQUEST['module'] ) ? $_REQUEST['module'] : '';
		$s = isset( $_REQUEST['s'] ) ? urlencode( $_REQUEST['s'] ) : '';

		// Clean up request URI from temporary args for screen options/paging uri's to work as expected.
		$_SERVER['REQUEST_URI'] = remove_query_arg( array( 'error', 'deleted', 'activate', 'activate-multi', 'deactivate', 'deactivate-multi', '_error_nonce' ), $_SERVER['REQUEST_URI'] );

		if ( $action ) {
			switch ( $action ) {
				case 'activate':
					if ( ! self::is_module_active( $module ) ) {
						$active_modules = (array) get_option( 'seoslides_active_modules', array() );

						$active_modules[] = $module;

						update_option( 'seoslides_active_modules', $active_modules );
					}
					break;
				case 'deactivate':
					if ( self::is_module_active( $module ) ) {
						$active_modules = (array) get_option( 'seoslides_active_modules', array() );

						$key = array_search( $module, $active_modules );
						if ( false !== $key ) {
							unset( $active_modules[ $key ] );

							update_option( 'seoslides_active_modules', $active_modules );
						}
					}
			}
		}

		$wp_list_table->prepare_items();

		add_thickbox();

		$title = __( 'seoslides Modules', 'seoslides_translate' );

?>
		<div class="wrap">
			<?php screen_icon(); ?>
			<h2>
				<?php echo esc_html( $title ); ?>
				<?php if ( $s ) : ?>
					<?php printf( '<span class="subtitle">' . __('Search results for &#8220;%s&#8221;') . '</span>', esc_html( $s ) ); ?>
				<?php endif; ?>
			</h2>

			<?php $wp_list_table->views(); ?>

			<form method="get" action="">
				<?php $wp_list_table->search_box( __( 'Search Available Modules', 'seoslides_translate' ), 'module' ); ?>
			</form>

			<form method="post" action="">

				<input type="hidden" name="plugin_status" value="<?php echo esc_attr($status) ?>" />
				<input type="hidden" name="paged" value="<?php echo esc_attr($page) ?>" />

				<?php $wp_list_table->display(); ?>
			</form>

		</div>
<?php
	}
}

/**
 * Class SEOSlides_Module
 *
 * @property-read string Name
 * @property-read string Version
 * @property-read string Description
 * @property-read string Author
 * @property-read string Title
 * @property-read string AuthorName
 */
class SEOSlides_Module {
	/**
	 * Flag whether or not the file is a loadable module.
	 *
	 * @var bool
	 */
	private $is_valid = false;

	private $include_file;

	private $class;

	private $name;

	private $activation;

	private $description;

	private $version;

	private $author;

	public function __construct( $file ) {
		$this->include_file = $file;
		$this->class = basename( $file, '.php' );

		$headers = array(
			'Name'        => 'Module Name',
			'Activation'  => 'Activation',
			'Description' => 'Description',
			'Version'     => 'Version',
			'Author'      => 'Author',
		);

		// Get file data
		$fp = fopen( $file, 'r' );

		// Get only the first chunk of data
		$file_data = fread( $fp, 8192 );

		// Close
		fclose( $fp );

		// Kill line endings
		$file_data = str_replace( "\r", "\n", $file_data );

		foreach( $headers as $field => $regex ) {
			if ( preg_match( '/^[ \t\/*#@]*' . preg_quote( $regex, '/' ) . ':(.*)$/mi', $file_data, $match ) && $match[1] )
				$headers[ $field ] = _cleanup_header_comment( $match[1] );
			else
				$headers[ $field ] = '';
		}

		if ( ! empty( $headers['Name'] ) ) {
			$this->name = $headers['Name'];
			$this->activation = $headers['Activation'];
			$this->description = $headers['Description'];
			$this->version = $headers['Version'];
			$this->author = $headers['Author'];

			$this->is_valid = true;
		} else {
			$this->is_valid = false;
		}
	}

	/**
	 * Magic Getter
	 *
	 * @param string $field
	 *
	 * @return string
	 * @throws SEOSlides_Module_Exception
	 */
	public function __get( $field ) {
		switch( $field ) {
			case 'Name':
				return $this->name;
			case 'Version':
				return $this->version;
			case 'Description':
				return $this->description;
			case 'Author':
				return $this->author;
			case 'Title':
				return $this->name;
			case 'AuthorName':
				return $this->author;
			default:
				throw new SEOSlides_Module_Exception( __( 'Invalid property name.', 'seoslides_translate' ) );
		}
	}

	/**
	 * Flag whther or not the module is loadable.
	 *
	 * @return bool
	 */
	public function is_valid() {
		return $this->is_valid;
	}

	/**
	 * Flag whether or not the module should load automatically.
	 *
	 * Any module that auto-loads will be transparent to the user.
	 *
	 * @return bool
	 */
	public function auto_load() {
		return $this->is_valid && ( 'hidden' === $this->activation || 'core' === $this->activation );
	}

	/**
	 * Return the module's header information.
	 *
	 * @return array
	 */
	public function header_info() {
		if ( ! $this->is_valid ) {
			return array();
		}

		return array(
			'name'        => $this->name,
			'description' => $this->description,
			'version'     => $this->version,
			'author'      => $this->author
		);
	}

	/**
	 * Get the module name.
	 *
	 * @return string
	 */
	public function name() {
		if ( ! $this->is_valid ) {
			return '';
		}

		return $this->name;
	}

	/**
	 * Get the module class name.
	 *
	 * @return string
	 */
	public function classname() {
		if ( ! $this->is_valid ) {
			return '';
		}

		return $this->class;
	}

	/**
	 * Get the readonly include file.
	 *
	 * @return string
	 */
	public function include_file() {
		if ( ! $this->is_valid ) {
			return '';
		}

		return $this->include_file;
	}

	/**
	 * Load the module.
	 *
	 * @return null|object
	 */
	public function load() {
		if ( ! $this->is_valid ) {
			return null;
		}

		require_once( $this->include_file );

		return new $this->class();
	}
}

/**
 * Custom exception class for the Module Provider
 */
class SEOSlides_Module_Exception extends Exception {

	/**
	 * Redefine the Exception so message is not optional.
	 *
	 * @param string $message Error message
	 */
	public function __construct( $message ) {
		parent::__construct( $message );
	}

	/**
	 * Custom string representation of the exception.
	 *
	 * @return string
	 */
	public function __toString() {
		return __CLASS__ . ": [{$this->code}]: {$this->message}\n";
	}
}