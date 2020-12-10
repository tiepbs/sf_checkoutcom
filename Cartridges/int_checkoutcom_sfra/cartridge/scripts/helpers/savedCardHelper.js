'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
  * Saved card functions for the Checkout.com cartridge integration.
  */
var savedCardHelper = {
    /**
     * Get a customer saved card.
     * @param {string} cardUuid The card uuid
     * @param {string} customerNo The customer number
     * @param {string} methodId The method id
     * @returns {Object} A card object
     */
    getSavedCard: function(cardUuid, customerNo, methodId) {
        // Get the customer
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);

        // Get the customer wallet
        var wallet = customer.getProfile().getWallet();

        // Get the existing payment instruments
        var paymentInstruments = wallet.getPaymentInstruments(methodId);

        // Match the saved card
        for (var i = 0; i < paymentInstruments.length; i++) {
            var card = paymentInstruments[i];
            if (card.getUUID() === cardUuid) {
                return card;
            }
        }

        return null;
    },

    /**
     * Get all customer saved cards.
     * @param {string} customerNo The customer number
     * @param {string} methodId The method ID
     * @returns {Array} A list of saved cards
     */
    getSavedCards: function(customerNo, methodId) {
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
            var condition = (processorId) ? paymentInstrument.paymentMethod === processorId : true;
            if (condition) {
                // Card data
                var card = {
                    creditCardHolder: paymentInstrument.creditCardHolder,
                    maskedCreditCardNumber: paymentInstrument.maskedCreditCardNumber,
                    creditCardType: paymentInstrument.creditCardType,
                    creditCardExpirationMonth: paymentInstrument.creditCardExpirationMonth,
                    creditCardExpirationYear: paymentInstrument.creditCardExpirationYear,
                    UUID: paymentInstrument.UUID,
                    paymentMethod: paymentInstrument.paymentMethod,
                };

                // Card image
                card.cardTypeImage = {
                    src: URLUtils.staticURL('/images/' +
                    paymentInstrument.creditCardType.toLowerCase().replace(/\s/g, '') +
                        '-dark.svg'),
                    alt: paymentInstrument.creditCardType,
                };

                cards.push(card);
            }
        }

        return cards;
    },

    /**
     * Save a card in the customer account.
     * @param {Object} paymentData The payment data
     * @param {Object} req The HTTP request data
     * @returns {string} A card uuid
     */
    saveCard: function(paymentData, req) {
        // Get the customer profile
        var customerNo = req.currentCustomer.profile.customerNo;
        var customerProfile = CustomerMgr.getCustomerByCustomerNumber(customerNo).getProfile();
        var processorId = paymentData.paymentMethod.htmlValue;

        // Build the customer full name
        var fullName = ckoHelper.getCustomerFullName(customerProfile);

        // Get the customer wallet
        var wallet = customerProfile.getWallet();

        // The return value
        var uuid;

        // Create a stored payment instrument
        Transaction.wrap(function() {
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

    /**
     * Update a card in the customer account.
     * @param {Object} hook The gateway webhook data
     */
    updateSavedCard: function(hook) {
        if (hook) {
            var condition1 = Object.prototype.hasOwnProperty.call(hook.data.metadata, 'card_uuid');
            var condition2 = Object.prototype.hasOwnProperty.call(hook.data.metadata, 'customer_id');
            if (condition1 && condition2) {
                // Get the card
                var card = this.getSavedCard(
                    hook.data.metadata.card_uuid,
                    hook.data.metadata.customer_id,
                    hook.data.metadata.payment_processor
                );
    
                // Create a stored payment instrument
                if (card) {
                    Transaction.wrap(function() {
                        card.setCreditCardToken(hook.data.source.id);
                    });
                }
            } else {
                this.deleteSavedCard();
            }
        }
    },

    /**
     * Delete a card in customer account.
     * @param {Object} hook The gateway webhook data
     */
    deleteSavedCard: function(hook) {
        if (hook) {
            var condition1 = Object.prototype.hasOwnProperty.call(hook, 'data') && Object.prototype.hasOwnProperty.call(hook.data, 'metadata');
            var condition2 = Object.prototype.hasOwnProperty.call(hook.data.metadata, 'card_uuid');
            var condition3 = Object.prototype.hasOwnProperty.call(hook.data.metadata, 'customer_id');
            if (condition1 && condition2 && condition3) {
                // Set the customer and card uuiid
                var customerId = hook.data.metadata.customer_id;
                var cardUuid = hook.data.metadata.card_uuid;
    
                // Get the customer
                var customer = CustomerMgr.getCustomerByCustomerNumber(customerId);
    
                // Get the customer wallet
                var wallet = customer.getProfile().getWallet();
    
                // Get the existing payment instruments
                var paymentInstruments = wallet.getPaymentInstruments();
    
                // Remove  the relevand payment instruments
                Transaction.wrap(function() {
                    for (var i = 0; i < paymentInstruments.length; i++) {
                        var card = paymentInstruments[i];
                        if (card.getUUID() === cardUuid) {
                            wallet.removePaymentInstrument(card);
                        }
                    }
                });
            }
        }
    },
};

/**
 * Module exports
 */
module.exports = savedCardHelper;
