'use strict';

var collections = require('*/cartridge/scripts/util/collections');

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentStatusCodes = require('dw/order/PaymentStatusCodes');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/** CKO Util */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var Site = require('dw/system/Site');


/**
 * Creates a token. This should be replaced by utilizing a tokenization provider
 * @returns {string} a token
 */
function createToken(paymentData) {
    // Prepare the parameters
    var requestData = {
        type: 'card',
        number: paymentData.cardNumber.toString(),
        expiry_month: paymentData.expirationMonth,
        expiry_year: paymentData.expirationYear,
        name: paymentData.name
    };

    // Perform the request to the payment gateway - get the card token
    var tokenResponse = ckoHelper.gatewayClientRequest(
        'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
        JSON.stringify(requestData)
    );
    
    if(tokenResponse && tokenResponse != 400) {
        requestData = {
            source: {
                type: "token",
                token: tokenResponse.token
            },
            currency: Site.getCurrent().getCurrencyCode(),
            risk: { enabled: false },
            billing_descriptor: ckoHelper.getBillingDescriptor()
        }
    }

    var idResponse = ckoHelper.gatewayClientRequest(
        'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
        requestData
    );

    if (idResponse && idResponse != 400) {
        return idResponse.source.id;
    }
}

/**
 * Verifies that entered credit card information is a valid card. If the information is valid a
 * credit card payment instrument is created
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @param {string} paymentMethodID - paymentmethodID
 * @param {Object} req the request object
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation, paymentMethodID, req) {
    var currentBasket = basket;
    var cardErrors = {};
    var cardNumber = paymentInformation.cardNumber.value;
    var cardSecurityCode = paymentInformation.securityCode.value;
    var expirationMonth = paymentInformation.expirationMonth.value;
    var expirationYear = paymentInformation.expirationYear.value;
    var serverErrors = [];
    var creditCardStatus;


    var cardType = paymentInformation.cardType.value;
    var paymentCard = PaymentMgr.getPaymentCard(cardType);


    // Validate payment instrument
    if (paymentMethodID === PaymentInstrument.METHOD_CREDIT_CARD) {
        var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
        var paymentCardValue = PaymentMgr.getPaymentCard(paymentInformation.cardType.value);

        var applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
            req.currentCustomer.raw,
            req.geolocation.countryCode,
            null
        );

        if (!applicablePaymentCards.contains(paymentCardValue)) {
            // Invalid Payment Instrument
            var invalidPaymentMethod = Resource.msg('error.payment.not.valid', 'checkout', null);
            return { fieldErrors: [], serverErrors: [invalidPaymentMethod], error: true };
        }
    }

    if (!paymentInformation.creditCardToken) {
        if (paymentCard) {
            creditCardStatus = paymentCard.verify(
                expirationMonth,
                expirationYear,
                cardNumber,
                cardSecurityCode
            );
        } else {
            cardErrors[paymentInformation.cardNumber.htmlName] =
                Resource.msg('error.invalid.card.number', 'creditCard', null);

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }

        if (creditCardStatus.error) {
            collections.forEach(creditCardStatus.items, function (item) {
                switch (item.code) {
                    case PaymentStatusCodes.CREDITCARD_INVALID_CARD_NUMBER:
                        cardErrors[paymentInformation.cardNumber.htmlName] =
                            Resource.msg('error.invalid.card.number', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_EXPIRATION_DATE:
                        cardErrors[paymentInformation.expirationMonth.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        cardErrors[paymentInformation.expirationYear.htmlName] =
                            Resource.msg('error.expired.credit.card', 'creditCard', null);
                        break;

                    case PaymentStatusCodes.CREDITCARD_INVALID_SECURITY_CODE:
                        cardErrors[paymentInformation.securityCode.htmlName] =
                            Resource.msg('error.invalid.security.code', 'creditCard', null);
                        break;
                    default:
                        serverErrors.push(
                            Resource.msg('error.card.information.error', 'creditCard', null)
                        );
                }
            });

            return { fieldErrors: [cardErrors], serverErrors: serverErrors, error: true };
        }
    }

    Transaction.wrap(function () {
        var paymentInstruments = currentBasket.getPaymentInstruments(
            PaymentInstrument.METHOD_CREDIT_CARD
        );

        collections.forEach(paymentInstruments, function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardHolder(currentBasket.billingAddress.fullName);
        paymentInstrument.setCreditCardNumber(cardNumber);
        paymentInstrument.setCreditCardType(cardType);
        paymentInstrument.setCreditCardExpirationMonth(expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(expirationYear);

        // Create card token if save card is true
        if (paymentInformation.saveCard.value) {
            paymentInstrument.setCreditCardToken(
                paymentInformation.creditCardToken
                    ? paymentInformation.creditCardToken
                    : createToken({
                        name: currentBasket.billingAddress.fullName,
                        cardNumber: paymentInformation.cardNumber.value,
                        cardType: paymentInformation.cardType.value,
                        expirationMonth: paymentInformation.expirationMonth.value,
                        expirationYear: paymentInformation.expirationYear.value,
                    })
            );
        };
        paymentInstrument.custom.ckoPaymentData = JSON.stringify({
            'securityCode': cardSecurityCode,
            'storedPaymentUUID': paymentInformation.storedPaymentUUID,
            'saveCard': paymentInformation.saveCard.value,
            'customerNo': req.currentCustomer.profile.customerNo
        });
    });

    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var serverErrors = [];
    var fieldErrors = {};
    var error = false;

    try {
        var ckoPaymentRequest = cardHelper.handleRequest(orderNumber, paymentInstrument, paymentProcessor);

        // Handle errors
        if (ckoPaymentRequest.error) {
            error = true;
            serverErrors.push(
                ckoHelper.getPaymentFailureMessage()
            );
            Transaction.wrap(function () {
                paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
                paymentInstrument.custom.ckoPaymentData = "";
            });
        } else {
            Transaction.wrap(function () {
                paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
                paymentInstrument.custom.ckoPaymentData = "";
            });
        }
    } catch (e) {
        error = true;
        serverErrors.push(
            Resource.msg('error.technical', 'checkout', null)
        );
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, redirectUrl: ckoPaymentRequest.redirectUrl };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
