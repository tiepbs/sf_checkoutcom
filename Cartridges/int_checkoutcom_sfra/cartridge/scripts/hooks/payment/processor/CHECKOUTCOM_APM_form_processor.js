'use strict';

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req The request
 * @param {Object} paymentForm The payment form
 * @param {Object} viewFormData Object contains billing form data
 * @returns {Object} An object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;
    var ckoSelectedApm = paymentForm.apmForm ? paymentForm.apmForm.ckoSelectedApm.htmlValue : null;
    var error = true;
    var fieldErrors = {};

    if (ckoSelectedApm) {
        error = false;
        viewData.paymentMethod = {
            value: paymentForm.paymentMethod.htmlValue,
            htmlName: paymentForm.paymentMethod.htmlName,
        };

        var apmForm = ckoSelectedApm + 'Form';
        var apmData = paymentForm[apmForm];
        viewData.paymentInformation = {};

        if (apmData) {
            viewData.paymentInformation.type = {
                value: ckoSelectedApm,
                htmlName: apmData.htmlName,
            };
            Object.keys(apmData).forEach(function(key) {
                var type = typeof apmData[key];
                if (type === 'object' && apmData[key] != null) {
                    viewData.paymentInformation[key] = {
                        value: apmData[key].htmlValue,
                        htmlName: apmData[key].htmlName,
                    };
                }
            });

        } else {
            viewData.paymentInformation.type = {
                value: ckoSelectedApm,
                htmlName: paymentForm.apmForm.htmlName,
            };
        }

        // Validate form value
        if (viewData.paymentInformation) {
            Object.keys(viewData.paymentInformation).forEach(function(key) {
                var currentElement = viewData.paymentInformation[key];
                if (currentElement.value === '') {
                    error = true;
                    fieldErrors[currentElement.htmlName] = 'required';
                }
            });
        }
    }

    return {
        error: error,
        viewData: viewData,
        fieldErrors: fieldErrors
    };
}

exports.processForm = processForm;
