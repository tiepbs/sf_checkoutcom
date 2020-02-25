'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var OrderMgr = require('dw/order/OrderMgr');
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');

/**
 * Transaction helper.
 */
var transactionHelper = {
    /*
     * Get a parent transaction from a payment id
     */
    getParentTransaction: function (paymentId, transactionType) {
        // Prepare the payload
        var mode = ckoHelper.getValue('ckoMode');
        var ckoChargeData = {
            chargeId: paymentId
        }

        // Get the payment actions
        var paymentActions = ckoHelper.gatewayClientRequest(
            'cko.payment.actions.' + mode + '.service',
            ckoChargeData,
            'GET'
        );

        // Convert the list to array
        if (paymentActions) {
            var paymentActionsArray = paymentActions.toArray();

            // Return the requested transaction
            for (var i = 0; i < paymentActionsArray.length; i++) {
                if (paymentActionsArray[i].type == transactionType) {
                    return this.loadTransaction(paymentActionsArray[i].id);
                }
            }
        }
        
        return null;
    },

    /**
     * Load a Checkout.com transaction by Id.
     */
    loadTransaction: function (transactionId) {
        // Query the orders
        var result  = ckoHelper.getOrders();

        // Loop through the results
        for each(var item in result) {
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each(var instrument in paymentInstruments) {
                // Get the payment transaction
                var paymentTransaction = instrument.getPaymentTransaction();

                // Prepare the filter condition
                var isIdMatch = paymentTransaction.transactionID == transactionId;

                // Add the payment transaction to the output
                if (isIdMatch) {
                    return paymentTransaction;
                }
            }
        }
        
        return null;
    },

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
     * Get order transaction amount
     */
    getOrderTransactionAmount : function (order) {
        return new Money(
            order.totalGrossPrice.value.toFixed(2),
            order.getCurrencyCode()
        );
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
            var parentTransaction = this.getParentTransaction(hook.data.id, 'Authorization');
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