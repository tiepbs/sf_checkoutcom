'use strict';


/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var Cart = require(SiteControllerName + '/cartridge/scripts/models/CartModel');
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Utility */
var apmUtility = require('~/cartridge/scripts/helpers/apmUtility');
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

// get apms form
var paymentForm = app.getForm('alternativePaymentForm');


/**
 * Verifies a credit card against a valid card number and expiration date and possibly invalidates invalid form fields.
 * If the verification was successful a credit card payment instrument is created.
 */
function Handle(args) {
	
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
			
		case "klarna":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
			
		case "paypal":
			
			// proceed with transaction
			SGJCTransHandleObject(args);
			
			return {success: true};
		
	}

}


/**
 * Authorises a payment using a credit card. The payment is authorised by using the BASIC_CREDIT processor
 * only and setting the order no as the transaction ID. Customisations may use other processors and custom
 * logic to authorise credit card payment.
 */
function Authorize(args) {
	
	// Add order Number to session
	session.privacy.ckoOrderId = args.OrderNo;
	
	// get apms form
	var paymentForm = app.getForm('alternativePaymentForm');
	
	// get apm type chosen
	var apm = paymentForm.get('alternative_payments').value();	
	
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
			
			
		case "klarna":
			
			klarnaPayAuthorization(args);
			
			return {success: false};
			
		case "paypal":
			
			paypalPayAuthorization(args);
			
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
	var apmRequest = apmUtility.handleApmRequest(payObject, args);
	
	
	// Handle apm result
	if(apmRequest){
		
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
	
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));
	var language = ckoUtility.getAppModeValue('nl', ckoUtility.getLanguage());
	var bic = ckoUtility.getAppModeValue('INGBNL2A', paymentForm.get('ideal_bic').value());
	
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
	
	var cpfNumber = ckoUtility.getAppModeValue('00003456789', paymentForm.get('boleto_cpf').value());
	var birthday = ckoUtility.getAppModeValue('1984-03-04', paymentForm.get('boleto_birthDate').value());
	var currency = ckoUtility.getAppModeValue('BRL', ckoUtility.getCurrency(args));
	
	// building pay object
	var payObject = {
		"source"		: {
			"type"	: "boleto",
			"birthDate" : birthday,
			"cpf"		: cpfNumber,
			"customerName" : ckoUtility.getCustomerName(args)
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
	
	var country = ckoUtility.getAppModeValue('BE', ckoUtility.getBillingCountry(args));
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));
	
	// building pay object
	var payObject = {
			"source"		: {
				"type"					: "bancontact",
				"payment_country" 		: country,
				"account_holder_name"	: ckoUtility.getCustomerName(args),
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
	
	var currency = ckoUtility.getAppModeValue('BHD', ckoUtility.getCurrency(args));
	
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
	
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));

	// building pay object
	var payObject = {
			"source"		: {
				"type"			: "giropay",
				"purpose"		: businessName
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
	
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));
	
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
	
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));

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
	
	var currency = ckoUtility.getAppModeValue('KWD', ckoUtility.getCurrency(args));
	var language = ckoUtility.getAppModeValue('en', ckoUtility.getLanguage());
	
	// building pay object
	var payObject = {
	    "source"	: 	{
	        "type"			: "knet",
	        "language"		: language,
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
	
	var nationalId = ckoUtility.getAppModeValue('070AYY010BU234M', paymentForm.get('qpay_national_id').value());
	var language = ckoUtility.getAppModeValue('en', ckoUtility.getLanguage());
	var currency = ckoUtility.getAppModeValue('QAR', ckoUtility.getCurrency(args));
	
	// building pay object
	var payObject = {
		"source"	: {
	        "type"			: "qpay",
	        "description"	: businessName,
	        "language"		: language,
	        "quantity"		: ckoUtility.getProductQuantity(args),
	        "national_id"	: nationalId
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
	
	var currency = ckoUtility.getAppModeValue('EGP', ckoUtility.getCurrency(args));
	
	// building pay object
	var payObject = {
	    "source"	: {
	        "type"				: "fawry",
	        "description"		: businessName,
			"customer_mobile"	: ckoUtility.getPhoneObject(args).number,
			"customer_email"	: ckoUtility.getCustomer(args).email,
			"products"			: ckoUtility.getProductInformation(args)
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
	
	var accountIban = ckoUtility.getAppModeValue('DE25100100101234567893', paymentForm.get('sepa_iban').value() + paymentForm.get('sepa_bic').value());
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));
	
	// building pay object
	var payObject = {
		"type"			: "sepa",
		"currency"		: currency,
	    "source_data"	: {
	        "first_name"			: ckoUtility.getCustomerFirstName(args),
	        "last_name"				: ckoUtility.getCustomerLastName(args),
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
	
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));
	var country = ckoUtility.getAppModeValue('PT', ckoUtility.getBillingCountry(args));
	
	var payObject = {
	        "type"		: "multibanco",
		    "currency"	: currency,
		    "source"	: {
		        "type"					: "multibanco",
		        "payment_country"		: country,
		        "account_holder_name"	: ckoUtility.getCustomerName(args),
		        "billing_descriptor"	: businessName
		    }
		 }
	

	SGJCTransAuthObject(payObject, args);
	
}

/*
 * Poli Pay Authorization
 */
function poliPayAuthorization(args){
	
	var currency = ckoUtility.getAppModeValue('NZD', ckoUtility.getCurrency(args));
	
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
	
	var currency = ckoUtility.getAppModeValue('PLN', ckoUtility.getCurrency(args));
	var country = ckoUtility.getAppModeValue('PL', ckoUtility.getBillingCountry(args));
	
	var payObject = {
		    "type"			: "p24",
		    "currency"		: currency,
		    "source"		: {
		        "type"					: "p24",
		        "payment_country"		: country,
		        "account_holder_name"	: ckoUtility.getCustomerName(args),
		        "account_holder_email"	: ckoUtility.getCustomer(args).email,
		        "billing_descriptor"	: businessName
		    }
		 }
	

	SGJCTransAuthObject(payObject, args);
	
}



/*
 * Klarna Pay Authorization
 */
function klarnaPayAuthorization(args){
	
	var order = OrderMgr.getOrder(args.OrderNo);
	
	

	var countryCode = ckoUtility.getAppModeValue('GB', ckoUtility.getBillingObject(args).country);
	var currency = ckoUtility.getAppModeValue('GBP', ckoUtility.getCurrencyCode(args));
	var locale = ckoUtility.getAppModeValue('en-GB', ckoUtility.getLanguage());
	var total = ckoUtility.getFormattedPrice(order.totalGrossPrice.value, currency);
	var tax =  ckoUtility.getFormattedPrice(order.totalTax.value, currency);
	var products = ckoUtility.getOrderBasketObject(args);
	
	// Klarna Form Inputs
	var klarna_token = paymentForm.get('klarna_token').value();
	var klarna_approved = paymentForm.get('klarna_approved').value();
	var billingAddress = ckoUtility.getOrderBasketAddress(args);
	
	if(klarna_approved){
		
		 var payObject = {
			"type"		: "klarna",
		    "amount"	: total,
		    "currency"	: currency,
		    "capture"	: false,
		    "source"	: {
		        "type"					: "klarna",
		        "authorization_token"	: klarna_token,
		        "locale"				: locale,
		        "purchase_country"		: countryCode,
		        "tax_amount"			: tax,
		        "billing_address"		: billingAddress,
		        "products"				: products
		    }
		 };
		
		

		SGJCTransAuthObject(payObject, args);
	}else{
		 return {success: false};
	}
	 
	
}


/*
 * Paypal Pay Authorization
 */
function paypalPayAuthorization(args){
	
	var currency = ckoUtility.getAppModeValue('EUR', ckoUtility.getCurrency(args));

	var payObject = {
		    "type"			: "paypal",
		    "currency"		: currency,
		    "source"		: {
		        "type"				: "paypal",
		        "invoice_number"	: args.OrderNo
		    }
		}
	

	SGJCTransAuthObject(payObject, args);
	
}


/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;