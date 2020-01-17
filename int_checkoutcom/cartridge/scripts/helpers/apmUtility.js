"use strict"


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/* Utility */
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');


/*
* Utility functions for my cartridge integration.
*/
var apmUtility = {
	
	/*
	 * Handle APM charge Response from CKO API
	 */
	handleAPMChargeResponse: function(gatewayResponse, order){
		// clean the session
		session.privacy.redirectUrl = null;
		
		// Logging
		ckoUtility.doLog('response', JSON.stringify(gatewayResponse));	
		
		// Update customer data
		ckoUtility.updateCustomerData(gatewayResponse);
		
		var gatewayLinks = gatewayResponse._links;
		var type = gatewayResponse.type;
		
		// add redirect to sepa source reqeust
		if(type == 'Sepa'){
			session.privacy.redirectUrl = "${URLUtils.url('Sepa-Mandate')}";
			session.privacy.sepaResponseId = gatewayResponse.id;
		}
		
		// Add redirect URL to session if exists
		if(gatewayLinks.hasOwnProperty('redirect')){
			session.privacy.redirectUrl = gatewayLinks.redirect.href
		}
	},
	
	
	
	/*
	 * Apm Request
	 */
	handleApmRequest: function(payObject, args){
		
		var gatewayResponse = false;
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// creating billing address object
		var gatewayObject = this.apmObject(payObject, args);
		
		if(payObject.type == "sepa"){
			
			var chargeData = {
				"customer"				: ckoUtility.getCustomer(args),
				"amount"				: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getApmCurrency(payObject.currency)),
			    "type"					: payObject.type,
				"currency"				: ckoUtility.getApmCurrency(payObject.currency),
				"billing_address"		: ckoUtility.getBillingObject(args),
			    "source_data"			: payObject.source_data,
				"reference"				: args.OrderNo,
				"payment_ip"			: ckoUtility.getHost(args),
			    "metadata"				: ckoUtility.getMetadataObject(payObject, args),
			    "billing_descriptor"	: ckoUtility.getBillingDescriptorObject()
			};
			
			// Perform the request to the payment gateway
			gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.sources." + ckoUtility.getValue('ckoMode') + ".service", chargeData);
			
		}
		else {
			// Perform the request to the payment gateway
			gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service", gatewayObject);
		}
		
		// If the charge is valid, process the response
		if (gatewayResponse) {
			this.handleAPMChargeResponse(gatewayResponse, order);
			return gatewayResponse;
		}
		else {
			// update the transaction
			Transaction.wrap(function(){
				OrderMgr.failOrder(order);
			});
			
			// Restore the cart
			ckoUtility.checkAndRestoreBasket(order);
			
			return false;
		}
		return true;
	},
	
	/*
	 * return apm object
	 */
	apmObject: function(payObject, args){
		
		var chargeData = false;
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var currency = ckoUtility.getApmCurrency(payObject.currency);
		var amount = ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getApmCurrency(currency));
		
		// object apm is sepa
		if(payObject.type == 'klarna'){
			
			// Prepare chargeData object
			chargeData = {
				"customer"				: ckoUtility.getCustomer(args),
				"amount"				: amount,	
				"currency"				: currency,
				"capture"				: false,
			    "source"				: payObject.source,
				"reference"				: args.OrderNo,
				"payment_ip"			: ckoUtility.getHost(args),
			    "metadata"				: ckoUtility.getMetadataObject(payObject, args),
			    "billing_descriptor"	: ckoUtility.getBillingDescriptorObject()
			};
			
		}else{
		
			// Prepare chargeData object
			chargeData = {
				"customer"				: ckoUtility.getCustomer(args),
				"amount"				: amount,	
				"currency"				: currency,
			    "source"				: payObject.source,
				"reference"				: args.OrderNo,
				"payment_ip"			: ckoUtility.getHost(args),
			    "metadata"				: ckoUtility.getMetadataObject(payObject, args),
			    "billing_descriptor"	: ckoUtility.getBillingDescriptorObject()
			};
			
		}
		
		return chargeData;
	},
	
	
	/*
	 * Sepa apm Request
	 */
	handleSepaRequest: function(payObject, order){
		
		var gatewayResponse = false;
		
		// Perform the request to the payment gateway
		gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service", payObject);
		
		// If the charge is valid, process the response
		if(gatewayResponse){
			
			this.handleAPMChargeResponse(gatewayResponse, order);
			
		}else{
			
			// update the transaction
			Transaction.wrap(function(){
				OrderMgr.failOrder(order);
			});
			
			// Restore the cart
			ckoUtility.checkAndRestoreBasket(order);
			
			return false;
		}
		return true;
	}
	
	
	
}



/*
* Module exports
*/

module.exports = apmUtility;