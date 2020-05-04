'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var googlePayHelper = require('~/cartridge/scripts/helpers/googlePayHelper');

/**
 * Google Pay Handle hook
 */
function Handle(basket, paymentInformation) {

	var logger = require('dw/system/Logger').getLogger('ckodebug');
	logger.debug('this is my test {0}', JSON.stringify(paymentInformation));

    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var cardIsValid = false;

    // Get the card data
    var cardData = cardHelper.buildCardData(paymentInformation); 
    session.custom.cardData = cardData;
    session.custom.basket = basket;
    session.custom.processorId = 'CHECKOUTCOM_CARD';

    // Pre authorize the card
    if (!paymentInformation.creditCardToken) {
        cardIsValid = cardHelper.preAuthorizeCard(cardData);
        if (!cardIsValid) {
            serverErrors.push(
                Resource.msg('error.card.information.error', 'creditCard', null)
            );

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }
    }

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(
            'CHECKOUTCOM_CARD'
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            'CHECKOUTCOM_CARD', currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardData.cardNumber);
        paymentInstrument.setCreditCardType(cardData.cardType);
        paymentInstrument.setCreditCardExpirationMonth(cardData.expiryMonth);
        paymentInstrument.setCreditCardExpirationYear(cardData.expiryYear);
        paymentInstrument.setCreditCardToken(
            paymentInformation.creditCardToken
                ? paymentInformation.creditCardToken
                : createToken()
        );
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false};
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    var paymentResonse = cardHelper.handleCardRequest(orderNumber);

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
