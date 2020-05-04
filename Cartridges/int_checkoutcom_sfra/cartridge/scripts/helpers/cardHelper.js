"use strict"

/* API Includes */
var URLUtils = require('dw/web/URLUtils');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle full charge Request to CKO API
     */
    handleRequest: function (orderNumber, processorId) {       
        // Create billing address object
        var gatewayRequest = this.buildRequest(orderNumber, processorId);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
            gatewayRequest
        );

        // Process the response
        return gatewayResponse && this.handleResponse(gatewayResponse);
    },

    /*
     * Handle full charge Response from CKO API
     */
    handleResponse: function (gatewayResponse) {
        // Clean the session
        session.privacy.redirectUrl = null;
        
        // Logging
        ckoHelper.doLog('response', gatewayResponse);
        
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
     * Pre_Authorize card with zero value
     */
    preAuthorizeCard: function(cardData) {
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : cardData.cardNumber,
                expiry_month        : cardData.expiryMonth,
                expiry_year         : cardData.expiryYear,
                cvv                 : cardData.cvv
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
     * Get payment card data from request
     */
    buildCardData: function (paymentInformation) {        
        return {
            cardNumber  : ckoHelper.getFormattedNumber(paymentInformation.cardNumber.value),
            expiryMonth : paymentInformation.expirationMonth.value,
            expiryYear  : paymentInformation.expirationYear.value,
            cvv         : paymentInformation.securityCode.value,
            cardType    : paymentInformation.cardType.value
        };
    },

    /*
     * Build the gateway request
     */
    buildRequest: function (orderNumber, processorId) {   
        // Prepare the charge data
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : session.custom.paymentData.cardNumber,
                expiry_month        : session.custom.paymentData.expiryMonth,
                expiry_year         : session.custom.paymentData.expiryYear,
                cvv                 : session.custom.paymentData.cvv
            },
            'amount'                : ckoHelper.getFormattedPrice(
                session.custom.basket.getTotalGrossPrice().value.toFixed(2),
                session.custom.basket.getCurrencyCode()
            ),
            'currency'              : session.custom.basket.getCurrencyCode(),
            'reference'             : orderNumber,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
            'shipping'              : this.getShipping(),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
            'metadata'              : ckoHelper.getMetadata({}, processorId)
        };   
    
        return chargeData;
    },

    /*
     * Build the Shipping object
     */
    getShipping: function () {
        // Get shipping address object
        var shippingAddress = session.custom.basket.getDefaultShipment().getShippingAddress();
        
        // Creating address object
        var shippingDetails = {
            address_line1       : shippingAddress.getAddress1(),
            address_line2       : shippingAddress.getAddress2(),
            city                : shippingAddress.getCity(),
            state               : shippingAddress.getStateCode(),
            zip                 : shippingAddress.getPostalCode(),
            country             : shippingAddress.getCountryCode().value
        };
        
        // Build the shipping object
        var shipping = {
            address             : shippingDetails,
            phone               : ckoHelper.getPhone()
        };
        
        return shipping;
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