'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	// Saved card selection
    initSavedCardSelection();

    // Enable the first saved card
    $('.saved-payment-instrument').first().trigger('click');
}, true);

function initCheckoutcomCardValidation() {
    // Is card payment
    var condition1 = $('input[name="dwfrm_billing_paymentMethod"]').val() == 'CHECKOUTCOM_CARD';

    // Saved cards invisible
    var condition2 = $('.user-payment-instruments').hasClass('checkout-hidden');

    // Validation events
    if (condition1 && condition2) { 
        cardFormValidation();
    }
    else if (condition1 && !condition2) {
        savedCardFormValidation();
    }
}

function cardFormValidation() {
    $('button.submit-payment').off('click touch').on('click touch', function (e) {
        // Reset the form error messages
        resetFormErrors();

        // Prepare the errors array
        var cardFields = [];

        // Card number validation
        cardFields.push(checkCardNumber());

        // Card expiration month validation
        cardFields.push(checkCardExpirationMonth());

        // Card expiration year validation
        cardFields.push(checkCardExpirationYear());

        // Security code validation
        cardFields.push(checkCardCvv());

        // Handle errors
        $.each(cardFields , function(i, field) {
            if (field.error == 1) {
                $('#' + field.id).next('.invalid-feedback').show();
            }
        });

        // Prevent submission
        if (cardFields.length > 0) {
            // Prevent the default button click behaviour
            e.preventDefault();
            e.stopImmediatePropagation();        
        }
    });
}

function savedCardFormValidation() {
    // Submit event
    $('button.submit-payment').off('click touch').on('click touch', function (e) {
        // Reset the form error messages
        resetFormErrors();

        // Prepare some variables
        var savedCard = $('.saved-payment-instrument');
        var buttonEvent = e;

        // Implement the event
        savedCard.each(function(i) {
            // Prepare the variables
            var self = $(this);
            var cvvField = self.find('input.saved-payment-security-code');

            // The saved card is selected
            var condition3 = self.hasClass('selected-payment');

            // Field is empty
            var condition4 = cvvField.val() == '';

            // Field is numeric
            var condition5 = cvvField.val()%1 == 0;

            // Field validation
            if (condition3 && (condition4 || !condition5)) {
                // Prevent the default button click behaviour
                buttonEvent.preventDefault();
                buttonEvent.stopImmediatePropagation();
        
                // Show the CVV error
                self.find('.invalid-feedback').show();
            }
        });
    });        
}

function resetFormErrors() {
    $('.invalid-feedback').hide();
    $('.credit-card-content .is-invalid').each(function() {
        $(this).removeClass('is-invalid');
    });        
}

function initSavedCardSelection() {
    // A saved card is selected
    var condition1 = $('.user-payment-instruments .selected-payment').length > 0;

    // Is card payment
    var condition2 = $('input[name="dwfrm_billing_paymentMethod"]').val() == 'CHECKOUTCOM_CARD';

    // Saved cards invisible
    var condition3 = $('.user-payment-instruments').hasClass('checkout-hidden');

    // Validation event
    if (condition1 && (condition2 || !condition3)) {
        // Set the selected card uuid
        $('.saved-payment-instrument').off('click touch').one('click touch', function (e) {
            var self = $(this);

            // Set the selected card uuid
            $('input[name="dwfrm_billing_creditCardFields_selectedCardUuid"]').val(
                self.data('uuid')
            );
        });

        // Set the card cvv event
        $('.saved-payment-instrument').off('click touch').one('click touch', function (e) {
            var self = $(this);
            $('input[name="dwfrm_billing_creditCardFields_selectedCardCvv"]').val(
                self.find('input.saved-payment-security-code').val()
            );
        });
    }
}

function checkCardNumber() {
    // Set the target field
    var targetField = $('#cardNumber');
    var field = {
        id: targetField.attr('id'),
        error: 0
    }

    // Check value length
    if (getFormattedNumber(targetField.val()).length < 16) {
        $('.dwfrm_billing_creditCardFields_cardNumber .invalid-field-message').text(
            window.ckoLang.cardNumberInvalid
        );
        targetField.addClass('is-invalid');
        field.error = 1;
    }

    return field;
}

function checkCardExpirationMonth() {
    // Set the target field
    var targetField = $('#expirationMonth');
    var field = {
        id: targetField.attr('id'),
        error: 0
    }
    
    // Check expiration month
    if (targetField.val() == '') {
        $('.dwfrm_billing_creditCardFields_expirationMonth .invalid-field-message').text(
            window.ckoLang.cardExpirationMonthInvalid
        );
        targetField.addClass('is-invalid');
        field.error = 1;
    }

    return field;
}

function checkCardExpirationYear() {
    // Set the target field
    var targetField = $('#expirationYear');
    var field = {
        id: targetField.attr('id'),
        error: 0
    }

    // Check expiration year
    if (targetField.val() == '') {
        $('.dwfrm_billing_creditCardFields_expirationYear .invalid-field-message').text(
            window.ckoLang.cardExpirationYearInvalid
        );
        targetField.addClass('is-invalid');
        field.error = 1;
    }

    return field;
}

function checkCardCvv() {
    // Set the target field
    var targetField = $('#securityCode');
    var field = {
        id: targetField.attr('id'),
        error: 0
    }

    // Check CVV length
    if (targetField.val().length < 3 || targetField.val().length > 4) {
        $('.dwfrm_billing_creditCardFields_securityCode .invalid-field-message').text(
            window.ckoLang.cardSecurityCodeInvalid
        );
        targetField.addClass('is-invalid');
        field.error = 1;
    }

    return field;
}

function getFormattedNumber(num) {
    return num.replace(/\s/g, '');
}