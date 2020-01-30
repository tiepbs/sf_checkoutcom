'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	// Handle payment buttons state
	paymentButtonsState();

	// Handle payment tabs state
	paymentTabsState();

}, false);

function paymentButtonsState() {
    $('button.submit-payment').hide();
    $('#ckoSubmitPayment').show();
}

function paymentTabsState() {
	var allTabs = $('.payment-options a.nav-link');
	allTabs.click(function () {
		$('.credit-card-form').hide();
		$($(this).attr('href')).show();
	});
}

/**
 * Retrieves the card number from the form.
 */
function getCardData(elt, dataUrl) {
	// Get the selected card UUID
	var cardUUID = elt.options[elt.selectedIndex].value;
	if (cardUUID.length !== 0) {
		const xhr = new XMLHttpRequest();
		xhr.open('POST', dataUrl);
		xhr.onload = function() {
			if (this.status == 200) {
				var cards = JSON.parse(this.response.replace(/&quot;/g, '"'));

				// Find the corresponding card
				for (var i = 0; i < cards.length; i++) {
					if (cards[i].cardId == cardUUID) {
						setFields({
							cardId : cards[i].cardId,
							cardNumber : cards[i].cardNumber,
							cardType : cards[i].cardType,
							cardHolder : cards[i].cardHolder,
							cardType : cards[i].cardType,
							expiryMonth : cards[i].expiryMonth,
							expiryYear : cards[i].expiryYear,
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
 * Sets the card form fields from user card data.
 */
function setFields(data) {
	var $creditCard = $('[data-method="CHECKOUTCOM_CARD"]');
	$creditCard.find('input[name$="_cardPaymentForm_owner"]').val(
			data.cardHolder).trigger('change');
	$creditCard.find('input[name$="_cardPaymentForm_number"]').val(
			data.cardNumber).trigger('change');
	// enable card data formating
	setSchema('#dwfrm_cardPaymentForm_number');
	$creditCard.find('[name$="_month"]').val(data.expiryMonth)
			.trigger('change');
	$creditCard.find('[name$="_year"]').val(data.expiryYear).trigger('change');
	$creditCard.find('input[name$="_cvn"]').val('').trigger('change');
}