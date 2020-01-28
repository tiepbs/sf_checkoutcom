'use strict';

/* Server */
var server = require('server');
server.extend(module.superModule);

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(siteControllerName + '/cartridge/scripts/app');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');

/* Checkout.com Event functions */
var eventsHelper = require('~/cartridge/scripts/helpers/eventsHelper');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/** Apm Filter Configuration file **/
var ckoApmFilterConfig = require('~/cartridge/scripts/config/ckoApmFilterConfig');

/**
 * Handles responses from the Checkout.com payment gateway.
 */
server.post('HandleReturn', function (req, res, next) {
    // Prepare some variables
    var gResponse = false;
    var mode = ckoHelper.getValue('ckoMode').value;
    var orderId = ckoHelper.getOrderId();
    
    // If there is a track id
    if (orderId) {
        // Load the order
        var order = OrderMgr.getOrder(orderId);
        if (order) {
            // Check the payment token if exists
            var sessionId = req.httpParameterMap.get('cko-session-id').stringValue;
            
            // If there is a payment session id available, verify
            if (sessionId) {
                // Perform the request to the payment gateway
                var gVerify = ckoHelper.gatewayClientRequest(
                    'cko.verify.charges.' + mode + '.service',
                    {'paymentToken': sessionId}
                );
                
                // If there is a valid response
                if (typeof(gVerify) === 'object' && gVerify.hasOwnProperty('id')) {
                    if (ckoHelper.redirectPaymentSuccess(gVerify)) {
                        // Show order confirmation page
                        app.getController('COSummary').ShowConfirmation(order);
                    } else {
                        // Restore the cart
                        ckoHelper.checkAndRestoreBasket(order);

                        // Send back to the error page
                        res.render('custom/common/response/failed');
                    }
                } else {
                    ckoHelper.handleFail(gVerify);
                }
            }

            // Else it's a normal transaction
            else {
                // Get the response
                gResponse = JSON.parse(request.httpParameterMap.getRequestBodyAsString());

                // Process the response data
                if (ckoHelper.paymentIsValid(gResponse)) {
                    app.getController('COSummary').ShowConfirmation(order);
                } else {
                    ckoHelper.handleFail(gResponse);
                }
            }
        } else {
            ckoHelper.handleFail(null);
        }
    } else {
        res.getWriter().println('error!');
    }

    next();
});

/**
 * Handles a failed payment from the Checkout.com payment gateway.
 */
server.post('HandleFail', function (req, res, next) {
    // Load the order
    var order = OrderMgr.getOrder(session.privacy.ckoOrderId);

    // Restore the cart
    ckoHelper.checkAndRestoreBasket(order);

    // Send back to the error page
    res.render('custom/common/response/failed');

    next();
});

/**
 * Handles webhook responses from the Checkout.com payment gateway.
 */
server.post('HandleWebhook', function (req, res, next) {
    var isValidResponse = ckoHelper.isValidResponse();
    if (isValidResponse) {
        // Get the response as JSON object
        var hook = JSON.parse(req.httpParameterMap.getRequestBodyAsString());

        // Check the webhook event
        if (hook !== null && hook.hasOwnProperty('type')) {
            // Get a camel case function name from event type
            var func = '';
            var parts = hook.type.split('_');
            for (var i = 0; i < parts.length; i++) {
                func += (i == 0) ? parts[i] : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
            }

            // Call the event
            eventsHelper[func](hook);
        }
    }

    next();
});

/**
 * Initializes the credit card list by determining the saved customer payment method.
 */
server.get('GetCardsList', function (req, res, next) {
    // Prepare the variables
    var applicablePaymentCards;
    var data = [];

    // If user logged in
    if (customer.authenticated) {
        var profile = customer.getProfile();
        if (profile) {
            applicablePaymentCards = customer.profile.getWallet().getPaymentInstruments();
            for (let i = 0; i < applicablePaymentCards.length; i++) {
                data.push({
                    cardId: applicablePaymentCards[i].getUUID(),
                    cardNumber: applicablePaymentCards[i].getCreditCardNumber(),
                    cardHolder: applicablePaymentCards[i].creditCardHolder,
                    cardType: applicablePaymentCards[i].getCreditCardType(),
                    expiryMonth: applicablePaymentCards[i].creditCardExpirationMonth,
                    expiryYear: applicablePaymentCards[i].creditCardExpirationYear,
                });
            }
        }
        
        // Send the output for rendering
        res.render('custom/ajax/output', {data: JSON.stringify(data)});
    } else {
        app.getModel('Customer').logout();
        res.render('csrf/csrffailed');
    }

    next();
});

server.get('GetApmFilter', function (req, res, next) {
    // Prepare some variables
    var basket = BasketMgr.getCurrentBasket();
    var currencyCode = basket.getCurrencyCode();
    var countryCode = basket.defaultShipment.shippingAddress.countryCode.valueOf();
    
    // Prepare the filter object
    var filterObject = {
        country     : countryCode,
        currency    : currencyCode
    }
    
    // Prepare the response object
    var responseObject = {
        'filterObject'          : filterObject,
        'ckoApmFilterConfig'    : ckoApmFilterConfig
    }
    
    // Write the response
    res.getWriter().println(JSON.stringify(responseObject));
    next();
});

/*
 * Module exports
 */
module.exports = server.exports();