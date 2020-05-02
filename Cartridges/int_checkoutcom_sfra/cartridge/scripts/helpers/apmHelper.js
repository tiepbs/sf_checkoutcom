"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var apmHelper = {            
    /*
     * Apm Request
     */
    handleApmRequest: function (payObject, args) {
        // Gateway response
        var gatewayResponse = false;
        
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Creating billing address object
        var gatewayRequest = this.getApmRequest(payObject, args);

        // Test SEPA
        if (payObject.type == "sepa") {
            // Prepare the charge data
            var chargeData = {
                "customer"              : ckoHelper.getCustomer(args),
                "amount"                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), payObject.currency),
                "type"                  : payObject.type,
                "currency"              : payObject.currency,
                "billing_address"       : ckoHelper.getBilling(args),
                "source_data"           : payObject.source_data,
                "reference"             : args.OrderNo,
                "metadata"              : ckoHelper.getMetadata(payObject, args),
                "billing_descriptor"    : ckoHelper.getBillingDescriptor()
            };
            
            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.sources." + ckoHelper.getValue('ckoMode') + ".service", chargeData);
        } else {
            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", gatewayRequest);
        }

        // Logging
        ckoHelper.doLog('response', gatewayResponse);
        
        // If the charge is valid, process the response
        if (gatewayResponse) {
            if (this.handleApmResponse(gatewayResponse)) {
                return gatewayResponse;
            }
            
            return false;
        } else {
            // Update the transaction
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
        }
    },
    
    /*
     * Handle APM charge Response from CKO API
     */
    handleApmResponse: function (gatewayResponse) {
        // Clean the session
        session.privacy.redirectUrl = null;
        
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);
        
        // Get the response links
        var gatewayLinks = gatewayResponse._links;

        // Get the response type
        var type = gatewayResponse.type;
        
        // Add redirect to sepa source reqeust
        if (type == 'Sepa') {
            session.privacy.redirectUrl = URLUtils.url('CKOSepa-Mandate');
            session.privacy.sepaResponseId = gatewayResponse.id;
            return true;
        }
        
        // Add redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
            session.privacy.redirectUrl = gatewayLinks.redirect.href
            return true;
        }
        
        return ckoHelper.paymentSuccess(gatewayResponse);
    },

    /*
     * Return the APM request data
     */
    getApmRequest: function (payObject, args) {
        // Charge data
        var chargeData = false;
        
        // Load the order information
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Load the currency and amount
        var currency = ckoHelper.getCurrency(payObject.currency);
        var amount = ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), currency);
        
        // Object APM is SEPA
        if (payObject.type == 'klarna') {
            // Prepare chargeData object
            chargeData = {
                "customer"              : ckoHelper.getCustomer(args),
                "amount"                : amount,
                "currency"              : currency,
                "capture"               : false,
                "source"                : payObject.source,
                "reference"             : args.OrderNo,
                "metadata"              : ckoHelper.getMetadata(payObject, args),
                "billing_descriptor"    : ckoHelper.getBillingDescriptor()
            };
        } else {
            // Prepare chargeData object
            chargeData = {
                "customer"              : ckoHelper.getCustomer(args),
                "amount"                : amount,
                "currency"              : currency,
                "source"                : payObject.source,
                "reference"             : args.OrderNo,
                "metadata"              : ckoHelper.getMetadata(payObject, args),
                "billing_descriptor"    : ckoHelper.getBillingDescriptor()
            };
        }
        
        return chargeData;
    },
    
    /*
     * Sepa apm Request
     */
    handleSepaRequest: function (payObject, order) {
        // Gateway response
        var gatewayResponse = false;
        
        // Perform the request to the payment gateway
        gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", payObject);
        
        // If the charge is valid, process the response
        if (gatewayResponse) {
            this.handleApmResponse(gatewayResponse, order);
        } else {
            // Update the transaction
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            
            // Restore the cart
            ckoHelper.checkAndRestoreBasket(order);
            
            return false;
        }

        return true;
    }
}

/*
* Module exports
*/

module.exports = apmHelper;