'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var PaymentTransaction = require('dw/order/PaymentTransaction');

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* Shopper cart */
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Helpers */
var CKOCardHelper = require('~/cartridge/scripts/helpers/CKOCardHelper');

/* Utility */
var util = require('~/cartridge/scripts/utility/util');


/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
	var cart = Cart.get(args.Basket);
	var paymentMethod = args.PaymentMethodID;
	//var shop_url = paymentTypeForm.get('shop_url').value();
	

	// get card payment form
	var paymentForm = app.getForm('cardPaymentForm');
	
	// prepare card data object
	var cardData = {
			
		owner		: paymentForm.get('owner').value(),
		number		: util.getFormattedNumber(paymentForm.get('cardNumber').value()),
		month		: paymentForm.get('expiration.month').value(),
		year		: paymentForm.get('expiration.year').value(),
		cvn			: paymentForm.get('cvv').value(),
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
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
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
	var chargeResponse = util.handleCardRequest(cardData, args);
	
	// Handle card charge request result
	if(chargeResponse){
		
		if(util.getValue('cko3ds')){
			
			ISML.renderTemplate('redirects/3DSecure.isml', {
				redirectUrl: session.privacy.redirectUrl
			});
			
			return {authorized: true, redirected: true};
			
		}else{
			// Create the authorization transaction
		    Transaction.wrap(function() {
		        paymentInstrument.paymentTransaction.transactionID = chargeResponse.action_id;
		        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
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