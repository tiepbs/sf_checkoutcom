'use strict';

/* Server */
var server = require('server');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

/* Checkout.com Event functions */
var eventsHelper = require('~/cartridge/scripts/helpers/eventsHelper');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var paymentHelper = require('~/cartridge/scripts/helpers/paymentHelper');

/** Apm Filter Configuration file **/
var ckoApmFilterConfig = require('~/cartridge/scripts/config/ckoApmFilterConfig');

/**
 * Handles responses from the Checkout.com payment gateway.
 * @returns {string} The controller response
 */
server.get('HandleReturn', server.middleware.https, function(req, res, next) {
    // Prepare some variables
    var order;
    var mode = ckoHelper.getValue('ckoMode');
    var gResponse = {};

    // Check if a session id is available
    var condition1 = Object.prototype.hasOwnProperty.call(req, 'querystring');
    var condition2 = Object.prototype.hasOwnProperty.call(req.querystring, 'cko-session-id');
    if (condition1 && condition2) {
        // Parse the response
        gResponse = req.querystring;

        // Reset the session URL
        // eslint-disable-next-line
        session.privacy.redirectUrl = null;

        // Perform the request to the payment gateway
        var gVerify = ckoHelper.gatewayClientRequest(
            'cko.verify.charges.' + mode + '.service',
            {
                paymentToken: req.querystring['cko-session-id'],
            }
        );

        // Load the order
        if (Object.prototype.hasOwnProperty.call(gVerify, 'reference') && gVerify.reference) {
            // Load the order
            order = OrderMgr.getOrder(gVerify.reference);

            // If there is a valid response
            var condition = order && typeof (gVerify) === 'object'
            && Object.prototype.hasOwnProperty.call(gVerify, 'id')
            && ckoHelper.redirectPaymentSuccess(gVerify);
            if (condition) {
                // Place the order
                var placeOrderResult = COHelpers.placeOrder(order, { status: '' });
                if (placeOrderResult.error) {
                    OrderMgr.failOrder(order, true);
                }
    
                // Show the order confirmation page
                paymentHelper.getConfirmationPageRedirect(res, order);
            }
            else {
                OrderMgr.failOrder(order, true);
            }
        }
    } else if (ckoHelper.paymentSuccess(gResponse)) {
        // Place the order
        order = OrderMgr.getOrder(gResponse.reference);
        var placeOrderResult = COHelpers.placeOrder(order, { status: '' });
        if (placeOrderResult.error) {
            OrderMgr.failOrder(order, true);
        }

        // Show the order confirmation page
        paymentHelper.getConfirmationPageRedirect(res, order);
    }
    else {
        OrderMgr.failOrder(order, true);
    }

    return next();
});

/**
 * Handles a failed payment from the Checkout.com payment gateway.
 * @returns {string} The controller response
 */
server.get('HandleFail', server.middleware.https, function(req, res, next) {
    // Load the order
    // eslint-disable-next-line
    if (Object.prototype.hasOwnProperty.call(session.privacy, 'ckoOrderId')) {
        // eslint-disable-next-line
        var order = OrderMgr.getOrder(session.privacy.ckoOrderId);

        // Restore the cart
        if (order) {
            OrderMgr.failOrder(order, true);
        }
    }

    // Send back to the error page
    paymentHelper.getFailurePageRedirect(res);
    this.emit('route:Complete', req, res);
    return;
});

/**
 * Handles webhook responses from the Checkout.com payment gateway.
 * @returns {string} The controller response
 */
server.post('HandleWebhook', function(req, res, next) {
    if (ckoHelper.isValidResponse(req)) {
        // Get the response as JSON object
        var hook = JSON.parse(req.body);

        // Check the webhook event
        if (hook !== null && Object.prototype.hasOwnProperty.call(hook, 'type')) {
            // Get a camel case function name from event type
            var func = '';
            var parts = hook.type.split('_');
            for (var i = 0; i < parts.length; i++) {
                func += (i === 0) ? parts[i] : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
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
            ),
        });
    } else {
        // Set a failure response
        res.json({
            response: Resource.msg(
                'cko.webhook.failure',
                'cko',
                null
            ),
        });
    }

    return next();
});

/**
 * Gets the APM filter data.
 * @returns {string} The controller response
 */
server.get('GetApmFilter', server.middleware.https, function(req, res, next) {
    // Prepare some variables
    var basket = BasketMgr.getCurrentBasket();
    var currencyCode = basket.getCurrencyCode();
    var countryCode = basket.defaultShipment.shippingAddress.countryCode.valueOf();

    // Prepare the filter object
    var filterObject = {
        country: countryCode,
        currency: currencyCode,
    };

    // Prepare the response object
    var responseObject = {
        filterObject: filterObject,
        ckoApmFilterConfig: ckoApmFilterConfig,
    };

    // Write the response
    res.json(responseObject);
    return next();
});

/*
 * Module exports
 */
module.exports = server.exports();
