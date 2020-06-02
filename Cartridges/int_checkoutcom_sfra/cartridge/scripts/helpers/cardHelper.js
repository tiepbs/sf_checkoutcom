"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle the payment request.
     */
    handleRequest: function (paymentData, processorId, orderNumber, req) {  
        // Order number
        orderNumber = orderNumber || null;

        // Build the request data
        var gatewayRequest = this.buildRequest(paymentData, processorId, orderNumber, req);

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

        // Handle the response
        if (gatewayResponse) {
            // Update customer data
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
     * Build the gateway request
     */
    buildRequest: function (paymentData, processorId, orderNumber, req) {
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
    
        // Handle the save card request
        if (paymentData.creditCardFields.saveCard.value) {
            // Save the card
            var uuid = this.saveCard(
                paymentData,
                req
            );

            // Update the metadata
            chargeData.metadata.card_uuid = uuid;
            chargeData.metadata.customer_id = req.currentCustomer.profile.customerNo;
        }

        return chargeData;
    },


    /*
     * Get a card source
     */
    getCardSource: function (paymentData, order, processorId) {              
        // Replace selectedCardUuid by get saved card token from selectedCardUuid
        var cardSource;
        var selectedCardUuid = paymentData.savedCardForm.selectedCardUuid.value;
        var selectedCardCvv = paymentData.savedCardForm.selectedCardCvv.value;

        // If the saved card data is valid
        var condition1 = selectedCardCvv && selectedCardCvv.length > 0;
        var condition2 = selectedCardUuid && selectedCardUuid.length > 0;
        if (condition1 && condition2) {
            // Get the saved card
            var savedCard = this.getSavedCard(
                selectedCardUuid.toString(),
                order.getCustomerNo(),
                processorId
            );
           
            cardSource = {
                type: 'id',
                id: savedCard.getCreditCardToken(),
                cvv: selectedCardCvv.toString()
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
    getSavedCard: function (cardUuid, customerNo, methodId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(methodId);

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
     * Get all customer saved cards
     */
    getSavedCards: function (customerNo, methodId) {
        // Prepare the processor id
        var processorId = methodId || 'CHECKOUTCOM_CARD';

        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(processorId);
        
        // Prepare the return value
        var cards = [];

        // Match the saved cards
        for (var i = 0; i < paymentInstruments.length; i++) {
            var paymentInstrument = paymentInstruments[i];
            var condition = (processorId) ? paymentInstrument.paymentMethod == processorId : true;
            if (condition) {
                // Card data
                var card = {
                    creditCardHolder: paymentInstrument.creditCardHolder,
                    maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                    creditCardType: paymentInstrument.creditCardType,
                    creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                    creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
                    UUID: paymentInstrument.UUID,
                    paymentMethod: paymentInstrument.paymentMethod
                };

                // Card image
                card.cardTypeImage = {
                    src: URLUtils.staticURL('/images/' +
                    paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                        '-dark.svg'),
                    alt: paymentInstrument.creditCardType
                };

                cards.push(card);
            }
        } 

        return cards;
    },

    /*
     * Save a card in customer account
     */
    saveCard: function (paymentData, req) {
        // Get the customer profile
        var customerNo = req.currentCustomer.profile.customerNo;
        var customerProfile = CustomerMgr.getCustomerByCustomerNumber(customerNo).getProfile();
        var processorId = paymentData.paymentMethod.value;
    
        // Build the customer full name
        var fullName = this.getCustomerFullName(customerProfile); 
    
        // Get the customer wallet
        var wallet = customerProfile.getWallet();

        // The return value
        var uuid;
        
        // Create a stored payment instrument
        Transaction.wrap(function () {
            var storedPaymentInstrument = wallet.createPaymentInstrument(processorId);
            storedPaymentInstrument.setCreditCardHolder(fullName);
            storedPaymentInstrument.setCreditCardNumber(paymentData.creditCardFields.cardNumber.value);
            storedPaymentInstrument.setCreditCardExpirationMonth(paymentData.creditCardFields.expirationMonth.value);
            storedPaymentInstrument.setCreditCardExpirationYear(paymentData.creditCardFields.expirationYear.value);
            storedPaymentInstrument.setCreditCardType(paymentData.creditCardFields.cardType.value.toLowerCase());
            uuid = storedPaymentInstrument.getUUID();
        });

        return uuid;
    },

    /*
     * Update a card in customer account
     */
    updateSavedCard: function (hook) {
        var condition1 = hook.data.metadata.hasOwnProperty('card_uuid');
        var condition2 = hook.data.metadata.hasOwnProperty('customer_id');
        if (condition1 && condition2) {                
            // Get the card
            var card = this.getSavedCard(
                hook.data.metadata.card_uuid,
                hook.data.metadata.customer_id,
                hook.data.metadata.payment_processor
            );
        
            // Create a stored payment instrument
            if (card) {     
                Transaction.wrap(function () {
                    card.setCreditCardToken(hook.data.source.id);
                });
            }
        }
    },

    getRenderedPaymentInstruments: function (req, accountModel) {
        var result;
    
        if (req.currentCustomer.raw.authenticated
            && req.currentCustomer.raw.registered
            && req.currentCustomer.raw.profile.wallet.paymentInstruments.getLength()
        ) {
            var context;
            var template = 'checkout/billing/paymentOptions/forms/savedCardForm';
    
            context = { customer: accountModel };
            result = renderTemplateHelper.getRenderedHtml(
                context,
                template
            );
        }
    
        return result || null;
    },

    getCustomerFullName: function(customerProfile) { 
        var customerName = '';
        customerName += customerProfile.firstName;
        customerName += ' ' + customerProfile.lastName;
        
        return customerName;
    }
}

/*
* Module exports
*/
module.exports = cardHelper;