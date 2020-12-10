'use strict';

// API Includes
var Transaction = require('dw/system/Transaction');

// Site controller
var Site = require('dw/system/Site');
var SiteControllerName = Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');

// Shopper cart
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

// App
var app = require(SiteControllerName + '/cartridge/scripts/app');

// Utility
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Verifies that the payment data is valid.
 * @param {Object} args The method arguments
 * @returns {Object} The form validation result
 */
function Handle(args) { 

    var cart = Cart.get(args.Basket);
    var creditCardForm = app.getForm('billing.paymentMethods.creditCard');
    var PaymentMgr = require('dw/order/PaymentMgr');

    var creditCardHolder = creditCardForm.get('owner').value();
    var cardNumber = ckoHelper.getFormattedNumber(creditCardForm.get('number').value());
    var cardSecurityCode = creditCardForm.get('cvn').value();
    var cardType = creditCardForm.get('type').value();
    var expirationMonth = creditCardForm.get('expiration.month').value();
    var expirationYear = creditCardForm.get('expiration.year').value(); 
    var madaCardType = creditCardForm.get('madaCardType').value();
    var paymentCard = PaymentMgr.getPaymentCard(cardType);

    var creditCardStatus = paymentCard.verify(expirationMonth, expirationYear, cardNumber, cardSecurityCode);

    if (creditCardStatus.error) {

        var invalidatePaymentCardFormElements = require('*/cartridge/scripts/checkout/InvalidatePaymentCardFormElements');
        invalidatePaymentCardFormElements.invalidatePaymentCardForm(creditCardStatus, session.forms.billing.paymentMethods.creditCard);

        return {error: true};
    }

    // Save card feature
    if (creditCardForm.get('saveCard').value()) {
        var i,
            creditCards,
            newCreditCard;

        // eslint-disable-next-line
        creditCards = customer.profile.getWallet().getPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);

        Transaction.wrap(function() {
            // eslint-disable-next-line
            newCreditCard = customer.profile.getWallet().createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);

            // copy the credit card details to the payment instrument
            newCreditCard.setCreditCardHolder(creditCardHolder);
            newCreditCard.setCreditCardNumber(cardNumber);
            newCreditCard.setCreditCardExpirationMonth(expirationMonth);
            newCreditCard.setCreditCardExpirationYear(expirationYear);
            newCreditCard.setCreditCardType(cardType);

            for (i = 0; i < creditCards.length; i++) {
                var creditcard = creditCards[i];

                if (creditcard.maskedCreditCardNumber === newCreditCard.maskedCreditCardNumber && creditcard.creditCardType === newCreditCard.creditCardType) {
                    // eslint-disable-next-line
                	customer.profile.getWallet().removePaymentInstrument(creditcard);
                }
            }
        });
    }

    Transaction.wrap(function () {
        cart.removeExistingPaymentInstruments(dw.order.PaymentInstrument.METHOD_CREDIT_CARD);
        var paymentInstrument = cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, cart.getNonGiftCertificateAmount());

        paymentInstrument.creditCardHolder = creditCardHolder;
        paymentInstrument.creditCardNumber = cardNumber;
        paymentInstrument.creditCardType = cardType;
        paymentInstrument.creditCardExpirationMonth = expirationMonth;
        paymentInstrument.creditCardExpirationYear = expirationYear;
        paymentInstrument.custom.ckoPaymentData = JSON.stringify({cvn: cardSecurityCode, madaCard: madaCardType ? 'yes' : ''});
    });

    return {success: true};
}


/**
 * Authorises a payment.
 * @param {Object} args The method arguments
 * @returns {Object} The payment success or failure
 */
function Authorize(args) {
    var orderNo = args.OrderNo;

    // Add order number to the session global object
    // eslint-disable-next-line
    session.privacy.ckoOrderId = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var PaymentMgr = require('dw/order/PaymentMgr');
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    try {

        var paymentAuth = cardHelper.cardAuthorization(paymentInstrument, args);

        Transaction.wrap(function () {
            paymentInstrument.paymentTransaction.transactionID = orderNo;
            paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
            paymentInstrument.custom.ckoPaymentData = '';
        });

        if (paymentAuth) { 

            return {authorized: true, error: false};
        } else {
            throw new Error({mssage: 'Authorization Error'});
        }
    } catch(e) {

        return {authorized: false, error: true, message: e.message };
    }
}

// Module exports
exports.Handle = Handle;
exports.Authorize = Authorize;
