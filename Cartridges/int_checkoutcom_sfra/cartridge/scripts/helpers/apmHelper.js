"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions APM.
*/
var apmHelper = {
    /*
     * Apm Request
     */
    handleRequest: function (apmConfigData, processorId, orderNumber) {
        // Load the order
        var order = OrderMgr.getOrder(orderNumber);

        // Create the payment request
        var gatewayRequest = this.getApmRequest(order, processorId, apmConfigData);

        // Test SEPA
        if (gatewayRequest.source.type == "sepa") {
            gatewayRequest['billing_address'] = ckoHelper.getBilling({order: order});
            gatewayRequest['type'] = apmConfigData.type;
            gatewayRequest['source_data'] = apmConfigData.source_data;
        }

        // Test Klarna
        else if (gatewayRequest.source.type == "klarna") {
            gatewayRequest['capture'] = false;
        }
        // Perform the request to the payment gateway
        gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", gatewayRequest);

        // Log the SEPA payment response data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

        // Process the response
        return this.handleResponse(gatewayResponse);
    },

    /*
     * Handle the payment response
     */
    handleResponse: function (gatewayResponse) {
        // Prepare the result
        var result = {
            error: true,
            redirectUrl: false
        }

        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);

        // Add redirect to sepa source reqeust
        if (gatewayResponse.hasOwnProperty('type') && gatewayResponse.type == 'Sepa') {
            session.privacy.sepaResponseId = gatewayResponse.id;
            result.error = false;
            result.redirectUrl = URLUtils.url('CKOSepa-Mandate').toString();
        }

        // Add redirect URL to session if exists
        else if (gatewayResponse.hasOwnProperty('_links') && gatewayResponse['_links'].hasOwnProperty('redirect')) {
            result.error = false;
            var gatewayLinks = gatewayResponse._links;
            result.redirectUrl = gatewayLinks.redirect.href;
        }

        return result;
    },

    /*
     * Return the APM request data
     */
    getApmRequest: function (order, processorId, apmConfigData) {
        // Charge data
        var chargeData;

        // Get the order amount
        var amount = ckoHelper.getFormattedPrice(
            order.totalGrossPrice.value.toFixed(2),
            order.getCurrencyCode()
        );

        // Prepare the charge data
        chargeData = {
            "customer"              : ckoHelper.getCustomer(order),
            "amount"                : amount,
            "currency"              : order.getCurrencyCode(),
            "source"                : apmConfigData.source,
            "reference"             : order.orderNo,
            "metadata"              : ckoHelper.getMetadata({}, processorId),
            "billing_descriptor"    : ckoHelper.getBillingDescriptor()
        };
        
        // Test Klarna
        if (apmConfigData.type == 'klarna') {
            chargeData.capture = false;
        }

        return chargeData;
    },

    /*
     * Sepa APM request
     */
    handleSepaRequest: function (payObject, order) {
        // Gateway response
        var gatewayResponse = false;

        // Perform the request to the payment gateway
        gatewayResponse = ckoHelper.gatewayClientRequest("cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service", payObject);

        // If the charge is valid, process the response
        if (gatewayResponse) {
            ckoHelper.doLog(ckoHelper._('cko.response.data', 'cko'), gatewayResponse);
            this.handleResponse(gatewayResponse, order);
        } else {
            // Update the transaction
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });

            // Restore the cart
            ckoHelper.checkAndRestoreBasket(order);

            return false;
        }

        return true;
    }
}

/*
* Module exports
*/

module.exports = apmHelper;
