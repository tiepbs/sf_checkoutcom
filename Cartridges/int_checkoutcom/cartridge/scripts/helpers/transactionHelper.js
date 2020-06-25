'use strict';

// API Includes 
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');

// Utility 
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

// Transaction helper.
var transactionHelper = {

    /**
     * Get order transaction amount
     */
    getOrderTransactionAmount : function (order) {

        return new Money(
            order.totalGrossPrice.value.toFixed(2),
            order.getCurrencyCode()
        );
    },

    /**
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

    /**
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

    /**
     * Get the Checkout.com orders
     */
    getCkoOrders: function () {

        // Prepare the output array
        var data = [];
    
        // Query the orders
        var result  = SystemObjectMgr.querySystemObjects('Order', '', 'creationDate desc');
        
        // Loop through the results
        for each(var item in result) {
        	
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each(var instrument in paymentInstruments) {
                if (ckoHelper.isCkoItem(instrument.paymentMethod) && !this.containsObject(item, data)) {
                    data.push(item);
                }
            }
        }

        return data;
    },

    /**
     * Get the Checkout.com transactions
     */
    loadTransactionById: function (transactionId) {

        // Query the orders
        var result  = ckoHelper.getCkoOrders();

        // Loop through the results
        for each(var item in result) {
        	
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each(var instrument in paymentInstruments) {
            	
                // Get the payment transaction
                var paymentTransaction = instrument.getPaymentTransaction();

                // Add the payment transaction to the output
                if (transactionId = paymentTransaction.transactionID) {
                    return paymentTransaction;
                }
            }
        }
        
        return null;
    },

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
     * Load a transaction by Id
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

    shouldCloseRefund: function (order) {
        // Prepare the totals
        var totalRefunded = 0;
        var totalCaptured = 0;
    
        // Get the payment instruments
        var paymentInstruments = order.getPaymentInstruments();
    
        // Loop through the payment instruments
        for each(var instrument in paymentInstruments) {
            // Get the payment transaction
            var paymentTransaction = instrument.getPaymentTransaction();
    
            // Calculate the total refunds
            if (paymentTransaction.type.toString() == PaymentTransaction.TYPE_CREDIT) {
                totalRefunded += parseFloat(paymentTransaction.amount.value);
            }
    
            // Calculate the total captures
            if (paymentTransaction.type.toString() == PaymentTransaction.TYPE_CAPTURE) {
                totalCaptured += parseFloat(paymentTransaction.amount.value);
            }
        }
      
        // Check if a refund is possible
        return totalRefunded >= totalCaptured;
    }
};

// Module exports
module.exports = transactionHelper;