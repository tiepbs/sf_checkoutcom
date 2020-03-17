'use strict';

/* Server */
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.extend(module.superModule);

/** Utility **/
var paymentHelper = require('~/cartridge/scripts/helpers/paymentHelper');


/**
 * Handles requests to the Checkout.com payment gateway.
 */
server.replace('SubmitPayment', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {    
    // Load some classes
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var PaymentManager = require('dw/order/PaymentMgr');

    // Load some parameters
    var accountModel = new AccountModel(req.currentCustomer);
    var currentLocale = Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: false, countryCode: currentLocale.country, containerView: 'basket' }
    );

    // Prepare the payment parameters
    var viewData = {};
    var paymentForm = server.forms.getForm('billing');

    // verify billing form data
    var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
    var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

    var formFieldErrors = [];
    if (Object.keys(billingFormErrors).length) {
        formFieldErrors.push(billingFormErrors);
    } else {
        viewData.address = {
            firstName: { value: paymentForm.addressFields.firstName.value },
            lastName: { value: paymentForm.addressFields.lastName.value },
            address1: { value: paymentForm.addressFields.address1.value },
            address2: { value: paymentForm.addressFields.address2.value },
            city: { value: paymentForm.addressFields.city.value },
            postalCode: { value: paymentForm.addressFields.postalCode.value },
            countryCode: { value: paymentForm.addressFields.country.value }
        };

        if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
            viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
        }
    }

    if (Object.keys(contactInfoFormErrors).length) {
        formFieldErrors.push(contactInfoFormErrors);
    } else {
        viewData.email = {
            value: paymentForm.contactInfoFields.email.value
        };

        viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
    }

    var paymentFormResult;

    // Set the payment method ID
    //var paymentMethodId = req.form.dwfrm_billing_paymentMethod;
    var paymentMethodId = 'CHECKOUTCOM_CARD';
    if (!PaymentManager.getPaymentMethod(paymentMethodId).paymentProcessor) {
        throw new Error(Resource.msg(
            'error.payment.processor.missing',
            'checkout',
            null
        ));
    }

    res.setViewData(viewData);  

    //res.setViewData(paymentFormResult.viewData);

    var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
        req,
        accountModel
    );

    var billingForm = server.forms.getForm('billing');

    res.json({
        renderedPaymentInstruments: renderedStoredPaymentInstrument,
        customer: accountModel,
        order: basketModel,
        form: billingForm,
        error: false
    });    
    

   return next();
});

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
	
    var f1 = server.forms.getForm('billing');

    var logger = require('dw/system/Logger').getLogger('ckodebug');
    logger.debug('line 1 {0}', JSON.stringify(f1));
    logger.debug('line 2 {0}', JSON.stringify(req.form));

    // Get the payment method id
    var paymentMethodId = 'CHECKOUTCOM_CARD';
    //var paymentMethodId = req.form.dwfrm_billing_paymentMethod;

    // Get a camel case function name from event type
    var func = '';
    var parts = paymentMethodId.toLowerCase().split('_');
    for (var i = 0; i < parts.length; i++) {
        func += (i == 0) ? parts[i] : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
    }

    // Add the request suffix
    func += 'Request';

    // Process the request
    return paymentHelper[func](paymentMethodId, req, res, next);

});

/*
 * Module exports
 */
module.exports = server.exports();