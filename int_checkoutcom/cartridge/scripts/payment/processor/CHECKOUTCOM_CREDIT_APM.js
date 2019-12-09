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
	//var shop_url = paymentTypeForm.get('shop_url').value();
	
	
	// get apms form
	var paymentForm = app.getForm('alternativePaymentForm');
	
	// get apm type chosen
	var apm = paymentForm.get('alternative_payments').value();
	
	// switch apms
	switch(apm){
		case "ideal":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "boleto":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "bancontact":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "benefit":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "giro":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "eps":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "sofort":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "knet":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "qpay":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "fawry":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "sepa":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
		
	}

}


/**
 * Authorizes a payment using a credit card. The payment is authorized by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customizations may use other processors and custom
 * logic to authorize credit card payment.
 */
function Authorize(args) {
	
	// Add order Number to session
	session.privacy.ckoOrderId = args.OrderNo;
	
	// get apms form
	var paymentForm = app.getForm('alternativePaymentForm');
	
	// get apm type chosen
	var apm = paymentForm.get('alternative_payments').value();	
	
	// get shop url
	var shop_url = paymentForm.get('store_url').value();
	
	// switch apms
	switch(apm){
		case "ideal":
			// building ideal pay object
		    var payObject = {
				source		: {
			        "type"			: "ideal",
			        "bic"			: "INGBNL2A",
			        "description"	: args.OrderNo,
			        "language"		: "nl",
			    },
			    type		: 'ideal',
			    purpose		: businessName,
			    currency	: 'EUR'
			};

			// build Authorization Object
		    SGJCTransAuthObject(payObject, args);
			
			
			return {success: false};
			
		case "boleto":
			// building pay object
			var payObject = {
				source		: {
					"type"	: "boleto",
					"birthDate" : paymentForm.get('boleto_birthDate').value(),
					"cpf"		: "00003456789",
					// in prod uncomment
					//"cpf"	: paymentForm.get('boleto_cpf').value(),
					"customerName" : util.getCustomerName(args)
				},
				type		: 'boleto',
				purpose		: shop_url,
				currency	: 'BRL'
			};

			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "bancontact":
			// building pay object
			var payObject = {
					source		: {
						"type"					: "bancontact",
						"payment_country" 		: "BE",
						"account_holder_name"	: util.getCustomerName(args),
						"billing_descriptor" 	: businessName
					},
					type		: 'boleto',
					purpose		: shop_url,
					currency	: 'EUR'
				};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "benefit":
			// process benefit pay
			var payObject = {
			    source		: {
			        "type"					: "benefitpay",
			        "integration_type"		: "web"
			    },
			    type		: "benefit",
			    purpose		:	shop_url,
			    currency	: "BHD"
			};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "giro":
			// building pay object
			var payObject = {
				source				: {
					type			: "giropay",
					purpose			: businessName,
			        "info_fields"	: [
			            {
			                "label"	: "Shop Adrress",
			                "text"	: shop_url
			            },
			            {
			                "label"	: "info 2",
			                "text"	: "so was this info"
			            }
			        ]
				},
			    type		: "giropay",
			    purpose		:	shop_url,
			    currency	: "EUR"
				
			};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "eps":
			
			// building pay object
			var payObject = {
				source		: {
					type	: "eps",
					purpose	: shop_url
				},
			    type		: "eps",
			    purpose		:	shop_url,
			    currency	: "EUR"
			};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "sofort":
			
			// building pay object
			var payObject = {
				source : 	{
					type	: "sofort"
				},
				type	: "sofort",
				purpose	: shop_url,
				currency: 'EUR'
			};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "knet":
			
			// building pay object
			var payObject = {
			    "source"	: 		{
			        "type"						: "knet",
			        "language"					: "en",
			        "user_defined_field1"		: "first user defined field",
			        "user_defined_field2"		: "second user defined field",
			        "card_token"				: "01234567",
			        "user_defined_field4"		: "fourth user defined field",
			        "ptlf"						: "ebtdut3vgtqepe56w64zcxlg6i"
			    },
			    type		: "knet",
			    purpose		: shop_url,
			    currency	: 'KWD'
			};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "qpay":
			
			// building pay object
			var payObject = {
				source		: {
			        "type"				: "qpay",
			        "description"		: shop_url,
			        "language"			: "en",
			        "quantity"			: util.getProductQuantity(args),
			        "national_id"		: paymentForm.get('qpay_national_id').value()
					// remove the comment in production
			        //"national_id"		: "070AYY010BU234M"
			    },
			    type		: "qpay",
			    purpose		: shop_url,
			    currency	: "QAR"
			};
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "fawry":
			
			// building pay object
			var payObject = {
			    source	: {
			        "type": "fawry",
			        "description": shop_url,
					"customer_mobile"	: util.getPhoneObject(args).number,
					"customer_email"	: util.getCustomer(args).email,
					"products"			: util.getProductInformation(args)
			    },
				type		: "fawry",
				purpose		: shop_url,
			    currency	: "EGP"
			 };
			
			// build Authorization Object
			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
			
		case "sepa":

			// Preparing payment parameters
			var orderNo = args.OrderNo;
			var paymentInstrument = args.PaymentInstrument;
			var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
			
			// building pay object
			var payObject = {
				"type"	: "sepa",
			    "source_data": {
			        "first_name": util.getCustomerFirstName(args),
			        "last_name": util.getCustomerLastName(args),
			        "account_iban": "DE25100100101234567893",
			        "billing_descriptor": businessName,
			        "mandate_type": "single"
			    }

			};
			

			SGJCTransAuthObject(payObject, args);
			
			return {success: false};
		
	}

}



/*
 * Creates Site Genesis Transaction Object
 * @return object
 */
function SGJCTransHandleObject(args){
	var cart = Cart.get(args.Basket);
	var paymentMethod = args.PaymentMethodID;
	
	// proceed with transact
	return Transaction.wrap(function(){
		cart.removeExistingPaymentInstruments(paymentMethod);
		
		var paymentInstrument = cart.createPaymentInstrument(paymentMethod, cart.getNonGiftCertificateAmount());
	});
}



/*
 * Creates Site Genesis Transaction Object
 * @return object
 */
function SGJCTransAuthObject(payObject, args){

	// Preparing payment parameters
	var orderNo = args.OrderNo;
	var paymentInstrument = args.PaymentInstrument;
	var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
	
	// perform the charge
	var request = util.handleApmRequest(payObject, args);
	
	
	// Handle apm result
	if(request){
		
		// Transaction wrapper
		Transaction.wrap(function(){
			paymentInstrument.paymentTransaction.transactionID = orderNo;
			paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
		});
		
		if(session.privacy.redirectUrl){
			
			if(payObject.type == "sepa"){
				
				ISML.renderTemplate('redirects/sepaMandate.isml', {
					redirectUrl: session.privacy.redirectUrl,
				});
				
			}else{
			
			
				ISML.renderTemplate('redirects/APM.isml', {
					redirectUrl: session.privacy.redirectUrl,
				});
				
			}
			
			return {authorized: true, redirected: true};
			
			
		}else{
			return {authorized: true};
		}
		
	}else{
		return {error: true};
	}
	
	
}


/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;