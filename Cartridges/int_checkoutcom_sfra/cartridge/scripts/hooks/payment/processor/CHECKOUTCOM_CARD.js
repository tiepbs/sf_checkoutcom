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
function createToken() {
    var paymentForm = session.getForms().billing;
    var cardForm = paymentForm.creditCardFields;
    var requestData;

    // Prepare the parameters
    requestData = {
        type: 'card',
        number: cardForm.cardNumber.value,
        expiry_month: cardForm.expirationMonth.value,
        expiry_year: cardForm.expirationYear.value,
        name: cardForm.cardOwner.value,
    };

    // Perform the request to the payment gateway - get the card token
    var tokenResponse = ckoHelper.gatewayClientRequest(
        'cko.network.token.' + ckoHelper.getValue('ckoMode') + '.service',
        JSON.stringify(requestData)
    );

    if (tokenResponse && tokenResponse !== 400) {
        requestData = {
            source: {
                type: 'token',
                token: tokenResponse.token,
            },
            currency: Site.getCurrent().getDefaultCurrency(),
            risk: { enabled: Site.getCurrent().getCustomPreferenceValue('ckoEnableRiskFlag') },
            billing_descriptor: ckoHelper.getBillingDescriptor(),
        };

        var idResponse = ckoHelper.gatewayClientRequest(
            'cko.card.charge.' + ckoHelper.getValue('ckoMode') + '.service',
            requestData
        );
    
        if (idResponse && idResponse !== 400 && idResponse !== 422) {
            return idResponse.source.id;
        }
    }

    return '';
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

    // Validate Mada Card
    var madaCard = false;

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

            // Validate Mada Card
            madaCard = ckoHelper.isMadaCard(cardNumber);
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
        if (paymentInformation.saveCard.value && !paymentInformation.storedPaymentUUID) {
            paymentInstrument.setCreditCardToken(
                paymentInformation.creditCardToken
                    ? paymentInformation.creditCardToken
                    : createToken()
            );
        } else if (paymentInformation.storedPaymentUUID) {
            paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
        };

        paymentInstrument.custom.ckoPaymentData = JSON.stringify({
            'securityCode': cardSecurityCode,
            'storedPaymentUUID': paymentInformation.storedPaymentUUID,
            'saveCard': paymentInformation.creditCardToken ? true : false,
            'customerNo': req.currentCustomer.raw.registered ? req.currentCustomer.profile.customerNo : null ,
            'madaCard': madaCard
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

    var ckoPaymentRequest = cardHelper.handleRequest(orderNumber, paymentInstrument, paymentProcessor);

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
        paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
        paymentInstrument.custom.ckoPaymentData = "";
    });

    if (ckoPaymentRequest) {

        try {
            // Handle errors
            if (ckoPaymentRequest.error) {
    
                throw new Error(ckoPaymentRequest.message);
            }
               
        } catch (e) {
            error = true;
            if (ckoPaymentRequest.code) {
                serverErrors.push(e.message);
            } else {
                Resource.msg('error.technical', 'checkout', null);
            }
        }

    } else {
        error = true;
        Resource.msg('error.technical', 'checkout', null);
        return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, redirectUrl: false };
    }

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error, redirectUrl: ckoPaymentRequest.redirectUrl };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
exports.createToken = createToken;
