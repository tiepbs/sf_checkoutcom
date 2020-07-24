'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/*
* Payment helper
*/
var paymentHelper = {
    getConfirmationPageRedirect: function(res, order) {
        return res.redirect(
            URLUtils.url(
                'Order-Confirm',
                'ID',
                order.orderNo,
                'token',
                order.orderToken
            ).toString()
        );
    },

    getFailurePageRedirect: function(res) {
        return res.redirect(
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

/*
* Module exports
*/
module.exports = paymentHelper;
