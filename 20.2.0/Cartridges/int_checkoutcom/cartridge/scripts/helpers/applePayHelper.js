'use strict';


// API Includes
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Module applePayHelper
 */
var applePayHelper = {
    /**
     * Handle full charge Request to CKO API
     * @param {Object} args The request arguments
     * @returns {Object} The gateway response
     */
    handleRequest: function(args) {
        // Prepare the parameters
        var order = OrderMgr.getOrder(args.OrderNo);
        var paymentInstrument = args.PaymentInstrument;
        var ckoApplePayData = paymentInstrument.paymentTransaction.custom.ckoApplePayData;
        var serviceName;

        // Prepare the parameters
        var requestData = {
            type: 'applepay',
            token_data: JSON.parse(ckoApplePayData),
        };

        // Perform the request to the payment gateway
        serviceName = 'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service';

        // Log the token request data
        ckoHelper.log(serviceName + ' ' + ckoHelper._('cko.request.data', 'cko'), requestData);

        // Get the payment response
        var tokenResponse = ckoHelper.gatewayClientRequest(
            serviceName,
            requestData
        );

        // Log the token response data
        ckoHelper.log(serviceName + ' ' + ckoHelper._('cko.response.data', 'cko'), tokenResponse);

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

            // Log the payment request data
            ckoHelper.log(serviceName + ' ' + ckoHelper._('cko.request.data', 'cko'), requestData);

             // Perform the request to the payment gateway
            serviceName = 'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service';
            var gatewayResponse = ckoHelper.gatewayClientRequest(
                serviceName,
                chargeData
            );

            // Log the payment response data
            ckoHelper.log(serviceName + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

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
     * Build Gateway Source Object
     * @param {Object} tokenData The token data
     * @returns {Object} The source object
     */
    getSourceObject: function(tokenData) {
        var source = {
            type: 'token',
            token: tokenData.token,
        };

        return source;
    },
};

// Module exports
module.exports = applePayHelper;
