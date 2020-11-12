'use strict';

function qpayFormValidation() {
    // Errors count
    var errors = [];

    // Field 1 validation
    var field1 = '#qpay_national_id';
    if ($(field1).val() === '') {
        errors.push(field1);
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
