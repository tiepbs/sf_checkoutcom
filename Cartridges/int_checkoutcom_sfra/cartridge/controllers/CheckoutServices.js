'use strict';

/* Server */
var server = require('server');
server.extend(module.superModule);

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Money = require('dw/value/Money');

/** Utility **/
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Handles responses from the Checkout.com payment gateway.
 */
server.replace('SubmitPayment', server.middleware.https, function (req, res, next) {
    // Set the payment method ID
    var paymentMethodID = 'CHECKOUTCOM_CARD';
    
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
        var paymentInstrument = currentBasket.createPaymentInstrument(paymentMethodID, currentBasket.totalGrossPrice);
        //var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();    

	    // Make the charge request
	    var args = {
	        OrderNo: order.orderNo,
	        ProcesssorID: paymentMethodID
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
    });
});

/*
 * Module exports
 */
module.exports = server.exports();