'use strict';

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(paymentForm, viewFormData) {
    var viewData = viewFormData;
    var selectedCardUuid = paymentForm.creditCardFields.selectedCardUuid.value;
    var creditCardErrors = {};

    // Add the payment method info
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value.toString(),
        htmlName: paymentForm.paymentMethod.htmlName
    };

    // Process the card info
    if (!selectedCardUuid) { 
        // Verify credit card form data
        creditCardErrors = COHelpers.validateCreditCard(paymentForm);
        if (Object.keys(creditCardErrors).length) {
            return {
                fieldErrors: creditCardErrors,
                error: true
            };
        }

        // New card
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
        // Saved card
        viewData.selectedCardUuid = selectedCardUuid.toString();
    }

    return {
        error: false,
        viewData: viewData
    };
}

exports.processForm = processForm;