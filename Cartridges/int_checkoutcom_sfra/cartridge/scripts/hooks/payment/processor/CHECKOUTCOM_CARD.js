'use strict';

var Resource = require('dw/web/Resource');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, billingData, processorId, req) {
    var fieldErrors = {};
    var serverErrors = [];
    var customerNo = null;

    // Pre authorize the card
    if (!billingData.selectedCardUuid) {
        // Prepare the customer number
        var condition = req.hasOwnProperty('currentCustomer')
        && req.currentCustomer.hasOwnProperty('profile')
        && req.currentCustomer.profile.hasOwnProperty('customerNo');
        if (condition) {
            customerNo = req.currentCustomer.profile.customerNo;
        }
    }

    return {
        fieldErrors: fieldErrors,
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
    var result = {
        error: false,
        redirectUrl: false
    };

    // Payment request
    result = cardHelper.handleRequest(
        billingForm,
        processorId,
        orderNumber
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
        error: result.error,
        redirectUrl: result.redirectUrl
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;