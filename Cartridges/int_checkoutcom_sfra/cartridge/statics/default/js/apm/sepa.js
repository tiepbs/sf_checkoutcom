'use strict';

function sepaFormValidation() {
    // Errors count
    var errors = [];

    // Field 1 validation
    var field1 = '#sepa_iban';
    if ($(field1).val() === '') {
        errors.push(field1);
    }

    // Field 2 validation
    var field2 = '#sepa_bic';
    if ($(field2).val() === '') {
        errors.push(field2);
    }

    return errors;
}

/**
 * Reset Form
 */
function resetFormErrors() {
    $('.contact-info-block .is-invalid').each(function() {
        $(this).removeClass('is-invalid');
    });
}

/**
 * Validate Email
 */
function validateEmail() {
    var emailAddress = $('input[name$="dwfrm_billing_contactInfoFields_email"]');

    // Check expiration month
    if (emailAddress.val() === '') {
        $('#emailInvalidMessage').text(
            window.ckoLang.apmEmailInvalid
        );
        emailAddress.addClass('is-invalid');

        return false;
    }

    return true;
}

/**
 * Validate Phone Number
 */
function validatePhone() {
    var phone = $('input[name$="dwfrm_billing_contactInfoFields_phone"]');

    // Check expiration month
    if (phone.val() === '') {
        $('#phoneInvalidMessage').text(
            window.ckoLang.apmPhoneNumberInvalid
        );
        phone.addClass('is-invalid');

        return false;
    }

    return true;
}
