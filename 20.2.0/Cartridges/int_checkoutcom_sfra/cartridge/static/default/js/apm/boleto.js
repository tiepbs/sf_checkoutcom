'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {

}, false);

function boletoFormValidation() {
    // Errors count
    var errors = [];

    // Field 1 validation
    var field1 = '#boleto_birthDate';
    if ($(field1).val() === '') {
        errors.push(field1);
    }

    // Field 2 validation
    var field2 = '#boleto_cpf';
    if ($(field2).val() === '') {
        errors.push(field2);
    }

    return errors;
}
