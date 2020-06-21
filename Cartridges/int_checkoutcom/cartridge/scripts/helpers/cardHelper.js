"use strict"

// API Includes
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

// Utility functions for my cartridge integration
var cardHelper = {
	
    /**
     * Creates Site Genesis Transaction Object
     */
    cardAuthorization: function (payObject, args) {
    	
        // Preparing payment parameters
        var paymentInstrument = args.PaymentInstrument;
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
        
        // perform the charge
        var cardRequest = this.handleCardRequest(payObject, args);
        
        // Handle apm result
        if (cardRequest) {
            if (session.privacy.redirectUrl) {
                
                // 3ds redirection
                ISML.renderTemplate('redirects/3DSecure.isml', {
                    redirectUrl: session.privacy.redirectUrl
                });

                return {authorized: true, redirected: true};
            } else {
            	
                // Load the card and order information
                var order = OrderMgr.getOrder(args.OrderNo);
            	
                return {authorized: true};
            }    
        } else {
        	
            return false
        }
    },
		
    /**
     * Handle full charge Request to CKO API
     */
    handleCardRequest: function (cardData, args) {
    	
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Create billing address object
        var gatewayRequest = this.getCardRequest(cardData, args);
        	
        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
            gatewayRequest
        );

        // If the charge is valid, process the response
        if (gatewayResponse) {    
        	
            // Logging
            ckoHelper.doLog('response', gatewayResponse);
        	
            // Handle the response
            if (this.handleFullChargeResponse(gatewayResponse)) {
            	
                return gatewayResponse;
            }

            return false;
        } else {
        	
            // Fail the order
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });

            return false;
        }
            
    },
    
    /**
     * Handle full charge Response from CKO API
     */
    handleFullChargeResponse: function (gatewayResponse) {
    	
        // Clean the session
        session.privacy.redirectUrl = null;
        
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);
        
        // Get the gateway links
        var gatewayLinks = gatewayResponse._links;
        
        // Add 3DS redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
        	
        	// Save redirect link to session
            session.privacy.redirectUrl = gatewayLinks.redirect.href;
            
            // Check if its a valid response
            return ckoHelper.paymentSuccess(gatewayResponse);
            
        } else {
        	
        	// Check if its a valid response
            return ckoHelper.paymentSuccess(gatewayResponse);
        }
    },
    
    /**
     * Build the gateway request
     */
    getCardRequest: function (cardData, args) {
    	
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
    
        // Prepare the charge data
        var chargeData = {
            'source'                : this.getSourceObject(cardData, args),
            'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
            'currency'              : ckoHelper.getCurrency(),
            'reference'             : args.OrderNo,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'customer'              : ckoHelper.getCustomer(args),
            'billing_descriptor'    : ckoHelper.getBillingDescriptorObject(),
            'shipping'              : this.getShippingObject(args),
            '3ds'                   : (cardData.type == "mada") ? {enabled: true} : this.get3Ds(),
            'risk'                  : {enabled: true},
            'success_url'           : URLUtils.https('CKOMain-HandleReturn').toString(),
            'failure_url'           : URLUtils.https('CKOMain-HandleFail').toString(),
            'payment_ip'            : ckoHelper.getHost(args),
            'metadata'              : ckoHelper.getMetadataObject(cardData, args),
            'udf5'					: ckoHelper.getMetadataString(cardData, args)
        };
        
        return chargeData;
    },
    
    /**
     * Build Gateway Source Object
     */
    getSourceObject: function (cardData, args) {
    	
        // Source object
        var source = {
            type                : 'card',
            number              : cardData.number,
            expiry_month        : cardData.expiryMonth,
            expiry_year         : cardData.expiryYear,
            name                : cardData.name,
            cvv                 : cardData.cvv,
            billing_address     : this.getBillingObject(args),
            phone               : ckoHelper.getPhoneObject(args)
        }
        
        return source;
    },
    
    /**
     * Build 3ds object
     */
    get3Ds: function () { 
   
        return {
            'enabled' : ckoHelper.getValue('cko3ds'),
            'attempt_n3d' : ckoHelper.getValue('ckoN3ds')
        }
    },
    
    /**
     * Build the Billing object
     */
    getBillingObject: function (args) { 
    	
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();

        // Creating billing address object
        var billingDetails = {
            address_line1       : billingAddress.getAddress1(),
            address_line2       : billingAddress.getAddress2(),
            city                : billingAddress.getCity(),
            state               : billingAddress.getStateCode(),
            zip                 : billingAddress.getPostalCode(),
            country             : billingAddress.getCountryCode().value
        };
        
        return billingDetails;
    },
    
    /**
     * Build the Shipping object
     */
    getShippingObject: function (args) {
    	
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get shipping address object
        var shippingAddress = order.getDefaultShipment().getShippingAddress();
        
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
            phone               : ckoHelper.getPhoneObject(args)
        };
        
        return shipping;
    }
}

// Module exports
module.exports = cardHelper;