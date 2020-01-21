'use strict'


/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');


/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var app = require(SiteControllerName + '/cartridge/scripts/app');


/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');
//get apms form
var paymentForm = app.getForm('alternativePaymentForm');
/* Utility */
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');



var ckoApmConfig = {
	
	/*
	 * Ideal Pay Authorization
	 */
	idealPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		var language = ckoUtility.getLanguage();
		var bic = paymentForm.get('ideal_bic').value();
		
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
	    
	    return payObject;
		
	},
	
	

	/*
	 * Boleto Pay Authorization
	 */
	boletoPayAuthorization: function(args){
		
		var cpfNumber = paymentForm.get('boleto_cpf').value();
		var birthday = paymentForm.get('boleto_birthDate').value();
		var currency = ckoUtility.getCurrency(args);
		
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
		
		return payObject;
		
	},
	


	/*
	 * Bancontact Pay Authorization
	 */
	bancontactPayAuthorization: function(args){
		
		var country = ckoUtility.getBillingCountry(args);
		var currency = ckoUtility.getCurrency(args);
		
		// building pay object
		var payObject = {
				"source"		: {
					"type"					: "bancontact",
					"payment_country" 		: country,
					"account_holder_name"	: ckoUtility.getCustomerName(args),
					"billing_descriptor" 	: businessName
				},
				"type"		: 'bancontact',
				"purpose"	: businessName,
				"currency"	: currency
			};
		
		return payObject;
		
	},
	


	/*
	 * Benefit Pay Authorization
	 */
	benefitPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		
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
		
		return payObject;
		
	},
	


	/*
	 * Giro Pay Authorization
	 */
	giroPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);

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
		
		return payObject;
		
	},
	
	

	/*
	 * Eps Pay Authorization
	 */
	epsPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		
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
		
		return payObject;
		
	},
	


	/*
	 * Sofort Pay Authorization
	 */
	sofortPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);

		// building pay object
		var payObject = {
			"source"	: 	{
					"type"	: "sofort"
				},
			"type"		: "sofort",
			"purpose"	: businessName,
			"currency" 	: currency
		};
		
		return payObject;
		
	},
	
	

	/*
	 * Knet Pay Authorization
	 */
	knetPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		var language = ckoUtility.getLanguage().substr(0, 2);
		
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
		
		return payObject;
		
	},

	

	/*
	 * Q Pay Authorization
	 */
	qpayPayAuthorization: function(args){
		
		var nationalId = paymentForm.get('qpay_national_id').value();
		var language = ckoUtility.getLanguage().substr(0, 2);
		var currency = ckoUtility.getCurrency(args);
		
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
		
		return payObject;
		
	},

	

	/*
	 * Fawry Pay Authorization
	 */
	fawryPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		
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
		
		return payObject;
		
	},
	
	

	/*
	 * Sepa Pay Authorization
	 */
	sepaPayAuthorization: function(args){
		
		var accountIban = paymentForm.get('sepa_iban').value() + paymentForm.get('sepa_bic').value();
		var currency = ckoUtility.getCurrency(args);
		
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
		
		return payObject;
		
	},
	
	

	/*
	 * Multibanco Pay Authorization
	 */
	multibancoPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		var country = ckoUtility.getBillingCountry(args);
		
		var payObject = {
		        "type"		: "multibanco",
			    "currency"	: currency,
			    "source"	: {
			        "type"					: "multibanco",
			        "payment_country"		: country,
			        "account_holder_name"	: ckoUtility.getCustomerName(args),
			        "billing_descriptor"	: businessName
			    }
			 };
		
		return payObject;
		
	},
	
	

	/*
	 * Poli Pay Authorization
	 */
	poliPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		
		var payObject = {
		        "type"		: "poli",
			    "currency"	: currency,
			    "source"	: {
			        "type"		: "poli"
			     }
			 };
		
		return payObject;
		
	},
	
	

	/*
	 * P24 Pay Authorization
	 */
	p24PayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);
		var country = ckoUtility.getBillingCountry(args);
		
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
			 };
	
		return payObject;
		
	},



	/*
	 * Klarna Pay Authorization
	 */
	klarnaPayAuthorization: function(args){
		
		var order = OrderMgr.getOrder(args.OrderNo);
		
		

		var countryCode = ckoUtility.getBillingObject(args).country;
		var currency = ckoUtility.getCurrencyCode(args);
		var locale = ckoUtility.getLanguage();
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
			 
			 return payObject;
			
		}else{
			 return {success: false};
		}
		 
		
	},


	/*
	 * Paypal Pay Authorization
	 */
	paypalPayAuthorization: function(args){
		
		var currency = ckoUtility.getCurrency(args);

		var payObject = {
			    "type"			: "paypal",
			    "currency"		: currency,
			    "source"		: {
			        "type"				: "paypal",
			        "invoice_number"	: args.OrderNo
			    }
			};
		
		return payObject;
		
	},
	
	
	/*
	 * Oxxo Pay Object
	 */
	oxxoPayAuthorization:	function(args){
		
		var countryCode = ckoUtility.getBillingObject(args).country;
		var identification = paymentForm.get('oxxo_identification').value();
		var currency = ckoUtility.getCurrency(args);
		
		var payObject = {
		    "source": {
		        "type": "oxxo",
		        "integration_type": "redirect",
		        "country": countryCode,
		        "payer": {
		            "name": ckoUtility.getCustomerName(args),
		            "email": ckoUtility.getCustomer(args).email,
		            "document": identification
		        }
		    },
	    "type"			: "oxxo",
	    "currency"		: currency,
		};
		
		return payObject;
	}
		
}




/*
* Module exports
*/

module.exports = ckoApmConfig;