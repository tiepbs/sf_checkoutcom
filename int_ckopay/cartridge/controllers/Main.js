"use strict";

/* API Include */

var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('cko_pay_test_StorefrontController');
var siteCoreName = dw.system.Site.getCurrent().getCustomPreferenceValue('cko_pay_test_StorefrontCore');
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

function start(){
	console.log('start');
}

function test() {
	response.getWriter().println('Show Hello World!');
}

exports.Test = guard.ensure(['get'], test);

function handleReturn(){
	//response.getWriter().println('Show Hello World!');
	
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
				gatewayVerify = util.gatewayClientRequest("cko.pay.test.confirm.init.sandbox.service", {paymentToken: sessionId});
				
				//response.getWriter().println(gatewayVerify);
				
				// if verified
				if(typeof gatewayVerify === 'object' && gatewayVerify.hasOwnProperty('id')){
					//response.getWriter().println(JSON.stringify(gatewayVerify));
					confirmation.ShowConfirmation(order);
				}else{
					// handle failure
					//util.handleFail(null);
					response.getWriter().println(JSON.stringify(gatewayVerify));
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
exports.HandleReturn = guard.ensure(['https'], handleReturn);

//exports.HandleReturn = guard.ensure(['https'], handleReturn);