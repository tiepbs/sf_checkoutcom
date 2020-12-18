'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var savedCardHelper = require('~/cartridge/scripts/helpers/savedCardHelper');

/**
 * Utility functions.
 */
var cardHelper = {
    /**
     * Handle the payment request.
     * @param {Object} paymentInstrument The payment data
     * @param {string} paymentProcessor The processor ID
     * @param {string} orderNumber The order number
     * @returns {boolean} The request success or failure
     */
    handleRequest: function(orderNumber, paymentInstrument, paymentProcessor) {

        // Build the request data
        var gatewayRequest = this.buildRequest(orderNumber, paymentInstrument, paymentProcessor.ID);

        // Log the payment request data
        ckoHelper.log(paymentProcessor.ID + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            gatewayRequest
        );

        // Log the payment response data
        ckoHelper.log(paymentProcessor.ID + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

        // Process the response
        return this.handleResponse(gatewayResponse);
    },

    /**
     * Handle the payment response.
     * @param {Object} gatewayResponse The gateway response data
     * @returns {Object} The payment result
     */
    handleResponse: function(gatewayResponse) {
        // Prepare the result
        var result = {
            error: !ckoHelper.paymentSuccess(gatewayResponse),
            message: gatewayResponse.response_summary ? ckoHelper.errorMessage(gatewayResponse.response_summary.toLowerCase()) : '',
            code: gatewayResponse.response_code,
            redirectUrl: false,
        };

        // Handle the response
        if (gatewayResponse) {
            // Update customer data
            ckoHelper.updateCustomerData(gatewayResponse);

            // Add 3DS redirect URL to session if exists
            var condition1 = Object.prototype.hasOwnProperty.call(gatewayResponse, '_links');
            var condition2 = condition1 && Object.prototype.hasOwnProperty.call(gatewayResponse._links, 'redirect');
            if (condition2) {
                result.error = false;
                // eslint-disable-next-line
                result.redirectUrl = gatewayResponse._links.redirect.href;
            }
        }

        return result;
    },

    /**
     * Build the gateway request.
     * @param {Object} paymentInstrument The payment data
     * @param {string} paymentProcessor The processor ID
     * @param {string} orderNumber The order number
     * @returns {Object} The payment request data
     */
    buildRequest: function(orderNumber, paymentInstrument, paymentProcessor) {
        // Load the order
        var order = OrderMgr.getOrder(orderNumber);
        var paymentData = JSON.parse(paymentInstrument.custom.ckoPaymentData); 

        // Prepare the charge data
        var chargeData = {
            source: this.getCardSource(paymentInstrument),
            amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
            currency: order.getCurrencyCode(),
            reference: orderNumber,
            capture: ckoHelper.getValue('ckoAutoCapture'),
            capture_on: ckoHelper.getCaptureTime(),
            customer: ckoHelper.getCustomer(order),
            billing_descriptor: ckoHelper.getBillingDescriptor(),
            shipping: ckoHelper.getShipping(order),
            '3ds': (paymentData.madaCard === true) ? { enabled: true } : this.get3Ds(),
            risk: { enabled: Site.getCurrent().getCustomPreferenceValue('ckoEnableRiskFlag') },
            success_url: URLUtils.https('CKOMain-HandleReturn').toString(),
            failure_url: URLUtils.https('CKOMain-HandleFail').toString(),
            metadata: ckoHelper.getMetadata({}, paymentProcessor),
        };

        var paymentData = JSON.parse(paymentInstrument.custom.ckoPaymentData);

        // Handle the save card request
        if (paymentData.saveCard) {

            // Update the metadata
            chargeData.metadata.card_uuid = paymentData.storedPaymentUUID;
            chargeData.metadata.customer_id = paymentData.customerNo;
        }

        return chargeData;
    },

    /**
     * Get a card source.
     * @param {Object} paymentInstrument The payment data
     * @returns {Object} The card source
     */
    getCardSource: function(paymentInstrument) {
        // Replace selectedCardUuid by get saved card token from selectedCardUuid
        var cardSource;
        var paymentData = JSON.parse(paymentInstrument.custom.ckoPaymentData);

        if (paymentData.securityCode && paymentData.saveCard) {

            cardSource = {
                type: 'id',
                id: paymentInstrument.creditCardToken,
                cvv: paymentData.securityCode,
            };
        } else {
            cardSource = {
                type: 'card',
                number: paymentInstrument.creditCardNumber,
                expiry_month: paymentInstrument.creditCardExpirationMonth,
                expiry_year: paymentInstrument.creditCardExpirationYear,
                cvv: paymentData.securityCode,
            };
        }

        return cardSource;
    },

    /**
     * Build a 3ds object.
     * @returns {Object} The 3ds parameters
     */
    get3Ds: function() {
        return {
            enabled: ckoHelper.getValue('cko3ds'),
            attempt_n3d: ckoHelper.getValue('ckoN3ds'),
        };
    },
};

/**
 * Module exports
 */
module.exports = cardHelper;
