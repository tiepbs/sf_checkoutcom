/* API Includes */
var svc = require('dw/svc');

/* Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Initialize HTTP service for the Checkout.com sandbox full card charge.
 */
svc.ServiceRegistry.configure("cko.card.charge.sandbox.service", {
    createRequest: function(svc, args) {  	
  		// Prepare the http service
        svc.addHeader("Authorization", CKOHelper.getAccountKeys().privateKey);
        svc.addHeader("User-Agent", CKOHelper.getCartridgeMeta());
        svc.addHeader("Content-Type", 'application/json;charset=UTF-8');
        
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function(svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com live full card charge.
 */
svc.ServiceRegistry.configure("cko.card.charge.live.service", {
    createRequest: function(svc, args) {
		// Prepare the http service
	    svc.addHeader("Authorization", CKOHelper.getAccountKeys().privateKey);
	    svc.addHeader("User-Agent", CKOHelper.getCartridgeMeta());
	    svc.addHeader("Content-Type", 'application/json;charset=UTF-8');
	   
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function(svc, resp) {
        return JSON.parse(resp.text);
    }
});
