function idealFieldsValidation() {
    var idealField1 = $('#ideal_bic');
    if (idealField1.val() == '') {
        $('#ideal_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        idealField1.addClass('is-invalid');
    }
}
