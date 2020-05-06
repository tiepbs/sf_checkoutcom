"use strict";

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    initBoletoFieldFormatters();
}, false);

function boletoFieldsValidation() {
    // Errors count
    var errors = 0;

    // Field 1 validation
    var field1 = $('#boleto_birthDate');
    if (field1.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
        errors++;
    }

    // Field 2 validation
    var field2 = $('#boleto_cpfe');
    if (field2.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field2.addClass('is-invalid');
        errors++;
    }

    return errors;
}

function initBoletoFieldFormatters() {
    // Boleto birth date formatter
    var cleave = new Cleave('#boleto_birthDate', {
        date: true,
        delimiter: '-',
        datePattern: ['Y', 'm', 'd']
    });
}
