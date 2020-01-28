'use strict';

/* Server */
var server = require('server');
server.extend(module.superModule);

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var HookMgr = require('dw/system/HookMgr');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Handles responses from the Checkout.com payment gateway.
 */
server.replace('SubmitPayment', server.middleware.https, function (req, res, next) {
	// Prepare the Handle Hook Arguments
	var args = {};
	args.Basket = BasketMgr.getCurrentBasket();
	args.PaymentMethodID = 'CHECKOUTCOM_CARD';
	
	// Prepare the card data
	/*
	args.cardData = {
        number      : ckoHelper.getFormattedNumber(req.form.dwfrm_billing_creditCardFields_cardNumber),
        month       : req.form.dwfrm_billing_creditCardFields_expirationMonth,
        year        : req.form.dwfrm_billing_creditCardFields_expirationYear,
        cvn         : req.form.dwfrm_billing_creditCardFields_securityCode,
        cardType    : req.form.dwfrm_billing_creditCardFields_cardType	
	};
	
	*/
   
    var handleResult = HookMgr.callHook(
        'app.payment.processor.CHECKOUTCOM_CARD',
        'Handle',
        args
    );
   
    var logger = require('dw/system/Logger').getLogger('ckodebug');
	logger.debug('cccccc {0}', JSON.stringify(handleResult));

});

/*
 * Module exports
 */
module.exports = server.exports();