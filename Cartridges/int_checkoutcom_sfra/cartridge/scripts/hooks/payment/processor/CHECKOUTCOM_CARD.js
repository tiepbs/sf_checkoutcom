'use strict';

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

/**
 * Verifies that the payment data is valid.
 * @param {Object} basket The basket instance
 * @param {Object} billingData The billing data
 * @param {string} processorId The processor id
 * @param {Object} req The HTTP request data
 * @returns {Object} The form validation result
 */
function Handle(basket, billingData, processorId, req) {
    var fieldErrors = {};
    var serverErrors = [];

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: false,
    };
}

/**
 * Authorizes a payment.
 * @param {Object} orderNumber The order number
 * @param {Object} billingForm The billing data
 * @param {string} processorId The processor id
 * @param {Object} req The HTTP request data
 * @returns {Object} The payment result
 */
function Authorize(orderNumber, billingForm, processorId, req) {
    var serverErrors = [];
    var fieldErrors = {};
    var result = {
        error: false,
        redirectUrl: false,
    };

    // Payment request
    result = cardHelper.handleRequest(
        billingForm,
        processorId,
        orderNumber,
        req
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
        redirectUrl: result.redirectUrl,
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
