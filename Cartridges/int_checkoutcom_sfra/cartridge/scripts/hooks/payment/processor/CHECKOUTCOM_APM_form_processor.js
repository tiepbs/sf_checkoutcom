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
    var viewData = viewFormData;

    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };

    viewData.paymentInformation = {
        ckoApm: {
            value: paymentForm.apmForm.ckoSelectedApm.htmlValue,
            htmlName: paymentForm.apmForm.ckoSelectedApm.htmlName,
            data: paymentForm.apmForm
        },
    };

    return {
        error: false,
        viewData: viewData
    };
}

exports.processForm = processForm;