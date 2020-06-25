'use strict';

// API Includes 
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');

// Site controller 
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');

// Shopper cart 
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

// App 
var app = require(SiteControllerName + '/cartridge/scripts/app');

// Utility 
var googlePayHelper = require('~/cartridge/scripts/helpers/googlePayHelper');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);
    var paymentMethod = args.PaymentMethodID;
    
    // Get the payload data
    var googlePayData = app.getForm('googlePayForm').get('data').value();

    // Proceed with transaction
    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments(paymentMethod);
        var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
        paymentInstrument.paymentTransaction.custom.ckoGooglePayData = googlePayData;
    });
    
    return {success: true};
}

/**
 * Authorises a payment using a credit card. The payment is authorised by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customisations may use other processors and custom
 * logic to authorise credit card payment.
 */
function Authorize(args) {

    // Preparing payment parameters
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    
    // Add order number to the session global object
    session.privacy.ckoOrderId = args.OrderNo;

    // Make the charge request
    var chargeResponse = googlePayHelper.handleRequest(args);
    if (chargeResponse) {

        // Create the authorization transaction
        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.paymentTransaction.custom.ckoPaymentId = chargeResponse.id;
            paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
            paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
            paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
            paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
        });
        
        return {authorized: true};
    } else {
        return {error: true};
    }
}

// Module exports
exports.Handle = Handle;
exports.Authorize = Authorize;