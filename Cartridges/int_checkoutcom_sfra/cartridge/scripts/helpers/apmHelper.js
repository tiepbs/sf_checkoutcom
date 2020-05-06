"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/* APM Configuration */
var apmConfig = require('~/cartridge/scripts/config/ckoApmConfig');
/*
* Utility functions for my cartridge integration.
*/
var apmHelper = {            
    /*
     * Apm Request
     */
    handleRequest: function (orderNumber, processorId, apmConfigData) {
        // Load the order
        var order = OrderMgr.getOrder(orderNumber);
        
        // Create the payment request
        var gatewayRequest = this.getApmRequest(order, processorId, apmConfigData);

        // Test SEPA
        if (apmConfigData.type == "sepa") {
            // Prepare the charge data
            var chargeData = {
                "customer"              : ckoHelper.getCustomer(order),
                "amount"                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
                "type"                  : apmConfigData.type,
                "currency"              : order.getCurrencyCode(),
                "billing_address"       : ckoHelper.getBilling(order),
                "source_data"           : apmConfigData.source_data,
                "reference"             : order.OrderNo,
                "metadata"              : ckoHelper.getMetadata({}, processorId),
                "billing_descriptor"    : ckoHelper.getBillingDescriptor()
            };
            
            // Log the SEPA payment request data
            ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), chargeData);

            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.sources." + ckoHelper.getValue('ckoMode') + ".service", chargeData);

            // Log the SEPA payment response data
            ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

        } else {
            // Log the APM payment request data
            ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", gatewayRequest);

            // Log the APM payment response data
            ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);
        }

        // Process the response
        return gatewayResponse && this.handleResponse(gatewayResponse);

    },
    
    /*
     * Handle the payment response
     */
    handleResponse: function (gatewayResponse) {
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
            session.privacy.redirectUrl = URLUtils.url('CKOSepa-Mandate').value;
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
    getApmRequest: function (order, processorId, apmConfigData) {
        // Charge data
        var chargeData;
        
        // Get the order amount
        var amount = ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode());
        
        // Prepare the charge data
        chargeData = {
            "customer"              : ckoHelper.getCustomer(order),
            "amount"                : amount,
            "currency"              : order.getCurrencyCode(),
            "source"                : apmConfigData.source,
            "reference"             : order.orderNo,
            "metadata"              : ckoHelper.getMetadata({}, processorId),
            "billing_descriptor"    : ckoHelper.getBillingDescriptor()
        };

        // Test Klarna
        if (apmConfigData.type == 'klarna') {
            chargeData.capture = false;
        }
        
        return chargeData;
    },
    
    /*
     * Sepa APM request
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