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
    handleRequest: function(paymentData, processorId, orderNumber) {
        // Load the order information
        var order = OrderMgr.getOrder(orderNumber);
        var gatewayResponse = null;
        var gatewayRequest = null;

        // Prepare the parameters
        var tokenRequest = {
            type: 'applepay',
            token_data: paymentData,
        };

        // Log the payment token request data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.tokenrequest.data', 'cko'), tokenRequest);

        // Perform the request to the payment gateway
        var tokenResponse = ckoHelper.gatewayClientRequest(
            'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
            JSON.stringify(tokenRequest)
        );

        // Log the payment token response data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.tokenresponse.data', 'cko'), tokenResponse);

        // If the request is valid, process the response
        if (tokenResponse && Object.prototype.hasOwnProperty.call(tokenResponse, 'token')) {
            var args = {
                OrderNo: orderNumber
            }
            gatewayRequest = {
                source: {
                    type: 'token',
                    token: tokenResponse.token,
                },
                amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
                currency: order.getCurrencyCode(),
                reference: order.orderNo,
                capture: ckoHelper.getValue('ckoAutoCapture'),
                capture_on: ckoHelper.getCaptureTime(),
                customer: ckoHelper.getCustomer(args),
                billing_descriptor: ckoHelper.getBillingDescriptorObject(),
                shipping: ckoHelper.getShippingObject(args),
                metadata: ckoHelper.getApplePayMetadata({}, processorId)
            };

            // Log the payment request data
            ckoHelper.log(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest(
                'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
                gatewayRequest
            );
        }

        // Log the payment response data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayRequest);

        // Process the response
        return this.handleResponse(gatewayResponse);
    },

    /**
     * Handle the payment response.
     * @param {Object} gatewayResponse The gateway response data
     * @returns {Object} The payment success or failure
     */
    handleResponse: function(gatewayResponse) {
        // Prepare the result
        var result = ckoHelper.paymentSuccess(gatewayResponse);

        // Update customer data
        if (result) {
            ckoHelper.updateCustomerData(gatewayResponse);
        } else {
            // Update the transaction
            Transaction.wrap(function() {
                OrderMgr.failOrder(order, true);
            });
        }

        return result;
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
