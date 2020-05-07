'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken() {
    return Math.random().toString(36).substr(2);
}

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, billingData, processorId, req) {
    var currentBasket = basket;
    var customerId = (req.currentCustomer.profile.customerNo) ? req.currentCustomer.profile.customerNo : null;
    var cardErrors = {};
    var serverErrors = [];
    var result = {
        success: false,
        cardToken: false
    };
    
    var savedCard = cardHelper.getSavedCard(billingData.paymentInformation.storedPaymentUUID, customerId);
    logger.debug('zomi2 {0}', JSON.stringify(savedCard));

    // Pre authorize the card
    if (!billingData.paymentInformation.creditCardToken) {
        result = cardHelper.preAuthorizeCard(billingData.paymentInformation, currentBasket, processorId);
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

        paymentInstrument.setCreditCardNumber(billingData.paymentInformation.cardNumber.value);
        paymentInstrument.setCreditCardType(billingData.paymentInformation.cardType.value);
        paymentInstrument.setCreditCardExpirationMonth(billingData.paymentInformation.expirationMonth.value);
        paymentInstrument.setCreditCardExpirationYear(billingData.paymentInformation.expirationYear.value);

        // Save the card source id if needed
        if (result.cardToken && JSON.parse(billingData.saveCard) === true) {
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
exports.createToken = createToken;
