'use strict';

function idealFormValidation() {
    // Errors count
    var errors = [];

    // Field 1 validation
    var field1 = '#ideal_bic';
    if ($(field1).val() === '') {
        errors.push(field1);
    }

    return errors;
}
