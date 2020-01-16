"use strict"


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/*
* Utility functions for my cartridge integration.
*/
var applePayUtility = {
	/*
	 * Handle full charge Request to CKO API
	 */
	handleRequest: function(args) {
		// load the order information
		var order = OrderMgr.getOrder(args.OrderNo);
		var paymentInstrument = args.PaymentInstrument;
		var ckoApplePayData =  paymentInstrument.paymentTransaction.custom.ckoApplePayData;

		// Prepare the parameters
		var requestData = {
			"type": "applepay",
			"token_data": JSON.parse(ckoApplePayData)
		};

		// Perform the request to the payment gateway
		var tokenResponse = ckoUtility.gatewayClientRequest(
			"cko.network.token." + ckoUtility.getValue('ckoMode') + ".service",
			requestData
		);

		// If the request is valid, process the response
		if (tokenResponse && tokenResponse.hasOwnProperty('token')) {
			var chargeData = {
				"source"				: this.getSourceObject(tokenResponse),
				"amount"				: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency()),	
				"currency"				: ckoUtility.getCurrency(),
				"reference"				: args.OrderNo,
				"capture"				: ckoUtility.getValue('ckoAutoCapture'),
				"capture_on"			: ckoUtility.getCaptureTime(),
				"customer"				: ckoUtility.getCustomer(args),
				"billing_descriptor"	: ckoUtility.getBillingDescriptorObject(),
				"shipping"				: ckoUtility.getShippingObject(args),
				"payment_ip"			: ckoUtility.getHost(args)
				//"metadata"				: ckoUtility.getMetadataObject(cardData, args)
			};

			// Perform the request to the payment gateway
			var gatewayResponse = ckoUtility.gatewayClientRequest(
				"cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service",
				chargeData
			);

			return gatewayResponse;
		} else {
			// update the transaction
			Transaction.wrap(function(){
				OrderMgr.failOrder(order);
			});
			
			// Restore the cart
			ckoUtility.checkAndRestoreBasket(order);
			
			return false;
		}
	},
	
	/*
	 * Handle full Google Pay response from CKO API
	 */
	handleResponse: function(gatewayResponse){
		// Logging
		ckoUtility.doLog('response', JSON.stringify(gatewayResponse));	
		
		// Update customer data
		ckoUtility.updateCustomerData(gatewayResponse);
	},
	
	/*
	 * Build Gateway Source Object
	 */
	getSourceObject: function(tokenData) {
		// source object
		var source = {
			type: "token",
			token: tokenData.token
		}
		
		return source;
	}
}

/*
* Module exports
*/

module.exports = applePayUtility;