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

function loadTranslations() {
	var translationStrings = $('#translationStrings').val();
    window.ckoLang = JSON.parse(translationStrings);
}

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
		}
	);

	// Show the first active
	$('.card-tab').trigger('click');
}