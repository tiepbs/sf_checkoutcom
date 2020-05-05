function idealFieldsValidation() {
    var qpayField1 = $('#qpay_national_id');
    if (qpayField1.val() == '') {
        $('#qpay_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        qpayField1.addClass('is-invalid');
    }
}
