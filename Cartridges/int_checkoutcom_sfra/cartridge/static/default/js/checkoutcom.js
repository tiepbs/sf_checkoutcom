'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	// Load the language strings
	loadTranslations();

	// Handle payment buttons state
	initButtons();

	// Handle payment tabs state
	initTabs();

	// Tooltips
	initTooltips();
	
	// Customer email
	prepareCustomerEmail();
		
}, true);

function loadTranslations() {
	var translationStrings = $('#translationStrings').val();
    window.ckoLang = JSON.parse(translationStrings);
}

function prepareCustomerEmail() {
	$('input#email').on('focus', function() {
		if ($.trim($(this).val()) == '') {
			$(this).val($('#ckoCustomerEmail').val());
		}
	});
}

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
}

function initTabs() {
	// Remove all active classes
	$('.ckoPaymentOptions .tab-pane').hide();

	// Handle the click navigation
	var allTabs = $('.payment-options a.nav-link');
	allTabs.off('click').on(
			'click',
			function() {
				// Hide all tabs contents
				$('.ckoPaymentOptions .tab-pane').hide();

				// Show the clicked tab content
				$($(this).attr('href')).show();

				// Set the selected option id
				$('#selectedPaymentOption').val(
					$(this).closest('li').data('method-id'));
				});

	// Show the first active
	$('.card-tab').trigger('click');
}
