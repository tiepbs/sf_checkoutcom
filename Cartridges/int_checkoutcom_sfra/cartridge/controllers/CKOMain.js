'use strict';

/* Server */
var server = require('server');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');

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
server.get('HandleReturn', server.middleware.https, function (req, res, next) {
    // Prepare some variables
    var mode = ckoHelper.getValue('ckoMode');

    // Check if a session id is available
    if (req.querystring.hasOwnProperty('cko-session-id')) {
        // Reset the session URL
        session.privacy.redirectUrl = null;

        // Perform the request to the payment gateway
        var gVerify = ckoHelper.gatewayClientRequest(
            'cko.verify.charges.' + mode + '.service',
            {
                'paymentToken': req.querystring['cko-session-id']
            }
        );

        // If there is a valid response
        if (typeof(gVerify) === 'object' && gVerify.hasOwnProperty('id')) {
            if (ckoHelper.redirectPaymentSuccess(gVerify)) {
                // Load the order
                var order = OrderMgr.getOrder(gVerify.reference);

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
    else {
        // Process the response data
        var gResponse = JSON.parse(req.querystring);
        if (ckoHelper.paymentIsValid(gResponse)) {
            // Load the order
            var order = OrderMgr.getOrder(gVerify.reference);

            // Redirect to the confirmation page
            paymentHelper.getConfirmationPage(res, order);
        } else {
            // Redirect to the failure page
            paymentHelper.getFailurePage(res);
        }
    }

    next();
});

/**
 * Handles a failed payment from the Checkout.com payment gateway.
 */
server.get('HandleFail', server.middleware.https, function (req, res, next) {
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
    if (ckoHelper.isValidResponse(req)) {
        // Get the response as JSON object
        var hook = JSON.parse(req.body);

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

        // Set a success response
        res.json({
            response: Resource.msg(
                'cko.webhook.success',
                'cko',
                null
            )
        });
    }
    else {
        // Set a failure response
        res.json({
            response: Resource.msg(
                'cko.webhook.failure',
                'cko',
                null
            )
        });
    }

    next();
});

server.get('GetApmFilter', server.middleware.https, function (req, res, next) {
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