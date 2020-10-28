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
            $('a.nav-link').removeClass('active');

            // Handle the saved cards display
            handleSavedCardsDisplay();

            // Get the target id
            var targetId = $(this).attr('href');

            // Show the clicked tab content
            $(targetId).addClass('active');
            $(this).addClass('active');

            // Add the selected payment method
            var methodId = $(this).parents('li').data('method-id');
            $('input[name="dwfrm_billing_paymentMethod"]').val(methodId);

            // Run the APM filter if relevant
            if (methodId === 'CHECKOUTCOM_APM') {
                filterApm();
            }

            // Initialize the form validation
            initFormValidation();
        }
    );

    // Show the first active
    $('.payment-options li.nav-item').first().find('a.nav-link').trigger('click');
}

function handleSavedCardsDisplay() {
    var savedCards = $('.row.saved-payment-instrument').length;
    if (savedCards === 0) {
        $('.saved-card-tab').closest('li').hide();
        $('.tab-pane.saved-card-content').hide();
    }
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
    if (typeof window[func] === 'function') {
        window[func]();
    }
}

function loadTranslations() {
    var translationStrings = $('#translationStrings').val();
    window.ckoLang = JSON.parse(translationStrings);
}
