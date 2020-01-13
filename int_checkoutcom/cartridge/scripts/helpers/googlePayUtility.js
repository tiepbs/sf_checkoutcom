"use strict"


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/*
* Utility functions for my cartridge integration.
*/
var googlePayUtility = {
	/*
	 * Handle full charge Request to CKO API
	 */
	handleRequest: function(args) {
		// load the order information
		var order = OrderMgr.getOrder(args.OrderNo);
		var paymentInstrument = args.PaymentInstrument;
		var ckoGooglePayData =  paymentInstrument.paymentTransaction.custom.ckoGooglePayData;

		// Prepare the parameters
		var requestData = {
			"type": "googlepay",
			"token_data": ckoGooglePayData
		};

		// Perform the request to the payment gateway
		var gatewayResponse = ckoUtility.gatewayClientRequest(
			"cko.network.token." + ckoUtility.getValue('ckoMode') + ".service",
			requestData
		);

		// If the charge is valid, process the response
		if (gatewayResponse) {
			this.handleResponse(gatewayResponse, order);
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
	
}

/*
* Module exports
*/

module.exports = googlePayUtility;