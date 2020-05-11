'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, billingData, processorId, req) {
    var currentBasket = basket;
    var fieldErrors = {};
    var serverErrors = [];
    var success = true; 

    // Pre authorize the card
    if (!billingData.selectedCardUuid) {
        success = cardHelper.preAuthorizeCard(
            billingData,
            currentBasket,
            req.currentCustomer.profile.customerNo,
            processorId
        );
    }

    if (!success) {
        serverErrors.push(
            Resource.msg('error.card.information.error', 'creditCard', null)
        );
    }

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !success
    };
}

/**
 * Authorizes a payment using card details
 */
function Authorize(orderNumber, billingForm, processorId) {
    var serverErrors = [];
    var fieldErrors = {};
    var result = {
        error: false,
        redirectUrl: false
    };

    // Payment request
    result = cardHelper.handleRequest(
        orderNumber,
        billingForm,
        processorId
    );

    // Handle errors
    if (result.error) {
        serverErrors.push(
            ckoHelper.getPaymentFailureMessage()
        );
    }
   
    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !result.error,
        redirectUrl: result.redirectUrl
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;