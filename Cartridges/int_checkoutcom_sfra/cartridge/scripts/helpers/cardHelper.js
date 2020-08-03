'use strict';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var savedCardHelper = require('~/cartridge/scripts/helpers/savedCardHelper');

/**
 * Utility functions.
 */
var cardHelper = {
    /**
     * Handle the payment request.
     * @param {Object} paymentData The payment data
     * @param {string} processorId The processor ID
     * @param {string} orderNumber The order number
     * @param {Object} req The HTTP request data
     * @returns {boolean} The request success or failure
     */
    handleRequest: function(paymentData, processorId, orderNumber, req) {
        // Order number
        // eslint-disable-next-line
        orderNumber = orderNumber || null;

        // Build the request data
        var gatewayRequest = this.buildRequest(paymentData, processorId, orderNumber, req);

        // Log the payment request data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            gatewayRequest
        );

        // Log the payment response data
        ckoHelper.log(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

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
     * @param {Object} paymentData The payment data
     * @param {string} processorId The processor ID
     * @param {string} orderNumber The order number
     * @param {Object} req The HTTP request data
     * @returns {Object} The payment request data
     */
    buildRequest: function(paymentData, processorId, orderNumber, req) {
        // Load the order
        var order = OrderMgr.getOrder(orderNumber);

        // Prepare the charge data
        var chargeData = {
            source: this.getCardSource(paymentData, order, processorId),
            amount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
            currency: order.getCurrencyCode(),
            reference: order.orderNo,
            capture: ckoHelper.getValue('ckoAutoCapture'),
            capture_on: ckoHelper.getCaptureTime(),
            customer: ckoHelper.getCustomer(order),
            billing_descriptor: ckoHelper.getBillingDescriptor(),
            shipping: ckoHelper.getShipping(order),
            '3ds': this.get3Ds(),
            risk: { enabled: true },
            success_url: URLUtils.https('CKOMain-HandleReturn').toString(),
            failure_url: URLUtils.https('CKOMain-HandleFail').toString(),
            metadata: ckoHelper.getMetadata({}, processorId),
        };

        // Handle the save card request
        if (paymentData.creditCardFields.saveCard.value) {
            // Save the card
            var uuid = savedCardHelper.saveCard(
                paymentData,
                req
            );

            // Update the metadata
            chargeData.metadata.card_uuid = uuid;
            chargeData.metadata.customer_id = req.currentCustomer.profile.customerNo;
        }

        return chargeData;
    },

    /**
     * Get a card source.
     * @param {Object} paymentData The payment data
     * @param {Object} order The order instance
     * @param {string} processorId The processor ID
     * @returns {Object} The card source
     */
    getCardSource: function(paymentData, order, processorId) {
        // Replace selectedCardUuid by get saved card token from selectedCardUuid
        var cardSource;
        var selectedCardUuid = paymentData.savedCardForm.selectedCardUuid.value;
        var selectedCardCvv = paymentData.savedCardForm.selectedCardCvv.value;

        // If the saved card data is valid
        var condition1 = selectedCardCvv && selectedCardCvv.length > 0;
        var condition2 = selectedCardUuid && selectedCardUuid.length > 0;
        if (condition1 && condition2) {
            // Get the saved card
            var savedCard = savedCardHelper.getSavedCard(
                selectedCardUuid.toString(),
                order.getCustomerNo(),
                processorId
            );

            cardSource = {
                type: 'id',
                id: savedCard.getCreditCardToken(),
                cvv: selectedCardCvv.toString(),
            };
        } else {
            cardSource = {
                type: 'card',
                number: ckoHelper.getFormattedNumber(paymentData.creditCardFields.cardNumber.value.toString()),
                expiry_month: paymentData.creditCardFields.expirationMonth.value.toString(),
                expiry_year: paymentData.creditCardFields.expirationYear.value.toString(),
                cvv: paymentData.creditCardFields.securityCode.value.toString(),
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
