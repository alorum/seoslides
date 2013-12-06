<?php

$to_translate = array(
	'button_desc'  => __( 'Embed a Slideshow', 'seoslides_translate' ),
	'window_title' => __( 'Embed a Slideshow', 'seoslides_translate' ),
);

$strings = "tinyMCE.addI18n('$mce_locale.seoslides',";
$strings .= json_encode( $to_translate );
$strings .= ');';
