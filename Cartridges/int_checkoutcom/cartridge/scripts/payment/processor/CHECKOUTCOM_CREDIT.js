'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* Shopper cart */
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Helpers */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);
    var paymentMethod = args.PaymentMethodID;
    var creditCardForm = app.getForm('billing.paymentMethods.creditCard');
    var cardType = creditCardForm.get('type').value();
    var paymentCard = PaymentMgr.getPaymentCard(cardType);

    // Prepare the card data
    var cardData = {
        owner: creditCardForm.get('owner').value(),
        number: creditCardForm.get('number').value(),
        type: creditCardForm.get('type').value(),
        month: creditCardForm.get('expiration.month').value(),
        year: creditCardForm.get('expiration.year').value(),
        cvn: creditCardForm.get('cvn').value()
    };

    // Verify the card
    var creditCardStatus = paymentCard.verify(cardData.month, cardData.year, cardData.number, cardData.cvn);

    // Handle card validation errors
    if (creditCardStatus.error) {
        var coreCartridgeName = CKOHelper.getCoreCartridgeName(SiteControllerName);
        var invalidatePaymentCardFormElements = require(coreCartridgeName + '/cartridge/scripts/checkout/InvalidatePaymentCardFormElements');
        invalidatePaymentCardFormElements.invalidatePaymentCardForm(creditCardStatus, session.forms.billing.paymentMethods.creditCard);

        return {error: true};
    }

    // Proceed with the transaction
    Transaction.wrap(function() {
        cart.removeExistingPaymentInstruments(paymentMethod);
        var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
        paymentInstrument.creditCardHolder = creditCardForm.get('owner').value();
        paymentInstrument.creditCardNumber = creditCardForm.get('number').value();
        paymentInstrument.creditCardType = creditCardForm.get('type').value();
        paymentInstrument.creditCardExpirationMonth = cardData.month;
        paymentInstrument.creditCardExpirationYear = cardData.year;
    });

    return { success: true };
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(args) {
	// Prepare the payment parameters
    var orderNo = args.OrderNo;
    var cart = Cart.get(args.Basket);
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
    
    // Add data to session for payment return
	session.privacy.ckoOrderId = args.OrderNo;

    // Perform the charge
    var success = CKOHelper.handleFullChargeRequest({
        "name": paymentInstrument.creditCardHolder,
        "number": paymentInstrument.creditCardNumber,
        "expiryMonth": paymentInstrument.creditCardExpirationMonth,
        "expiryYear": paymentInstrument.creditCardExpirationYear,
        "cvv": app.getForm('billing.paymentMethods.creditCard').get('cvn').value()
    }, args);
	
    // Transaction wrapper
    Transaction.wrap(function() {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    // Handle the card charge result
    if (success) {
        if (CKOHelper.getValue('cko3ds')) {
            ISML.renderTemplate('custom/common/response/3DSecure.isml', {
				redirectUrl: session.privacy.redirectUrl,
            });
            
            return {authorized: true, redirected: true};
        }
        else {
            return {authorized: true};
        }
    }
    else {
        return {error: true};
    }
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;