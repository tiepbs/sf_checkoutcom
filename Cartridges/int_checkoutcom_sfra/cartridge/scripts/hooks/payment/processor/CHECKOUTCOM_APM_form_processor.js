'use strict';

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} paymentForm The payment form
 * @param {Object} viewFormData Object contains billing form data
 * @returns {Object} An object that has error information or payment information
 */
function processForm(paymentForm, viewFormData) {
    var viewData = viewFormData;
    var ckoSelectedApm = paymentForm.apmForm ? paymentForm.apmForm.ckoSelectedApm.htmlValue : null;
    var error = true;

    if (ckoSelectedApm && ckoSelectedApm.htmlValue.length > 0) {
        viewData.paymentInformation = {
            ckoApm: {
                value: ckoSelectedApm.htmlValue,
                htmlName: ckoSelectedApm.htmlValue,
                data: paymentForm.apmForm,
            },
        };
    }

    return {
        error: error,
        viewData: viewData,
    };
}

exports.processForm = processForm;
