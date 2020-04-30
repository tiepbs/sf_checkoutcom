"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/*
* Utility functions for my cartridge integration.
*/
var cardHelper = {
    /*
     * Handle full charge Response from CKO API
     */
    handleFullChargeResponse: function (gatewayResponse) {
        // Clean the session
        session.privacy.redirectUrl = null;
        
        // Logging
        ckoHelper.doLog('response', gatewayResponse);
        
        // Update customer data
        ckoHelper.updateCustomerData(gatewayResponse);
        
        // Get the gateway links
        var gatewayLinks = gatewayResponse._links;
        
        // Add 3DS redirect URL to session if exists
        if (gatewayLinks.hasOwnProperty('redirect')) {
            session.privacy.redirectUrl = gatewayLinks.redirect.href;
            return true;
        } 
        
        return ckoHelper.paymentSuccess(gatewayResponse);
    },
    
    /*
     * Pre_Authorize card with zero value
     */
    preAuthorizeCard: function(cardData) {
        var chargeData = {
            'source'                : {
                type                : 'card',
                number              : cardData.cardNumber,
                expiry_month        : cardData.expiryMonth,
                expiry_year         : cardData.expiryYear,
                cvv                 : cardData.cvv
            },
            'amount'                : 0,
            'currency'              : 'USD',
            'capture'               : false,
            '3ds'                   : {enabled: false},
            'risk'                  : {enabled: true}
        };
        
        // Send the request
        var authResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            chargeData
        );
        
        var logger = require('dw/system/Logger').getLogger('ckodebug');
        logger.debug('chargeData {0}', JSON.stringify(chargeData));
        logger.debug('authResponse {0}', JSON.stringify(authResponse));


        // Return the response
        return ckoHelper.paymentSuccess(authResponse);
    },
  
    /*
     * Check if a card needs saving in customer account
     */
    needsCardSaving: function (req) {
        return req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && JSON.parse(req.form.dwfrm_billing_creditCardFields_saveCard)
    },

    /*
     * Check if a card has a source id
     */
    cardHasSourceId: function (card) {
        var sourceId = card.getCreditCardToken();
        return sourceId && sourceId.length > 0;
    },

    /*
     * Get payment card data from request
     */
    buildCardData: function (paymentInformation) {        
        return {
            cardNumber  : ckoHelper.getFormattedNumber(paymentInformation.cardNumber.value),
            expiryMonth : paymentInformation.expirationMonth.value,
            expiryYear  : paymentInformation.expirationYear.value,
            cvv         : paymentInformation.securityCode.value,
            cardType    : paymentInformation.cardType.value
        };
    },

    /*
     * Get payment card data from saved card
     */
    getCardDataFromSaved: function (card, req) {
        return {
            owner       : card.getCreditCardHolder(),
            cardNumber  : card.getCreditCardNumber(),
            expiryMonth : card.getCreditCardExpirationMonth(),
            expiryYear  : card.getCreditCardExpirationYear(),
            cvv         : req.form.selectedCardCvv,
            cardType    : card.getCreditCardType()
        };
    },

    /*
     * Save a card in customer account
     */
    saveCardData: function (req, cardData, paymentMethodId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(paymentMethodId);

        // Check for duplicates
        var isDuplicateCard = false;
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (this.customerCardExists(card, cardData)) {
                isDuplicateCard = true;
                break;
            }
        }       

        // Create a stored payment instrument
        if (!isDuplicateCard) {
            Transaction.begin();
            var storedPaymentInstrument = wallet.createPaymentInstrument(paymentMethodId);
            storedPaymentInstrument.setCreditCardHolder(cardData.owner);
            storedPaymentInstrument.setCreditCardNumber(cardData.cardNumber);
            storedPaymentInstrument.setCreditCardType(cardData.cardType);
            storedPaymentInstrument.setCreditCardExpirationMonth(parseInt(cardData.expiryMonth));
            storedPaymentInstrument.setCreditCardExpirationYear(parseInt(cardData.expiryYear));
            Transaction.commit();

            // Return the card uuid
            return storedPaymentInstrument.getUUID();
        }

        return false;
    },

    /*
     * Check if a customer card exists
     */
    customerCardExists: function (card, cardData) {
        // Prepare the card data to compare
        var cardMonth = "0" + card.creditCardExpirationMonth.toString().slice(-2);
        var cardYear = card.creditCardExpirationYear.toString().replace(',', '');
        var cardLast4 = card.getCreditCardNumberLastDigits().toString();

        // Return the test
        return cardMonth == cardData.expiryMonth
        && cardYear == cardData.expiryYear
        && card.creditCardType == cardData.cardType
        && cardLast4 == cardData.cardNumber.substr(cardData.cardNumber.length - 4);
    },

    /*
     * Get a customer saved card
     */
    getSavedCard: function (cardUuid, customerId, paymentMethodId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerId);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments();

        // Math the saved card
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (card.getUUID() == cardUuid) {
                return card;
            }
        } 
        
        return null;
    },

    /*
     * Build the gateway request
     */
    getCardRequest: function (cardData, args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
    
        // Prepare the charge data
        var chargeData = {
            'source'                : this.getSourceObject(cardData, args),
            'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
            'currency'              : ckoHelper.getCurrency(),
            'reference'             : args.OrderNo,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'customer'              : ckoHelper.getCustomer(args),
            'billing_descriptor'    : ckoHelper.getBillingDescriptorObject(),
            'shipping'              : this.getShippingObject(args),
            '3ds'                   : this.get3Ds(),
            'risk'                  : {enabled: true},
            'payment_ip'            : ckoHelper.getHost(args),
            'metadata'              : ckoHelper.getMetadataObject(cardData, args)
        };   

        return chargeData;
    },
    
    /*
     * Check if a payment is made with a saved card
     */
    isSavedCardRequest: function (req) {
        return req.form.hasOwnProperty('selectedCardId')
        && req.form.hasOwnProperty('selectedCardCvv')
        && req.form.selectedCardId.length > 0 
        && parseInt(req.form.selectedCardCvv) > 0
    },

    /*
     * Build a gateway saved card request
     */
    getSavedCardRequest: function (sourceId, cvv, args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
    
        // Prepare the charge data
        var chargeData = {
            'source': {
                type: 'id',
                id: sourceId,
                cvv: cvv
            },
            'amount'                : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
            'currency'              : ckoHelper.getCurrency(),
            'reference'             : args.OrderNo,
            'capture'               : ckoHelper.getValue('ckoAutoCapture'),
            'capture_on'            : ckoHelper.getCaptureTime(),
            'billing_descriptor'    : ckoHelper.getBillingDescriptorObject(),
            'shipping'              : this.getShippingObject(args),
            '3ds'                   : this.get3Ds(),
            'success_url'           : URLUtils.https('CKOMain-HandleReturn'),
            'failure_url'           : URLUtils.https('CKOMain-HandleFail'),
            'risk'                  : {enabled: true},
            'payment_ip'            : ckoHelper.getHost(args),
            'metadata'              : ckoHelper.getMetadataObject({}, args)
        };   

        return chargeData;
    },

    /*
     * Build a gateway card source object
     */
    getSourceObject: function (cardData, args) {
        // Source object
        var source = {
            type                : 'card',
            number              : cardData.cardNumber,
            expiry_month        : cardData.expiryMonth,
            expiry_year         : cardData.expiryYear,
            name                : cardData.owner,
            cvv                 : cardData.cvv,
            billing_address     : this.getBillingObject(args),
            phone               : ckoHelper.getPhoneObject(args)
        }
        
        return source;
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
     * Build the Billing object
     */
    getBillingObject: function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();

        // Creating billing address object
        var billingDetails = {
            address_line1       : billingAddress.getAddress1(),
            address_line2       : billingAddress.getAddress2(),
            city                : billingAddress.getCity(),
            state               : billingAddress.getStateCode(),
            zip                 : billingAddress.getPostalCode(),
            country             : billingAddress.getCountryCode().value
        };
        
        return billingDetails;
    },
    
    /*
     * Build the Shipping object
     */
    getShippingObject: function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get shipping address object
        var shippingAddress = order.getDefaultShipment().getShippingAddress();
        
        // Creating address object
        var shippingDetails = {
            address_line1       : shippingAddress.getAddress1(),
            address_line2       : shippingAddress.getAddress2(),
            city                : shippingAddress.getCity(),
            state               : shippingAddress.getStateCode(),
            zip                 : shippingAddress.getPostalCode(),
            country             : shippingAddress.getCountryCode().value
        };
        
        // Build the shipping object
        var shipping = {
            address             : shippingDetails,
            phone               : ckoHelper.getPhoneObject(args)
        };
        
        return shipping;
    }
}

/*
* Module exports
*/

module.exports = cardHelper;