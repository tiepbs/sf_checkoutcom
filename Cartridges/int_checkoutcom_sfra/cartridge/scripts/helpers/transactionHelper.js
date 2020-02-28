'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Transaction helper.
 */
var transactionHelper = {
    /*
     * Get order transaction amount
     */
    getOrderTransactionAmount : function (order) {
        return new Money(
            order.totalGrossPrice.value.toFixed(2),
            order.getCurrencyCode()
        );
    },

    /*
     * Get webhook transaction amount
     */
    getHookTransactionAmount : function (hook) {
        var divider = ckoHelper.getCkoFormatedValue(hook.data.currency);
        var amount = parseInt(hook.data.amount) / divider;
        return new Money(
            amount,
            hook.data.currency
        );
    },

    /*
     * Create an authorization transaction
     */
    createAuthorization: function (hook) {
        // Get the transaction amount
        var transactionAmount = this.getHookTransactionAmount(hook);

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;
        
        Transaction.wrap(function () {
            // Create the payment instrument and processor
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();

            // Create the authorization transaction
            paymentInstrument.paymentTransaction.setAmount(transactionAmount);
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
        });
    },

    /*
     * Create a capture transaction
     */
    createCapture: function (hook) {
        // Get the transaction amount
        var transactionAmount = this.getHookTransactionAmount(hook);

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;

        Transaction.wrap(function () {
            // Create the payment instrument and processor
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();

            // Create the transaction
            paymentInstrument.paymentTransaction.setAmount(transactionAmount);
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Capture';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CAPTURE);
        });
    },

    /*
     * Create a refund transaction
     */
    createRefund: function (hook) {
        // Get the transaction amount
        var transactionAmount = this.getHookTransactionAmount(hook);

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;
        
        Transaction.wrap(function () {
            // Create the payment instrument and processor
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();

            // Create the refunded transaction
            paymentInstrument.paymentTransaction.setAmount(transactionAmount);
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = false;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Refund';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CREDIT);
        });
    },

    /*
     * Create a void transaction
     */
    createVoid: function (hook) {
        // Get the transaction amount
        var transactionAmount = this.getHookTransactionAmount(hook);

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;
               
        Transaction.wrap(function () {
            // Create the payment instrument and processor
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();

            // Create the voided transaction
            paymentInstrument.paymentTransaction.setAmount(transactionAmount);
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
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