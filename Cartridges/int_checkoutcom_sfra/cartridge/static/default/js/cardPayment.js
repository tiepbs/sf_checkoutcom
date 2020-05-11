'use strict'

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
    // Sasved card selection
    initSavedCardSelection();
});

function initSavedCardSelection() {
    // Set the selected card uuid
    $('.saved-payment-instrument').on('click touch', function (e) {
        var self = $(this);

        // Set the selected card uuid
        $('input[name="dwfrm_billing_creditCardFields_selectedCardUuid"]').val(
            self.data('uuid')
        );
    });

    // Set the card cvv event
    $('.saved-payment-instrument').on('change', function (e) {
        var self = $(this);
        $('input[name="dwfrm_billing_creditCardFields_selectedCardCvv"]').val(
            self.find('input.saved-payment-security-code').val()
        );
    });
}

function initCheckoutcomCardValidation() {
    if ($('input[name="dwfrm_billing_paymentMethod"]').val() == 'CHECKOUTCOM_CARD') {
        $('button.submit-payment').off('click touch').one('click touch', function (e) {
            var savedCard = $('.saved-payment-instrument');
            var buttonEvent = e;
            savedCard.each(function() {
                var self = $(this);
                if (self.hasClass('selected-payment') && self.find('input.saved-payment-security-code').val() == '') {
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
