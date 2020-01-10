'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

/* Checkout.com Helper functions */
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/**
 * Gateway event functions for the Checkout.com cartridge integration.
 */
var CKOEvent = {
    /**
     * Adds the gateway webhook information to the newly created order.
     */
    addWebhookInfo: function (hook, paymentStatus, orderStatus) {
        // Load the order
        var order = OrderMgr.getOrder(hook.data.reference);
        if (order) {
            // Prepare the webhook info
            var details = '';
            details += ckoUtility._('cko.webhook.event', 'cko') + ': ' + hook.type + '\n';
            details += ckoUtility._('cko.transaction.id', 'cko') + ': ' + hook.action_id + '\n';
            details += ckoUtility._('cko.response.code', 'cko') + ': ' + hook.response_code + '\n';

            // Process the transaction
            Transaction.wrap(function() {
                // Add the details to the order
                order.addNote(ckoUtility._('cko.webhook.info', 'cko'), details);
    
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
    paymentCaptured: function(hook) {  
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', null);
    },

    /**
     * Payment authorized event.
     */
    paymentApproved: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', null);
    },   

    /**
     * Authorization failed event.
     */
    paymentDeclined: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },   

    /**
     * Capture failed event.
     */
    paymentCapturedDeclined: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },  

    /**
     * Payment refunded event.
     */
    paymentRefunded: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', 'ORDER_STATUS_CANCELLED');
    },  

    /**
     * Payment voided event.
     */    
    paymentVoided: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_CANCELLED');
    }, 

    /**
     * Refund failed event.
     */
    paymentRefundDeclined: function(hook) {
        this.addWebhookInfo(hook, null, null);
    }, 

    /**
     * Charge void failed event.
     */
    paymentVoidDeclined: function(hook) {
        this.addWebhookInfo(hook, null, null);
    }  
};

/*
 * Module exports
 */

module.exports = CKOEvent;