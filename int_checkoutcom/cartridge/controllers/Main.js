"use strict";

/* API Include */

var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(siteControllerName + '/cartridge/scripts/app');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Paymentinstrument = require('dw/order/PaymentInstrument');

/*
* Utility functions
*/
var util = require('~/cartridge/scripts/utility/util');

/*
* Cart
*/
var Cart = require(siteControllerName + '/cartridge/scripts/models/CartModel');


/*
* Handle response from gateway
*/

function handleReturn(){
	
	var gatewayResponse = false;
	var orderId = util.getOrderId();
	
	// if there is a track id
	if (orderId){
		
		// load the order
		var order = OrderMgr.getOrder(orderId);
		
		if(order) {
			
			// check the payment token if exists
			var sessionId = request.httpParameterMap.get('cko-session-id').stringValue;
			var confirmation = app.getController('COSummary');
			
			
			// if there is a session id is available, verify
			if(sessionId){
				
				// perform the request to the payment gateway
				gatewayVerify = util.gatewayClientRequest("cko.verify.charges." + util.getValue('ckoMode') + ".service", {paymentToken: sessionId});
				
				
				// if verified
				if(typeof(gatewayVerify) === 'object' && gatewayVerify.hasOwnProperty('id')){
					
					response.getWriter().println(JSON.stringify(gatewayVerify));
					
					// show order confirmation page
					//confirmation.ShowConfirmation(order);
				}else{
					
					response.getWriter().println('Error!' + typeof(gatewayVerify));
					// handle failure
					//util.handleFail(null);
				}
				
			} else{
				
				// Get the response
				gatewayResponse = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
				
				// process the response
				if(util.paymentValidate(gatewayResponse)){
					
					confirmation.ShowConfirmation(order);
				}else{
					
					util.handleFail(null);
				}
			}
			
		}else{
			
			util.handleFail(null);
		}
	}else{
		
		util.handleFail(null);
	}
}



function test() {
	response.getWriter().println('Show Hello World!');
}

exports.Test = guard.ensure(['get'], test);
exports.HandleReturn = guard.ensure(['https'], handleReturn);
