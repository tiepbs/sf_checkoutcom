'use strict'

// Set the card validation errors counter
var ckoFormErrors = 0;

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
    // Add expiration years
    setExpirationYears();

    // Add the card for validation
    initFormValidation();
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

function initFormValidation() {
    $('#ckoSubmitPayment').on('click', function (e) {
        if ($('#selectedPaymentOption').val() == 'CHECKOUTCOM_CARD') {
            // Reset the error messages
            $('.invalid-field').empty();
            
            // Card number validation
            checkCardNumber();

            // Card expiration validation
            checkCardExpiration();

            // Security code validation
            checkCardCvv();

            // Invalidate the button click if errors found
            if (ckoFormErrors > 0) {
                e.preventDefault();
            }
        }
    });
}

function checkCardNumber() {
    // Set the target field
    var targetField = $('#cardNumber');

    // Check value length
    if (getFormattedNumber(targetField.val()).length < 16) {
        $('.dwfrm_billing_creditCardFields_cardNumber .invalid-field').text(
            window.ckoLang.cardNumberInvalid
        );
        targetField.addClass('is-invalid');
        ckoFormErrors++;
    }
}

function checkCardExpiration() {
    // Set the target fields
    var targetField1 = $('#expirationMonth');
    var targetField2 = $('#expirationYear');

    // Check expiration month
    if (targetField1.val() == '') {
        $('.dwfrm_billing_creditCardFields_expirationMonth .invalid-field').text(
            window.ckoLang.cardExpirationMonthInvalid
        );
        targetField.addClass('is-invalid');
        ckoFormErrors++;
    }

    // Check expiration year
    if (targetField2.val() == '') {
        $('.dwfrm_billing_creditCardFields_expirationYear .invalid-field').text(
            window.ckoLang.cardExpirationYearInvalid
        );
        targetField.addClass('is-invalid');
        ckoFormErrors++;
    }
}

function checkCardCvv() {
    // Set the target field
    var targetField = $('#securityCode');

    // Check CVV length
    if (targetField.val().length < 3 || targetField.val().length > 4) {
        $('.dwfrm_billing_creditCardFields_securityCode .invalid-field').text(
            window.ckoLang.cardSecurityCodeInvalid
        );
        targetField.addClass('is-invalid');
        ckoFormErrors++;
    }
}

function getFormattedNumber(num) {
    return num.replace(/\s/g, '');
}