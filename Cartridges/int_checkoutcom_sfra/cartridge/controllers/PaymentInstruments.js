'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/** Utility **/
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

server.post('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var dwOrderPaymentInstrument = require('dw/order/PaymentInstrument');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);

    if (paymentForm.valid && !verifyCard(req, result, paymentForm)) {
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
            var processorid = 'CHECKOUTCOM_CARD';

            // Prepare the payment data
            var paymentData = {};
            paymentData.savedCardForm.selectedCardUuid.value = '';
            paymentData.savedCardForm.selectedCardCvv.value = '';
            paymentData.creditCardFields.cardNumber.value = formInfo.cardNumber;
            paymentData.creditCardFields.expirationMonth.value = formInfo.expirationMonth;
            paymentData.creditCardFields.expirationYear.value = formInfo.expirationYear;
            paymentData.creditCardFields.securityCode.value = 100;

            var logger = require('dw/system/Logger').getLogger('ckodebug');
            logger.debug('formInfox {0}', JSON.stringify(formInfo));
        
            // Handle the 0$ authorization
            var result = cardHelper.handleRequest(
                paymentData,
                processorId,
                null
            );

            if (!result.error) {
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

module.exports = server.exports();
