'use strict'

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
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
