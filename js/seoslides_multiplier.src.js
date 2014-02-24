/*! seoslides - v1.3.2
 * https://seoslides.com
 * Copyright (c) 2014 Alroum; * Licensed GPLv2+ */
( function( window, $, undefined ) {
	var document = window.document,
		CORE = window.multiplier;

	// Multiplier Push/Remove Controls
	var spinner = $('#seoslides-spinner'),
		push_button = $('#seoslides_multiplier_push'),
		del_button = $('#seoslides_multiplier_delete'),
		auto_checked_label = $('#multiplier_auto_label'),
		auto_checked = $('#seoslides_multiplier_auto');

	// Multipler Stati Controls
	var multiplier_status_open = $('.edit-multiplier-status', '#multiplier'),
		multiplier_status_close = $('.close-multiplier-status', '#multiplier'),
		controls = $('#multiplier_controls');

	// Multiplier Stati Messages
	var multiplier_status = $('#multiplier-status', '#multiplier');

	// Expand the Multiplier controls
	multiplier_status_open.click( function( e ) {
		e.preventDefault();

		var $this = $( this );

		if ( controls.is(':hidden')) {
			controls.slideDown('fast');
			$(this).hide();
			multiplier_status_close.show();
		}
	} );

	// Collapse the Multiplier controls
	multiplier_status_close.click( function ( e ) {
		e.preventDefault();

		controls.slideUp( 'fast' );
		$( this ).hide();
		multiplier_status_open.show();
	} );

// TODO: Decide if instant feedback should apply here (not actually true til save_post fires)
//	auto_checked.change(function() {
//		if (this.checked) {
//			multiplier_status.html( CORE.label_auto_published );
//		} else {
//			multiplier_status.html( CORE.label_published );
//		}
//	});

	// Create a remote Slideset
	push_button.click(function() {
		spinner.show();
		$(this).attr('disabled', true);

		var data = {
			action : 'push_remote_now',
			nonce : $('#seoslides-multiplier-push-nonce').val(),
			post_id : $('#post_ID').val()
		};
		$.post( CORE.ajaxurl, data, function(response) {
			push_button.attr('disabled', false);

			// Hide/Show elements
			spinner.add(push_button).hide();
			del_button.add(auto_checked).add(auto_checked_label).show();

			// Switch status text
			multiplier_status.html( CORE.label_published );
		});

		return false;
	});

	// Delete a remote Slideset
	del_button.click(function() {
		spinner.show();
		$(this).attr('disabled', true);

		var del = {
			'action' : 'delete_remote_now',
			'nonce' : $('#seoslides-multiplier-remove-nonce').val(),
			'post_id' : $('#post_ID').val()
		};
		$.post( CORE.ajaxurl, del, function(response) {
			del_button.attr('disabled', false);

			// Uncheck auto-updates
			auto_checked.prop('checked', false);

			// Hide/Show elements
			spinner.add(del_button).add(auto_checked).add(auto_checked_label).hide();
			push_button.show();

			// Switch status text
			multiplier_status.html( CORE.label_not_published );
		});

		return false;
	});
} )( this, jQuery );
