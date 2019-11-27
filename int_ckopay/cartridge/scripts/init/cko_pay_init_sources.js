/* API Includes */
var svc = require('dw/svc');

var util = require("~/cartridge/scripts/utility/util");						


/**
 * Initialize HTTP service for the Checkout.com sandbox charges verification.
 */
svc.ServiceRegistry.configure("cko.pay.test.init.sources.sandbox.service",{
	createRequest: function(svc, args){
		// prepare https service
		svc.addHeader("Authorization", util.getAccountKeys().secretKey);		
		svc.addHeader("Content-Type", "application/json;charset=UTF-8");
		
		return (args) ? JSON.stringify(args) : null;
	},
	
	parseResponse: function(svc, resp){
		return JSON.parse(resp.text);
	}
});




