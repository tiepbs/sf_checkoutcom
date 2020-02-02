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
var paymentHelper = require('~/cartridge/scripts/helpers/paymentHelper');

/** Apm Filter Configuration file **/
var ckoApmFilterConfig = require('~/cartridge/scripts/config/ckoApmFilterConfig');

/**
 * Handles responses from the Checkout.com payment gateway.
 */
server.get('HandleReturn', function (req, res, next) {
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
                        paymentHelper.getConfirmationPage(res, order);

                    } else {
                        // Restore the cart
                        ckoHelper.checkAndRestoreBasket(order);

                        // Send back to the error page
                        paymentHelper.getFailurePage(res);
                    }
                } else {
                    paymentHelper.getFailurePage(res);
                }
            }

            // Else it's a normal transaction
            else {
                // Get the response
                gResponse = JSON.parse(request.httpParameterMap.getRequestBodyAsString());

                // Process the response data
                if (ckoHelper.paymentIsValid(gResponse)) {
                    paymentHelper.getConfirmationPage(res, order);
                } else {
                    paymentHelper.getFailurePage(res);
                }
            }
        } else {
            paymentHelper.getFailurePage(res);
        }
    } else {
        paymentHelper.getFailurePage(res);
    }

    next();
});

/**
 * Handles a failed payment from the Checkout.com payment gateway.
 */
server.get('HandleFail', function (req, res, next) {
    // Load the order
    var order = OrderMgr.getOrder(session.privacy.ckoOrderId);

    // Restore the cart
    ckoHelper.checkAndRestoreBasket(order);

    // Send back to the error page
    paymentHelper.getFailurePage(res);

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
    res.json(responseObject);
    next();
});

/*
 * Module exports
 */
module.exports = server.exports();