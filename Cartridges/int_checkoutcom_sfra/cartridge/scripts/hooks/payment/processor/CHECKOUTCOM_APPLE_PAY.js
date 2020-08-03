'use strict';

var Resource = require('dw/web/Resource');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');

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
    var ckoApplePayData = billingData.paymentInformation.ckoApplePayData ? billingData.paymentInformation.ckoApplePayData.value : null;

    // Verify the payload
    if (!ckoApplePayData) {
    // Verify the payload
    if (!billingData.paymentInformation.ckoApplePayData.value || billingData.paymentInformation.ckoApplePayData.value.length === 0) {
        serverErrors.push(
            Resource.msg('cko.applepay.error', 'cko', null)
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
    var success = applePayHelper.handleRequest(
        billingForm.applePayForm.ckoApplePayData.htmlValue,
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
