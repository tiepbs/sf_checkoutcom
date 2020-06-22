'use strict';

// API Includes
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var PaymentMgr = require('dw/order/PaymentMgr');

<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
/* Checkout.com Helper functions */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var savedCardHelper = require('~/cartridge/scripts/helpers/savedCardHelper');
var transactionHelper = require('~/cartridge/scripts/helpers/transactionHelper');

/**
 * Gateway event functions for the Checkout.com cartridge integration.
 */
var eventsHelper = {
=======
// Checkout.com Helper functions
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var transactionHelper = require('~/cartridge/scripts/helpers/transactionHelper');

// Gateway event functions for the Checkout.com cartridge integration.
var eventsHelper = {

>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
    /**
     * Adds the gateway webhook information to the newly created order
     */
    addWebhookInfo: function (hook, paymentStatus, orderStatus) {

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);
        if (order) {

            // Prepare the webhook info
            var details = '';
            details += ckoHelper._('cko.webhook.event', 'cko') + ': ' + hook.type + '\n';
            details += ckoHelper._('cko.transaction.id', 'cko') + ': ' + hook.data.action_id + '\n';
            details += ckoHelper._('cko.transaction.paymentId', 'cko') + ': ' + hook.data.id + '\n';
            details += ckoHelper._('cko.transaction.eventId', 'cko') + ': ' + hook.id + '\n';
            details += ckoHelper._('cko.response.code', 'cko') + ': ' + hook.data.response_code + '\n';

            // Process the transaction
            Transaction.wrap(function () {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
                // Add the details to the order
                order.addNote(ckoHelper._('cko.webhook.info', 'cko'), details);
    
=======

                // Add the details to the order
                order.addNote(ckoHelper._('cko.webhook.info', 'cko'), details);

>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
                // Update the payment status
                if (paymentStatus) {
                    order.setPaymentStatus(order[paymentStatus]);
                }

                // Update the order status
                if ((orderStatus) && (orderStatus.indexOf("CANCELLED") != -1 || orderStatus.indexOf("FAILED") != -1)) {
                    OrderMgr.failOrder(order);
                }
            });
        }
    },

    /**
     * Payment captured event
     */
    paymentCaptured: function (hook) {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
        // Get the  transaction amount
        var transactionAmount = transactionHelper.getHookTransactionAmount(hook);
=======
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js

        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', null);

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;

<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
=======
        // Get the  transaction amount
        var transactionAmount = transactionHelper.getHookTransactionAmount(hook);

>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
        // Create the captured transaction
        Transaction.wrap(function () {
            // Create the transaction
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Capture';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CAPTURE);

            // Update the parent transaction state
            var parentTransaction = transactionHelper.getParentTransaction(hook.data.id, 'Authorization');
            if (parentTransaction) {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
                parentTransaction.custom.ckoTransactionOpened = false;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
=======
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
                parentTransaction.custom.ckoTransactionOpened = false;
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
            }
        });
    },

    /**
     * Payment authorized event
     */
    paymentApproved: function (hook) {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
=======

>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', null);

        // Create the authorized transaction
        transactionHelper.createAuthorization(hook);

<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
        // Save the card if needed
        savedCardHelper.updateSavedCard(hook);
    },

    /**
     * Card verified event.
=======
        // Handle card saving
        var cardUuid = hook.data.metadata.card_uuid;
        var customerId = hook.data.metadata.customer_id;
        var processorId = hook.data.metadata.payment_processor;
        if (cardUuid != 'false' && customerId) {

            // Load the saved card
            var savedCard = cardHelper.getSavedCard(
                cardUuid,
                customerId,
                processorId
            );

            if (savedCard) {

                // Add the card source
                Transaction.wrap(function () {
                    savedCard.setCreditCardToken(hook.data.source.id);
                });
            }
        }
    },

    /**
     * Card verified event
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
     */
    cardVerified: function (hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', null);
    },

    /**
     * Authorization failed event
     */
    paymentDeclined: function (hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js

        // Delete the card if needed
        savedCardHelper.updateSavedCardhook();
=======
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
    },

    /**
     * Capture failed event
     */
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
    paymentCaptureDeclined: function (hook) {
=======
    paymentCapturedDeclined: function (hook) {
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },

    /**
     * Payment refunded event
     */
    paymentRefunded: function (hook) {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
        // Get the  transaction amount
        var transactionAmount = transactionHelper.getHookTransactionAmount(hook);
=======
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js

        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', 'ORDER_STATUS_CANCELLED');

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;

        // Get the  transaction amount
        var transactionAmount = transactionHelper.getHookTransactionAmount(hook);

        // Create the refunded transaction
        Transaction.wrap(function () {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
=======

            // Create the transaction
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = false;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Refund';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_CREDIT);

            // Update the parent transaction state
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
            var parentTransaction = transactionHelper.getParentTransaction(hook.data.id, 'Capture');
            if (parentTransaction) {
                parentTransaction.custom.ckoTransactionOpened = !transactionHelper.shouldCloseRefund(order);
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
=======
            var parentTransaction = transactionHelper.getParentTransaction(hook.data.id, 'Authorization');
            if (parentTransaction) {
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
                parentTransaction.custom.ckoTransactionOpened = !transactionHelper.shouldCloseRefund(transactionAmount);
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
            }
        });
    },

    /**
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
     * Payment voided event.
     */
    paymentVoided: function (hook) {
        // Get the  transaction amount
        var transactionAmount = transactionHelper.getHookTransactionAmount(hook);
=======
     * Payment voided event
     */
    paymentVoided: function (hook) {
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js

        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_CANCELLED');

        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);

        // Get the payment processor id
        var paymentProcessorId = hook.data.metadata.payment_processor;

        // Get the  transaction amount
        var transactionAmount = transactionHelper.getHookTransactionAmount(hook);

        // Create the voided transaction
        Transaction.wrap(function () {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
=======

>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
            // Create the transaction
            var paymentInstrument = order.createPaymentInstrument(paymentProcessorId, transactionAmount);
            var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod).getPaymentProcessor();
            paymentInstrument.paymentTransaction.transactionID = hook.data.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = hook.data.id;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = false;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Void';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH_REVERSAL);

            // Update the parent transaction state
            var parentTransaction = transactionHelper.getParentTransaction(hook.data.id, 'Authorization');
            if (parentTransaction) {
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
                parentTransaction.custom.ckoTransactionOpened = false;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
            }    
        });
    },

    /**
     * Payment pending event.
     */
    paymentPending: function (hook) {
        this.addWebhookInfo(hook, null, null);
    },

    /**
     * Payment expired event.
     */
    paymentExpired: function (hook) {
        this.addWebhookInfo(hook, null, null);
    },
=======
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = parentTransaction.transactionID;
                parentTransaction.custom.ckoTransactionOpened = false;
            }
        });
    },
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js

    /**
     * Refund failed event
     */
    paymentRefundDeclined: function (hook) {
        this.addWebhookInfo(hook, null, null);
    },

    /**
     * Charge void failed event
     */
    paymentVoidDeclined: function (hook) {
        this.addWebhookInfo(hook, null, null);
<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
    }
};
=======
    },
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js

    /**
    * Payment pending event.
    */
    paymentExpired: function (hook) {
        this.addWebhookInfo(hook, null, null);
    }
};

<<<<<<< HEAD:Cartridges/int_checkoutcom_sfra/cartridge/scripts/helpers/eventsHelper.js
module.exports = eventsHelper;
=======
// Module exports
module.exports = eventsHelper;
>>>>>>> upa-apm:Cartridges/int_checkoutcom/cartridge/scripts/helpers/eventsHelper.js
