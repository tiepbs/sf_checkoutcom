'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, paymentInformation, processorId) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];

    // Prepare the payment data
    session.custom.paymentData = paymentInformation.ckoApm;
    
    // Verify the payload
    if (!paymentInformation.ckoApm.value || paymentInformation.ckoApm.value.length == 0) {
        serverErrors.push(
            Resource.msg('cko.apm.error', 'cko', null)
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
function Authorize(orderNumber, processorId) {
    var serverErrors = [];
    var fieldErrors = {};

    var logger = require('dw/system/Logger').getLogger('ckodebug');
    logger.debug('authapm {0}', JSON.stringify(session.custom.paymentData));

    // Payment request
    var success = apmHelper.handleRequest(orderNumber, processorId);

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !success
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;