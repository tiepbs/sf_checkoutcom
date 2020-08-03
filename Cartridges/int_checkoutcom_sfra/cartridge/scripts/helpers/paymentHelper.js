'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/**
 * Payment helper module.
 */
var paymentHelper = {
    /**
     * Get the confirmation page redirection.
     * @param {Object} res The HTTP response object
     * @param {Object} order The order instance
     * @returns {string} The redirection URL
     */
    getConfirmationPageRedirect: function(res, order) {
        res.redirect(
            URLUtils.url(
                'Order-Confirm',
                'ID',
                order.orderNo,
                'token',
                order.orderToken
            ).toString()
        );
    },

    /**
     * Get the failure page redirection.
     * @param {Object} res The HTTP response object
     * @returns {string} The redirection URL
     */
    getFailurePageRedirect: function(res) {
        res.redirect(
            URLUtils.url(
                'Checkout-Begin',
                'stage',
                'payment',
                'paymentError',
                Resource.msg('error.payment.not.valid', 'checkout', null)
            )
        );
    },
};

/**
 * Module exports
 */
module.exports = paymentHelper;
