'use strict';

/* Server */
var server = require('server');

/* Script Modules */
var URLUtils = require('dw/web/URLUtils');

server.extend(module.superModule);

/** Utility **/
var paymentHelper = require('~/cartridge/scripts/helpers/paymentHelper');

/**
 * Handles requests to the Checkout.com payment gateway.
 */
server.replace('SubmitPayment', server.middleware.https, function (req, res, next) { 
    // Load some classes
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

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
    var billingForm = server.forms.getForm('billing');

    res.setViewData(viewData);  

    this.on('route:BeforeComplete', function (req, res) {
        var BasketMgr = require('dw/order/BasketMgr');
        var HookMgr = require('dw/system/HookMgr');
        var PaymentMgr = require('dw/order/PaymentMgr');
        var PaymentInstrument = require('dw/order/PaymentInstrument');
        var Transaction = require('dw/system/Transaction');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');
        var URLUtils = require('dw/web/URLUtils');
        var Locale = require('dw/util/Locale');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = res.getViewData();

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return;
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return;
        }

        var billingAddress = currentBasket.billingAddress;
        var billingForm = server.forms.getForm('billing');

        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );

        res.json({
            customer: accountModel,
            order: basketModel,
            form: billingForm,
            error: false
        });    
    });
  
   return next();
});

server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {    
    // Process the place order request
	var condition = req.form && req.form.dwfrm_billing_paymentMethod;
	if (condition) {
	    // Get the payment method id
	    var paymentMethodId = req.form.dwfrm_billing_paymentMethod;

	    // Get a camel case function name from event type
	    var func = '';
	    var parts = paymentMethodId.toLowerCase().split('_');
	    for (var i = 0; i < parts.length; i++) {
	        func += (i == 0) ? parts[i] : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
	    }

	    // Add the request suffix
	    func += 'Request';

	    // Process the request
        var result = paymentHelper[func](paymentMethodId, req, res, next);
        if (result.url) {
            res.json({
                error: false,
                orderID: result.order.orderNo,
                continueUrl: result.url
            });
        }
        else if (result.order) {
            res.json({
                error: false,
                orderID: result.order.orderNo,
                orderToken: result.order.orderToken,
                continueUrl: URLUtils.url('Order-Confirm').toString()
            });
        }
        else {
            res.json({
                error: true,
                orderID: false,
                orderToken: false,
                continueUrl: URLUtils.url('Cart-Show').toString()
            });        
        }

        return next();
    }
});

/*
 * Module exports
 */
module.exports = server.exports();