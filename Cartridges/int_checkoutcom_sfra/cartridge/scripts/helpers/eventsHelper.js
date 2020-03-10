'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

/* Checkout.com Helper functions */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var transactionHelper = require('~/cartridge/scripts/helpers/transactionHelper');

/**
 * Gateway event functions for the Checkout.com cartridge integration.
 */
var eventsHelper = {
    /**
     * Adds the gateway webhook information to the newly created order.
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
                // Add the details to the order
                order.addNote(ckoHelper._('cko.webhook.info', 'cko'), details);
    
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
     * Payment captured event.
     */
    paymentCaptured: function (hook) {
        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', null);

        // Create the captured transaction
        transactionHelper.createCapture(hook);
    },

    /**
     * Payment authorized event.
     */
    paymentApproved: function (hook) {
        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', null);

        // Create the authorized transaction
        transactionHelper.createAuthorization(hook);

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
     * Card verified event.
     */
    cardVerified: function (hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', null);
    },

    /**
     * Authorization failed event.
     */
    paymentDeclined: function (hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },

    /**
     * Capture failed event.
     */
    paymentCapturedDeclined: function (hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },

    /**
     * Payment refunded event.
     */
    paymentRefunded: function (hook) {
        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', 'ORDER_STATUS_CANCELLED');

        // Create the refunded transaction
        transactionHelper.createRefund(hook);
    },

    /**
     * Payment voided event.
     */
    paymentVoided: function (hook) {
        // Create the webhook info
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_CANCELLED');

        // Create the refunded transaction
        transactionHelper.createVoid(hook);
    },

    /**
     * Refund failed event.
     */
    paymentRefundDeclined: function (hook) {
        this.addWebhookInfo(hook, null, null);
    },

    /**
     * Charge void failed event.
     */
    paymentVoidDeclined: function (hook) {
        this.addWebhookInfo(hook, null, null);
    }
};

/*
 * Module exports
 */

module.exports = eventsHelper;