"use strict"

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

/** Utility **/
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');



/*
* Utility functions for my cartridge integration.
*/
var paymentHelper = {  
    checkoutcomCardRequest: function (paymentMethodID) {

    }
}

/*
* Module exports
*/
module.exports = paymentHelper;