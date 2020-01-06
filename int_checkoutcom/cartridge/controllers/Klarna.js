/**
 * Klarna controller.
 *
 * @module controllers/Hello
 */

'use strict';

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var BasketMgr = require('dw/order/BasketMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');


function session(){
	
	var basket = BasketMgr.getCurrentBasket();
	
	if(basket){

		var countryCode = ckoUtility.getAppModeValue('GB', ckoUtility.getBasketCountyCode(basket));
		var currency = ckoUtility.getAppModeValue('GBP', basket.getCurrencyCode());
		var locale = ckoUtility.getAppModeValue('en-GB', ckoUtility.getLanguage());
		var total = ckoUtility.getFormattedPrice(basket.getTotalGrossPrice().value, currency);
		var tax =  ckoUtility.getFormattedPrice(basket.getTotalTax().value, currency);
		var products = ckoUtility.getBasketObject(basket);
		var billing = ckoUtility.getBasketAddress(basket);
				
		var requestObject = {
		    "purchase_country": countryCode,
		    "currency"				: currency,
		    "locale"				: locale,
		    "amount"				: total,
		    "tax_amount"			: tax,
		    "products"				: products,
		    "billing_address"		: billing
		}
		
		
		// Perform the request to the payment gateway
		var gSession = ckoUtility.gatewayClientRequest('cko.klarna.session.' + ckoUtility.getValue('ckoMode') + '.service', requestObject);
		
		gSession.requestObject = requestObject;
		gSession.addressInfo = ckoUtility.getBasketAddress(basket);

	   if(gSession){
		   response.getWriter().println(JSON.stringify(gSession));
	   }
		
	}
	else{
		response.getWriter().println('Basket Not Found');
	}
	
}


exports.Session = guard.ensure(['https'], session);