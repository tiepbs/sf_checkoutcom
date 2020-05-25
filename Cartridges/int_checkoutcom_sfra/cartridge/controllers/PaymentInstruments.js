'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/** Utility **/
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);

    if (paymentForm.valid) {
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) {
            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Transaction = require('dw/system/Transaction');

            var formInfo = res.getViewData();
            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
            var wallet = customer.getProfile().getWallet();
            var processorId = 'CHECKOUTCOM_CARD';

            // Prepare the payment data
            var paymentData = {
                savedCardForm: {},
                paymentInformation: {}
            };
            paymentData.savedCardForm['selectedCardUuid'] = {'value': ''};
            paymentData.savedCardForm['selectedCardCvv'] = {'value': ''};
            paymentData.paymentInformation['cardNumber'] = {'value': formInfo.cardNumber};
            paymentData.paymentInformation['expirationMonth'] = {'value': formInfo.expirationMonth};
            paymentData.paymentInformation['expirationYear'] = {'value': formInfo.expirationMonth};
            paymentData.paymentInformation['securityCode'] = {'value': 100};

            // Handle the 0$ authorization
            var success = cardHelper.preAuthorizeCard(
                paymentData,
                req.currentCustomer.profile.customerNo,
                processorId
            );

            if (success) {
                Transaction.wrap(function () {
                    var paymentInstrument = wallet.createPaymentInstrument(processorid);
                    paymentInstrument.setCreditCardHolder(formInfo.name);
                    paymentInstrument.setCreditCardNumber(formInfo.cardNumber);
                    paymentInstrument.setCreditCardType(formInfo.cardType);
                    paymentInstrument.setCreditCardExpirationMonth(formInfo.expirationMonth);
                    paymentInstrument.setCreditCardExpirationYear(formInfo.expirationYear);
                });
                
                // Send account edited email
                accountHelpers.sendAccountEditedEmail(customer.profile);

                // Return success
                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
                });
            }

            // Handle errors
            res.json({
                success: false,
                fields: formErrors.getFormErrors(paymentForm)
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    return next();
});

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm
    };
}

module.exports = server.exports();
