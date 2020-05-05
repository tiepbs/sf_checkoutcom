function idealFieldsValidation() {
    // Errors count
    var errors = 0;

    // Field 1 validation
    var field1 = $('#qpay_national_id');
    if (field1.val() == '') {
        $('#qpay_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
        errors++;
    }

    return errors;
}
