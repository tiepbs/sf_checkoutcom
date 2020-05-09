'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var array = require('*/cartridge/scripts/util/array');

    var logger = require('dw/system/Logger').getLogger('ckodebug');
    logger.debug('req1 {0}', JSON.stringify(req));
    logger.debug('paymentForm1 {0}', JSON.stringify(paymentForm));
    logger.debug('viewFormData1 {0}', JSON.stringify(viewFormData));

    var viewData = viewFormData;
    var fieldErrors = {};

    if (!req.form.storedPaymentUUID) {
        // verify credit card form data
        fieldErrors = COHelpers.validateCreditCard(paymentForm);

        if (Object.keys(fieldErrors).length) {
            return {
                fieldErrors: fieldErrors,
                error: true
            };
        }
    
        viewData.paymentMethod = {
            value: paymentForm.paymentMethod.value,
            htmlName: paymentForm.paymentMethod.value
        };
    
        viewData.paymentInformation = {
            cardType: {
                value: paymentForm.creditCardFields.cardType.value,
                htmlName: paymentForm.creditCardFields.cardType.htmlName
            },
            cardNumber: {
                value: paymentForm.creditCardFields.cardNumber.value,
                htmlName: paymentForm.creditCardFields.cardNumber.htmlName
            },
            securityCode: {
                value: paymentForm.creditCardFields.securityCode.value,
                htmlName: paymentForm.creditCardFields.securityCode.htmlName
            },
            expirationMonth: {
                value: parseInt(
                    paymentForm.creditCardFields.expirationMonth.selectedOption,
                    10
                ),
                htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
            },
            expirationYear: {
                value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
                htmlName: paymentForm.creditCardFields.expirationYear.htmlName
            }
        };

        viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;
    }
    else {
        viewData.storedPaymentUUID = req.form.storedPaymentUUID;

        // process payment information
        if (viewData.storedPaymentUUID
            && req.currentCustomer.raw.authenticated
            && req.currentCustomer.raw.registered
        ) {
            var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
            var paymentInstrument = array.find(paymentInstruments, function (item) {
                return viewData.storedPaymentUUID === item.UUID;
            });

            viewData.paymentInformation.cardNumber.value = paymentInstrument.creditCardNumber;
            viewData.paymentInformation.cardType.value = paymentInstrument.creditCardType;
            viewData.paymentInformation.securityCode.value = req.form.securityCode;
            viewData.paymentInformation.expirationMonth.value = paymentInstrument.creditCardExpirationMonth;
            viewData.paymentInformation.expirationYear.value = paymentInstrument.creditCardExpirationYear;
            viewData.paymentInformation.creditCardToken = paymentInstrument.raw.creditCardToken;
        }
    }

    return {
        error: false,
        viewData: viewData
    };
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
    var CustomerMgr = require('dw/customer/CustomerMgr');

    if (!billingData.storedPaymentUUID
        && req.currentCustomer.raw.authenticated
        && req.currentCustomer.raw.registered
        && billingData.saveCard
        && (billingData.paymentMethod.value === 'CHECKOUTCOM_CARD')
    ) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var saveCardResult = COHelpers.savePaymentInstrumentToWallet(
            billingData,
            basket,
            customer
        );

        req.currentCustomer.wallet.paymentInstruments.push({
            creditCardHolder: saveCardResult.creditCardHolder,
            maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
            creditCardType: saveCardResult.creditCardType,
            creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
            creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
            UUID: saveCardResult.UUID,
            creditCardNumber: Object.hasOwnProperty.call(
                saveCardResult,
                'creditCardNumber'
            )
                ? saveCardResult.creditCardNumber
                : null,
            raw: saveCardResult
        });
    }
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;
