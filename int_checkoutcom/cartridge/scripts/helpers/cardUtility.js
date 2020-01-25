"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/*
* Utility functions for my cartridge integration.
*/
var cardUtility = {
    /*
     * Handle full charge Request to CKO API
     */
    handleCardRequest: function (cardData, args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Create billing address object
        var gatewayRequest = this.getCardRequest(cardData, args);
        
        // Pre authorize the card
        if (this.preAuthorizeCard(gatewayRequest)) {
            // Perform the request to the payment gateway
            var gatewayResponse = ckoUtility.gatewayClientRequest(
                "cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service",
                gatewayRequest
            );
        
            // If the charge is valid, process the response
            if (gatewayResponse) {
                // Logging
                ckoUtility.doLog('response', JSON.stringify(gatewayResponse));
                
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
        ckoUtility.doLog('response', JSON.stringify(gatewayResponse));
        
        // Update customer data
        ckoUtility.updateCustomerData(gatewayResponse);
        
        // Get the gateway links
        var gatewayLinks = gatewayResponse._links;
        
        // Add 3DS redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
            session.privacy.redirectUrl = gatewayLinks.redirect.href;
            return true;
        } else {
            return ckoUtility.paymentSuccess(gatewayResponse);
        }

        return false;
    },
    
    /*
     * Pre_Authorize card with zero value
     */
    preAuthorizeCard: function (chargeData) {
        // Prepare the pre authorization charge
        chargeData['3ds'].enabled = false;
        chargeData.amount = 0;
        chargeData.currency = 'USD';
        chargeData.capture = false;
        delete chargeData['capture_on'];
        
        // Send the request
        var authResponse = ckoUtility.gatewayClientRequest(
            'cko.card.charge.' + ckoUtility.getValue('ckoMode') + '.service',
            chargeData
        );
        
        // Return the response
        return ckoUtility.paymentSuccess(authResponse);
    },
    
    /*
     * Build the gateway request
     */
    getCardRequest: function (cardData, args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
    
        // Prepare the charge data
        var chargeData = {
            'source'                : this.getSourceObject(cardData, args),
            'amount'                : ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency()),
            'currency'              : ckoUtility.getCurrency(),
            'reference'             : args.OrderNo,
            'capture'               : ckoUtility.getValue('ckoAutoCapture'),
            'capture_on'            : ckoUtility.getCaptureTime(),
            'customer'              : ckoUtility.getCustomer(args),
            'billing_descriptor'    : ckoUtility.getBillingDescriptorObject(),
            'shipping'              : this.getShippingObject(args),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
            'payment_ip'            : ckoUtility.getHost(args),
            'metadata'              : ckoUtility.getMetadataObject(cardData, args)
        };
        
        return chargeData;
    },
    
    /*
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
            phone               : ckoUtility.getPhoneObject(args)
        }
        
        return source;
    },
    
    /*
     * Build 3ds object
     */
    get3Ds: function () {
        return {
            'enabled' : ckoUtility.getValue('cko3ds'),
            'attempt_n3d' : ckoUtility.getValue('ckoN3ds')
        }
    },
    
    /*
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
    
    /*
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
            phone               : ckoUtility.getPhoneObject(args)
        };
        
        return shipping;
    }
}

/*
* Module exports
*/

module.exports = cardUtility;