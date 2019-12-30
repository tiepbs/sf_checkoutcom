/* API Includes */
var svc = require('dw/svc');

/* Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Initialize HTTP service for the Checkout.com sandbox charges history.
 */
svc.ServiceRegistry.configure("cko.charge.history.sandbox.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);        
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com live charges history.
 */
svc.ServiceRegistry.configure("cko.charge.history.live.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);        
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});