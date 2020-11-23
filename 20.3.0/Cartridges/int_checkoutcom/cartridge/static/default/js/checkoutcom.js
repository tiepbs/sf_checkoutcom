'use strict';

// jQuery Ajax helpers on DOM ready
document.addEventListener('DOMContentLoaded', function() {

    // Retrieve the card list
    getCardsList();
}, false);

/**
 * Get the user cards list
 */
function getCardsList() {
    // Get the card lsit url
    var cardUrl = $('[id="ckoCardListUrl"]').val();
    if (cardUrl) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', cardUrl);
        xhr.onload = function() {
            if (this.status === 200) {

                // Cleanup the response
                var cards = JSON.parse(this.response.replace(/&quot;/g,'"'));

                // Show the card selector if there are cards
                if (cards.length > 0) {
                    $('[id="ckoCardSelector"]').show();
                }

                // Add the cards to the select list
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].cardNumber) {
                        $('[id="ckoCreditCardList"]').append($('<option/>', {
                            value: cards[i].cardId,
                            text: cards[i].cardNumber,
                        }));
                    }
                }
            }
        };
        xhr.send();
    }
}

/**
 * Retrieves the card number from the form
 */
function getCardData(elt, dataUrl) {

    // Get the selected card UUID
    var cardUUID = elt.options[elt.selectedIndex].value;
    if (cardUUID.length !== 0) {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', dataUrl);
        xhr.onload = function() {
            if (this.status === 200) {
                var cards = JSON.parse(this.response.replace(/&quot;/g,'"'));

                // Find the corresponding card
                for (var i = 0; i < cards.length; i++) {
                    if (cards[i].cardId === cardUUID) {
                        setFields({
                            cardId: cards[i].cardId,
                            cardNumber: cards[i].cardNumber,
                            cardType: cards[i].cardType,
                            cardHolder: cards[i].cardHolder,
                            cardType: cards[i].cardType,
                            expiryMonth: cards[i].expiryMonth,
                            expiryYear: cards[i].expiryYear,
                        });

                        // Break the loop
                        return;
                    }
                }
            }
        };
        xhr.send();
    }
}

/**
 * Sets the card form fields from user card data
 */
function setFields(data)
{
    var $creditCard = $('[data-method="CREDIT_CARD"]');
    $creditCard.find('input[name$="_creditCard_owner"]').val(data.cardHolder).trigger('change');
    $creditCard.find("input[name$= " + $('.number :input').attr('id') + "]").val(data.cardNumber).trigger('change');

    // enable card data formating
    setSchema('#' + $('.number :input').attr('id'));
    $creditCard.find('[name$="_month"]').val(data.expiryMonth).trigger('change');
    $creditCard.find('[name$="_year"]').val(data.expiryYear).trigger('change');
    $creditCard.find('input[name$="_cvn"]').val('').trigger('change');
}