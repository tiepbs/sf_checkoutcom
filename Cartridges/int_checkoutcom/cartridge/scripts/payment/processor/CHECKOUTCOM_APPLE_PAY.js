'use strict';

var Status = require('dw/system/Status');
var OrderMgr = require('dw/order/OrderMgr');

// API Includes
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');

// Site controller
var Site = require('dw/system/Site');
var SiteControllerName = Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');

// Shopper cart
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

// Utility
var applePayHelper = require('~/cartridge/scripts/helpers/applePayHelper');

function GetRequest(basket, req) {
    OrderMgr.createOrder(basket);
    var cart = Cart.get(basket);
    var paymentMethod = 'CHECKOUTCOM_APPLE_PAY';
	
    // proceed with transaction
    Transaction.wrap(function() {
        cart.removeExistingPaymentInstruments(paymentMethod);
        var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
    });

    session.custom.applepaysession = 'yes';  // eslint-disable-line
}

function AuthorizeOrderPayment (order, event) {
    var condition = Object.prototype.hasOwnProperty.call(event, 'isTrusted')
    && event.isTrusted === true
    && order;

    if (condition) {
        // Preparing payment parameters
        var paymentInstruments = order.getPaymentInstruments(
            'CHECKOUTCOM_APPLE_PAY').toArray();
        var paymentInstrument = paymentInstruments[0];

        // Add order number to the session global object
        // eslint-disable-next-line
        session.privacy.ckoOrderId = order.orderNo;

        // Add the payload data
        paymentInstrument.paymentTransaction.custom.ckoApplePayData = event.payment.token.paymentData;

        // Prepare the request arguments
        var args = {
            OrderNo: order.orderNo,
            PaymentInstrument: paymentInstrument
        };

        // Make the charge request
        var chargeResponse = applePayHelper.handleRequest(args);
        if (chargeResponse) {
            // Create the authorization transaction
            Transaction.wrap(function() {
                paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
                paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
                paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
                paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
                paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
                paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
                paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
            });

            return new Status(Status.OK);
        }
    }

    return new Status(Status.ERROR);
}

// Module exports
exports.GetRequest = GetRequest;
exports.AuthorizeOrderPayment = AuthorizeOrderPayment;