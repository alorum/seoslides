<?php



class Catalyst_API {
	/**
	 * @var bool|Catalyst_API
	 */
	protected static $_instance = false;

	/**
	 * Gets the singleton instance of this class to ensure that it only ever gets constructed correctly once.
	 *
	 * @return bool|Catalyst_API
	 */
	public static function instance() {
		if ( ! self::$_instance ) {
			self::$_instance = new self();
		}

		return self::$_instance;
	}

	/**
	 * @var mixed|string|void
	 */
	protected $api_key = '';

	/**
	 * @var string
	 */
	protected $domain = '';

	/**
	 * @var string
	 */
	public $request_error = '';

	/**
	 * Constructor -  Wire up actions and filters
	 */
	protected function __construct() {
		// Make sure the IXR libraries are included
		include_once( ABSPATH . WPINC . '/class-IXR.php' );
		include_once( ABSPATH . WPINC . '/class-wp-http-ixr-client.php' );

		// Get the API key
		$api_key_option = apply_filters( 'catalyst_api_key_name', 'catalyst_api_key' );
		$this->api_key = get_option( $api_key_option, '' );

		// Build the site domain
		$url = get_bloginfo( 'url' );
		$url = parse_url( $url );
		$this->domain = $url['host'];
		if ( isset( $url['path'] ) ) {
			$this->domain .= $url['path'];
		}
		$this->domain = apply_filters( 'catalyst_domain', $this->domain );
	}

	/**
	 * Programatically override the API key (i.e. if it's being changed).
	 *
	 * @param string $key
	 */
	public function set_api_key( $key ) {
		$this->api_key = $key;
	}

	/**
	 * Programatically override the domain.
	 *
	 * @param string $domain
	 */
	public function set_domain( $domain ) {
		$this->domain = $domain;
	}

	/**
	 * Validate the API key set up when instantiating the API object
	 *
	 * @return bool
	 */
	public function validate_key() {
		$product_key = get_option( 'seoslides_product_key', '' );
		$api_args = array( $this->api_key, $this->domain );

		if ( ! empty( $product_key ) ) {
			$api_args[] = $product_key;
		}

		$success = $this->_send_request( 'validate_key', $api_args );

		if ( true !== $success ) {
			return false;
		}

		return true;
	}

	/**
	 * Check that a license is activated for a subscription.
	 *
	 * @param string $subscription_key
	 *
	 * @return bool
	 */
	public function has_subscription_access( $subscription_key = '' ) {
		$success = $this->_send_request( 'check_subscription', array( $this->api_key, $subscription_key, $this->domain ) );

		if ( true !== $success ) {
			return false;
		}

		return true;
	}

	/**
	 * Get the customer's subscription plan ID.
	 *
	 * @return array
	 */
	public function get_subscription_plans() {
		$success = $this->_send_request( 'get_subscriptions', array( $this->api_key ) );

		if ( is_a( $success, 'IXR_Error' ) ) {
			return array();
		}

		return $success;
	}

	/**
	 * Check that a license is activated for a product.
	 *
	 * @param string $product_key
	 *
	 * @return bool
	 */
	public function has_product_access( $product_key = '' ) {
		$success = $this->_send_request( 'check_product', array( $this->api_key, $product_key ) );

		if ( true !== $success ) {
			return false;
		}

		return true;
	}

	/**
	 * Send an XMLRPC request to the Catalyst API.
	 *
	 * @param string $request
	 * @param array  $args
	 *
	 * @return bool|IXR_Error
	 */
	protected function _send_request( $request, $args ) {
		$client = new WP_HTTP_IXR_Client( trailingslashit( CATALYST_URL ) . 'xmlrpc.php' );

		$response = $client->query( "catalyst.{$request}", $args );

		if ( false === $response ) {
			// store error for use in implementation
			$this->request_error = isset( $client->error->message ) ? $client->error->message : '';
			return $client->error;
		}

		return $client->getResponse();
	}
}

Catalyst_API::instance();