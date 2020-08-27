var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');


'use strict';

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');

exports.authorizeOrderPayment = function (order) {


    // Payment request
    /*
    var result = applePayHelper.handleRequest(
        billingForm.applePayForm.ckoApplePayData.htmlValue,
        processorId,
        orderNumber
    );
     */




    order.addNote('Payment Authorization Warning!', 'This is a dummy ' +
      'authorizeOrderPayment hook implementation. Please disable it to use ' +
      'the built-in PSP API, or implement the necessary calls to the ' +
      'Payment Provider for authorization.');
    var paymentInstruments = order.getPaymentInstruments(
        PaymentInstrument.METHOD_DW_APPLE_PAY).toArray();
    if (!paymentInstruments.length) {
        Logger.error('Unable to find Apple Pay payment instrument for order.');
        return null;
    }
    var paymentInstrument = paymentInstruments[0];
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    paymentTransaction.setTransactionID('DUMMY-APPLEPAY-PSP-TRANSACTION-ID');
    return new Status(Status.OK);
};


exports.getRequest = function (basket, req) {

    var logger = require('dw/system/Logger').getLogger('ckodebug');
    logger.debug('AP request 1 {0}', JSON.stringify(req));
    

    session.custom.applepaysession = 'yes';   // eslint-disable-line
};
