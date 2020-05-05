function sepaFieldsValidation() {
    // Errors count
    var errors = 0;

    // Field 1 validation
    var field1 = $('#sepa_iban');
    if (field1.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
        errors++;
    }

    // Field 2 validation
    var field2 = $('#sepa_bic');
    if (field2.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field2.addClass('is-invalid');
        errors++;
    }

    return errors;
}
