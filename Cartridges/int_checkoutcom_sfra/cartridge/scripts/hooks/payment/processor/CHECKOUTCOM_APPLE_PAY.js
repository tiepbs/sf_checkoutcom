'use strict';

// API Includes
var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');

/** Utility **/
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');

exports.authorizeOrderPayment = function (order, event) {

    var condition = Object.prototype.hasOwnProperty.call(event, 'isTrusted')
    && event.isTrusted === true 
    && order;

    if (condition) {
        try {
            order.addNote('Payment Authorization Request:', 'Checkout.com Applepay');
            var paymentInstruments = order.getPaymentInstruments(
                PaymentInstrument.METHOD_DW_APPLE_PAY).toArray();
            if (!paymentInstruments.length) {
                Logger.error('Unable to find Apple Pay payment instrument for order.');
                return null;
            }
            var paymentInstrument = paymentInstruments[0];
            var PaymentMgr = require('dw/order/PaymentMgr');
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
            var paymentTransaction = paymentInstrument.getPaymentTransaction();
            paymentTransaction.setTransactionID(order.orderNo);
            paymentTransaction.setPaymentProcessor(paymentProcessor);

            // Payment request
            var result = applePayHelper.handleRequest(
                event.payment.token.paymentData,
                paymentProcessor.ID,
                order.orderNo
            );

            if (result.error) {
                throw new Error({message: 'Payment Authorization error'});
            }

            order.addNote('Payment Authorization Request:', 'Payment Authorization successful');
            return new Status(Status.OK);

        } catch (e) {
            order.addNote('Payment Authorization Request:', e.message);
            return new Status(Status.ERROR);
        }
    }

    return new Status(Status.ERROR);
};
