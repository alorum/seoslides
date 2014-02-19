<?php
/**
 * The Template for displaying single presentations
 *
 * @package    seoslides
 * @subpackage SEOSlides_Deck
 */

// Remove some known theme incompatibilities
remove_filter( 'wp_title', 'genesis_doctitle_wrap', 20 );
remove_filter( 'wp_title', 'genesis_default_title', 10, 3 );

/**
 * Generate branding for the footer.
 */
function seoslides_branding() {
	$branding = get_option( 'seoslides_logo', '' );
	$branding_url = get_option( 'seoslides_logo_url', '' );
	$branding_title = get_option( 'seoslides_logo_title', '' );
	$enabled = 'yes' === get_option( 'seoslides_logo_enabled', 'no' );

	if ( 'default' === $branding || 'seoslides' === $branding ) {
		$brand = '<span class="branding"><img src="' . SEOSLIDES_URL . '/img/seoslides-logo-trans-2x.png" style="height:100%;width:auto;"></span>';
	} else {
		$brand = '<span class="branding"><img src="' . esc_url( $branding ) . '" style="height:100%;width:auto;"></span>';
	}

	if ( '' !== $branding_url ) {
		$brand = '<a href="' . esc_url( $branding_url ) . '" title="' . esc_attr( $branding_title ) . '">' . $brand . '</a>';
	}

	echo $enabled ? $brand : '';
}

/**
 * Build a navigation permalink.
 *
 * @param string               $direction
 * @param null|SEOSlides_Slide $slide
 *
 * @return string
 */
function seoslides_nav_link( $direction, $slide = null ) {
	if ( null !== $slide ) {
		return $slide->permalink( $direction );
	}

	return '#';
}

/**
 * Redirect to a 404 page so we don't produce a broken presentation.
 *
 * @global WP_Query $wp_query
 */
function seoslides_redirect_404() {
	// Display a 404 page since we don't have overviews
	global $wp_query;
	$wp_query->is_404 = true;
	$wp_query->is_single = false;
	$wp_query->is_page = false;

	include( get_query_template( '404' ) );
	exit();
}

global $post;
the_post();
$slide_slug = get_query_var( 'seoslides-slide' );
$slideset_bg = '#000';
if ( get_query_var( 'seoslides-embed' ) ) {
	$slide = get_posts(
		array(
		     'post_parent' => $post->ID,
		     'post_type'   => 'seoslides-slide',
		     'post_status' => 'publish',
		     'numberposts' => 1,
		     'orderby'     => 'menu_order',
		     'order'       => 'ASC',
		)
	);
	if ( $slide ) {
		$slide_slug = $slide[0]->post_name;
	}
	unset( $slide );
}

if ( '' === $slide_slug ) {
	// Temporarily redirect to the first slide in the presentation
	/** @var SEOSlides_Slideset $slideset */
	$slideset = SEOSlides_Module_Provider::get( 'SEOSlides Core' )->get_slideset( $post->ID );
	$slides = array_filter( $slideset->slides, array( 'SEOSlides_Slide', 'slide_is_published' ) );

	if ( count( $slides ) === 0 ) {
		seoslides_redirect_404();
	}

	reset( $slides );
	$first_id = key( $slides );
	/** @var SEOSlides_Slide $slide  */
	$slide = $slides[ $first_id ];

	header( "HTTP/1.1 307 Temporary Redirect" );
	header( "Location: " . trailingslashit( trailingslashit( get_permalink() ) . $slide->slug ) );
	die;
} else {
	// Get the slide based on its slug
	$found = get_posts(
		array(
		     'name'        => $slide_slug,
		     'post_type'   => 'seoslides-slide',
		     'post_status' => 'publish',
		     'numberposts' => 1
		)
	);

	if ( count( $found ) === 0 ) {
		seoslides_redirect_404();
	}

	$slide = $found[0];
	$slide = new SEOSlides_Slide( $slide );

	$slideset_bg = $slide->parent( 'default_fill_color' );
}
?><!DOCTYPE html>
<!--[if IE 7]>
<html class="ie ie7" <?php language_attributes(); ?>><![endif]-->
<!--[if IE 8]>
<html class="ie ie8" <?php language_attributes(); ?>><![endif]-->
<!--[if !(IE 7) | !(IE 8)  ]><!-->
<html <?php language_attributes(); ?>>
<!--<![endif]-->
<head>
	<title><?php wp_title( '|', true, 'right' ); ?></title>

	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="viewport" content="width=1024, user-scalable=no">
	<meta name="author" content="<?php the_author(); ?>">
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />

	<?php wp_head(); ?>

	<!--[if IE 8]>
	<style type="text/css">
		.slide {
			display: table;
			height: 100%;
		}
	</style>
	<![endif]-->
</head>
<body class="home" style="background-color:<?php echo esc_attr( $slideset_bg ); ?>;">

	<article class="deck-container single-slide" style="background-color:<?php echo esc_attr( $slideset_bg ); ?>;">

		<?php $slide->render( 'deck-before', true ); ?>

		<div class="extras">
			<a href="<?php echo esc_url( seoslides_nav_link( 'previous', $slide ) ); ?>" class="deck-prev-link" title="<?php _e( 'Previous', 'seoslides_translate' ); ?>" rel="previous">&lsaquo;</a>
			<a href="<?php echo esc_url( seoslides_nav_link( 'next', $slide ) ); ?>" class="deck-next-link" title="<?php _e( 'Next', 'seoslides_translate' ); ?>" rel="next">&rsaquo;</a>

			<p class="deck-actions"></p>
		</div>

	</article>

	<section id="noprint">
		<p><?php printf( __( 'Presentations are not meant to be printed.<br />Please visit %s to view the slides.', 'seoslides_translate' ), get_permalink( $slide->slideset ) ) ?></p>
	</section>

	<footer class="deck-footer <?php echo $scheme; ?>">
		<?php seoslides_branding(); ?>
	</footer>

	<?php wp_footer(); ?>

</body>
</html>