'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* Shopper cart */
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Utility */
var cardUtility = require('~/cartridge/scripts/helpers/cardUtility');
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');


/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
	var cart = Cart.get(args.Basket);
	var paymentMethod = args.PaymentMethodID;
	

	// get card payment form
	var paymentForm = app.getForm('cardPaymentForm');
	
	// prepare card data object
	var cardData = {
			
		owner		: paymentForm.get('owner').value(),
		number		: ckoUtility.getFormattedNumber(paymentForm.get('number').value()),
		month		: paymentForm.get('expiration.month').value(),
		year		: paymentForm.get('expiration.year').value(),
		cvn			: paymentForm.get('cvn').value(),
		cardType	: paymentForm.get('type').value()
		
	};	
	
	// proceed with transaction
	Transaction.wrap(function(){
		cart.removeExistingPaymentInstruments(paymentMethod);
		
		var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
		
		paymentInstrument.creditCardHolder = cardData.owner;
		paymentInstrument.creditCardNumber = cardData.number;
		paymentInstrument.creditCardExpirationMonth = cardData.month;
		paymentInstrument.creditCardExpirationYear = cardData.year;
		paymentInstrument.creditCardType = cardData.cardType;
	});
	
	return {success: true};
	

}

/**
 * Authorises a payment using a credit card. The payment is authorised by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customisations may use other processors and custom
 * logic to authorise credit card payment.
 */
function Authorize(args) {

	// Preparing payment parameters
	var orderNo = args.OrderNo;
	var paymentInstrument = args.PaymentInstrument;
	var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
	
	// Add order number to the session global object 
	session.privacy.ckoOrderId = args.OrderNo;
	
	
	// build card data object
	var cardData = {
		"name"			: paymentInstrument.creditCardHolder,
		"number"		: paymentInstrument.creditCardNumber,
		"expiryMonth"	: paymentInstrument.creditCardExpirationMonth,
		"expiryYear"	: paymentInstrument.creditCardExpirationYear,
		"cvv"			: app.getForm("cardPaymentForm").get('cvn').value(),
		"type"			: paymentInstrument.creditCardType,
	};
	
	// make the charge request
	var request = cardUtility.handleCardRequest(cardData, args);
	
	// Transaction wrapper
	Transaction.wrap(function(){
		paymentInstrument.paymentTransaction.transactionID = orderNo;
		paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
	});
	
	// Handle card charge request result
	if(request){
		
		if(ckoUtility.getValue('cko3ds')){
			
			ISML.renderTemplate('redirects/3DSecure.isml', {
				redirectUrl: session.privacy.redirectUrl
			});
			
			return {authorized: true, redirected: true};
			
		} else {
			// Create the authorization transaction
		    Transaction.wrap(function() {
		        paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
				paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				paymentInstrument.custom.ckoPaymentId = chargeResponse.id;
				paymentInstrument.custom.ckoParentTransactionId = null;
				paymentInstrument.custom.ckoTransactionOpened = null;
		        paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
		    });
			
			return {authorized: true};
		}
		
	}else{
		return {error: true};
	}	

}

/*
 * Module exports
 */
exports.Handle = Handle;
exports.Authorize = Authorize;