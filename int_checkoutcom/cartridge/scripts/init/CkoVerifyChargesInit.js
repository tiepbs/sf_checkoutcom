/* API Includes */
var svc = require('dw/svc');

/* Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Initialize HTTP service for the Checkout.com sandbox charges verification.
 */
svc.ServiceRegistry.configure("cko.verify.charges.sandbox.service", {
    createRequest: function(svc, args) {
        var serviceUrl = svc.configuration.credential.URL + "/" + args.paymentToken;
            
        // Prepare the http service
        svc.setURL(serviceUrl);
        svc.setRequestMethod("GET");
        svc.addHeader("Authorization", CKOHelper.getAccountKeys().secreteKey);
        svc.addHeader("User-Agent", CKOHelper.getCartridgeMeta());
        svc.addHeader("Content-Type", 'application/json;charset=UTF-8');    
        
        return (args) ? JSON.stringify(args) : null;
	},

    parseResponse: function(svc, resp) {    	
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com sandbox charges verification.
 */
svc.ServiceRegistry.configure("cko.verify.charges.live.service", {
    createRequest: function(svc, args) {
        var serviceUrl = svc.configuration.credential.URL + "/" + args.paymentToken;
            
        // Prepare the http service
        svc.setURL(serviceUrl);
        svc.setRequestMethod("GET");
        svc.addHeader("Authorization", CKOHelper.getAccountKeys().secreteKey);
        svc.addHeader("User-Agent", CKOHelper.getCartridgeMeta());
        svc.addHeader("Content-Type", 'application/json;charset=UTF-8');
        
        return (args) ? JSON.stringify(args) : null;
	},

    parseResponse: function(svc, resp) {
        return JSON.parse(resp.text);
    }
});