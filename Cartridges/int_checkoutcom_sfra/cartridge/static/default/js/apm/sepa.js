function sepaFieldsValidation() {
    var sepaField1 = $('#sepa_iban');
    if (sepaField1.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        sepaField1.addClass('is-invalid');
    }

    var sepaField2 = $('#sepa_bic');
    if (sepaField2.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        sepaField2.addClass('is-invalid');
    }
}
