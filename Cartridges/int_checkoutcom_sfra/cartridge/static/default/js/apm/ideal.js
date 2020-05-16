function idealFormValidation() {
    // Errors count
    var errors = 0;
 
    // Field 1 validation
    var field1 = $('#ideal_bic');
    if (field1.val() == '') {
        $('#ideal_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        field1.addClass('is-invalid');
        errors++;
    }

    return errors;
}
