'use strict';

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* Shopper cart */
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Helpers */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/* Utility */
var util = require('~/cartridge/scripts/utility/util');

/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

/* Card payment */
var payWithCard = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoCard'); 

/* Alternative payment */
var payWithApms = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoApms'); 


/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
	var cart = Cart.get(args.Basket);
	var paymentMethod = args.PaymentMethodID;
	//var shop_url = paymentTypeForm.get('shop_url').value();
	
	// is payment type card
	if(paymentMethod == 'CHECKOUTCOM_CARD'){
		// get card payment form
		var paymentForm = app.getForm('cardPaymentForm');
		
		// prepare card data object
		var cardData = {
				
			owner		: paymentForm.get('owner').value(),
			number		: util.getFormattedNumber(paymentForm.get('number').value()),
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
	
	
	// is payment type apm
	if(paymentMethod == 'CHECKOUTCOM_APM'){
		
		// get apms form
		var paymentForm = app.getForm('alternativePaymentForm');
		
		// get apm type chosen
		var apm = paymentForm.get('alternative_payments').value();
		
		// switch apms
		switch(apm){
			case "ideal":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "ideal";
				});
				
				return {success: true};
			case "boleto":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "boleto";
				});
				
				return {success: true};
			case "bancontact":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "bancontact";
				});
				
				return {success: true};
			case "benefit":
				// process benefit pay
				
				return {success: false};
			case "giro":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "giropay";
				});
				
				return {success: true};
			case "eps":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "eps";
				});
				
				return {success: true};
				
			case "sofort":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "sofort";
				});
				
				return {success: true};
				
			case "knet":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "knet";
				});
				
				return {success: true};
				
			case "qpay":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "qpay";
				});
				
				return {success: true};
				
			case "fawry":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "fawry";
				});
				
				return {success: true};
				
			case "sepa":
				
				// proceed with transaction
				Transaction.wrap(function(){
					cart.removeExistingPaymentInstruments(paymentMethod);
					
					var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
					
					paymentInstrument.creditCardHolder = "";
					paymentInstrument.creditCardNumber = "";
					paymentInstrument.creditCardExpirationMonth = "";
					paymentInstrument.creditCardExpirationYear = "";
					paymentInstrument.creditCardType = "sepa";
				});
				
				return {success: true};
			default:
				return {success: false};
			
		}
	}	

}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(args) {

	// Preparing payment parameters
	var orderNo = args.OrderNo;
	var cart = Cart.get(args.Basket);
	var paymentInstrument = args.PaymentInstrument;
	var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
	
	// Add data to session for payment return
	session.privacy.ckoOrderId = args.OrderNo;
	

	var paymentTypeForm = app.getForm('cardPaymentForm');
	
	// get payment type
	var payment_type = paymentTypeForm.get('payment_method').value();	
	
	// get shop url
	var shop_url = paymentTypeForm.get('shop_url').value();
	
	
	if(payment_type == 'card'){
		
		// process card payment
		var cardData = {
			"name"			: paymentInstrument.creditCardHolder,
			"number"		: paymentInstrument.creditCardNumber,
			"expiryMonth"	: paymentInstrument.creditCardExpirationMonth,
			"expiryYear"	: paymentInstrument.creditCardExpirationYear,
			"cvv"			: app.getForm("cardPaymentForm").get('cvn').value(),
			"type"			: paymentInstrument.creditCardType
		};
		
		// perform the charge
		var request = util.handleFullChargeRequest(cardData, args);
		
		// Transaction wrapper
		Transaction.wrap(function(){
			paymentInstrument.paymentTransaction.transactionID = orderNo;
			paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
		});
		
		// Handle card charge result
		if(request){
			
			if(util.getValue('cko_pay_test_3DS')){
				
				ISML.renderTemplate('redirects/3DSecure.isml', {
					redirectUrl: session.privacy.redirectUrl,
				});
				
				return {authorized: true, redirected: true};
				
			}else{
				return {authorized: true};
			}
			
		}else{
			return {error: true};
		}
		
		
	}else if(payment_type == 'apms'){
		
		// get apms form
		var paymentForm = app.getForm('alternativePaymentForm');
		
		// get apm type chosen
		var apm = paymentForm.get('alternative_payments').value();
		
		// switch apms
		switch(apm){
			case "ideal":
				// building ideal pay object
			    var payObject = {
			        "type": "ideal",
			        "bic": "INGBNL2A",
			        "description": "iDEAL Demo Payment",
			        "language": "nl"
			    };

				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
				
				return {success: false};
			case "boleto":
				// building pay object
				var payObject = {
					"type"	: "boleto",
					"birthDate" : paymentForm.get('boleto_birthDate').value(),
					"cpf"	: paymentForm.get('boleto_cpf').value(),
					"customerName" : paymentForm.get('boleto_customerName').value()
				};

				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
				return {success: false};
			case "bancontact":
				// building pay object
				var payObject = {
					"type"	: "bancontact",
					"payment_country" : "BE",
					"account_holder_name"	: paymentForm.get('bancontact_account_holder_name').value(),
					"billing_descriptor" : "Bancontact Test payment"
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
				return {success: false};
			case "benefit":
				// process benefit pay
				
				return {success: false};
			case "giro":
				
				// building pay object
				var payObject = {
					type	: "giropay",
					purpose	: businessName,
			        "info_fields": [
			            {
			                "label": "info 1",
			                "text": "this info was provided in the payment request"
			            },
			            {
			                "label": "info 2",
			                "text": "so was this info"
			            }
			        ]
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
			case "eps":
				
				// building pay object
				var payObject = {
					type	: "eps",
					purpose	: businessName
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
			case "sofort":
				
				// building pay object
				var payObject = {
					type	: "sofort",
					purpose	: businessName
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
			case "knet":
				
				// building pay object
				var payObject = {
					type	: "knet",
					language	: "en"
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
			case "qpay":
				
				// building pay object
				var payObject = {
					type	: "qpay",
					language	: "en",
					description : businessName
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
			case "fawry":
				
				// building pay object
				var payObject = {
					"type"	: "fawry",
					"description" : businessName,
					"customer_mobile"	: util.getPhone(args).number,
					"customer_email"	: util.getCustomer(args).email,
					"products"			: util.getProductInformation(args)
				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/APM.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						return {authorized: true};
					}
					
				}else{
					return {error: true};
				}
				
			case "sepa":
				
				// building pay object
				var payObject = {
					"type"	: "sepa",
				    "billing_address": {
				        "address_line1": "Wayne Plaza 1",
				        "address_line2": null,
				        "city": "Gotham City",
				        "state": null,
				        "zip": "12345",
				        "country":"US"
				    },
				    "source_data": {
				        "first_name": "Bruce",
				        "last_name": "Wayne",
				        "account_iban": "DE25100100101234567893",
				        "billing_descriptor": "SEPA Payment Demo",
				        "mandate_type": "single"
				    }

				};
				
				// perform the charge
				var request = util.handleAPMChargeRequest(payObject, args);
				
				// Transaction wrapper
				Transaction.wrap(function(){
					paymentInstrument.paymentTransaction.transactionID = orderNo;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
				});
				
				// Handle apm result
				if(request){
					
					if(session.privacy.redirectUrl){
						
						ISML.renderTemplate('redirects/sepaMandate.isml', {
							redirectUrl: session.privacy.redirectUrl,
						});
						
						//session.privacy.redirectUrl = null;
						
						return {authorized: true, redirected: true};
						
					}else{
						//return {authorized: true};
						response.getWriter().println('Hello World!');
						
					}
					
				}else{
					return {error: true};
				}
			default:
				return {success: false};
			
		}
		
	}

}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;