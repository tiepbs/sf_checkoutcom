'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var googlePayHelper = require('~/cartridge/scripts/helpers/googlePayHelper');

/**
 * Google Pay Handle hook
 */
function Handle(basket, paymentInformation, processorId) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];

    // Get the payment data data
    session.custom.basket = basket;

    // Verify the payload
    if (!paymentInformation.ckoGooglePayData || paymentInformation.ckoGooglePayData.length == 0) {
        serverErrors.push(
            Resource.msg('error.card.information.error', 'creditCard', null)
        );

        return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true};
    }

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(
            processorId
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            processorId, currentBasket.totalGrossPrice
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
function Authorize(orderNumber, processorId) {
    var serverErrors = [];
    var fieldErrors = {};
    var paymentResponse = googlePayHelper.handleRequest(orderNumber, processorId);

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: paymentResponse
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;