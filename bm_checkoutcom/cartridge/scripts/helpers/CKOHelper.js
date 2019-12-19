'use strict';

/* API Includes */
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var OrderMgr = require('dw/order/OrderMgr');
var ServiceRegistry = require('dw/svc/ServiceRegistry');
var Util  = require('dw/util');

/**
 * Helper functions for the Checkout.com cartridge integration.
 */
var CKOHelper = {
    /**
     * Handles string translation with language resource files.
     */
    _: function (strValue, strFile) {
        return Resource.msg(strValue, strFile, null);
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
        for each (var item in result) {
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each (var instrument in paymentInstruments) {
                if (this.isCKo(instrument) && !this.containsObject(item, data)) {
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
        var orders  = this.getCkoOrders();
        
        // Prepare the order mapping container
        var orderMap = {};
        
        // Loop through the results
        for each (var item in orders) {
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each (var instrument in paymentInstruments) {
                if (this.isCKo(instrument)) {
                    // Get the payment transaction
                    var paymentTransaction = instrument.getPaymentTransaction();
                    
                    // Add the payment transaction to the output
                    if (!this.containsObject(paymentTransaction, data)) {
                        data.push(paymentTransaction);
                    }
                    
                    // Map transaction to order id
                    orderMap[paymentTransaction.transactionID] = item.orderNo;
                }
            }
        } 
        
        return {result: data, orderMap: orderMap};
    },

    /**
     * Checks if a payment instrument is Checkout.com.
     */
    isCKo: function (instrument) {
        return instrument.paymentMethod.indexOf('CHECKOUTCOM_') >= 0;
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
    },

    /**
     * Writes gateway information to the website's custom log files.
     */
    // todo - update the logger
    /*
    logThis: function (dataType, gatewayData) {
        if (this.getValue('ckoDebugEnabled') == 'true' && (gatewayData)) {
            var logger = Logger.getLogger('ckodebug');
            if (logger) {
                logger.debug(this._('cko.gateway.name', 'cko') + ' ' + dataType + ' : {0}', gatewayData);
            }
        }
    },
    */

    /**
     * Build HTTP service Headers.
     */
    buildHttpServiceHeaders: function (serviceInstance, method, url) {
        // Set the method
        method = method || 'POST';

        // Set the URL
        url = url || null;
        if (url) serviceInstance.setURL(url);

        // Set the default headers
        serviceInstance.setRequestMethod(method);
        serviceInstance.addHeader("Authorization", this.getAccountKeys().privateKey);
        serviceInstance.addHeader("User-Agent", this.getCartridgeMeta());
        serviceInstance.addHeader("Content-Type", 'application/json;charset=UTF-8');

        return serviceInstance;
    },

    /**
     * Retrieves a custom preference value from the configuration.
     */
    getValue: function (fieldName) {
        return dw.system.Site.getCurrent().getCustomPreferenceValue(fieldName);
    },

    /**
     * Get live or sandbox account keys.
     */
    getAccountKeys: function () {
        var keys = {};
        var str = this.getValue('ckoMode') == 'live' ? 'Live' : 'Sandbox';

        keys.privateKey = this.getValue('cko' + str + 'PrivateKey');
        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.privateSharedKey = this.getValue('cko' + str + 'PrivateSharedKey');

        return keys;
    }
};

/*
 * Module exports
 */

module.exports = CKOHelper;