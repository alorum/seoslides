<?php
/**
 * Plugin Name: seoslides
 * Plugin URL:  https://seoslides.com
 * Description: Add embeddable presentations to WordPress.
 * Version:     1.2.4
 * Author:      alorum, 10up
 * Author URI:  http://alorum.com
 * License:     GPL2+
 */

/**
 * Copyright 2013  Alorum
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License, version 2 or, at
 * your discretion, any later version, as published by the Free
 * Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

// Useful global constants
define( 'SEOSLIDES_VERSION', '1.2.4' );
define( 'SEOSLIDES_URL',     plugin_dir_url( __FILE__ ) );
define( 'SEOSLIDES_PATH',    dirname( __FILE__ ) . '/' );
if ( ! defined( 'CATALYST_URL' ) ) {
	define( 'CATALYST_URL', 'https://seoslides.com' );
}

// Load plugin modules
require_once( 'includes/SEOSlides_Module_Provider.php' );

/**
 * Default initialization for the plugin:
 * - Registers the default textdomain.
 */
function seoslides_init() {
	load_plugin_textdomain( 'seoslides_translate', false, dirname( plugin_basename( __FILE__ ) ) . '/lang' );

	do_action( 'seoslides_register_cpts' );
}

/**
 * Activate the plugin
 */
function seoslides_activate() {
	SEOSlides_Module_Provider::initialize();

	// First load the init scripts in case any rewrite functionality is being loaded
	seoslides_init();

	flush_rewrite_rules();
}
register_activation_hook( __FILE__, 'seoslides_activate' );

/**
 * Deactivate the plugin
 */
function seoslides_deactivate() {

}
register_deactivation_hook( __FILE__, 'seoslides_deactivate' );

// Wireup actions
add_action( 'init',           'seoslides_init' );
add_action( 'plugins_loaded', array( 'SEOSlides_Module_Provider', 'initialize') );

// Wireup filters

// Wireup shortcodes