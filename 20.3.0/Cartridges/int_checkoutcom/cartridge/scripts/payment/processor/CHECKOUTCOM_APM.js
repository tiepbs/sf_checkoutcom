'use strict';

// Site controller
var Site = require('dw/system/Site');
var SiteControllerName = Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');

// API Includes
var Transaction = require('dw/system/Transaction');
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');
var app = require(SiteControllerName + '/cartridge/scripts/app');

// Utility
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');

// APM Configuration
var apmConfig = require('~/cartridge/scripts/config/ckoApmConfig');

/**
 * Verifies that the payment data is valid.
 * @param {Object} args The method arguments
 * @returns {Object} The form validation result
 */
function Handle(args) {
    // Proceed with transaction
    var cart = Cart.get(args.Basket);
    var paymentMethod = args.PaymentMethodID;

    // Proceed with transact
    Transaction.wrap(function() {
        cart.removeExistingPaymentInstruments(paymentMethod);
        cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
    });

    return { success: true };
}

/**
 * Authorises a payment.
 * @param {Object} args The method arguments
 * @returns {Object} The payment success or failure
 */
function Authorize(args) {
    // Add order Number to session
    // eslint-disable-next-line
    session.privacy.ckoOrderId = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentMethod = paymentInstrument.getPaymentMethod();
    var PaymentMgr = require('dw/order/PaymentMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(args.OrderNo, args.Order.orderToken);
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentMethod).getPaymentProcessor();

    var func = paymentMethod.toLowerCase() + 'PayAuthorization';
    // Get the required apm pay config object
    var payObject = apmConfig[func](args);

    try {
        var paymentAuth = apmHelper.apmAuthorization(payObject, args);

        Transaction.wrap(function () {
            order.addNote('Payment Authorization Request:', 'Payment Authorization successful');
            paymentInstrument.paymentTransaction.transactionID = args.OrderNo;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        });

        if (paymentAuth) { 

            return {authorized: true, error: false};
        } else {
            throw new Error({mssage: 'Authorization Error'});
        }
    } catch(e) {
        Transaction.wrap(function () {
            order.addNote('Payment Authorization Request:', e.message);
            paymentInstrument.paymentTransaction.transactionID = args.OrderNo;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        });

        return {authorized: false, error: true, message: e.message };
    }
}

// Local methods
exports.Handle = Handle;
exports.Authorize = Authorize;
