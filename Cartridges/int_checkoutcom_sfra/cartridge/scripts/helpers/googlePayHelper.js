"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var googlePayHelper = {
    /*
     * Handle the payment request
     */
    handleRequest: function (orderNumber, processorId) {    
        // Load the order information
        var order = OrderMgr.getOrder(orderNumber);

        // Prepare the parameters
        var requestData = {
            'type': 'googlepay',
            'token_data': JSON.parse(session.custom.paymentData)
        };    

        // Perform the request to the payment gateway
        var tokenResponse = ckoHelper.gatewayClientRequest(
            'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
            JSON.stringify(requestData)
        );
            	
        // If the request is valid, process the response
        if (tokenResponse && tokenResponse.hasOwnProperty('token')) {
            var chargeData = {
                "source"                : {
                    type: 'token',
                    token: tokenResponse.token
                },
                'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
                'currency'              : order.getCurrencyCode(),
                'reference'             : order.orderNo,
                'capture'               : ckoHelper.getValue('ckoAutoCapture'),
                'capture_on'            : ckoHelper.getCaptureTime(),
                'customer'              : ckoHelper.getCustomer(order),
                'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
                'shipping'              : ckoHelper.getShipping(order),
                'metadata'              : ckoHelper.getMetadata({}, processorId)
            };

            // Perform the request to the payment gateway
            var gatewayResponse = ckoHelper.gatewayClientRequest(
                "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
                chargeData
            );

            // Process the response
            return gatewayResponse && this.handleResponse(gatewayResponse);
        } 
    },
    
    /*
     * Handle full Google Pay response from CKO API
     */
    handleResponse: function (gatewayResponse) {
        // Logging
        ckoHelper.doLog('response', gatewayResponse);
        
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);

        return ckoHelper.paymentSuccess(gatewayResponse);
    }
}

/*
* Module exports
*/
module.exports = googlePayHelper;