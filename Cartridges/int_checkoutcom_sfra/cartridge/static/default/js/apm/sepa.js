function sepaFieldsValidation() {
    var field1 = $('#sepa_iban');
    if (field1.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
    }

    var field2 = $('#sepa_bic');
    if (field2.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field2.addClass('is-invalid');
    }
}
