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
    handleRequest: function (paymentData, processorId, orderNumber) {  
        // Check for 0$ auth
        orderNumber = orderNumber || null;

        // Build the request data
        var gatewayRequest = this.buildRequest(paymentData, processorId, orderNumber);

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
        // Prepare the result
        var result = {
            error: !ckoHelper.paymentSuccess(gatewayResponse),
            redirectUrl: false
        }

        // Update customer data
        if (gatewayResponse) {
            ckoHelper.updateCustomerData(gatewayResponse);

            // Add 3DS redirect URL to session if exists
            var condition1 = gatewayResponse.hasOwnProperty('_links');
            var condition2 = condition1 && gatewayResponse._links.hasOwnProperty('redirect');
            if (condition1 && condition2) {
                result.error = false;
                result.redirectUrl = gatewayResponse._links.redirect.href;
            }
        }

        return result;
    },
    
    /*
     * Pre authorize card with zero value
     */
    preAuthorizeCard: function(billingData, customerNo, processorId, currentBasket) {
        // Handle the basket state
        currentBasket =  currentBasket || null;

        // Prepare the charge data
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
            'billing_descriptor'    : ckoHelper.getBillingDescriptor(),
            '3ds'                   : {enabled: false},
            'risk'                  : {enabled: true}
        };

        // Add customer information if available
        if (currentBasket) {
            chargeData.customer = {
                email: currentBasket.getCustomerEmail(),
                name: currentBasket.getBillingAddress().getFullName()
            };
        }
     
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

        // If the payment is successful
        if (success && billingData.saveCard) {
            // Save the card
            this.saveCard(
                billingData.paymentInformation,
                currentBasket,
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
    buildRequest: function (paymentData, processorId, orderNumber) {
        //  Load the order
        var order = OrderMgr.getOrder(orderNumber);
      
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
        var selectedCardUuid = paymentData.savedCardForm.selectedCardUuid.value.toString();
        var selectedCardCvv = paymentData.savedCardForm.selectedCardCvv.value.toString();

        // If the saved card data is valid
        var condition1 = selectedCardCvv && selectedCardCvv.length > 0;
        var condition2 = selectedCardUuid && selectedCardUuid.length > 0;
        if (condition1 && condition2) {
            // Get the saved card
            var savedCard = this.getSavedCard(
                selectedCardUuid,
                order.getCustomerNo(),
                processorId
            );
           
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
    saveCard: function (paymentInformation, currentBasket, customerNo, authResponse, processorId) {
        // Check if the basket exists
        currentBasket = currentBasket || null;

        // Get the customer profile
        var customerProfile = CustomerMgr.getCustomerByCustomerNumber(customerNo).getProfile();

        // Build the customer full name
        var fullName = this.getCustomerFullName(customerProfile, currentBasket); 

        // Get the customer wallet
        var wallet = customerProfile.getWallet();

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
                storedPaymentInstrument.setCreditCardHolder(fullName);
                storedPaymentInstrument.setCreditCardNumber(paymentInformation.cardNumber.value);
                storedPaymentInstrument.setCreditCardType(authResponse.source.scheme.toLowerCase());
                storedPaymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
                storedPaymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);
                storedPaymentInstrument.setCreditCardToken(authResponse.source.id);
            });
        }
    },

    getCustomerFullName: function(customerProfile, currentBasket) { 
        // Check if the basket exists
        currentBasket = currentBasket || null;

        // Build the customer full name
        var customerName = '';
        if (currentBasket.billingAddress.fullName) {
            customerName = currentBasket.billingAddress.fullName;
        }
        else {
            customerName += customerProfile.firstName;
            customerName += customerProfile.secondName.length > 0 ? customerProfile.secondName : '';
            customerName += ' ' + customerProfile.lastName;
        }
        
        return customerName;
    }
}

/*
* Module exports
*/
module.exports = cardHelper;