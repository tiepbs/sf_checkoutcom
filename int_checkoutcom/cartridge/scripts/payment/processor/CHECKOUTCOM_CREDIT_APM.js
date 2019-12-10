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


// App Mode
var appMode = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoMode'); 

// get apms form
var paymentForm = app.getForm('alternativePaymentForm');


/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
	//var shop_url = paymentTypeForm.get('shop_url').value();
	
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
			
		case "multibanco":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "poli":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "p24":
			
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
			
			idealPayAuthorization(args);
			
			return {success: false};
			
		case "boleto":

			boletoPayAuthorization(args, paymentForm);
			
			return {success: false};
			
		case "bancontact":
			
			bancontactPayAuthorization(args);
			
			return {success: false};
			
		case "benefit":

			benefitPayAuthorization(args);
			
			return {success: false};
			
		case "giro":
			
			giroPayAuthorization(args);
			
			return {success: false};
			
		case "eps":
			
			epsPayAuthorization(args);
			
			return {success: false};
			
		case "sofort":
			
			sofortPayAuthorization(args);
			
			return {success: false};
			
		case "knet":
			
			knetPayAuthorization(args);
			
			return {success: false};
			
		case "qpay":
			
			qPayAuthorization(args);
			
			return {success: false};
			
		case "fawry":
			
			fawryPayAuthorization(args);
			
			return {success: false};
			
		case "sepa":
			
			sepaPayAuthorization(args);
			
			return {success: false};
			
		case "multibanco":
			
			multibancoPayAuthorization(args);
			
			return {success: false};
			
			
		case "poli":
			
			poliPayAuthorization(args);
			
			return {success: false};
			
			
		case "p24":
			
			p24PayAuthorization(args);
			
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
					redirectUrl: session.privacy.redirectUrl
				});
				
			}else{
			
			
				ISML.renderTemplate('redirects/APM.isml', {
					redirectUrl: session.privacy.redirectUrl
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
 * Ideal Pay Authorization
 */
function idealPayAuthorization(args){
	
	var currency = util.getAppModeValue('EUR', util.getCurrency(args));
	var language = util.getAppModeValue('nl', util.getLanguage());
	var bic = util.getAppModeValue('INGBNL2A', paymentForm.get('ideal_bic').value());
	
	// building ideal pay object
    var payObject = {
			"source"	: {
		        "type"			: "ideal",
		        "bic"			: bic,
		        "description"	: args.OrderNo,
		        "language"		: language,
		    },
		    "type"		: 'ideal',
		    "purpose"	: businessName,
		    "currency"	: currency
		};

	// build Authorization Object
    SGJCTransAuthObject(payObject, args);
	
}

/*
 * Boleto Pay Authorization
 */
function boletoPayAuthorization(args){
	
	var cpfNumber = util.getAppModeValue('00003456789', paymentForm.get('boleto_cpf').value());
	var birthday = util.getAppModeValue('1984-03-04', paymentForm.get('boleto_birthDate').value());
	var currency = util.getAppModeValue('BRL', util.getCurrency(args));
	
	// building pay object
	var payObject = {
		"source"		: {
			"type"	: "boleto",
			"birthDate" : birthday,
			"cpf"		: cpfNumber,
			"customerName" : util.getCustomerName(args)
		},
		"type"		: 'boleto',
		"purpose"	: businessName,
		"currency"	: currency
	};

	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Bancontact Pay Authorization
 */
function bancontactPayAuthorization(args){
	
	var country = util.getAppModeValue('BE', util.getBillingCountry(args));
	var currency = util.getAppModeValue('EUR', util.getCurrency(args));
	
	// building pay object
	var payObject = {
			"source"		: {
				"type"					: "bancontact",
				"payment_country" 		: country,
				"account_holder_name"	: util.getCustomerName(args),
				"billing_descriptor" 	: businessName
			},
			"type"		: 'boleto',
			"purpose"	: businessName,
			"currency"	: currency
		};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Benefit Pay Authorization
 */
function benefitPayAuthorization(args){
	
	var currency = util.getAppModeValue('BHD', util.getCurrency(args));
	
	// process benefit pay
	var payObject = {
		    "source"		: {
		        "type"					: "benefitpay",
		        "integration_type"		: "web"
		    },
		    "type"		: "benefit",
		    "purpose"	: businessName,
		    "currency"	: currency
		};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Giro Pay Authorization
 */
function giroPayAuthorization(args){
	
	var currency = util.getAppModeValue('EUR', util.getCurrency(args));

	// building pay object
	var payObject = {
			"source"				: {
				"type"			: "giropay",
				"purpose"			: businessName
			},
		    "type"		: "giropay",
		    "purpose"	: businessName,
		    "currency"	: currency
			
		};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}

/*
 * Eps Pay Authorization
 */
function epsPayAuthorization(args){
	
	var currency = util.getAppModeValue('EUR', util.getCurrency(args));
	
	// building pay object
	var payObject = {
			"source"	: {
				"type"		: "eps",
				"purpose"	: businessName
			},
		    "type"		: "eps",
		    "purpose"	: businessName,
		    "currency"	: currency
		};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Sofort Pay Authorization
 */
function sofortPayAuthorization(args){
	
	var currency = util.getAppModeValue('EUR', util.getCurrency(args));

	// building pay object
	var payObject = {
		"source"	: 	{
				"type"	: "sofort"
			},
		"type"		: "sofort",
		"purpose"	: businessName,
		"currency" 	: currency
	};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
}

/*
 * Knet Pay Authorization
 */
function knetPayAuthorization(args){
	
	var currency = util.getAppModeValue('KWD', util.getCurrency(args));
	var language = util.getAppModeValue('en', util.getLanguage());
	
	// building pay object
	var payObject = {
	    "source"	: 		{
	        "type"						: "knet",
	        "language"					: language,
	        "user_defined_field1"		: "first user defined field",
	        "user_defined_field2"		: "second user defined field",
	        "card_token"				: "01234567",
	        "user_defined_field4"		: "fourth user defined field",
	        "ptlf"						: "ebtdut3vgtqepe56w64zcxlg6i"
	    },
	    "type"		: "knet",
	    "purpose"	: businessName,
	    "currency"	: currency
	};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Q Pay Authorization
 */
function qPayAuthorization(args){
	
	var nationalId = util.getAppModeValue('070AYY010BU234M', paymentForm.get('qpay_national_id').value());
	var language = util.getAppModeValue('en', util.getLanguage());
	var currency = util.getAppModeValue('QAR', util.getCurrency(args));
	
	// building pay object
	var payObject = {
		"source"	: {
	        "type"				: "qpay",
	        "description"		: businessName,
	        "language"			: language,
	        "quantity"			: util.getProductQuantity(args),
	        "national_id"		: nationalId
	    },
	    "type"		: "qpay",
	    "purpose"	: businessName,
	    "currency"	: currency
	};
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Fawry Pay Authorization
 */
function fawryPayAuthorization(args){
	
	var currency = util.getAppModeValue('EGP', util.getCurrency(args));
	
	// building pay object
	var payObject = {
	    "source"	: {
	        "type": "fawry",
	        "description": businessName,
			"customer_mobile"	: util.getPhoneObject(args).number,
			"customer_email"	: util.getCustomer(args).email,
			"products"			: util.getProductInformation(args)
	    },
		"type"		: "fawry",
		"purpose"	: businessName,
	    "currency"	: currency
	 };
	
	// build Authorization Object
	SGJCTransAuthObject(payObject, args);
	
}

/*
 * Sepa Pay Authorization
 */
function sepaPayAuthorization(args){
	
	var accountIban = util.getAppModeValue('DE25100100101234567893', paymentForm.get('sepa_iban').value() + paymentForm.get('sepa_bic').value());
	
	// building pay object
	var payObject = {
		"type"			: "sepa",
	    "source_data"	: {
	        "first_name"			: util.getCustomerFirstName(args),
	        "last_name"				: util.getCustomerLastName(args),
	        "account_iban"			: accountIban,
	        "billing_descriptor"	: businessName,
	        "mandate_type"			: "single"
	    }

	};
	

	SGJCTransAuthObject(payObject, args);
	
}

/*
 * Multibanco Pay Authorization
 */
function multibancoPayAuthorization(args){
	
	var currency = util.getAppModeValue('EUR', util.getCurrency(args));
	var country = util.getAppModeValue('PT', util.getBillingCountry(args));
	
	var payObject = {
	        "type"		: "multibanco",
		    "currency"	: currency,
		    "source": {
		        "type"					: "multibanco",
		        "payment_country"		: country,
		        "account_holder_name"	: util.getCustomerName(args),
		        "billing_descriptor"	: businessName
		    }
		 }
	

	SGJCTransAuthObject(payObject, args);
	
}

/*
 * Poli Pay Authorization
 */
function poliPayAuthorization(args){
	
	var currency = util.getAppModeValue('NZD', util.getCurrency(args));
	
	var payObject = {
	        "type"		: "poli",
		    "currency"	: currency,
		    "source"	: {
		        "type"		: "poli"
		     }
		 }
	

	SGJCTransAuthObject(payObject, args);
	
}

/*
 * P24 Pay Authorization
 */
function p24PayAuthorization(args){
	
	var currency = util.getAppModeValue('PLN', util.getCurrency(args));
	var country = util.getAppModeValue('PL', util.getBillingCountry(args));
	
	var payObject = {
		    "type": "p24",
		    "currency"		: currency,
		    "source"		: {
		        "type"					: "p24",
		        "payment_country"		: country,
		        "account_holder_name"	: util.getCustomerName(args),
		        "account_holder_email"	: util.getCustomer(args).email,
		        "billing_descriptor"	: businessName
		    }
		 }
	

	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;