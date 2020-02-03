/* API Includes */
var svc = require('dw/svc');

/* Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Initialize HTTP service for the Checkout.com sandbox capture transaction.
 */
svc.ServiceRegistry.configure("cko.transaction.capture.sandbox.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com live capture transaction.
 */
svc.ServiceRegistry.configure("cko.transaction.capture.live.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com sandbox void transaction.
 */
svc.ServiceRegistry.configure("cko.transaction.void.sandbox.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com live void transaction.
 */
svc.ServiceRegistry.configure("cko.transaction.void.live.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com sandbox refund transaction.
 */
svc.ServiceRegistry.configure("cko.transaction.refund.sandbox.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});

/**
 * Initialize HTTP service for the Checkout.com live refund transaction.
 */
svc.ServiceRegistry.configure("cko.transaction.refund.live.service", {
    createRequest: function (svc, args) {
        svc = CKOHelper.buildHttpServiceHeaders(svc);
        return (args) ? JSON.stringify(args) : null;
    },

    parseResponse: function (svc, resp) {
        return JSON.parse(resp.text);
    }
});