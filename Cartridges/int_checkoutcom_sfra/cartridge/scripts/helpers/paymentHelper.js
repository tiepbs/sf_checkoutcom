"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/** Utility **/
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

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
                ProcesssorID: paymentMethodId
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
                // Fail the order
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                
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