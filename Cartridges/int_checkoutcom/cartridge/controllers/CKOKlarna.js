/**
 * Klarna controller.
 */

'use strict';

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var BasketMgr = require('dw/order/BasketMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/**
 * Initiate the Kalrna session.
 */
function klarnaSession()
{
    // Prepare the basket
    var basket = BasketMgr.getCurrentBasket();
    if (basket) {
        // Prepare the variables
        var countryCode = ckoUtility.getBasketCountyCode(basket);
        var currency = basket.getCurrencyCode();
        var locale = ckoUtility.getLanguage();
        var total = ckoUtility.getFormattedPrice(basket.getTotalGrossPrice().value, currency);
        var tax =  ckoUtility.getFormattedPrice(basket.getTotalTax().value, currency);
        var products = ckoUtility.getBasketObject(basket);
        var billing = ckoUtility.getBasketAddress(basket);
        
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
        var gSession = ckoUtility.gatewayClientRequest(
            'cko.klarna.session.' + ckoUtility.getValue('ckoMode') + '.service',
            requestObject
        );
        
        // Store variables in session
        gSession.requestObject = requestObject;
        gSession.addressInfo = ckoUtility.getBasketAddress(basket);

        // Write the session
        if (gSession) {
            response.getWriter().println(JSON.stringify(gSession));
        }
    } else {
        response.getWriter().println('Basket Not Found');
    }
}

/*
 * Module exports
 */
exports.klarnaSession = guard.ensure(['https'], klarnaSession);