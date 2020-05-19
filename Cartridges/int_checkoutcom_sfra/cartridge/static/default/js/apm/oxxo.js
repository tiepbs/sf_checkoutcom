function oxxoFormValidation() {
    // Errors count
    var errors = [];

    // Field 1 validation
    var field1 = '#oxxo_identification';
    if ($(field1).val() == '') {
        errors.push(field1);
    }

    return errors;
}
