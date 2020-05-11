"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle the payment request.
     */
    handleRequest: function (orderNumber, paymentData, processorId) {      
        // Load the order information
        var order = OrderMgr.getOrder(orderNumber);

        // Build the request data
        var gatewayRequest = this.buildRequest(order, paymentData, processorId);

        // Log the payment request data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.request.data', 'cko'), gatewayRequest);

        // Perform the request to the payment gateway
        var gatewayResponse = ckoHelper.gatewayClientRequest(
            "cko.card.charge." + ckoHelper.getValue('ckoMode') + ".service",
            gatewayRequest
        );

        // Log the payment response data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.response.data', 'cko'), gatewayResponse);

        // Process the response
        return this.handleResponse(gatewayResponse);
    },

    /*
     * Handle the payment response
     */
    handleResponse: function (gatewayResponse) {
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);
        
        // Get the gateway links
        var gatewayLinks = gatewayResponse._links;
        
        // Prepare the result
        var result = {
            error: !ckoHelper.paymentSuccess(gatewayResponse),
            redirectUrl: false
        }

        // Add 3DS redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
            result.redirectUrl = gatewayLinks.redirect.href;
        } 
        
        return result;
    },
    
    /*
     * Pre authorize card with zero value
     */
    preAuthorizeCard: function(billingData, currentBasket, customerNo, processorId) {
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : ckoHelper.getFormattedNumber(billingData.paymentInformation.cardNumber.value),
                expiry_month        : billingData.paymentInformation.expirationMonth.value,
                expiry_year         : billingData.paymentInformation.expirationYear.value,
                cvv                 : billingData.paymentInformation.securityCode.value
            },
            'amount'                : 0,
            'currency'              : 'USD',
            'capture'               : false,
            'customer'              : {
                email: currentBasket.getCustomerEmail(),
                name: currentBasket.getBillingAddress().getFullName()
            },
            'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
            '3ds'                   : {enabled: false},
            'risk'                  : {enabled: true}
        };
     
        // Log the payment authorization request data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.verification.request.data', 'cko'), chargeData);

        // Send the request
        var authResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            chargeData
        );

        // Log the payment authorization response data
        ckoHelper.doLog(processorId + ' ' + ckoHelper._('cko.verification.response.data', 'cko'), authResponse);

        // Return the response
        var success = ckoHelper.paymentSuccess(authResponse);

        var logger = require('dw/system/Logger').getLogger('ckodebug');
        logger.debug('this is my test billingDatax {0}', JSON.stringify(billingData));

        // If the payment is successful
        if (success && billingData.saveCard) {
            // Save the card
            this.saveCard(
                billingData.paymentInformation,
                customerNo,
                authResponse,
                processorId
            );
        }

        return success;
    },

    /*
     * Build the gateway request
     */
    buildRequest: function (order, paymentData, processorId) {           
        // Prepare the charge data
        var chargeData = {
            'source'                : this.getCardSource(paymentData, order, processorId),
            'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode()),
            'currency'              : order.getCurrencyCode(),
            'reference'             : order.orderNo,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'customer'              : ckoHelper.getCustomer(order),
            'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
            'shipping'              : ckoHelper.getShipping(order),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
            'metadata'              : ckoHelper.getMetadata({}, processorId)
        };   
    
        return chargeData;
    },


    /*
     * Get a card source
     */
    getCardSource: function (paymentData, order, processorId) {              
        // Replace selectedCardUuid by get saved card token from selectedCardUuid
        var cardSource;
        var selectedCardUuid = paymentData.creditCardFields.selectedCardUuid.htmlValue;
        var selectedCardCvv = paymentData.creditCardFields.selectedCardCvv.htmlValue;

        // Get the saved card
        var savedCard = this.getSavedCard(
            selectedCardUuid,
            order.getCustomerNo(),
            processorId
        );

        // If the saved card data is valid
        if (selectedCardCvv.length > 0 && selectedCardUuid.length > 0 && savedCard) {
            cardSource = {
                type: 'id',
                id: savedCard.getCreditCardToken(),
                cvv: selectedCardCvv
            };
        }
        else {
            cardSource = {
                type                : 'card',
                number              : ckoHelper.getFormattedNumber(paymentData.creditCardFields.cardNumber.value.toString()),
                expiry_month        : paymentData.creditCardFields.expirationMonth.value.toString(),
                expiry_year         : paymentData.creditCardFields.expirationYear.value.toString(),
                cvv                 : paymentData.creditCardFields.securityCode.value.toString()
            };
        }

        return cardSource;
    },

    /*
     * Build 3ds object
     */
    get3Ds: function () {
        return {
            'enabled' : ckoHelper.getValue('cko3ds'),
            'attempt_n3d' : ckoHelper.getValue('ckoN3ds')
        }
    },

    /*
     * Get a customer saved card
     */
    getSavedCard: function (cardUuid, customerNo, processorId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(processorId);

        // Match the saved card
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (card.getUUID() == cardUuid) {
                return card;
            }
        } 
        
        return null;
    },

    /*
     * Save a card in customer account
     */
    saveCard: function (paymentInformation, customerNo, authResponse, processorId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(processorId);

        // Check for duplicates
        var cardExists = false;
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (card.getCreditCardToken() == authResponse.source.id) {
                cardExists = true;
                break;
            }
        }       

        // Create a stored payment instrument
        if (!cardExists) {
            Transaction.wrap(function () {
                var storedPaymentInstrument = wallet.createPaymentInstrument(processorId);
                storedPaymentInstrument.setCreditCardNumber(paymentInformation.cardNumber.value);
                storedPaymentInstrument.setCreditCardType(authResponse.source.scheme.toLowerCase());
                storedPaymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
                storedPaymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);
                storedPaymentInstrument.setCreditCardToken(authResponse.source.id);
            });
        }
    }
}

/*
* Module exports
*/
module.exports = cardHelper;