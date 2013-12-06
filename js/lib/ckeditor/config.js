/**
 * @license Copyright (c) 2003-2012, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	// Define changes to default configuration here.
	// For the complete reference:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	config.extraPlugins = 'sourcedialog';

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'basicstyles', groups: [ 'basicstyles' ] },
		{ name: 'paragraph',   groups: [ 'list', 'blocks', 'align' ] },
		{ name: 'links' },
		{ name: 'document', groups: [ 'mode' ] },
		'/',
		{ name: 'styles' },
		{ name: 'colors' },
		{ name: 'clipboard',   groups: [ 'clipboard' ] },
		{ name: 'basicstyles', groups: [ 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'indent' ] },
		{ name: 'clipboard', groups: [ 'undo' ] }
	];

	// Remove some buttons, provided by the standard plugins, which we don't
	// need to have in the Standard(s) toolbar.
	config.removeButtons = 'Save,NewPage,Preview,Print,Styles,CreateDiv,BGColor,Anchor,Cut,Copy,Paste,JustifyBlock';

	// Set up font sizes using ems
	config.fontSize_sizes = '14/1.077em;16/1.231em;18/1.385em;20/1.538em;22/1.692em;24/1.846em;26/2em;28/2.154em;36/2.769em;48/3.692em;72/5.538em'

	// Set the editor height
	config.resize_enabled = false;
	config.height = '350px';
};
