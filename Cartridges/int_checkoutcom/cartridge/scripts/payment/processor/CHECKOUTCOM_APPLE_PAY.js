var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');

exports.authorizeOrderPayment = function (order, event) {
    var condition = Object.prototype.hasOwnProperty.call(event, 'isTrusted')
    && event.isTrusted === true
    && order;

    if (condition) {

        // Preparing payment parameters
        var paymentInstruments = order.getPaymentInstruments(
        PaymentInstrument.METHOD_DW_APPLE_PAY).toArray();

        if (!paymentInstruments.length) {
            Logger.error('Unable to find Apple Pay payment instrument for order.');
            return null;
        }
        var paymentInstrument = paymentInstruments[0];

        // Add order number to the session global object
        // eslint-disable-next-line
        session.privacy.ckoOrderId = order.orderNo;

        // Add the payload data
        paymentInstrument.paymentTransaction.custom.ckoApplePayData = event.payment.token.paymentData;

        // Make the charge request
        var chargeResponse = applePayHelper.handleRequest(
            event.payment.token.paymentData,
            'CHECKOUTCOM_APPLE_PAY',
            order.orderNo
        );
        if (chargeResponse) {
            // Create the authorization transaction
            Transaction.wrap(function() {
                paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
                paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
                paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
                paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
                paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
            });

            return new Status(Status.OK);
        }
    }
};