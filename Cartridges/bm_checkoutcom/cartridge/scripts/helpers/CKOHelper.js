'use strict';

/* API Includes */
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');

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
        var result = SystemObjectMgr.querySystemObjects('Order', '', 'creationDate desc');
        
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
                        processor: this.getProcessorId(instrument),
                        refundable_amount: 0,
                        data_type: paymentTransaction.type.toString()
                    };

                    // Calculate the refundable amount
                    var condition1 = row.data_type == PaymentTransaction.TYPE_CAPTURE;
                    var condition2 = row.opened !== false;
                    if (condition1 && condition2) {
                        row.refundable_amount = this.getRefundableAmount(paymentInstruments);
                    }

                    // Add the transaction
                    data.push(row);
                    i++;
                }
            }
        }
        
        return data;
    },

    /**
     * Check if a capture transaction can allow refunds.
     */
    getRefundableAmount: function (paymentInstruments) {
        // Prepare the totals
        var totalRefunded = 0;
        var totalCaptured = 0;

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
    
        // Return the final amount
        var finalAmount = totalCaptured - totalRefunded;
        return finalAmount.toFixed(2);
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
        for each(i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true;
            }
        }

        return false;
    },

    /**
     * Loads an order by track id.
     */
    loadOrderFromRequest: function () {
        // Get the order from the request
        var trackId = request.httpParameterMap.get('trackId').stringValue;

        return OrderMgr.getOrder(trackId);
    },

    /**
     * Writes gateway information to the website's custom log files.
     */
    log: function (dataType, gatewayData) {
        if (this.getValue('ckoDebugEnabled') == 'true' && (gatewayData)) {
            // Get the logger
            var logger = Logger.getLogger('ckodebug');

            // Remove sensitive data
            gatewayData = this.removeSentisiveData(gatewayData);

            if (logger) {
                logger.debug(this._('cko.gateway.name', 'cko') + ' ' + dataType + ' : {0}', gatewayData);
            }
        }
    },

    /*
     * Remove sentitive data from the logs
     */
    removeSentisiveData: function (data) {
        // Card data
        if (data.hasOwnProperty('source')) {
           if (data.source.hasOwnProperty('number')) data.source.number.replace(/^.{14}/g, '*');
           if (data.source.hasOwnProperty('cvv')) data.source.cvv.replace(/^.{3}/g, '*');
           if (data.source.hasOwnProperty('billing_address')) delete data.source.billing_address;
           if (data.source.hasOwnProperty('phone')) delete data.source.phone;
           if (data.source.hasOwnProperty('name')) delete data.source.name;
        }

        // Customer data
        if (data.hasOwnProperty('customer')) delete data.customer;
        if (data.hasOwnProperty('shipping')) delete data.shipping;
        if (data.hasOwnProperty('billing')) delete data.billing;

        return data;
    },
    
    /*
     * Create an HTTP client to handle request to gateway
     */
    getGatewayClient: function (serviceId, requestData, method) {
        var method = method || 'POST';
        var serv = this.getService(serviceId);

        // Prepare the request URL and data
        if (requestData.hasOwnProperty('chargeId')) {
            var requestUrl = serv.getURL().replace('chargeId', requestData.chargeId);
            serv.setURL(requestUrl);
            delete requestData['chargeId'];
        }

        // Set the request method
        serv.setRequestMethod(method);

        // Call the service
        var resp = serv.call(requestData);
        if (resp.status != 'OK') {
            return resp.error;
        }

        return resp.object;
    },

    getService: function (serviceId) {
        var parts  =  serviceId.split('.');
        var entity = parts[1];
        var action = parts[2];
        var mode = parts[3];
        var svcFile = entity + action.charAt(0).toUpperCase() + action.slice(1);
        var svcClass = require('~/cartridge/scripts/services/' + svcFile);

        return svcClass[mode]();
    },
    
    /**
     * Returns a price formatted for processing by the gateway.
     */
    getFormattedPrice: function (amount) {
        return amount*100;
    },

    /**
     * The cartridge metadata.
     */
    getCartridgeMeta: function (price) {
        return this.getValue('ckoBmPlatformData');
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

        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.secretKey = this.getValue('cko' + str + 'SecretKey');
        keys.privateKey = this.getValue('cko' + str + 'PrivateKey');

        return keys;
    }
};

/*
 * Module exports
 */

module.exports = CKOHelper;