'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the APM accordion
    initApmAccordion();
}, false);

/*
 * Set APM Forms
 */
function initApmAccordion() {
    // List item radio click action
    $('.cko-apm-accordion input[type="radio"]').on('click touch', function(e) {
        e.stopPropagation();

        $(this).parents('.cko-apm-accordion').trigger('click');
    });

    // List item click action
    $('.cko-apm-accordion').on('click touch', function(e) {
    // Prevent the form submission
        e.preventDefault();

        // Uncheck all radio buttons
        $('.cko-apm-accordion input[type="radio"]').prop('checked', false);

        // Activate the input
        $(this).children('input[type="radio"]').prop('checked', true);

        // Remove all active classes
        $('.cko-apm-accordion').removeClass('cko-apm-active');

        // Close all items
        $('.cko-apm-panel').css('maxHeight', '0px');
        $('.cko-apm-panel').removeClass('cko-apm-panel-opened');

        // Disable the container auto height (display: table)
        $('.cko-apm-panel').css('display', 'block');

        // Set the active element
        $(this).addClass('cko-apm-active');

        // Set the selected APM fields
        var apmId = $(this).parents('.apm-list-item').attr('id');
        $('input[name="dwfrm_billing_apmForm_ckoSelectedApm"]').val(apmId);

        // Run the validation event
        initCheckoutcomApmValidation();

        // Open the sibling panel
        var panel = $(this).next();

        // Enable the container auto height
        panel.css('display', 'table');
        if (panel.css('maxHeight') !== '0px') {
            panel.css('maxHeight', '0px');
        } else {
            panel.css('maxHeight', panel.prop('scrollHeight') + 'px');
        }
    });
}

/*
 * Get the APMs filter
 */
function filterApm() {
    // Get the APM controller URL
    var controllerUrl = $('#ckoApmFilterUrl').val();

    // Send the APM filter AJAX request
    var xhttpFilter = new XMLHttpRequest();
    xhttpFilter.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            // Get the APM countries and currencies list
            var apmList = JSON.parse(this.responseText);
            var anyApmActive = false;

            // Get the user country and currency
            var userData = apmList.filterObject;

            // Display only the allowed APM for the user
            var dataArray = apmList.ckoApmFilterConfig;
            for (var item in dataArray) {
                var condition1 = dataArray[item].countries.includes(userData.country.toUpperCase());
                var condition2 = dataArray[item].countries.includes('*');
                var condition3 = dataArray[item].currencies.includes(userData.currency);
                var condition4 = dataArray[item].enabled;
                if ((condition1 || condition2) && condition3 && condition4) {
                    anyApmActive = true;
                    $('#' + item).css('display', 'block');
                }
            }

            if (!anyApmActive){
                $('a.apm-tab').parent().hide();
            }
        }
    };

    xhttpFilter.open('GET', controllerUrl, true);
    xhttpFilter.send();
}

function initCheckoutcomApmValidation() {
    // Submit event
    $('button.submit-payment').off('click touch').on('click touch', function(e) {
        if ($('input[name="dwfrm_billing_paymentMethod"]').val() === 'CHECKOUTCOM_APM') {
            // Remove all previous errors
            $('.apm-list-item .is-invalid').removeClass('is-invalid');
            $('.apm-list-item .invalid-field-message').hide();

            // Errors count
            var errors = [];

            // Get the APM container id
            var apmId = $('.cko-apm-active').parents('.apm-list-item').attr('id');

            // Build the form validation function name
            var func = apmId + 'FormValidation';

            // Run the form validation
            if (typeof window[func] === 'function') {
                errors = window[func]();
                if (errors.length > 0) {
                    // Prevent the default button click behaviour
                    e.preventDefault();
                    e.stopImmediatePropagation();

                    // Add the invalid fileds invalid style
                    for (var i = 0; i < errors.length; i++) {
                        $(errors[i]).addClass('is-invalid');
                    }

                    // Show the invalid fields error message
                    var invalidFieldMessage = $(errors[0]).parents('.apm-list-item').find('.invalid-field-message');
                    invalidFieldMessage.show();
                    invalidFieldMessage.text(
                        window.ckoLang.apmFieldInvalid
                    );

                    // Scroll back to the error
                    var scrollTarget = $(errors[0]).parents('.apm-list-item');
                    $('html, body').animate({
                        scrollTop: parseInt(scrollTarget.offset().top),
                    }, 500);
                }
            }
        }
    });
}
