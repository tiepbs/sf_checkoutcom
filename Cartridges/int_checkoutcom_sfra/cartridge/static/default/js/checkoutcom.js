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
	// Hide the global form button
	$('button.submit-payment').hide();
	
	// Show the custom form button
	$('#ckoSubmitPayment').show();
	
	// Disable card validation if option not active
	$('#dwfrm_billing').submit(function(e) {
		if ($('#selectedPaymentOption').val() != 'CHECKOUTCOM_CARD') {
			e.preventDefault();
		}
	});
}

function paymentTabsState() {
	// Remove all active classes
	$('.ckoPaymentOptions .tab-pane').hide();

	// Handle the click navigation
	var allTabs = $('.payment-options a.nav-link');
	allTabs.click(function () {
		$('.ckoPaymentOptions .tab-pane').hide();
		$($(this).attr('href')).show();
		$('#selectedPaymentOption').val(
			$(this).closest('li').data('method-id')
		);
	});
	
	// Show the first active
	$('.card-tab').trigger('click');
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
