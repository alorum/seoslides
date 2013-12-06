( function( window, $, undefined ) {
	var document = window.document;

	var plugin = new SEO_Slides.Plugin();
	plugin.setName( 'Mario' );
	plugin.setMenuText( 'Add Mario' );
	plugin.setIcon( 'http://cdn2.iconfinder.com/data/icons/fatcow/16x16/mario.png' );
	plugin.renderControl = function() {
		return '<img style="position: relative; height: 100%; width: 100%;" src="http://www.zeldainformer.com/Paper%20Mario.png"/>';
	};
	plugin.onPluginRendered = function( $element ) {
		var style = $element[ 0 ].style;
		style.height = '110px';
		style.width = '100px';
	};

} )( window, jQuery );