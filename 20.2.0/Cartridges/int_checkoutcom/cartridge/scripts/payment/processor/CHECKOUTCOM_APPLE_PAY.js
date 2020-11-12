var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var PaymentMgr = require('dw/order/PaymentMgr');

exports.authorizeOrderPayment = function (order, event) {
    var condition = Object.prototype.hasOwnProperty.call(event, 'isTrusted')
    && event.isTrusted === true
    && order;

    if (condition) {

        // Payment request
        var result = applePayHelper.handleRequest(
            event.payment.token.paymentData,
            'CHECKOUTCOM_APPLE_PAY',
            order.orderNo
        );

        if (result) {
            return new Status(Status.OK);
        } else {
            return new Status(Status.ERROR);
        }

    }
};

exports.placeOrder = function (order) {

    var paymentInstruments = order.getPaymentInstruments(
        PaymentInstrument.METHOD_DW_APPLE_PAY).toArray();

    var paymentInstrument = paymentInstruments[0];
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    paymentTransaction.setTransactionID('#');

    // Get Previews Notes and Remove them
    var orderNotes = order.getNotes();

    // Remove sfcc notes
    if (orderNotes.length > 0) {
        for (var i = 0; i < orderNotes.length; i ++) {
            var currentNote = orderNotes.get(i);
            var subject = currentNote.subject;
            if (subject == "Payment Authorization Warning!") {
                order.removeNote(currentNote);
            }
        }
    }
    
    // Get Previews Notes and Remove them
    var orderNotes = order.getNotes();

    var placeOrderStatus = OrderMgr.placeOrder(order);
    if (placeOrderStatus === Status.ERROR) {
        OrderMgr.failOrder(order);
        throw new Error('Failed to place order.');
    }
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
};
