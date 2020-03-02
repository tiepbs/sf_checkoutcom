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
    },

    /**
     * Get the Checkout.com orders.
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
                if (this.isCkoItem(instrument.paymentMethod) && !this.containsObject(item, data)) {
                    data.push(item);
                }
            }
        }

        return data;
    },

    /**
     * Get the Checkout.com transactions.
     */
    getCkoTransactions: function () {
        // Prepare the output array
        var data = [];

        // Query the orders
        var result  = this.getCkoOrders();

        // Loop through the results
        var i = 1;
        for each(var item in result) {
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each(var instrument in paymentInstruments) {
                // Get the payment transaction
                var paymentTransaction = instrument.getPaymentTransaction();

                // Add the payment transaction to the output
                if (!this.containsObject(paymentTransaction, data) && this.isTransactionNeeded(paymentTransaction, instrument)) {
                    // Build the row data
                    var row = {
                        id: i,
                        order_no: item.orderNo,
                        transaction_id: paymentTransaction.transactionID,
                        payment_id: paymentTransaction.custom.ckoPaymentId,
                        opened: paymentTransaction.custom.ckoTransactionOpened,
                        amount: paymentTransaction.amount.value,
                        currency: paymentTransaction.amount.currencyCode,
                        creation_date: paymentTransaction.getCreationDate().toDateString(),
                        type: paymentTransaction.type.displayValue,
                        processor: this.getProcessorId(instrument)
                    };
                    
                    // Add the transaction
                    data.push(row);
                    i++;
                }
            }
        }
        
        return data;
    },

    /**
     * Checks if a transaction should be returned in the reaults.
     */
    isTransactionNeeded: function (paymentTransaction, paymentInstrument) {
        // Get an optional transaction id
        var tid = request.httpParameterMap.get('tid').stringValue;

        // Return true only if conditions are met
        var condition1 = (tid && paymentTransaction.transactionID == tid) || !tid;
        var condition2 = this.isCkoItem(paymentInstrument.paymentMethod);
        var condition3 = this.isCkoItem(this.getProcessorId(paymentInstrument));
        var condition4 = paymentTransaction.custom.ckoPaymentId !==null && paymentTransaction.custom.ckoPaymentId != '';
        var condition5 = paymentTransaction.transactionID && paymentTransaction.transactionID != '';

        if (condition1 && condition2 && condition3 && condition4 && condition5) {
            return true;
        }

        return false;
    },

    /**
     * Checks if a payment instrument is Checkout.com.
     */
    isCkoItem: function (item) {
        return item.length > 0 && item.indexOf('CHECKOUTCOM_') >= 0;
    },

    /**
     * Get the processor ID for a payment instrument.
     */
    getProcessorId: function (instrument) {
        var paymentMethod = PaymentMgr.getPaymentMethod(instrument.getPaymentMethod());
        if (paymentMethod) {
            return paymentMethod.getPaymentProcessor().getID();
        } else {
            return '';
        }
    },
    
    /**
     * Checks if an object already exists in an array.
     */
    containsObject: function (obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true;
            }
        }

        return false;
    }
};

/*
 * Module exports
 */

module.exports = transactionHelper;