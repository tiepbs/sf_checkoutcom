'use strict';

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(paymentForm, viewFormData) {
    var viewData = viewFormData;
    var ckoSelectedApm = paymentForm.apmForm.ckoSelectedApm;
    var result = {
        error: false,
        viewData: viewData
    };    
    if (ckoSelectedApm.htmlValue.length > 0) {
        viewData.paymentInformation = {
            ckoApm: {
                value: ckoSelectedApm.htmlValue,
                htmlName: ckoSelectedApm.htmlValue,
                data: paymentForm.apmForm
            },
        };
    }
    else {
        result.error = true;
    }

    return result;
}

exports.processForm = processForm;