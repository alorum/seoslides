<?php
/**
 * PHP-serializable representation of canvas objects.
 *
 * @package    SEOSlides
 * @subpackage Objects
 */
class SEOSlides_CanvasObject {
	/**
	 * @var string
	 */
	public $element_id;

	/**
	 * @var string
	 */
	public $plugin_id;

	/**
	 * @var SEOSlides_CanvasObject_Settings
	 */
	public $settings;

	/**
	 * Construct an object based on a JSON-serialized string.
	 *
	 * @param string|array $json
	 *
	 * @throws Exception
	 */
	public function __construct( $json ) {
		if ( is_string( $json ) ) {
			$data = json_decode( $json, true );
		} else if ( is_array( $json ) ) {
			$data = $json;
		} else {
			throw new Exception( 'Bad data sent from browser' );
		}

		$this->element_id = $data['element_id'];
		$this->plugin_id  = $data['plugin_id'];

		$this->settings = new SEOSlides_CanvasObject_Settings( $data['settings'] );
	}
}

/**
 * PHP-serializable representation of canvas object settings
 *
 * @package    SEOSlides
 * @subpackage Objects
 */
class SEOSlides_CanvasObject_Settings {
	/**
	 * @var object
	 */
	public $size;

	/**
	 * @var object
	 */
	public $position;

	/**
	 * @var string
	 */
	public $content = '';

	/**
	 * Standard constructor
	 *
	 * @param array $data
	 */
	public function __construct( $data ) {
		$this->size = new stdClass;
		$this->size->w = $data['size']['w'];
		$this->size->h = $data['size']['h'];

		$this->position = new stdClass;
		$this->position->top  = $data['position']['top'];
		$this->position->left = $data['position']['left'];

		$this->content = $data['content'];
	}
}