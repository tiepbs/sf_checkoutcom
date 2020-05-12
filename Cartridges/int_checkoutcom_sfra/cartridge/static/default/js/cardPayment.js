'use strict'

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
    // Saved card selection
    //initSavedCardSelection();
});

function initSavedCardSelection() {
    // A saved card is selected
    var condition1 = $('.user-payment-instruments .selected-payment').length > 0;

    // Is card payment
    var condition2 = $('input[name="dwfrm_billing_paymentMethod"]').val() == 'CHECKOUTCOM_CARD';

    // Saved cards invisible
    var condition3 = $('.user-payment-instruments').hasClass('checkout-hidden');

    // Validation event
    if (condition1 && (condition2 || !condition3)) {
        // Set the selected card uuid
        $('.saved-payment-instrument').off('click touch').one('click touch', function (e) {
            var self = $(this);

            // Set the selected card uuid
            $('input[name="dwfrm_billing_creditCardFields_selectedCardUuid"]').val(
                self.data('uuid')
            );
        });

        // Set the card cvv event
        $('.saved-payment-instrument').off('click touch').one('click touch', function (e) {
            var self = $(this);
            $('input[name="dwfrm_billing_creditCardFields_selectedCardCvv"]').val(
                self.find('input.saved-payment-security-code').val()
            );
        });

        // Initialize the validation logic
        //cardv();
    }
}

function cardv() {
    // Is card payment
    var condition1 = $('input[name="dwfrm_billing_paymentMethod"]').val() == 'CHECKOUTCOM_CARD';

    // Saved cards invisible
    var condition2 = $('.user-payment-instruments').hasClass('checkout-hidden');

    // Validation event
    if (condition1 && !condition2) {
        $('button.submit-payment').on('click touch', function (e) {
            var savedCard = $('.saved-payment-instrument');
            var buttonEvent = e;
            savedCard.each(function() {
                // Prepare the variables
                var self = $(this);
                var cvvField = self.find('input.saved-payment-security-code');

                // The saved card is selected
                var condition3 = self.hasClass('selected-payment');

                // Field is empty
                var condition4 = cvvField.val() == '';

                // Field is numeric
                var condition5 = cvvField.val()%1 == 0;

                // Field validation
                if (condition3 && (condition4 || !condition5)) {
                    // Prevent the default button click behaviour
                    buttonEvent.preventDefault();
                    buttonEvent.stopImmediatePropagation();
            
                    // Show the CVV error
                    self.find('.invalid-feedback').show();
                }
            });
        });        
    }
}
