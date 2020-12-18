'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/** CKO Util */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');
var apmConfig = require('~/cartridge/scripts/config/ckoApmConfig');
var Site = require('dw/system/Site');

/**
 * Verifies that the payment data is valid.
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @returns {Object} The form validation result
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
    var currentBasket = basket;
    var apmErrors = {};
    var fieldErrors = {};
    var serverErrors = [];

    // Validate payment instrument
    if (paymentMethodID) { 
        var apmPaymentMethod = PaymentMgr.getPaymentMethod(paymentMethodID);

        if (!apmPaymentMethod) {
            // Invalid Payment Method
            var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
            
            return { fieldErrors: [], serverErrors: [invalidPaymentMethod], error: true };
        }
    } else {
        // Invalid Payment Type
        var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);

        return { fieldErrors: [], serverErrors: [invalidPaymentMethod], error: true };
    }

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(
            paymentMethodID
        );

        // Remove any apm payment instruments
        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        paymentInstruments = currentBasket.getPaymentInstruments(
            PaymentInstrument.METHOD_CREDIT_CARD
        );

        // Remove any credit card payment instuments
        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            paymentMethodID, currentBasket.totalGrossPrice
        );

        paymentInstrument.custom.ckoPaymentData = JSON.stringify(paymentInformation);
    });

    return { fieldErrors: apmErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using an apm. Customizations may use other processors and custom
 *      logic to authorize apm payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    // Get the order
    var order = OrderMgr.getOrder(orderNumber);
    var formData = JSON.parse(paymentInstrument.custom.ckoPaymentData);

    // Prepare the arguments
    var args = {
        order: order,
        processorId: paymentProcessor.ID,
        paymentData: formData
    };

    // Get the selected APM request data
    var func = paymentInstrument.paymentMethod.toLowerCase() + 'Authorization';
    var apmConfigData = apmConfig[func](args);

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
        paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        paymentInstrument.custom.ckoPaymentData = "";
    });

    try {
        var ckoPaymentRequest = apmHelper.handleRequest(apmConfigData, paymentProcessor.ID, orderNumber);

        // Handle errors
        if (ckoPaymentRequest === '' || ckoPaymentRequest === undefined || ckoPaymentRequest.error) {
            throw new Error(ckoHelper.getPaymentFailureMessage());
        }

        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, redirectUrl: ckoPaymentRequest.redirectUrl };

    } catch (e) {
        error = true;
        serverErrors.push(
            e.message
        );
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, redirectUrl: false };
    }
}

exports.Handle = Handle;
exports.Authorize = Authorize;
