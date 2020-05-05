function idealFieldsValidation() {
    var field1 = $('#qpay_national_id');
    if (field1.val() == '') {
        $('#qpay_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
    }
}
