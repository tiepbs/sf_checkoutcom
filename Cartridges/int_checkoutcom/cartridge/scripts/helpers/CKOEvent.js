'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

/* Checkout.com Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Gateway event functions for the Checkout.com cartridge integration.
 */
var CKOEvent = {
    /**
     * Adds the gateway webhook information to the newly created order.
     */
    addWebhookInfo: function (hook, paymentStatus, orderStatus) {
        // Load the order
	    var order = OrderMgr.getOrder(hook.message.trackId);

    	// Prepare the webhook info
        var details = '';
        details += CKOHelper._('cko.webhook.event', 'cko') + ': ' + hook.eventType + '\n';
        details += CKOHelper._('cko.transaction.id', 'cko') + ': ' + hook.message.id + '\n';
        details += CKOHelper._('cko.transaction.oid', 'cko') + ': ' + hook.message.originalId + '\n';
        details += CKOHelper._('cko.transaction.status', 'cko') + ': ' + hook.message.status + '\n';
        details += CKOHelper._('cko.response.code', 'cko') + ': ' + hook.message.responseCode + '\n';
        details += CKOHelper._('cko.response.message', 'cko') + ': ' + hook.message.responseMessage + '\n';
        details += CKOHelper._('cko.response.info', 'cko') + ': ' + hook.message.responseAdvancedInfo + '\n';

        // Process the transaction
        Transaction.wrap(function() {
            // Add the details to the order
            order.addNote(CKOHelper._('cko.webhook.info', 'cko'), details);
 
            // Update the payment status
            if (paymentStatus) {
            	order.setPaymentStatus(order[paymentStatus]);	
            }

            // Update the order status
            if ((orderStatus) && (orderStatus.indexOf("CANCELLED") != -1 || orderStatus.indexOf("FAILED") != -1)) {
                OrderMgr.failOrder(order);
            }
        });
    },

    /**
     * Charge captured event.
     */
    chargeCaptured: function(hook) {  
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', null);
    },

    /**
     * Charge succeded event.
     */
    chargeSucceeded: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', null);
    },   

    /**
     * Charge failed event.
     */
    chargeFailed: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },   

    /**
     * Charge capture failed event.
     */
    chargeCapturedFailed: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_FAILED');
    },  

    /**
     * Charge refunded event.
     */
    chargeRefunded: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_PAID', 'ORDER_STATUS_CANCELLED');
    },  

    /**
     * Charge voided event.
     */    
    chargeVoided: function(hook) {
        this.addWebhookInfo(hook, 'PAYMENT_STATUS_NOTPAID', 'ORDER_STATUS_CANCELLED');
    }, 

    /**
     * Charge refund failed event.
     */
    chargeRefundedFailed: function(hook) {
        this.addWebhookInfo(hook, null, null);
    }, 

    /**
     * Charge void failed event.
     */
    chargeVoidedFailed: function(hook) {
        this.addWebhookInfo(hook, null, null);
    }  
};

/*
 * Module exports
 */

module.exports = CKOEvent;