"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle the payment request
     */
    handleRequest: function (orderNumber, paymentData, processorId) {       
        // Build the request data
        var gatewayRequest = this.buildRequest(orderNumber, paymentData, processorId);

        // Log the payment request data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
            gatewayRequest
        );

        // Log the payment response data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayRequest);

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
        
        // Get the gateway links
        var gatewayLinks = gatewayResponse._links;
        
        // Add 3DS redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
            session.privacy.redirectUrl = gatewayLinks.redirect.href;
            return true;
        } 
        
        return ckoHelper.paymentSuccess(gatewayResponse);
    },
    
    /*
     * Pre authorize card with zero value
     */
    preAuthorizeCard: function(paymentInformation) {
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : ckoHelper.getFormattedNumber(paymentInformation.cardNumber.value),
                expiry_month        : paymentInformation.expirationMonth.value,
                expiry_year         : paymentInformation.expirationYear.value,
                cvv                 : paymentInformation.securityCode.value
            },
            'amount'                : 0,
            'currency'              : 'USD',
            'capture'               : false,
            '3ds'                   : {enabled: false},
            'risk'                  : {enabled: true}
        };
        
        // Send the request
        var authResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            chargeData
        );

        // Return the response
        return ckoHelper.paymentSuccess(authResponse);
    },

    /*
     * Build the gateway request
     */
    buildRequest: function (orderNumber, paymentData, processorId) {   
        // Load the order information
        var order = OrderMgr.getOrder(orderNumber);

        // Prepare the charge data
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : ckoHelper.getFormattedNumber(paymentData.cardNumber.htmlValue),
                expiry_month        : paymentData.expirationMonth.htmlValue,
                expiry_year         : paymentData.expirationYear.htmlValue,
                cvv                 : paymentData.securityCode.htmlValue
            },
            'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
            'currency'              : order.getCurrencyCode(),
            'reference'             : order.orderNo,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'customer'              : ckoHelper.getCustomer(order),
            'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
            'shipping'              : ckoHelper.getShipping(order),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
            'metadata'              : ckoHelper.getMetadata({}, processorId)
        };   
    
        return chargeData;
    },

    /*
     * Build 3ds object
     */
    get3Ds: function () {
        return {
            'enabled' : ckoHelper.getValue('cko3ds'),
            'attempt_n3d' : ckoHelper.getValue('ckoN3ds')
        }
    }
}

/*
* Module exports
*/
module.exports = cardHelper;