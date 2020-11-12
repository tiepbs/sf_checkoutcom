'use strict';

// API Includes
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * APM utility funnctions.
 */
var apmHelper = {
    /**
     * Creates Site Genesis Transaction Object.
     * @param {Object} payObject The transaction parameters
     * @param {Object} args The transaction arguments
     * @returns {boolean} Payment success or failure
     */
    apmAuthorization: function(payObject, args) {
        // Perform the charge
        var apmRequest = this.handleApmRequest(payObject, args);

        // Handle apm result
        if (apmRequest) {
            if (this.handleApmChargeResponse(apmRequest)) {
                // eslint-disable-next-line
                if (session.privacy.redirectUrl) {
                    // Set the redirection template
                    var templatePath;
                    if (Object.prototype.hasOwnProperty.call(payObject, 'type') && payObject.type === 'sepa') {
                        templatePath = 'redirects/sepaMandate.isml';
                    } else {
                        templatePath = 'redirects/apm.isml';
                    }

                    // Redirect
                    ISML.renderTemplate(templatePath, {
                        redirectUrl: session.privacy.redirectUrl // eslint-disable-line
                    });

                    return { authorized: true, redirected: true };
                }

                return { authorized: true };
            }

            return false;
        }

        return false;
    },

    /**
     * Handle APM charge Response from CKO API.
     * @param {Object} gatewayResponse The gateway response
     * @returns {boolean} Payment success or failure
     */
    handleApmChargeResponse: function(gatewayResponse) {
        // Clean the session
        // eslint-disable-next-line
        session.privacy.redirectUrl = null;

        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);

        // Get the response links
        // eslint-disable-next-line
        var gatewayLinks = gatewayResponse._links;

        // Get the response type
        var type = gatewayResponse.type;

        // Add redirect to sepa source reqeust
        if (type === 'Sepa') {
            session.privacy.redirectUrl = "${URLUtils.url('CKOSepa-Mandate')}"; // eslint-disable-line
            session.privacy.sepaResponseId = gatewayResponse.id; // eslint-disable-line
        }

        // Add redirect URL to session if exists
        if (Object.prototype.hasOwnProperty.call(gatewayLinks, 'redirect')) {
            // eslint-disable-next-line
            session.privacy.redirectUrl = gatewayLinks.redirect.href;

            return ckoHelper.paymentSuccess(gatewayResponse);
        }

        return ckoHelper.paymentSuccess(gatewayResponse);
    },

    /**
     * Apm Request.
     * @param {Object} payObject The transaction parameters
     * @param {Object} args The transaction arguments
     * @returns {Object} The gateway response
     */
    handleApmRequest: function(payObject, args) {
        // Gateway response
        var gatewayResponse = false;
        var serviceName;

        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Creating billing address object
        var gatewayRequest = this.getApmRequest(payObject, args);

        // Log the payment request data
        ckoHelper.log(serviceName + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

        // Prepare the service name (test for SEPA)
        serviceName = Object.prototype.hasOwnProperty.call(payObject, 'type') && payObject.type === 'sepa'
        ? 'cko.card.sources.'
        : 'cko.card.charge.';

        // Perform the request to the payment gateway
        serviceName += ckoHelper.getValue('ckoMode') + '.service';
        gatewayResponse = ckoHelper.gatewayClientRequest(serviceName, gatewayRequest);

        // Log the payment response data
        ckoHelper.log(serviceName + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

        // If the charge is valid, process the response
        if (gatewayResponse) {
            return gatewayResponse;
        }

        // Update the transaction
        Transaction.wrap(function() {
            OrderMgr.failOrder(order, true);
        });

        return null;
    },

    /**
     * Return the APM request data.
     * @param {Object} payObject The transaction parameters
     * @param {Object} args The transaction arguments
     * @returns {Object} The gateway request
     */
    getApmRequest: function(payObject, args) {
        // Charge data
        var chargeData = false;

        // Load the order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Load the currency and amount
        var amount = ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), payObject.currency);

        // Object APM is SEPA
        if (Object.prototype.hasOwnProperty.call(payObject, 'type') && payObject.type === 'sepa') {
            // Prepare the charge data
            chargeData = {
                customer: ckoHelper.getCustomer(args),
                amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), payObject.currency),
                type: payObject.type,
                currency: payObject.currency,
                billing_address: ckoHelper.getBillingObject(args),
                source_data: payObject.source_data,
                reference: args.OrderNo,
                payment_ip: ckoHelper.getHost(args),
                metadata: ckoHelper.getMetadataObject(payObject, args),
                billing_descriptor: ckoHelper.getBillingDescriptorObject(),
                udf5: ckoHelper.getMetadataString(payObject, args),
            };
        } else if (Object.prototype.hasOwnProperty.call(payObject, 'type') && payObject.source.type === 'klarna') {
            // Prepare chargeData object
            chargeData = {
                customer: ckoHelper.getCustomer(args),
                amount: amount,
                currency: payObject.currency,
                capture: false,
                source: payObject.source,
                reference: args.OrderNo,
                payment_ip: ckoHelper.getHost(args),
                metadata: ckoHelper.getMetadataObject(payObject, args),
                billing_descriptor: ckoHelper.getBillingDescriptorObject(),
            };
        } else {
            // Prepare chargeData object
            chargeData = {
                customer: ckoHelper.getCustomer(args),
                amount: amount,
                currency: payObject.currency,
                source: payObject.source,
                reference: args.OrderNo,
                payment_ip: ckoHelper.getHost(args),
                metadata: ckoHelper.getMetadataObject(payObject, args),
                billing_descriptor: ckoHelper.getBillingDescriptorObject(),
            };
        }

        return chargeData;
    },

    /**
     * Sepa controller Request.
     * @param {Object} payObject The transaction parameters
     * @param {Object} order The order instance
     * @returns {Object} The gateway response
     */
    handleSepaControllerRequest: function(payObject, order) {
        // Gateway response
        var gatewayResponse = null;

        // Perform the request to the payment gateway
        gatewayResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            payObject
        );

        // If the charge is valid, process the response
        if (gatewayResponse) {
            return gatewayResponse;
        }

        // Update the transaction
        Transaction.wrap(function() {
            OrderMgr.failOrder(order, true);
        });

        return null;
    },
};

// Module exports
module.exports = apmHelper;
