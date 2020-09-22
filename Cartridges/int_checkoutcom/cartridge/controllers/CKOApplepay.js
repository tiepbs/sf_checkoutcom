'use strict';

//  API Includes
var Site = require('dw/system/Site');
var siteControllerName = Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var BasketMgr = require('dw/order/BasketMgr');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Returns the Order Informaton for apple pay
 * @returns {object} The Apple Pay Order response
 */
function applePayOrder() {
    // Prepare the basket
    var basket = BasketMgr.getCurrentBasket();
    if (basket) {
        // Prepare the variables
        var countryCode = ckoHelper.getBasketCountyCode(basket);
        var currency = basket.getCurrencyCode();
        var locale = ckoHelper.getLanguage();
        var total = basket.getTotalGrossPrice().value;
        var products = ckoHelper.getBasketObject(basket);
        var billing = ckoHelper.getBasketAddress(basket);

        // Prepare the request object
        var orderObject = {
            countryCode: countryCode,
            currencyCode: currency,
            locale: locale,
            amount: total,
            products: products,
            billing_address: billing,
        };

        // Write the session
        if (orderObject) {
            return ckoHelper.ckoResponse(orderObject);
        }
    } else {
        return ckoHelper.ckoResponse(ckoHelper._('cko.applepay.noBasket', 'cko'));
    }

    return null;
}

// Module exports
exports.ApplePayOrder = guard.ensure(['get', 'https'], applePayOrder);
