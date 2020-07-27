'use strict';

// API Includes
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Module cardHelper.
 */
var cardHelper = {
    /**
     * Creates Site Genesis Transaction Object.
     * @param {Object} payObject The payment data
     * @param {Object} args The request parameters
     * @returns {Object} The payment result
     */
    cardAuthorization: function(payObject, args) {
        // Perform the charge
        var cardRequest = this.handleCardRequest(payObject, args);

        // Handle apm result
        if (cardRequest) {
            // eslint-disable-next-line
            if (session.privacy.redirectUrl) {
                // 3ds redirection
                ISML.renderTemplate('redirects/3DSecure.isml', {
                    // eslint-disable-next-line
                    redirectUrl: session.privacy.redirectUrl,
                });

                return { authorized: true, redirected: true };
            }

            return { authorized: true };
        }

        return null;
    },

    /**
     * Handle full charge Request to CKO API.
     * @param {Object} cardData The card data
     * @param {Object} args The request data
     * @returns {Object} The gateway response
     */
    handleCardRequest: function(cardData, args) {
        // Prepare the parameters
        var order = OrderMgr.getOrder(args.OrderNo);
        var serviceName = 'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service';

        // Create billing address object
        var gatewayRequest = this.getCardRequest(cardData, args);

        // Log the payment response data
        ckoHelper.log(
            serviceName + ' - ' + ckoHelper._('cko.request.data', 'cko'),
            gatewayRequest
        );

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            serviceName,
            gatewayRequest
        );

        // If the charge is valid, process the response
        if (gatewayResponse) {
            // Log the payment response data
            ckoHelper.log(
                serviceName + ' - ' + ckoHelper._('cko.response.data', 'cko'),
                gatewayResponse
            );

            // Handle the response
            if (this.handleFullChargeResponse(gatewayResponse)) {
                return gatewayResponse;
            }

            return null;
        }

        // Fail the order
        Transaction.wrap(function() {
            OrderMgr.failOrder(order, true);
        });

        return null;
    },

    /**
     * Handle full charge Response from CKO API.
     * @param {Object} gatewayResponse The gateway response
     * @returns {boolean} The payment success or failure
     */
    handleFullChargeResponse: function(gatewayResponse) {
        // Clean the session
        // eslint-disable-next-line
        session.privacy.redirectUrl = null;

        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);

        // Get the gateway links
        // eslint-disable-next-line
        var gatewayLinks = gatewayResponse._links;

        // Add 3DS redirect URL to session if exists
        if (Object.prototype.hasOwnProperty.call(gatewayLinks, 'redirect')) {
            // Save redirect link to session
            // eslint-disable-next-line
            session.privacy.redirectUrl = gatewayLinks.redirect.href;

            // Check if its a valid response
            return ckoHelper.paymentSuccess(gatewayResponse);
        }

        // Check if its a valid response
        return ckoHelper.paymentSuccess(gatewayResponse);
    },

    /**
     * Build the gateway request.
     * @param {Object} cardData The card data
     * @param {Object} args The request data
     * @returns {Object} The card request data
     */
    getCardRequest: function(cardData, args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Prepare the charge data
        var chargeData = {
            source: this.getSourceObject(cardData, args),
            amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
            currency: ckoHelper.getCurrency(),
            reference: args.OrderNo,
            capture: ckoHelper.getValue('ckoAutoCapture'),
            capture_on: ckoHelper.getCaptureTime(),
            customer: ckoHelper.getCustomer(args),
            billing_descriptor: ckoHelper.getBillingDescriptorObject(),
            shipping: this.getShippingObject(args),
            '3ds': (cardData.type === 'mada') ? { enabled: true } : this.get3Ds(),
            risk: { enabled: true },
            success_url: URLUtils.https('CKOMain-HandleReturn').toString(),
            failure_url: URLUtils.https('CKOMain-HandleFail').toString(),
            payment_ip: ckoHelper.getHost(args),
            metadata: ckoHelper.getMetadataObject(cardData, args),
            udf5: ckoHelper.getMetadataString(cardData, args),
        };

        return chargeData;
    },

    /**
     * Build Gateway Source Object.
     * @param {Object} cardData The card data
     * @param {Object} args The request data
     * @returns {Object} The source object
     */
    getSourceObject: function(cardData, args) {
        // Source object
        var source = {
            type: 'card',
            number: cardData.number,
            expiry_month: cardData.expiryMonth,
            expiry_year: cardData.expiryYear,
            name: cardData.name,
            cvv: cardData.cvv,
            billing_address: this.getBillingObject(args),
            phone: ckoHelper.getPhoneObject(args),
        };

        return source;
    },

    /**
     * Build 3ds object.
     * @returns {Object} The 3ds object
     */
    get3Ds: function() {
        return {
            enabled: ckoHelper.getValue('cko3ds'),
            attempt_n3d: ckoHelper.getValue('ckoN3ds'),
        };
    },

    /**
     * Build the billing object.
     * @param {Object} args The request data
     * @returns {Object} The billing object
     */
    getBillingObject: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();

        // Creating billing address object
        var billingDetails = {
            address_line1: billingAddress.getAddress1(),
            address_line2: billingAddress.getAddress2(),
            city: billingAddress.getCity(),
            state: billingAddress.getStateCode(),
            zip: billingAddress.getPostalCode(),
            country: billingAddress.getCountryCode().value,
        };

        return billingDetails;
    },

    /**
     * Build the shipping object.
     * @param {Object} args The request data
     * @returns {Object} The shipping object
     */
    getShippingObject: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get shipping address object
        var shippingAddress = order.getDefaultShipment().getShippingAddress();

        // Creating address object
        var shippingDetails = {
            address_line1: shippingAddress.getAddress1(),
            address_line2: shippingAddress.getAddress2(),
            city: shippingAddress.getCity(),
            state: shippingAddress.getStateCode(),
            zip: shippingAddress.getPostalCode(),
            country: shippingAddress.getCountryCode().value,
        };

        // Build the shipping object
        var shipping = {
            address: shippingDetails,
            phone: ckoHelper.getPhoneObject(args),
        };

        return shipping;
    },
};

// Module exports
module.exports = cardHelper;
