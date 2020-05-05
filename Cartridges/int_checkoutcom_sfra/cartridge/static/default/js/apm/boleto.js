function boletoFieldsValidation() {
    var boletoField1 = $('#boleto_birthDate');
    if (boletoField1.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField1.addClass('is-invalid');
    }

    var boletoField2 = $('#boleto_cpfe');
    if (boletoField2.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField2.addClass('is-invalid');
    }
}
