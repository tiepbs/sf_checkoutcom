'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var googlePayHelper = require('~/cartridge/scripts/helpers/googlePayHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, billingData, processorId) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    
    // Verify the payload
    if (!billingData.paymentInformation.ckoGooglePayData.value || billingData.paymentInformation.ckoGooglePayData.value.length == 0) {
        serverErrors.push(
            Resource.msg('cko.googlepay.error', 'cko', null)
        );

        return {
            fieldErrors: [cardErrors],
            serverErrors: serverErrors,
            error: true
        };
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
    });

    return {
        fieldErrors: cardErrors,
        serverErrors: serverErrors,
        error: false
    };
}

/**
 * Authorizes a payment
 */
function Authorize(orderNumber, billingForm, processorId) {
    var serverErrors = [];
    var fieldErrors = {};

    // Payment request
    var success = googlePayHelper.handleRequest(
        orderNumber, 
        billingForm.googlePayForm.ckoGooglePayData.htmlValue,
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