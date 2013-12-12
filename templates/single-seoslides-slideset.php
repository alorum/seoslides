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
	if ( count( $slides ) > 0 ) {
		reset( $slides );
		$first_id = key( $slides );
		/** @var SEOSlides_Slide $first  */
		$first = $slides[ $first_id ];

		header( "HTTP/1.1 307 Temporary Redirect" );
		header( "Location: " . trailingslashit( trailingslashit( get_permalink() ) . $first->slug ) );
		die;
	}

	$scheme = 'overview';
} else {
	$scheme = 'single-slide';

	// Get the slide based on its slug
	$found = get_posts(
		array(
		     'name'        => $slide_slug,
		     'post_type'   => 'seoslides-slide',
		     'post_status' => 'publish',
		     'numberposts' => 1
		)
	);

	if ( count( $found ) > 0 ) {
		$slide = $found[0];
		$slide = new SEOSlides_Slide( $slide );

		$slideset_bg = $slide->parent( 'default_fill_color' );
	}
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
	<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>"/>
	<?php wp_head(); ?>
	<!--[if IE 8]>
	<style type="text/css">
		.slide {
			display: table;
			height: 100%;
		}
	</style>
	<![endif]-->
	<style type="text/css">
		#wpadminbar,
		.show-admin-bar {
			display: none;
		}

		html {
			margin-top: 0 !important;
		}
	</style>
</head>
<body class="home" style="background-color:<?php echo $slideset_bg; ?>;">

<article class="deck-container <?php echo $scheme; ?>" style="background-color:<?php echo $slideset_bg; ?>;">
	<?php if ( 'overview' === $scheme ) : ?>
		<?php
		$author_link = '<a href="' . get_author_posts_url( get_the_author_meta( 'ID' ) ) . '" rel="author">' . get_the_author() . '</a>';
		$site_link = '<a href="' . get_bloginfo( 'url' ) . '">' . __( 'Home', 'seoslides_translate' ) . '</a>';
		$all_slides = '<a href="' . get_bloginfo( 'url' ) . '/slides">' . __( 'All Presentations', 'seoslides_translate' ) . '</a>';
		?>
		<section class='overview'>
			<header class="caption">
				<h1><?php echo get_the_title( $post ); ?></h1>

				<p><?php printf( __( 'Presented by %s', 'seoslides_translate' ), $author_link ); ?></p>
				<p><?php echo $site_link; ?> &bull; <?php echo $all_slides; ?></p>
			</header>
			<?php if ( ! empty( $post->post_content ) ) : ?>
				<section class="details short">
					<?php the_content(); ?>
				</section>
				<div class="detail-expander">
					<p class="button button-primary"><?php _e( 'Show More', 'seoslides_translate' ); ?></p>
					<p class="button button-primary hidden"><?php _e( 'Show Less', 'seoslides_translate' ); ?></p>
				</div>
			<?php endif; ?>
			<section class="list thumbnails">
				<?php
				/** @var SEOSlides_Slideset $slideset */
				$slideset = new SEOSlides_Slideset( $post->ID );

				$link_base = get_permalink();

				$slide_number = 1;
				/** @var SEOSlides_Slide $slide */
				foreach ( $slideset->slides as $slide ) {
					if ( 'publish' !== $slide->status ) {
						continue;
					}

					echo "<span class='link-wrap' data-href='{$link_base}{$slide->slug}'>";

					echo $slide->render( 'deck-thumb' );

					echo "</span>\r\n";

					$slide_number ++;
				}
				?>
			</section>

		</section>
	<?php else : ?>
		<?php if ( isset( $slide ) ) : ?>
			<?php $slide->render( 'deck-before', true ); ?>
		<?php endif; ?>
	<?php endif; ?>
	<div class="extras">
		<?php $branding = get_option( 'seoslides_logo', '' ); ?>
		<?php $branding_url = get_option( 'seoslides_logo_url', '' ); ?>
		<?php $branding_title = get_option( 'seoslides_logo_title', '' ); ?>
		<?php $enabled = 'yes' === get_option( 'seoslides_logo_enabled', 'no' ); ?>
		<?php if ( 'default' === $branding || 'seoslides' === $branding ) : ?>
			<?php $brand = '<span class="branding"><img src="' . SEOSLIDES_URL . '/img/seoslides-logo-trans-2x.png" style="height:100%;width:auto;"></span>'; ?>
		<?php else : ?>
			<?php $brand = '<span class="branding"><img src="' . esc_url( $branding ) . '" style="height:100%;width:auto;"></span>'; ?>
		<?php endif; ?>
		<?php if ( '' !== $branding_url ) : ?>
			<?php $brand = '<a href="' . esc_url( $branding_url ) . '" title="' . esc_attr( $branding_title ) . '">' . $brand . '</a>'; ?>
		<?php endif; ?>
		<?php echo $enabled ? $brand : ''; ?>

		<?php if ( isset( $slide ) ) : ?>
			<?php $prev = $slide->permalink( 'previous' ); ?>
			<?php $next = $slide->permalink( 'next' ); ?>
		<?php else : ?>
			<?php $prev = $next = '#'; ?>
		<?php endif; ?>

		<a href="<?php echo esc_url( $prev ); ?>" class="deck-prev-link" title="<?php _e( 'Previous', 'seoslides_translate' ); ?>" rel="previous">&lsaquo;</a>
		<a href="<?php echo esc_url( $next ); ?>" class="deck-next-link" title="<?php _e( 'Next', 'seoslides_translate' ); ?>" rel="next">&rsaquo;</a>
	</div>
</article>

<section id="noprint">
	<p><?php printf( __( 'Presentations are not meant to be printed.<br />Please visit %s to view the slides.', 'seoslides_translate' ), get_permalink( $slide->slideset ) ) ?></p>
</section>

<footer class="deck-footer <?php echo $scheme; ?>">
	<p class="deck-actions"></p>
</footer>
<?php wp_footer(); ?>
</body>
</html>