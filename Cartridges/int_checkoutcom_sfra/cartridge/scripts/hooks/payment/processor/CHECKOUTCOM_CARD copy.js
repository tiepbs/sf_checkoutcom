'use strict';

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var Site = require('dw/system/Site');

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

    // Payment request
    var result = cardHelper.handleRequest(
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

function createToken(paymentData, req) {
    // Prepare the parameters
    var requestData = {
        type: 'card',
        number: paymentData.cardNumber.toString(),
        expiry_month: paymentData.expirationMonth,
        expiry_year: paymentData.expirationYear,
        name: paymentData.name
    };

    // Perform the request to the payment gateway - get the card token
    var tokenResponse = ckoHelper.gatewayClientRequest(
        'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
        JSON.stringify(requestData)
    );
    
    if(tokenResponse && tokenResponse != 400) {
        requestData = {
            source: {
                type: "token",
                token: tokenResponse.token
            },
            currency: Site.getCurrent().getCurrencyCode(),
            risk: { enabled: false },
            billing_descriptor: ckoHelper.getBillingDescriptor()
        }
    }

    var idResponse = ckoHelper.gatewayClientRequest(
        'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
        requestData
    );

    if(idResponse && idResponse != 400) {
        return idResponse.source.id;
    }

    
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
