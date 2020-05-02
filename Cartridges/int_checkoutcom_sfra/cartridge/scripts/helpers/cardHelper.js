"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle full charge Request to CKO API
     */
    handleCardRequest: function (paymentInstrument, orderNumber) {       
        // Create billing address object
        var gatewayRequest = this.getCardRequest(paymentInstrument, orderNumber);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
            gatewayRequest
        );

        // Logging
        ckoHelper.doLog('response', gatewayResponse);

        // If the charge is valid, process the response
        if (gatewayResponse && this.handleFullChargeResponse(gatewayResponse)) {                
            return true;
        }
            
        return false;
    },

    /*
     * Handle full charge Response from CKO API
     */
    handleFullChargeResponse: function (gatewayResponse) {
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
    getCardRequest: function (paymentInstrument, orderNumber) {   
        // Get the curren basket
        var basket = BasketMgr.getCurrentBasket();

        // Prepare the charge data
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : paymentInstrument.getCreditCardNumber(),
                expiry_month        : paymentInstrument.getCreditCardExpirationMonth(),
                expiry_year         : paymentInstrument.getCreditCardExpirationYear(),
                cvv                 : sessoin.custom.cvv,
            },
            'amount'                : ckoHelper.getFormattedPrice(basket.getTotalGrossPrice().value.toFixed(2), ckoHelper.getCurrency()),
            'currency'              : ckoHelper.getCurrency(),
            'reference'             : orderNumber,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'billing_descriptor'    : ckoHelper.getBillingDescriptorObject(),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
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