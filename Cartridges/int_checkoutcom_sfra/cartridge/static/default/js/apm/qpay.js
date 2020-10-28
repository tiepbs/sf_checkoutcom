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
