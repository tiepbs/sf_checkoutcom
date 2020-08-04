'use strict';

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(paymentForm, viewFormData) {
    var viewData = viewFormData;
    var ckoApplePayData = paymentForm.ckoApplePayData ? paymentForm.applePayForm.ckoApplePayData.htmlValue : null;
    var error = true;

    if (ckoApplePayData) {
        viewData.paymentMethod = {
            value: paymentForm.paymentMethod.htmlValue,
            htmlName: paymentForm.paymentMethod.htmlValue,
        };

        viewData.paymentInformation = {
            ckoApplePayData: {
                value: ckoApplePayData.htmlValue,
                htmlName: ckoApplePayData.htmlName,
            },
        };
    }

    return {
        error: error,
        viewData: viewData,
    };
}

exports.processForm = processForm;
