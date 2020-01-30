'use strict';

/* Server */
var server = require('server');
server.extend(module.superModule);

/** Utility **/
var paymentHelper = require('~/cartridge/scripts/helpers/paymentHelper');

/**
 * Handles requests to the Checkout.com payment gateway.
 */
server.replace('SubmitPayment', server.middleware.https, function (req, res, next) {
    // Set the payment method ID
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
    return paymentHelper[func](paymentMethodId, req, res, next);
});

/*
 * Module exports
 */
module.exports = server.exports();