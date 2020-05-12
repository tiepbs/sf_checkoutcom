'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	// Load the language strings
	loadTranslations();

	// Handle payment tabs state
	initTabs();
}, true);

function initTabs() {
	// Handle the click navigation
	var allTabs = $('.payment-options a.nav-link');
	allTabs.on(
		'click touch',
		function() {
			// Hide all tabs contents
			$('.tab-pane').removeClass('active');

			// Show the clicked tab content
			$($(this).attr('href')).addClass('active');

			// Add the selected payment method
			var methodId = $(this).closest('li').data('method-id');
			$('input[name="dwfrm_billing_paymentMethod"]').val(methodId);

			// Initialize the form validation
			initFormValidation();
		}
	);

	// Show the first active
	$('.credit-card-tab').trigger('click');
}

function initFormValidation() {
	// Selected option container
	var selectedOption = '';

	// Format the selected payment method name
	var parts = $('input[name="dwfrm_billing_paymentMethod"]').val().toLowerCase().split('_');
	for (var i = 0; i < parts.length; i++) {
		selectedOption += parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
	}

	// Build and call the validation function name
	var func = 'init' + selectedOption + 'Validation';
	if (typeof window[func] === "function") {
		window[func]();
	}
}

function resetFormErrors() {
    $('.invalid-feedback').hide();
    $('.credit-card-content .is-invalid').each(function() {
        $(this).removeClass('is-invalid');
    });        
}

function loadTranslations() {
	var translationStrings = $('#translationStrings').val();
    window.ckoLang = JSON.parse(translationStrings);
}