function boletoFieldsValidation() {

    alert('boleto validation called');

    var boletoField1 = $('#boleto_birthDate');
    if ($('#boleto_apm_radio_btn').is(':checked') && boletoField1.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField1.addClass('is-invalid');
    }

    var boletoField2 = $('#boleto_cpfe');
    if ($('#boleto_apm_radio_btn').is(':checked') && boletoField2.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField2.addClass('is-invalid');
    }
}
