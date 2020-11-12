'use strict';
    /**
    * Handle the saved card selection
    */
        // Set the selected card uuid
$('.saved-payment-instrument').off('click touch').on('click touch', function(e) {
    var self = $(this);

    // Set the selected card uuid
    $('input[name="dwfrm_billing_savedCardForm_selectedCardUuid"]').val(
        self.data('uuid')
    );

    // Set the selected card security code event
    var cvvField = self.find('input.saved-payment-security-code');
    cvvField.off('change').on('change', function(e) {
        $('input[name="dwfrm_billing_savedCardForm_selectedCardCvv"]').val($(this).val());
    });
});