'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, paymentInformation, processorId) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var result = {
        success: false,
        cardToken: false
    };

	var logger = require('dw/system/Logger').getLogger('ckodebug');
	logger.debug('xpay {0}', JSON.stringify(paymentInformation));


    // Pre authorize the card
    if (!paymentInformation.creditCardToken) {
        result = cardHelper.preAuthorizeCard(paymentInformation, currentBasket, processorId);
        if (!result.success) {
            serverErrors.push(
                Resource.msg('error.card.information.error', 'creditCard', null)
            );

            return {
                fieldErrors: [cardErrors],
                serverErrors: serverErrors,
                error: true
            };
        }
    }

    Transaction.wrap(function () {
        // Remove existing payment instruments
        var paymentInstruments = currentBasket.getPaymentInstruments(
            processorId
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        // Create a new payment instrument
        var paymentInstrument = currentBasket.createPaymentInstrument(
            processorId, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber.value);
        paymentInstrument.setCreditCardType(paymentInformation.cardType.value);
        paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
        paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);

        // Set the card token if available
        if (result.cardToken) {
            paymentInstrument.setCreditCardToken(result.cardToken);
        }
    });

    return {
        fieldErrors: cardErrors,
        serverErrors: serverErrors,
        error: false
    };
}

/**
 * Authorizes a payment using card details
 */
function Authorize(orderNumber, billingForm, processorId) {
    var serverErrors = [];
    var fieldErrors = {};

    // Payment request
    var success = cardHelper.handleRequest(
        orderNumber,
        billingForm.creditCardFields,
        processorId
    );

    // Handle errors
    if (!success) {
        serverErrors.push(
            ckoHelper.getPaymentFailureMessage()
        );
    }

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !success
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
