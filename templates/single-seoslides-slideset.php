<?php
/**
 * The Template for displaying single presentations
 *
 * @package    seoslides
 * @subpackage SEOSlides_Deck
 */

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
		SEOSlides_Util::redirect_404();
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
		SEOSlides_Util::redirect_404();
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
	<meta name="viewport" content="width=device-width, user-scalable=no, minimal-ui">
	<meta name="author" content="<?php the_author(); ?>">
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>" />

<?php $slide_title = empty( $slide->seo_title ) ? $slide->title : $slide->seo_title; ?>
	<meta name="twitter:card" content="summary" />
	<meta property="og:site_name" content="<?php echo esc_attr( get_bloginfo( 'name' ) ); ?>" />
	<meta property="og:title" content="<?php echo esc_attr( $slide_title ); ?>" />
	<meta property="og:url" content="<?php echo esc_url( $slide->permalink() ); ?>" />
	<meta property="og:type" content="presentation:slide" />
<?php $bg_image = $slide->get_bg_image(); ?>
<?php if ( '' !== $bg_image && 'noimage' !== $bg_image ) : ?>
	<meta property="og:image" content="<?php echo esc_url( $bg_image ); ?>" />
<?php endif; ?>
<?php if ( ! empty( $slide->seo_description ) ) : ?>
	<meta property="og:description" content="<?php echo esc_attr( $slide->seo_description ); ?>" />
<?php elseif ( ! empty( $slide->presenter_notes ) ) : ?>
	<meta property="og:description" content="<?php echo esc_attr( wp_trim_words( strip_tags( $slide->presenter_notes ), 200 ) ); ?>" />
<?php else : ?>
	<meta property="og:description" content="<?php echo esc_attr( $slide_title ); ?>" />
<?php endif; ?>

	<?php wp_head(); ?>

	<?php if ( ! has_action( 'wp_head', 'rel_canonical' ) ) : ?>
	<?php rel_canonical(); ?>
	<?php endif; ?>

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

	<article class="deck-container single-slide shownav" style="background-color:<?php echo esc_attr( $slideset_bg ); ?>;">

		<?php $slide->render( 'deck-before', true ); ?>

		<div class="extras">
			<a href="<?php echo esc_url( SEOSlides_Util::slide_nav_link( 'previous', $slide ) ); ?>" class="deck-prev-link" title="<?php _e( 'Previous', 'seoslides_translate' ); ?>" rel="previous">&lsaquo;</a>
			<a href="<?php echo esc_url( SEOSlides_Util::slide_nav_link( 'next', $slide ) ); ?>" class="deck-next-link" title="<?php _e( 'Next', 'seoslides_translate' ); ?>" rel="next">&rsaquo;</a>
		</div>

	</article>

	<section id="noprint">
		<p><?php printf( __( 'Presentations are not meant to be printed.<br />Please visit %s to view the slides.', 'seoslides_translate' ), get_permalink( $slide->slideset ) ) ?></p>
	</section>

	<footer class="deck-footer">
		<span class="ssi social facebook" title="<?php esc_attr_e( 'Share on Facebook', 'seoslides_translate' ); ?>"></span>
		<span class="ssi social google" title="<?php esc_attr_e( 'Share on Google+', 'seoslides_translate' ); ?>"></span>
		<span class="ssi social twitter" title="<?php esc_attr_e( 'Share on Twitter', 'seoslides_translate' ); ?>"></span>

		<?php do_action( 'seoslides-social-toolbar-buttons', $slide->ID ); ?>

		<span class="ssi overlay seoslides" title="<?php esc_attr_e( 'Embed with seoslides', 'seoslides_translate' ); ?>"></span>
		<span class="ssi overlay link" title="<?php esc_attr_e( 'Embed anywhere with a link', 'seoslides_translate' ); ?>"></span>

		<?php do_action( 'seoslides-sharing-toolbar-buttons', $slide->ID ); ?>

		<span class="ssi overlay notes" title="<?php esc_attr_e( 'Slide Notes', 'seoslides_translate' ); ?>"></span>

		<?php do_action( 'seoslides-utility-toolbar-buttons', $slide->ID ); ?>

		<span class="ssi-right">
			<span class="ssi dismiss" title="<?php esc_attr_e( 'Close Overlay', 'seoslides_translate' ); ?>"></span>
			<?php if ( $slideset_link = get_post_meta( get_the_ID(), '_slideset_link', true ) ) : ?>
			<span class="ssi landing" data-href="<?php echo esc_attr( $slideset_link ); ?>" title="<?php esc_attr_e( 'View Presentation Overview', 'seoslides_translate' ); ?>"></span>
			<?php endif; ?>
			<span class="ssi embiggen" title="<?php esc_attr_e( 'View Full-screen', 'seoslides_translate' ); ?>"></span>
			<span class="ssi deck-status" aria-role="status">
				<span class="deck-status-current">?</span>/<span class="deck-status-total">?</span>
			</span>
		</span>
	</footer>

	<div id="loading-interstitial">
		<div class="loading-overlay"></div>
		<div class="loading-modal">
			<?php esc_html_e( 'Loading', 'seoslides_translate' ); ?>
			<div class="spinner">
				<div class="bounce1"></div>
				<div class="bounce2"></div>
				<div class="bounce3"></div>
			</div>
		</div>
	</div>

	<?php wp_footer(); ?>

</body>
</html>