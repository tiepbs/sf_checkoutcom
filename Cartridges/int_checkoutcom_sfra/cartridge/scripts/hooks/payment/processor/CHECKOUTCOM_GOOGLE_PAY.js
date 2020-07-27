'use strict';

var Resource = require('dw/web/Resource');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var googlePayHelper = require('~/cartridge/scripts/helpers/googlePayHelper');

/**
 * Verifies that the payment data is valid.
 * @param {Object} basket The basket instance
 * @param {Object} billingData The billing data
 * @param {string} processorId The processor id
 * @param {Object} req The HTTP request data
 * @returns {Object} The form validation result
 */
function Handle(basket, billingData, processorId, req) {
    var cardErrors = {};
    var serverErrors = [];

    // Verify the payload
    if (!billingData.paymentInformation.ckoGooglePayData.value || billingData.paymentInformation.ckoGooglePayData.value.length === 0) {
        serverErrors.push(
            Resource.msg('cko.googlepay.error', 'cko', null)
        );

        return {
            fieldErrors: [cardErrors],
            serverErrors: serverErrors,
            error: true,
        };
    }

    return {
        fieldErrors: cardErrors,
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

    // Payment request
    var success = googlePayHelper.handleRequest(
        billingForm.googlePayForm.ckoGooglePayData.htmlValue,
        processorId,
        orderNumber
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
        error: !success,
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
