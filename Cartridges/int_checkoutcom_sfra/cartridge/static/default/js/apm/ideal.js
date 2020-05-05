function idealFieldsValidation() {
    var field1 = $('#ideal_bic');
    if (field1.val() == '') {
        $('#ideal_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
    }
}
