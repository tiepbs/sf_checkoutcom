'use strict';


// API Includes
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Module googlePayHelper
 */
var googlePayHelper = {
    /**
     * Handle full charge Request to CKO API
     * @param {Object} args The request arguments
     * @returns {Object} The gateway response
     */
    handleRequest: function(args) {
        // load the order information
        var order = OrderMgr.getOrder(args.OrderNo);
        var paymentInstrument = args.PaymentInstrument;
        var ckoGooglePayData = paymentInstrument.paymentTransaction.custom.ckoGooglePayData;

        // Prepare the parameters
        var requestData = {
            type: 'googlepay',
            token_data: JSON.parse(ckoGooglePayData),
        };

        // Perform the request to the payment gateway
        var tokenResponse = ckoHelper.gatewayClientRequest(
            'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
            requestData
        );

        // If the request is valid, process the response
        if (tokenResponse && Object.prototype.hasOwnProperty.call(tokenResponse, 'token')) {
            var chargeData = {
                source: this.getSourceObject(tokenResponse),
                amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
                currency: ckoHelper.getCurrency(),
                reference: args.OrderNo,
                capture: ckoHelper.getValue('ckoAutoCapture'),
                capture_on: ckoHelper.getCaptureTime(),
                customer: ckoHelper.getCustomer(args),
                billing_descriptor: ckoHelper.getBillingDescriptorObject(),
                shipping: ckoHelper.getShippingObject(args),
                payment_ip: ckoHelper.getHost(args),
                metadata: ckoHelper.getMetadataObject([], args),
            };

            // Perform the request to the payment gateway
            var gatewayResponse = ckoHelper.gatewayClientRequest(
                'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
                chargeData
            );

            // Validate the response
            if (ckoHelper.paymentSuccess(gatewayResponse)) {
                ckoHelper.updateCustomerData(gatewayResponse);
                return gatewayResponse;
            }

            return null;
        }

            // Update the transaction
        Transaction.wrap(function() {
            OrderMgr.failOrder(order, true);
        });

        return null;
    },

    /**
     * Build a gateway source object
     * @param {Object} tokenData The token data
     * @returns {Object} The gateway source
     */
    getSourceObject: function(tokenData) {
        // Source object
        var source = {
            type: 'token',
            token: tokenData.token,
        };

        return source;
    },
};

// Module exports
module.exports = googlePayHelper;
