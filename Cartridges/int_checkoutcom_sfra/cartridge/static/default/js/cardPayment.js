'use strict'

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
    // Add expiration years
    setExpirationYears();
});

// Sets the expiration years in the form
function setExpirationYears() {
    // Get the current year
    var d = new Date();
    var currentYear = d.getFullYear();

    // Add the select list options
    for (var i = 0; i < 10; i++) {
        $('#expirationYear').append(
            new Option(
                currentYear + i,
                currentYear + i
            )
        );
    }
}

function initCheckoutcomCardValidation() {
    $('#ckoSubmitPayment').off('click touch').on('click touch', function (e) {
        if ($('#selectedPaymentOption').val() == 'CHECKOUTCOM_CARD') {
            // Reset the error messages
            $('.invalid-field-message').empty();
            
            // Prepare the errors array
            var ckoFormErrors = [];
            
            // Card number validation
            ckoFormErrors[0] = checkCardNumber();

            // Card expiration month validation
            ckoFormErrors[1] = checkCardExpirationMonth();

            // Card expiration year validation
            ckoFormErrors[2] = checkCardExpirationYear();

            // Security code validation
            ckoFormErrors[3] = checkCardCvv();

            // Invalidate the button click if errors found
            if ($.inArray(1, ckoFormErrors) !== -1) {
                e.preventDefault();
            }

            console.log(ckoFormErrors);
        }
    });
}

function checkCardNumber() {
    // Set the target field
    var targetField = $('#cardNumber');

    // Check value length
    if (getFormattedNumber(targetField.val()).length < 16) {
        $('.dwfrm_billing_creditCardFields_cardNumber .invalid-field-message').text(
            window.ckoLang.cardNumberInvalid
        );
        targetField.addClass('is-invalid');
        return 1;
    }

    return 0;
}

function checkCardExpirationMonth() {
    // Set the target field
    var targetField = $('#expirationMonth');

    // Check expiration month
    if (targetField.val() == '') {
        $('.dwfrm_billing_creditCardFields_expirationMonth .invalid-field-message').text(
            window.ckoLang.cardExpirationMonthInvalid
        );
        targetField.addClass('is-invalid');
        return 1;
    }

    return 0;
}

function checkCardExpirationYear() {
    // Set the target field
    var targetField = $('#expirationYear');

    // Check expiration year
    if (targetField.val() == '') {
        $('.dwfrm_billing_creditCardFields_expirationYear .invalid-field-message').text(
            window.ckoLang.cardExpirationYearInvalid
        );
        targetField.addClass('is-invalid');
        return 1;
    }

    return 0;
}

function checkCardCvv() {
    // Set the target field
    var targetField = $('#securityCode');

    // Check CVV length
    if (targetField.val().length < 3 || targetField.val().length > 4) {
        $('.dwfrm_billing_creditCardFields_securityCode .invalid-field-message').text(
            window.ckoLang.cardSecurityCodeInvalid
        );
        targetField.addClass('is-invalid');
        return 1;
    }

    return 0;
}

function getFormattedNumber(num) {
    return num.replace(/\s/g, '');
}