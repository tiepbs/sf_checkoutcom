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

    var logger = require('dw/system/Logger').getLogger('ckodebug');

	logger.debug('xapm req {0}', JSON.stringify(req));
	logger.debug('xapm paymentForm {0}', JSON.stringify(paymentForm));
	logger.debug('xapm viewData {0}', JSON.stringify(viewData));

    viewData.paymentInformation = {
        ckoApm: {
            value: paymentForm.apmForm.ckoSelectedApm.value.toString(),
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