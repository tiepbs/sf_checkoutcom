'use strict'

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
    // Initialise the card type detection
    initCardTypeDetection();

    // Initialise the saved selection
    initSavedCardSelection();

    // Disable saved cards on card form focus
    initCardFormFocus();
});

function initCardTypeDetection() {
    var cleaveCreditCard = new Cleave(
    '#cardNumber', 
    {
        creditCard: true,
        onCreditCardTypeChanged: function (cardType) {
            if (cardType && cardType.length > 0) {
                $('#cardType').val(
                    cardType.charAt(0).toUpperCase() + cardType.slice(1)
                );
            }
            else {
                $('#cardType').val('Unknown');
            }
        }
    });
}

function initSavedCardSelection() {
    // Set the card Id event
    $('#cko-card-content .saved-payment-instrument').off('click touch').on('click touch', function (e) {
        // Remove previous errors displayed
        $(this).find('input.saved-payment-security-code').removeClass('is-invalid');
        $(this).find('input.saved-payment-security-code').next('.invalid-feedback').css('display', 'none');

        // Set the selected card
        $('input[name="selectedCardId"]').val(
            $(this).data('uuid')
        );
    });

    // Set the card cvv event
    $('#cko-card-content .saved-payment-instrument').on('change', function (e) {
        var self = $(this);
        $('input[name="selectedCardCvv"]').val(
            self.find('input.saved-payment-security-code').val()
        );
    });

    // Trigger selection of the fist card
    $('#cko-card-content .saved-payment-instrument').first().trigger('click');
}

function initCardFormFocus() {
    $('#cko-card-form input, #cko-card-form select').on('focus', function (e) {
        // Disable the selected saved cards
        $('#cko-card-content .saved-payment-instrument').removeClass('selected-payment');

        // Empty the selected saved card field
        $('#selectedCardId').val('');
    });
}

function initCheckoutcomCardValidation() {
    $('button.submit-payment').off('click touch').on('click touch', function (e) {
        // Reset the error messages
        $('.invalid-field-message').empty();
        $('.invalid-feedback').hide();
        $('input.saved-payment-security-code').removeClass('is-invalid');

        // Prepare the errors array
        var ckoFormErrors = [];

        // Perform the fields validation
        if ($('#selectedPaymentOption').val() == 'CHECKOUTCOM_CARD' && $('#selectedCardId').val() == '') {            
            // Card owner validation
            ckoFormErrors[0] = checkCardholder();

            // Card number validation
            ckoFormErrors[1] = checkCardNumber();

            // Card expiration month validation
            ckoFormErrors[2] = checkCardExpirationMonth();

            // Card expiration year validation
            ckoFormErrors[3] = checkCardExpirationYear();

            // Security code validation
            ckoFormErrors[4] = checkCardCvv();
        }
        else if ($('#selectedPaymentOption').val() == 'CHECKOUTCOM_CARD' && $('#selectedCardId').val() != '') {
            // Saved card CVV validation
            ckoFormErrors[0] = checkSavedCardCvv();
        }

        // Invalidate the button click if errors found
        if ($.inArray(1, ckoFormErrors) !== -1) {
            e.preventDefault();
            return false;
        }
    });
}

function checkCardholder() {
    // Set the target field
    var targetField = $('#cardOwner');

    // Check value length
    if (getFormattedNumber(targetField.val()).length < 1) {
        $('.dwfrm_billing_creditCardFields_cardOwner .invalid-field-message').text(
            window.ckoLang.cardOwnerInvalid
        );
        targetField.addClass('is-invalid');
        return 1;
    }

    return 0;
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

function checkSavedCardCvv() {
    $('body').bind('DOMNodeInserted', function() {
        // Set the target field
        var targetField = $('#cko-card-content .selected-payment')
        .find('input.saved-payment-security-code');

        // Check CVV length
        if (targetField.val().length < 3 || targetField.val().length > 4) {
            targetField.addClass('is-invalid');
            targetField.closest('.saved-payment-instrument').find('.invalid-feedback').css('display', 'block');
            return 1;
        }
    });

    return 0;
}

function getFormattedNumber(num) {
    return num.replace(/\s/g, '');
}