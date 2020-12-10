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
    var ckoSelectedApm = paymentForm.paymentMethod.value.toLowerCase();
    var error = true;
    var fieldErrors = {};

    if (paymentForm.paymentMethod.value) {
        error = false;
        viewData.paymentMethod = {
            value: paymentForm.paymentMethod.value,
            htmlName: paymentForm.paymentMethod.htmlName
        };

        var apm = ckoSelectedApm + 'Form';
        var apmForm = paymentForm[apm];
        viewData.paymentInformation = {};

        // If this apm have a form
        if (apmForm) {
            Object.keys(apmForm).forEach(function(key) {
                var type = typeof apmForm[key];
                if (type === 'object' && apmForm[key] != null) {
                    viewData.paymentInformation[key] = {
                        value: apmForm[key].htmlValue,
                        htmlName: apmForm[key].htmlName,
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
