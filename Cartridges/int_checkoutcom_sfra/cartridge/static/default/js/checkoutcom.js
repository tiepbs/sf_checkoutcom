'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	// Handle payment buttons state
	initButtons();

	// Handle payment tabs state
	initTabs();
	
	// Tooltips
	initTooltips();

}, false);

function initTooltips() {
	$('#cko-card-content .icon').off('click').on('click', function() {
		$('#cko-card-content .tooltip').toggle();
	});
}

function initButtons() {
	// Hide the global form button
	$('button.submit-payment').hide();
	
	// Show the custom form button
	$('#ckoSubmitPayment').show();
	
	// Disable card validation if option not active
	$('#dwfrm_billing').submit(function(e) {
		if ($('#selectedPaymentOption').val() != 'CHECKOUTCOM_CARD') {
			e.preventDefault();
		}
	});
}

function initTabs() {
	// Remove all active classes
	$('.ckoPaymentOptions .tab-pane').hide();

	// Handle the click navigation
	var allTabs = $('.payment-options a.nav-link');
	allTabs.click(function () {
		$('.ckoPaymentOptions .tab-pane').hide();
		$($(this).attr('href')).show();
		$('#selectedPaymentOption').val(
			$(this).closest('li').data('method-id')
		);
	});
	
	// Show the first active
	$('.card-tab').trigger('click');
}
