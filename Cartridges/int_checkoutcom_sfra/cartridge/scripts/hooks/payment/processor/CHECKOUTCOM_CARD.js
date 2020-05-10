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
function Handle(basket, billingData, processorId, req) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var result = {error: false}; 

    // Pre authorize the card
    if (!billingData.selectedCardUuid) {
        result = cardHelper.preAuthorizeCard(
            billingData.paymentInformation,
            currentBasket,
            req.currentCustomer.profile.customerNo,
            processorId
        );
    }

    if (result.error) {
        serverErrors.push(
            Resource.msg('error.card.information.error', 'creditCard', null)
        );
    }

    return {
        fieldErrors: [cardErrors],
        serverErrors: serverErrors,
        error: result.error
    };
}

/**
 * Authorizes a payment using card details
 */
function Authorize(orderNumber, billingForm, processorId) {
    var serverErrors = [];
    var fieldErrors = {};
    var success = false;
 
    // Payment request
    success = cardHelper.handleRequest(
        orderNumber,
        billingForm,
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