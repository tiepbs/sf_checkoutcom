function savedCardFormValidation() {
    // Enable the saved card selection
    savedCardSelection();

    // Submit event
    $('button.submit-payment').off('click touch').one('click touch', function (e) {
        // Reset the form error messages
        resetFormErrors();

        // Prepare some variables
        var savedCard = $('.saved-payment-instrument');
        var buttonEvent = e;

        // Implement the event
        savedCard.each(function(i) {
            // Prepare the variables
            var self = $(this);
            var cvvField = self.find('input.saved-payment-security-code');

            // The saved card is selected
            var condition1 = self.hasClass('selected-payment');

            // Field is empty
            var condition2 = cvvField.val() == '';

            // Field is numeric
            var condition3 = cvvField.val()%1 == 0;

            // Field validation
            if (condition1 && (condition2 || !condition3)) {
                // Prevent the default button click behaviour
                buttonEvent.preventDefault();
                buttonEvent.stopImmediatePropagation();
        
                // Show the CVV error
                self.find('.invalid-feedback').show();
            }
        });
    }); 
}

function savedCardSelection() {
    // Target saved card
    var savedCardItem = $('.saved-payment-instrument');

    // Set the selected card uuid
    savedCardItem.off('click touch').one('click touch', function (e) {
        var self = $(this);

        // Set the selected card uuid
        $('input[name="dwfrm_billing_savedCardForm_selectedCardUuid"]').val(
            self.data('uuid')
        );

        // Set the selected card security code event
        var cvvField = self.find('input.saved-payment-security-code');
        cvvField.off('change').one('change', function (e) {
            $('input[name="dwfrm_billing_savedCardForm_selectedCardCvv"]').val($(this).val());
        });
    });

    // Select the first item in the list
    savedCardItem.first().addClass('selected-payment');
}