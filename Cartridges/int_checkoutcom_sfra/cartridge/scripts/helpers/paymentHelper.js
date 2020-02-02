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
                ProcesssorId: paymentMethodId
            };

            // Handle the charge request
            var chargeResponse = cardHelper.handleCardRequest(cardData, args);

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
            
            // Check the response
            if (ckoHelper.paymentSuccess(chargeResponse)) {
                // Redirect to the confirmation page
                res.redirect(
                    URLUtils.url(
                        'Order-Confirm',
                        'ID',
                        order.orderNo,
                        'token',
                        order.orderToken
                    ).toString()
                );
            }
            else {                
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                res.redirect(
                    URLUtils.url(
                        'Checkout-Begin',
                        'stage',
                        'payment',
                        'paymentError',
                        Resource.msg('error.payment.not.valid', 'checkout', null)
                    )
                );
            }

            return next();
        });
    },

    checkoutcomGooglePayRequest: function (paymentMethodId, req, res, next) {
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
                ProcesssorId: paymentMethodId,
                ckoGooglePayData: req.form.ckoGooglePayData
            };

            // Handle the charge request
            var chargeResponse = googlePayHelper.handleRequest(args);

            // Create the authorization transaction
            paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
            //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
            
            // Check the response
            if (chargeResponse) {
                // Redirect to the confirmation page
                res.redirect(
                    URLUtils.url(
                        'Order-Confirm',
                        'ID',
                        order.orderNo,
                        'token',
                        order.orderToken
                    ).toString()
                );
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                res.redirect(
                    URLUtils.url(
                        'Checkout-Begin',
                        'stage',
                        'payment',
                        'paymentError',
                        Resource.msg('error.payment.not.valid', 'checkout', null)
                    )
                );
            }

            return next();
        });
    },

    checkoutcomApplePayRequest: function (paymentMethodId, req, res, next) {
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
                ProcesssorId: paymentMethodId,
                ckoApplePayData: req.form.ckoApplePayData
            };

            // Handle the charge request
            var chargeResponse = applePayHelper.handleRequest(args);

            // Create the authorization transaction
            paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
            //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
            
            // Check the response
            if (chargeResponse) {
                // Redirect to the confirmation page
                res.redirect(
                    URLUtils.url(
                        'Order-Confirm',
                        'ID',
                        order.orderNo,
                        'token',
                        order.orderToken
                    ).toString()
                );
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                res.redirect(
                    URLUtils.url(
                        'Checkout-Begin',
                        'stage',
                        'payment',
                        'paymentError',
                        Resource.msg('error.payment.not.valid', 'checkout', null)
                    )
                );
            }

            return next();
        });
    },

    checkoutcomApmRequest: function (paymentMethodId, req, res, next) {
        var logger = require('dw/system/Logger').getLogger('ckodebug');
        logger.debug('this is my test {0}', JSON.stringify(req.form));

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
                ProcesssorId: paymentMethodId,
            };

            // Get the required apm pay config object
            var payObject = apmConfig[func](args);

            // Handle the charge request
            var chargeResponse = apmHelper.apmAuthorization(payObject, args);

            // Create the authorization transaction
            paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
            //paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
            
            // Check the response
            if (chargeResponse) {
                // Redirect to the confirmation page
                res.redirect(
                    URLUtils.url(
                        'Order-Confirm',
                        'ID',
                        order.orderNo,
                        'token',
                        order.orderToken
                    ).toString()
                );
            }
            else {
                // Restore the cart
                ckoHelper.checkAndRestoreBasket(order);

                // Redirect to the checkout process
                res.redirect(
                    URLUtils.url(
                        'Checkout-Begin',
                        'stage',
                        'payment',
                        'paymentError',
                        Resource.msg('error.payment.not.valid', 'checkout', null)
                    )
                );
            }

            return next();
        });
    }
}

/*
* Module exports
*/
module.exports = paymentHelper;