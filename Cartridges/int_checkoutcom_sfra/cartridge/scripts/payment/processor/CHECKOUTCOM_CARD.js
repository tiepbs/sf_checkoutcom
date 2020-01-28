'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var PaymentTransaction = require('dw/order/PaymentTransaction');

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* Shopper cart */
var Cart = require('~/cartridge/models/cart');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Utility */
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args)
{
    var cart = Cart.get(args.Basket);
    var paymentMethod = args.PaymentMethodID;
    var cardData = args.cardData;
    
    // Proceed with transaction
    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments(paymentMethod);
        var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
        paymentInstrument.creditCardHolder = cardData.owner;
        paymentInstrument.creditCardNumber = cardData.number;
        paymentInstrument.creditCardExpirationMonth = cardData.month;
        paymentInstrument.creditCardExpirationYear = cardData.year;
        paymentInstrument.creditCardType = cardData.cardType;
    });
    
    return {success: true};
}

/**
 * Authorises a payment using a credit card. The payment is authorised by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customisations may use other processors and custom
 * logic to authorise credit card payment.
 */
function Authorize(args)
{
    // Preparing payment parameters
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    
    // Add order number to the session global object
    session.privacy.ckoOrderId = args.OrderNo;
    
    // Get card payment form
    var paymentForm = app.getForm('cardPaymentForm');
    
    // Build card data object
    var cardData = {
        'name'          : paymentInstrument.creditCardHolder,
        'number'        : ckoHelper.getFormattedNumber(paymentForm.get('number').value()),
        'expiryMonth'   : paymentInstrument.creditCardExpirationMonth,
        'expiryYear'    : paymentInstrument.creditCardExpirationYear,
        'cvv'           : paymentForm.get('cvn').value(),
        'type'          : paymentInstrument.creditCardType,
    };
    
    // Make the charge request
    var chargeResponse = cardHelper.handleCardRequest(cardData, args);
    
    // Handle card charge request result
    if (chargeResponse) {
        if (ckoHelper.getValue('cko3ds')) {
            // 3ds redirection
            ISML.renderTemplate('redirects/3DSecure.isml', {
                redirectUrl: session.privacy.redirectUrl
            });
            
            return {authorized: true, redirected: true};
        } else {
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
        }
    } else {
        return {error: true};
    }
}

/*
 * Module exports
 */
exports.Handle = Handle;
exports.Authorize = Authorize;