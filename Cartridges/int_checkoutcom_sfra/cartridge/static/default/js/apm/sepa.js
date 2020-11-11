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
