'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');

/**
 * Transaction helper.
 */
var transactionHelper = {
    /*
     * Create an authorization transaction
     */
    createAuthorization: function (paymentMethodId, gatewayResponse, order) {
        // Create a new payment instrument
        var paymentInstrument = order.createPaymentInstrument(paymentMethodId, order.totalGrossPrice);
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();

        // Create the authorization transaction
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.setAmount(this.getOrderTransactionAmount(order));
            paymentInstrument.paymentTransaction.transactionID = gatewayResponse.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = gatewayResponse.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
        });

        return paymentInstrument;
    },

    /*
     * Create a capture transaction
     */
    createCapture: function (hook) {
        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;

        // Update the parent transaction state
        var parentTransaction = this.getParentTransaction(hook.data.id, 'Authorization');
        parentTransaction.custom.ckoTransactionOpened = false;

        // Create the payment instrument and processor
        var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, order.totalGrossPrice);
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();

        Transaction.wrap(function () {
            // Create the transaction
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Capture';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CAPTURE);
        });
    },

    /*
     * Create a refund transaction
     */
    createRefund: function (hook) {
        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;
 
        // Create the refunded transaction
        Transaction.wrap(function () {
            // Update the parent transaction state
            var parentTransaction = this.getParentTransaction(hook.data.id, 'Capture');
            parentTransaction.custom.ckoTransactionOpened = false;
            
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, order.totalGrossPrice);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = false;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Refund';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CREDIT);
        });
    },

    /*
     * Create a void transaction
     */
    createVoid: function (hook) {
        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;
               
        // Create the voided transaction
        Transaction.wrap(function () {
            // Update the parent transaction state
            var parentTransaction = ckoHelper.getParentTransaction(hook.data.id, 'Authorization');
            parentTransaction.custom.ckoTransactionOpened = false;
            
            // Create the transaction
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, order.totalGrossPrice);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = false;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Void';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH_REVERSAL);
        });
    }
};

/*
 * Module exports
 */

module.exports = transactionHelper;