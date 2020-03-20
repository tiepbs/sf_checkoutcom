"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var googlePayHelper = require('~/cartridge/scripts/helpers/googlePayHelper');
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');

/* APM Configuration */
var apmConfig = require('~/cartridge/scripts/config/ckoApmConfig');

/*
* Utility functions for my cartridge integration.
*/
var paymentHelper = {  
    checkoutcomCardRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;
        
        // Prepare the response data
        self.result = {
            order: false,
            url: false
        };

        // Transaction wrapper
        Transaction.wrap(function () {
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();
            currentBasket.setCustomerEmail(req.form.ckoCustomerEmail);

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);
            
            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Prepare the arguments
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                CardUuid: false,
                CustomerId: false
            };

            // Handle the charge request
            var cardData = null;
            if (cardHelper.isSavedCardRequest(req)) {
                // Get the saved card
                var savedCard = cardHelper.getSavedCard(
                    req.form.selectedCardId,
                    req.currentCustomer.profile.customerNo,
                    paymentMethodId
                );

                // Handle the saved card cases
                if (savedCard) {
                    if (cardHelper.cardHasSourceId(savedCard)) {    
                        // Send the charge request
                        var chargeResponse = cardHelper.handleSavedCardRequest(
                            savedCard.getCreditCardToken(),
                            req.form.selectedCardCvv,
                            args
                        );
                    }
                    else {
                        // Prepare the card data
                        var cardData = getCardDataFromSaved(savedCard, req);
                    }

                    // Send the charge request
                    var chargeResponse = cardHelper.handleCardRequest(cardData, args);
                }
            }
            else {
                // Prepare the card data
                var cardData = cardHelper.getCardDataFromRequest(req);

                // Save the card
                if (cardHelper.needsCardSaving(req)) {
                    // Save the card
                    var cardUuid = cardHelper.saveCardData(
                        req,
                        cardData,
                        paymentMethodId
                    );

                    // Add the card uuid and customer id to the metadata
                    args.CardUuid = cardUuid;
                    args.CustomerId = req.currentCustomer.profile.customerNo
                }

                // Send the charge request
                var chargeResponse = cardHelper.handleCardRequest(cardData, args);
            }

            // Check the response
            if (session.privacy.redirectUrl) {
                // Handle the 3ds redirection
                self.result.url = session.privacy.redirectUrl;
            }
            else if (ckoHelper.paymentSuccess(chargeResponse)) {
                self.result.order = order;
            }
            else {                
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);
            }
        });

        return self.result;
    },

    checkoutcomGooglePayRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;
        
        // Prepare the response data
        self.result = {
            order: false,
            url: false
        };

        // Transaction wrapper
        Transaction.wrap(function () {
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();
            currentBasket.setCustomerEmail(req.form.ckoCustomerEmail);

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                ckoGooglePayData: req.form.ckoGooglePayData,
                CardUuid: false,
                CustomerId: false
            };

            // Handle the charge request
            var chargeResponse = googlePayHelper.handleRequest(args);            

            // Check the response
            if (chargeResponse) {
                // Redirect to the confirmation page
                self.result.order = order;
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);
            }
        });

        return self.result;
    },

    checkoutcomApplePayRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;
        
        // Prepare the response data
        self.result = {
            order: false,
            url: false
        };

        // Transaction wrapper
        Transaction.wrap(function () {
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();
            currentBasket.setCustomerEmail(req.form.ckoCustomerEmail);

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                ckoApplePayData: req.form.ckoApplePayData,
                CardUuid: false,
                CustomerId: false
            };

            // Handle the charge request
            var chargeResponse = applePayHelper.handleRequest(args);
            
            // Check the response
            if (chargeResponse) {
                // Redirect to the confirmation page
                self.result.order = order;
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);
            }
        });

        return self.result;
    },

    checkoutcomApmRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;
        
        // Prepare the response data
        self.result = {
            order: false,
            url: false
        };

        // Transaction wrapper
        Transaction.wrap(function () {         
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();
            currentBasket.setCustomerEmail(req.form.ckoCustomerEmail);

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Get the APM type chosen
            var func = req.form.apm_list + 'PayAuthorization';

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                Form: req.form,
                CardUuid: false,
                CustomerId: false
            };

            // Get the required apm pay config object
            var payObject = apmConfig[func](args);

            // Handle the charge request
            var chargeResponse = apmHelper.handleApmRequest(payObject, args);
            
            // Handle the redirection
            if (session.privacy.redirectUrl) {
                res.redirect(session.privacy.redirectUrl);
            }

            // Check the response
            if (chargeResponse) {
                // Redirect to the APM page
                self.result.url = session.privacy.redirectUrl;
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);
            }
        });

        return self.result;
    },

    getConfirmationPageRedirect: function (res, order) {
        return res.redirect(
            URLUtils.url(
                'Order-Confirm',
                'ID',
                order.orderNo,
                'token',
                order.orderToken
            ).toString()
        );
    },

    getFailurePageRedirect: function (res) {
        return res.redirect(
            URLUtils.url(
                'Checkout-Begin',
                'stage',
                'payment',
                'paymentError',
                Resource.msg('error.payment.not.valid', 'checkout', null)
            )
        );
    }
}

/*
* Module exports
*/
module.exports = paymentHelper;