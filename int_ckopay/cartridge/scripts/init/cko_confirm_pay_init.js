/* API Includes */
var svc = require('dw/svc');

var util = require('~/cartridge/scripts/utility/util');						

/**
 * Initialize HTTP service for the Checkout.com sandbox charges verification.
 */
svc.ServiceRegistry.configure("cko.pay.test.confirm.init.sandbox.service", {
    createRequest: function(svc, args) {
        var serviceUrl = svc.configuration.credential.URL + "/" + args.paymentToken;
            
        // Prepare the http service
        svc.setURL(serviceUrl);
        svc.setRequestMethod("GET");
        svc.addHeader("Authorization", util.getAccountKeys().secretKey);
        svc.addHeader("Content-Type", 'application/json;charset=UTF-8');    
        
        return (args) ? JSON.stringify(args) : null;
	},

    parseResponse: function(svc, resp) {    	
        return JSON.parse(resp.text);
    }
});

