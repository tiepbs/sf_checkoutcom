'use strict';

var Resource = require('dw/web/Resource');
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');
var apmConfig = require('~/cartridge/scripts/config/ckoApmConfig');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, billingData, processorId, req) {
    var fieldErrors = {};
    var serverErrors = [];

    // Conditions
    var condition1 = Object.prototype.hasOwnProperty.call(billingData.paymentInformation, 'ckoApm');
    var condition2 = condition1 && billingData.paymentInformation.ckoApm.value;
    var condition3 = condition2 && billingData.paymentInformation.ckoApm.value.length > 0;

    // Verify the payload
    if (!condition3) {
        serverErrors.push(
            Resource.msg('cko.apm.error', 'cko', null)
        );

        return {
            fieldErrors: fieldErrors,
            serverErrors: serverErrors,
            error: true,
        };
    }

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: false,
    };
}

/**
 * Authorizes a payment
 */
function Authorize(orderNumber, billingForm, processorId, req) {
    var serverErrors = [];
    var fieldErrors = {};
    var result = {
        error: false,
        redirectUrl: false,
    };

    // Get the order
    var order = OrderMgr.getOrder(orderNumber);

    // Prepare the arguments
    var args = {
        order: order,
        processorId: processorId,
        paymentData: billingForm.apmForm,
        req: req,
    };

    // Get the selected APM request data
    var func = billingForm.apmForm.ckoSelectedApm.value.toString() + 'Authorization';
    var apmConfigData = apmConfig[func](args);

    // Payment request
    var result = apmHelper.handleRequest(
        apmConfigData,
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
        redirectUrl: result.redirectUrl,
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
