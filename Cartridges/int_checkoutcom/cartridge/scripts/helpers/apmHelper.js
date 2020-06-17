"use strict"

// API Includes 
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');

// Utility 
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

// Utility functions for my cartridge integration.
var apmHelper = {
		
    /**
     * Creates Site Genesis Transaction Object
     */
    apmAuthorization: function (payObject, args) {
    	
        // Preparing payment parameters
        var paymentInstrument = args.PaymentInstrument;
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
        
        // perform the charge
        var apmRequest = this.handleApmRequest(payObject, args);
        
        // Handle apm result
        if (apmRequest) {
            if (this.handleApmChargeResponse(apmRequest)) {
                if (session.privacy.redirectUrl) {
                    
                    // Set the redirection template
                    var templatePath;
                    if (payObject.hasOwnProperty('type') && payObject.type == "sepa") {
                        templatePath = 'redirects/sepaMandate.isml';
                    } else {
                        templatePath = 'redirects/apm.isml';
                    }

                    // Redirect
                    ISML.renderTemplate(templatePath, {
                        redirectUrl: session.privacy.redirectUrl
                    });
                    
                    return {authorized: true, redirected: true};
                } else {
                	
                    return {authorized: true};
                }
            } else {
            	
                return false;
            }
        } else {
        	
            return false
        }
    },
        
    /**
     * Handle APM charge Response from CKO API
     */
    handleApmChargeResponse: function (gatewayResponse) {
    	
        // clean the session
        session.privacy.redirectUrl = null;
        
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);
        
        // Get the response links
        var gatewayLinks = gatewayResponse._links;

        // Get the response type
        var type = gatewayResponse.type;
        
        // Add redirect to sepa source reqeust
        if (type == 'Sepa') {
            session.privacy.redirectUrl = "${URLUtils.url('CKOSepa-Mandate')}";
            session.privacy.sepaResponseId = gatewayResponse.id;
        }
        
        // Add redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
            session.privacy.redirectUrl = gatewayLinks.redirect.href;
            
            return ckoHelper.paymentSuccess(gatewayResponse);
        } else {
        	
            return ckoHelper.paymentSuccess(gatewayResponse);
        }  
    },
    
    /**
     * Apm Request
     */
    handleApmRequest: function (payObject, args) {
    	
        // Gateway response
        var gatewayResponse = false;
        
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Creating billing address object
        var gatewayRequest = this.getApmRequest(payObject, args);
        
        // Test for SEPA
        if (payObject.hasOwnProperty('type') && payObject.type == "sepa") {
            
            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.sources." + ckoHelper.getValue('ckoMode') + ".service", gatewayRequest);
        } else {
        	
            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", gatewayRequest);
        }
        
        // Logging
        ckoHelper.doLog('response', gatewayResponse);
        
        // If the charge is valid, process the response
        if (gatewayResponse) {
        	
        	return gatewayResponse;
        } else {
        	
            // Update the transaction
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
        }
    },
    
    /**
     * Return the APM request data
     */
    getApmRequest: function (payObject, args) {
    	
        // Charge data
        var chargeData = false;
        
        // Load the order information
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Load the currency and amount
        var amount = ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), payObject.currency);
        
        // Object APM is SEPA
        if (payObject.hasOwnProperty('type') && payObject.type == "sepa") {
        	
            // Prepare the charge data
            chargeData = {
                "customer"              : ckoHelper.getCustomer(args),
                "amount"                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), payObject.currency),
                "type"                  : payObject.type,
                "currency"              : payObject.currency,
                "billing_address"       : ckoHelper.getBillingObject(args),
                "source_data"           : payObject.source_data,
                "reference"             : args.OrderNo,
                "payment_ip"            : ckoHelper.getHost(args),
                "metadata"              : ckoHelper.getMetadataObject(payObject, args),
                "billing_descriptor"    : ckoHelper.getBillingDescriptorObject(),
                "udf5"					: ckoHelper.getMetadataString(payObject, args)
            };     	
        } else if (payObject.hasOwnProperty('source') && payObject.source.type == 'klarna') {
        	
            // Prepare chargeData object
            chargeData = {
                "customer"              : ckoHelper.getCustomer(args),
                "amount"                : amount,
                "currency"              : payObject.currency,
                "capture"               : false,
                "source"                : payObject.source,
                "reference"             : args.OrderNo,
                "payment_ip"            : ckoHelper.getHost(args),
                "metadata"              : ckoHelper.getMetadataObject(payObject, args),
                "billing_descriptor"    : ckoHelper.getBillingDescriptorObject()
            };
        } else {
        	
            // Prepare chargeData object
            chargeData = {
                "customer"              : ckoHelper.getCustomer(args),
                "amount"                : amount,
                "currency"              : payObject.currency,
                "source"                : payObject.source,
                "reference"             : args.OrderNo,
                "payment_ip"            : ckoHelper.getHost(args),
                "metadata"              : ckoHelper.getMetadataObject(payObject, args),
                "billing_descriptor"    : ckoHelper.getBillingDescriptorObject()
            };
        }
        
        return chargeData;
    },
    
    /**
     * Sepa controller Request
     */
    handleSepaControllerRequest: function (payObject, order) {
    	
        // Gateway response
        var gatewayResponse = false;
        
        // Perform the request to the payment gateway
        gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", payObject);
        
        // If the charge is valid, process the response
        if (gatewayResponse) {
        	
            // Logging
            ckoHelper.doLog('sepa response', gatewayResponse);
        	
            return gatewayResponse;
            
        } else {
        	
            // Update the transaction
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            
            // Restore the cart
            ckoHelper.checkAndRestoreBasket(order);
            
            return false;
        }
    }
}

// Module exports
module.exports = apmHelper;