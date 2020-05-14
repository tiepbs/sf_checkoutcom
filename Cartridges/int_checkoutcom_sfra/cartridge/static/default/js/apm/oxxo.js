function oxxoFormValidation() {
    // Errors count
    var errors = 0;

    // Field 1 validation
    var field1 = $('#oxxo_identification');
    if (field1.val() == '') {
        $('#oxxo_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
        errors++;
    }

    return errors;
}
