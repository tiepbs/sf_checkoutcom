/**
 * Klarna controller.
 */

'use strict';

/* Server */
var server = require('server');

/* API Includes */
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Initiate the Kalrna session.
 */
server.get('KlarnaSession', server.middleware.https, function (req, res, next) {
    // Prepare the basket
    var basket = BasketMgr.getCurrentBasket();
    if (basket) {
        // Prepare the variables
        var countryCode = ckoHelper.getBasketCountyCode(basket);
        var currency = basket.getCurrencyCode();
        var locale = ckoHelper.getLanguage();
        var total = ckoHelper.getFormattedPrice(basket.getTotalGrossPrice().value, currency);
        var tax =  ckoHelper.getFormattedPrice(basket.getTotalTax().value, currency);
        var products = ckoHelper.getBasketObject(basket);
        var billing = ckoHelper.getBasketAddress(basket);
        
        // Prepare the request object
        var requestObject = {
            "purchase_country": countryCode,
            "currency"              : currency,
            "locale"                : locale,
            "amount"                : total,
            "tax_amount"            : tax,
            "products"              : products,
            "billing_address"       : billing
        }
        
        // Perform the request to the payment gateway
        var gSession = ckoHelper.gatewayClientRequest(
            'cko.klarna.session.' + ckoHelper.getValue('ckoMode') + '.service',
            requestObject
        );
        
        // Store variables in session
        gSession.requestObject = requestObject;
        gSession.addressInfo = ckoHelper.getBasketAddress(basket);

        // Write the session
        if (gSession) {
            res.json(gSession);
        }
    } else {
        return next(
            new Error(
                Resource.msg(
                    'cko.payment.invalid',
                    'cko',
                    null
                )
            )
        );
    }

    next();
});

/*
 * Module exports
 */
module.exports = server.exports();