/**
 * Klarna controller.
 *
 * @module controllers/Hello
 */

'use strict';

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(siteControllerName + '/cartridge/scripts/app');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');

/* Utility */
var util = require('~/cartridge/scripts/utility/util');


function session(){
	
	var basket = BasketMgr.getCurrentBasket();
	
	if(basket){
		//response.getWriter().println(basket);
		//var quantity = basket.productLineItems.size();
		//var shippingAddress = basket.productLineItems;
		

		var countryCode = util.getAppModeValue('GB', util.getBasketCountyCode(basket));
		var currency = util.getAppModeValue('GBP', basket.getCurrencyCode());
		var locale = util.getAppModeValue('en-GB', util.getLanguage());
		var total = util.getFormattedPrice(basket.getTotalGrossPrice().value, currency);
		var tax =  util.getFormattedPrice(basket.getTotalTax().value, currency);
		var products = util.getBasketObject(basket);
				
		var requestObject = {
		    "purchase_country": countryCode,
		    "currency": currency,
		    "locale": locale,
		    "amount": total,
		    "tax_amount": tax,
		    "products": products
		}
		

		//response.getWriter().println(JSON.stringify(requestObject));
		
		
		// Perform the request to the payment gateway
		var gSession = util.gatewayClientRequest('cko.klarna.session.' + util.getValue('ckoMode') + '.service', requestObject);
		
		gSession.requestObject = requestObject;
		gSession.addressInfo = util.getBasketAddress(basket);

	   if(gSession){
		   //response.getWriter().println('Your session key is this');
		   response.getWriter().println(JSON.stringify(gSession));
	   }
		
	}
	else{
		response.getWriter().println('Basket Not Found');
	}
				
		
		
		//response.getWriter().println(JSON.stringify(requestObject));
	
}


exports.Session = guard.ensure(['https'], session);