function boletoFieldsValidation() {
    var field1 = $('#boleto_birthDate');
    if (field1.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
    }

    var field2 = $('#boleto_cpfe');
    if (field2.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field2.addClass('is-invalid');
    }
}
