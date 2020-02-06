"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');
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

        // Transaction wrapper
        Transaction.wrap(function () {
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Prepare the card data
            var cardData = {
                number      : ckoHelper.getFormattedNumber(req.form.dwfrm_billing_creditCardFields_cardNumber),
                expiryMonth : req.form.dwfrm_billing_creditCardFields_expirationMonth,
                expiryYear  : req.form.dwfrm_billing_creditCardFields_expirationYear,
                cvv         : req.form.dwfrm_billing_creditCardFields_securityCode,
                cardType    : req.form.dwfrm_billing_creditCardFields_cardType	
            };

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Create a new payment instrument
            var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodId, currentBasket.totalGrossPrice);
            //var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();    

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId
            };

            // Handle the charge request
            var chargeResponse = cardHelper.handleCardRequest(cardData, args);
            
            // Handle the 3ds redirection
            if (session.privacy.redirectUrl) {
                res.redirect(session.privacy.redirectUrl);
            }

            // Check the response
            else if (ckoHelper.paymentSuccess(chargeResponse)) {
                // Prepare the transaction
                paymentInstrument.creditCardNumber = cardData.number;
                paymentInstrument.creditCardExpirationMonth = cardData.expiryMonth;
                paymentInstrument.creditCardExpirationYear = cardData.expiryYear;
                paymentInstrument.creditCardType = cardData.cardType;

                // Create the authorization transaction
                paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
                //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
                paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
                paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
                paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);

                // Redirect to the confirmation page
                self.getConfirmationPage(res, order);
            }
            else {                
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                self.getFailurePage(res);
            }

            return next();
        });
    },

    checkoutcomGooglePayRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;

        // Transaction wrapper
        Transaction.wrap(function () {
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Create a new payment instrument
            var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodId, currentBasket.totalGrossPrice);
            //var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();    

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                ckoGooglePayData: req.form.ckoGooglePayData
            };

            // Handle the charge request
            var chargeResponse = googlePayHelper.handleRequest(args);            

            // Check the response
            if (chargeResponse) {
                // Create the authorization transaction
                paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
                //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
                paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
                paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
                paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);

                // Redirect to the confirmation page
                self.getConfirmationPage(res, order);
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                self.getFailurePage(res);
            }

            return next();
        });
    },

    checkoutcomApplePayRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;

        // Transaction wrapper
        Transaction.wrap(function () {
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Create a new payment instrument
            var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodId, currentBasket.totalGrossPrice);
            //var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();    

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                ckoApplePayData: req.form.ckoApplePayData
            };

            // Handle the charge request
            var chargeResponse = applePayHelper.handleRequest(args);
            
            // Check the response
            if (chargeResponse) {
                // Create the authorization transaction
                paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
                //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
                paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
                paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
                paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);

                // Redirect to the confirmation page
                self.getConfirmationPage(res, order);
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                self.getFailurePage(res);
            }

            return next();
        });
    },

    checkoutcomApmRequest: function (paymentMethodId, req, res, next) {
        // Reference the object
        var self = this;

        // Transaction wrapper
        Transaction.wrap(function () {         
            // Get the current basket
            var currentBasket = BasketMgr.getCurrentBasket();

            // Create the order
            var order = OrderMgr.createOrder(currentBasket);

            // Add order number to the session global object
            session.privacy.ckoOrderId = order.orderNo;

            // Get apm type chosen
            var func = req.form.apm_list + 'PayAuthorization';

            // Create a new payment instrument
            var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodId, currentBasket.totalGrossPrice);
            //var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();    

            // Make the charge request
            var args = {
                OrderNo: order.orderNo,
                ProcessorId: paymentMethodId,
                Form: req.form
            };

            // Get the required apm pay config object
            var payObject = apmConfig[func](args);

            // Handle the charge request
            var chargeResponse = apmHelper.handleApmRequest(payObject, args);
            
            // Check the response
            if (chargeResponse) {
                // Create the authorization transaction
                paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
                //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
                paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
                paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
                paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);

                // Redirect to the confirmation page
                res.redirect(session.privacy.redirectUrl);
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                self.getFailurePage(res);
            }

            return next();
        });
    },

    getConfirmationPage: function (res, order) {
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

    getFailurePage: function (res) {
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