"use strict"


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/*
* Utility functions for my cartridge integration.
*/
var googlePayUtility = {
    /*
     * Handle full charge Request to CKO API
     */
    handleRequest: function (args) {
        // load the order information
        var order = OrderMgr.getOrder(args.OrderNo);
        var paymentInstrument = args.PaymentInstrument;
        var ckoGooglePayData =  paymentInstrument.paymentTransaction.custom.ckoGooglePayData;

        // Prepare the parameters
        var requestData = {
            "type": "googlepay",
            "token_data": JSON.parse(ckoGooglePayData)
        };

        // Perform the request to the payment gateway
        var tokenResponse = ckoUtility.gatewayClientRequest(
            "cko.network.token." + ckoUtility.getValue('ckoMode') + ".service",
            requestData
        );

        // If the request is valid, process the response
        if (tokenResponse && tokenResponse.hasOwnProperty('token')) {
            var chargeData = {
                "source"                : this.getSourceObject(tokenResponse),
                "amount"                : ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency()),
                "currency"              : ckoUtility.getCurrency(),
                "reference"             : args.OrderNo,
                "capture"               : ckoUtility.getValue('ckoAutoCapture'),
                "capture_on"            : ckoUtility.getCaptureTime(),
                "customer"              : ckoUtility.getCustomer(args),
                "billing_descriptor"    : ckoUtility.getBillingDescriptorObject(),
                "shipping"              : ckoUtility.getShippingObject(args),
                "payment_ip"            : ckoUtility.getHost(args),
                "metadata"              : ckoUtility.getMetadataObject([], args)
            };

            // Perform the request to the payment gateway
            var gatewayResponse = ckoUtility.gatewayClientRequest(
                "cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service",
                chargeData
            );

            // Validate the response
            if (ckoUtility.paymentSuccess(gatewayResponse)) {
                return gatewayResponse;
            }

            return false;
        } else {
            // Update the transaction
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            
            // Restore the cart
            ckoUtility.checkAndRestoreBasket(order);
            
            return false;
        }
    },
    
    /*
     * Handle full Google Pay response from CKO API
     */
    handleResponse: function (gatewayResponse) {
        // Logging
        ckoUtility.doLog('response', JSON.stringify(gatewayResponse));
        
        // Update customer data
        ckoUtility.updateCustomerData(gatewayResponse);
    },
    
    /*
     * Build Gateway Source Object
     */
    getSourceObject: function (tokenData) {
        // Source object
        var source = {
            type: "token",
            token: tokenData.token
        }
        
        return source;
    }
}

/*
* Module exports
*/
module.exports = googlePayUtility;