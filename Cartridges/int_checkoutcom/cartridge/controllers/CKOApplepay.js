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

        // Prepare the request object
        var orderObject = {
            countryCode: ckoHelper.getBasketCountyCode(basket),
            merchantId: ckoHelper.getValue('ckoApplePayMerchantId'),
            applepayEnvironment: ckoHelper.getValue('ckoApplePayEnvironment'),
            siteName: ckoHelper.getSiteName(),
            currencyCode: basket.getCurrencyCode(),
            locale: ckoHelper.getLanguage(),
            amount: basket.getTotalGrossPrice().value,
            products: ckoHelper.getBasketObject(basket),
            billing_address: ckoHelper.getBasketAddress(basket),
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
