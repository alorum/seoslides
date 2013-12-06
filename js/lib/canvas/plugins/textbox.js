( function( window, $, undefined ) {
	var document = window.document;
	var plugin = new SEO_Slides.Plugin();
	plugin.setName( 'TextBox' );
	plugin.setMenuText( 'Add new Textbox' );
	plugin.setIcon( 'http://cdn2.iconfinder.com/data/icons/gnomeicontheme/16x16/stock/text/stock_draw-text-frame.png' );
	plugin.renderControl = function() {
		return '<div style="padding: 10px;">' + plugin.getName() + '</div>';
	};
	plugin.onPluginRendered = function( $element ) {
		//
	};

} )( window, jQuery );