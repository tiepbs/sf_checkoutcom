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
        var gatewayResponse = null;
        var order = OrderMgr.getOrder(orderNumber);
        var serviceId = 'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service';

        // Create the payment request
        var gatewayRequest = this.getApmRequest(order, processorId, apmConfigData);

        // Log the payment request data
        ckoHelper.log(
            processorId + ' ' + ckoHelper._('cko.request.data', 'cko'),
            gatewayRequest
        );

        // Test the APM type
        var condition1 = Object.prototype.hasOwnProperty.call(gatewayRequest, 'type');
        var condition2 = Object.prototype.hasOwnProperty.call(gatewayRequest, 'source')
        && Object.prototype.hasOwnProperty.call(gatewayRequest.source, 'type');

        // Set the service id
        if (condition1 || condition2) {
            if (gatewayRequest.type === 'sepa') {
                serviceId = 'cko.card.sources.' + ckoHelper.getValue('ckoMode') + '.service';
            }

            // Perform the request to the payment gateway
            gatewayResponse = ckoHelper.gatewayClientRequest(
                serviceId,
                gatewayRequest
            );
        }

        // Log the payment response data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

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

        // Handle the response
        if (gatewayResponse && Object.prototype.hasOwnProperty.call(gatewayResponse, 'id')) {
            // Update the response state
            result.error = false;

            // Update customer data
            ckoHelper.updateCustomerData(gatewayResponse);

            // Test the SEPA redirection
            var condition1 = Object.prototype.hasOwnProperty.call(gatewayResponse, 'type')
            && gatewayResponse.type === 'Sepa';

            // Test other redirections
            var condition2 = Object.prototype.hasOwnProperty.call(gatewayResponse, '_links')
            && Object.prototype.hasOwnProperty.call(gatewayResponse._links, 'redirect');

            // Handle the redirection logic
            if (condition1) {
                result.redirectUrl = URLUtils.url('CKOSepa-Mandate').toString()
                + '?orderNumber=' + orderNumber
                + '&sepaResponseId=' + gatewayResponse.id;
            } else if (condition2) {
                result.redirectUrl = gatewayResponse._links.redirect.href;
            }
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
