'use strict';

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(siteControllerName + '/cartridge/scripts/app');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');

/* Checkout.com Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/* Checkout.com Event functions */
var CKOEvent = require('~/cartridge/scripts/helpers/CKOEvent');

/**
 * Handles responses from the Checkout.com payment gateway.
 */
function handleReturn() {
	var gResponse = false;
	var mode = CKOHelper.getValue('ckoMode');
	var trackId = CKOHelper.getTrackId();	
	
	// If there is a track id
	if (trackId) {
		// Load the order
		var order = OrderMgr.getOrder(trackId);		
		if (order) {
			// Check the payment token if exists		
			var paymentToken = request.httpParameterMap.get('cko-payment-token').stringValue;
			
			// If there is a payment token available, verify
			if (paymentToken) {
				// Perform the request to the payment gateway
				gVerify = CKOHelper.getGatewayClient(
					'cko.verify.charges.' + mode + '.service', 
					{'paymentToken': paymentToken}
				);			
				
				// If there is a valid response
				if (typeof gVerify === 'object' && gVerify.hasOwnProperty('id') && CKOHelper.paymentIsValid(gVerify)) {
					app.getController('COSummary').ShowConfirmation(order);
				}
				else {
					CKOHelper.handleFail(null);
				}
			}

			// Else it's a normal transaction
			else {
				// Get the response
				gResponse = JSON.parse(request.httpParameterMap.getRequestBodyAsString());

				// Process the response data
				if (CKOHelper.paymentIsValid(gResponse)) {
					app.getController('COSummary').ShowConfirmation(order);
				}
				else {
					CKOHelper.handleFail(null);
				}
			}
		}
		else {
			CKOHelper.handleFail(null);
		}
	}
	else {
		CKOHelper.handleFail(null);
	}
}

/**
 * Handles a failed payment from the Checkout.com payment gateway.
 */
function handleFail() {
	// Load the order
	var order = OrderMgr.getOrder(session.privacy.ckoOrderId);

    // Restore the cart
	CKOHelper.checkAndRestoreBasket(order);

	// Send back to the error page
	ISML.renderTemplate('custom/common/response/failed.isml');
}

/**
 * Handles webhook responses from the Checkout.com payment gateway.
 */
function handleWebhook() {
	var isValidResponse = CKOHelper.isValidResponse();
	if (isValidResponse) {
		// Get the response as JSON object
		var hook = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
		
		// Check the webhook event
		if (hook !== null && hook.hasOwnProperty('eventType') && hook.hasOwnProperty('message')) {
			// Get a camel case function name from event type
			var func = '';
			var parts = hook.eventType.split('.');
			for (var i = 0; i < parts.length; i++) {
				func += (i == 0) ? parts[i] : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
			}

			// Call the event
			CKOEvent[func](hook);
		}
	}
}

/**
 * Initializes the credit card list by determining the saved customer payment method.
 */
function getCardsList() {
    var applicablePaymentCards;
    var data = [];

	// If user logged in
	if (customer.authenticated) {
		var profile = customer.getProfile();
        if (profile) {
    		applicablePaymentCards = customer.profile.getWallet().getPaymentInstruments();
			for (let i = 0; i < applicablePaymentCards.length; i++) {
				data.push({
					cardId: applicablePaymentCards[i].getUUID(),
					cardNumber: applicablePaymentCards[i].getCreditCardNumber(),
					cardHolder: applicablePaymentCards[i].creditCardHolder,
					cardType: applicablePaymentCards[i].getCreditCardType(),
					expiryMonth: applicablePaymentCards[i].creditCardExpirationMonth,
					expiryYear: applicablePaymentCards[i].creditCardExpirationYear,
				});
			}
        }
        
    	// Send the output for rendering
    	ISML.renderTemplate('custom/ajax/output.isml', {data: JSON.stringify(data)});
    }
	else {
		app.getModel('Customer').logout();  
        app.getView().render('csrf/csrffailed');		
	}
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.HandleReturn = guard.ensure(['https'], handleReturn);
exports.HandleFail = guard.ensure(['https'], handleFail);
exports.HandleWebhook = guard.ensure(['post', 'https'], handleWebhook);
exports.GetCardsList = guard.ensure(['https'], getCardsList);