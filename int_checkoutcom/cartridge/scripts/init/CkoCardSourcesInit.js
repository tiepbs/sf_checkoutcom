/* API Includes */
var svc = require('dw/svc');

/* Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/* Utililty module */
var util = require('~/cartridge/scripts/utility/util');

/**
 * Initialize HTTP service for the Checkout.com sandbox full card charge.
 */
svc.ServiceRegistry.configure("cko.card.sources.sandbox.service", {
    createRequest: function(svc, args) {  	
  		// Prepare the http service
        svc.addHeader("Authorization", util.getAccountKeys().secreteKey);
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
svc.ServiceRegistry.configure("cko.card.sources.live.service", {
    createRequest: function(svc, args) {
		// Prepare the http service
        svc.addHeader("Authorization", util.getAccountKeys().secreteKey);
	    svc.addHeader("User-Agent", CKOHelper.getCartridgeMeta());
	    svc.addHeader("Content-Type", 'application/json;charset=UTF-8');
	   
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function(svc, resp) {
        return JSON.parse(resp.text);
    }
});
