'use strict';

/**
 * Handle the saved card selection
 */
function savedCardSelection() {
    // Target saved card
    var savedCardItem = $('.saved-payment-instrument');

    // Set the selected card uuid
    savedCardItem.off('click touch').one('click touch', function(e) {
        var self = $(this);

        // Set the selected card uuid
        $('input[name="dwfrm_billing_savedCardForm_selectedCardUuid"]').val(
            self.data('uuid')
        );

        // Set the selected card security code event
        var cvvField = self.find('input.saved-payment-security-code');
        cvvField.off('change').one('change', function(e) {
            $('input[name="dwfrm_billing_savedCardForm_selectedCardCvv"]').val($(this).val());
        });
    });

    // Select the first item in the list
    savedCardItem.first().addClass('selected-payment');
}
