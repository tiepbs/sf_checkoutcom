'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functionss.
*/
var apmHelper = {
    /**
     * Handle the payment request.
     * @param {Object} apmConfigData The payment data
     * @param {string} processorId The processor ID
     * @param {string} orderNumber The order number
     * @returns {boolean} The request success or failure
     */
    handleRequest: function(apmConfigData, processorId, orderNumber) {
        // Prepare required parameters
        var gatewayResponse;
        var order = OrderMgr.getOrder(orderNumber);

        // Create the payment request
        var gatewayRequest = this.getApmRequest(order, processorId, apmConfigData);

        // Test SEPA
        if (Object.prototype.hasOwnProperty.call(gatewayRequest, 'type') & gatewayRequest.type === 'sepa') {
            gatewayResponse = ckoHelper.gatewayClientRequest('cko.card.sources.' + ckoHelper.getValue('ckoMode') + '.service', gatewayRequest);
        } else {
            // Test Klarna
            if (gatewayRequest.source.type === 'klarna') {
                gatewayRequest.capture = false;
            }

            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest('cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service', gatewayRequest);
        }

        // Process the response
        return this.handleResponse(gatewayResponse, orderNumber);
    },

    /**
     * Handle the payment response.
     * @param {Object} gatewayResponse The gateway response data
     * @param {string} orderNumber The order number
     * @returns {Object} The payment result
     */
    handleResponse: function(gatewayResponse, orderNumber) {
        // Prepare the result
        var result = {
            error: true,
            redirectUrl: false,
        };

        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);

        // Add redirect to sepa source reqeust
        if (Object.prototype.hasOwnProperty.call(gatewayResponse, 'type') && gatewayResponse.type === 'Sepa') {
            result.error = false;
            result.redirectUrl = URLUtils.url('CKOSepa-Mandate').toString()
            + '?orderNumber=' + orderNumber + '&sepaResponseId=' + gatewayResponse.id;
        } else if (Object.prototype.hasOwnProperty.call(gatewayResponse, '_links') && Object.prototype.hasOwnProperty.call(gatewayResponse._links, 'redirect')) {
            result.error = false;
            var gatewayLinks = gatewayResponse._links;
            result.redirectUrl = gatewayLinks.redirect.href;
        }

        return result;
    },

    /**
     * Return the APM request data.
     * @param {Object} order The order instance
     * @param {string} processorId The processor ID
     * @param {string} apmConfigData The APM config data
     * @returns {Object} The payment request data
     */
    getApmRequest: function(order, processorId, apmConfigData) {
        // Charge data
        var chargeData;

        // Get the order amount
        var amount = ckoHelper.getFormattedPrice(
            order.totalGrossPrice.value.toFixed(2),
            order.getCurrencyCode()
        );

        // Prepare the charge data
        if (Object.prototype.hasOwnProperty.call(apmConfigData, 'type') && apmConfigData.type === 'sepa') {
            // Prepare the charge data
            chargeData = {
                customer: ckoHelper.getCustomer(order),
                amount: amount,
                type: apmConfigData.type,
                currency: order.getCurrencyCode(),
                billing_address: apmConfigData.billingAddress,
                source_data: apmConfigData.source_data,
                reference: order.orderNo,
                metadata: ckoHelper.getMetadata({}, processorId),
                billing_descriptor: ckoHelper.getBillingDescriptor(),
            };
        } else {
            // Prepare chargeData object
            chargeData = {
                customer: ckoHelper.getCustomer(order),
                amount: amount,
                currency: order.getCurrencyCode(),
                source: apmConfigData.source,
                reference: order.orderNo,
                metadata: ckoHelper.getMetadata({}, processorId),
                billing_descriptor: ckoHelper.getBillingDescriptor(),
            };

            // Test Klarna
            if (chargeData.source.type === 'klarna') {
                chargeData.capture = false;
            }
        }

        return chargeData;
    },

    /**
     * Handle the SEPA payment request.
     * @param {Object} payObject The payment data
     * @param {string} order The order instance
     * @returns {boolean} The request success or failure
     */
    handleSepaRequest: function(payObject, order) {
        // Gateway response
        var gatewayResponse = false;

        // Perform the request to the payment gateway
        gatewayResponse = ckoHelper.gatewayClientRequest('cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service', payObject);

        // If the charge is valid, process the response
        if (gatewayResponse) {
            this.handleResponse(gatewayResponse, order);
        } else {
            // Update the transaction
            Transaction.wrap(function() {
                OrderMgr.failOrder(order, true);
            });

            return false;
        }

        return true;
    },
};

/**
 * Module exports
 */
module.exports = apmHelper;
