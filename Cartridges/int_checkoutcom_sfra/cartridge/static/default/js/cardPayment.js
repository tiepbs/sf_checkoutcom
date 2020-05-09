'use strict'

// Set events on page loaded
document.addEventListener('DOMContentLoaded', function () { 
    initSavedCardSelection();
});

function initSavedCardSelection() {
    // Set the selected card uuid
    $('.saved-payment-instrument').off('click touch').on('click touch', function (e) {
        var self = $(this);
        $('input[name="selectedCardUuid"]').val(
            self.data('uuid')
        );
    });

    // Set the card cvv event
    $('.saved-payment-instrument').on('change', function (e) {
        var self = $(this);
        $('input[name="selectedCardCvv"]').val(
            self.find('input.saved-payment-security-code').val()
        );
    });
}
