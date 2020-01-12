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
	handleRequest: function() {

	},
	
	
	/*
	 * Handle full Google Pay response from CKO API
	 */
	handleResponse: function(gatewayResponse){
		// Logging
		ckoUtility.doLog('response', JSON.stringify(gatewayResponse));	

	},
	
}



/*
* Module exports
*/

module.exports = cardUtility;