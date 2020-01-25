'use strict'

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

// Get apms form
var paymentForm = app.getForm('alternativePaymentForm');

/* Utility */
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

var ckoApmConfig = {
	
	/*
	 * Ideal Pay Authorization
	 */
	idealPayAuthorization: function(args) {
		
		// building ideal pay object
	    var payObject = {
			'source'	: {
				'type'			: 'ideal',
				'bic'			: paymentForm.get('ideal_bic').value(),
				'description'	: args.OrderNo,
				'language'		: ckoUtility.getLanguage(),
			},
			'type'		: 'ideal',
			'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
	    
	    return payObject;
	},
	
	/*
	 * Boleto Pay Authorization
	 */
	boletoPayAuthorization: function(args) {
		
		// Building pay object
		var payObject = {
			'source'		: {
				'type'	: 'boleto',
				'birthDate' : paymentForm.get('boleto_birthDate').value(),
				'cpf'		: paymentForm.get('boleto_cpf').value(),
				'customerName' : ckoUtility.getCustomerName(args)
			},
			'type'		: 'boleto',
			'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},

	/*
	 * Bancontact Pay Authorization
	 */
	bancontactPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'source'		: {
				'type'					: 'bancontact',
				'payment_country' 		: ckoUtility.getBillingCountry(args),
				'account_holder_name'	: ckoUtility.getCustomerName(args),
				'billing_descriptor' 	: businessName
			},
			'type'		: 'bancontact',
			'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},
	
	/*
	 * Benefit Pay Authorization
	 */
	benefitPayAuthorization: function(args) {
		// Process benefit pay
		var payObject = {
			'source' : {
				'type'				: 'benefitpay',
				'integration_type'	: 'web'
			},
			'type'		: 'benefit',
			'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},

	/*
	 * Giro Pay Authorization
	 */
	giroPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'source'		: {
				'type'			: 'giropay',
				'purpose'		: businessName
			},
			'type'		: 'giropay',
			'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},
	
	/*
	 * Eps Pay Authorization
	 */
	epsPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'source'	: {
				'type'		: 'eps',
				'purpose'	: businessName
			},
			'type'		: 'eps',
			'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},
	
	/*
	 * Sofort Pay Authorization
	 */
	sofortPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'source'	: {
				'type'	: 'sofort'
			},
			'type'		: 'sofort',
			'purpose'	: businessName,
			'currency' 	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},
	
	/*
	 * Knet Pay Authorization
	 */
	knetPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
		    'source'	: 	{
		        'type'			: 'knet',
		        'language'		: ckoUtility.getLanguage().substr(0, 2),
		    },
		    'type'		: 'knet',
		    'purpose'	: businessName,
			'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},

	/*
	 * Q Pay Authorization
	 */
	qpayPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'source'	: {
		        'type'			: 'qpay',
		        'description'	: businessName,
		        'language'		: ckoUtility.getLanguage().substr(0, 2),
		        'quantity'		: ckoUtility.getProductQuantity(args),
		        'national_id'	: paymentForm.get('qpay_national_id').value()
		    },
		    'type'		: 'qpay',
		    'purpose'	: businessName,
		    'currency'	: ckoUtility.getCurrency(args)
		};
		
		return payObject;
	},

	/*
	 * Fawry Pay Authorization
	 */
	fawryPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
		    'source'	: {
		        'type'				: 'fawry',
		        'description'		: businessName,
				'customer_mobile'	: ckoUtility.getPhoneObject(args).number,
				'customer_email'	: ckoUtility.getCustomer(args).email,
				'products'			: ckoUtility.getProductInformation(args)
		    },
			'type'		: 'fawry',
			'purpose'	: businessName,
		    'currency'	: ckoUtility.getCurrency(args)
		 };
		
		return payObject;	
	},
	
	/*
	 * Sepa Pay Authorization
	 */
	sepaPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'type'			: 'sepa',
			'currency'		: ckoUtility.getCurrency(args),
		    'source_data'	: {
		        'first_name'			: ckoUtility.getCustomerFirstName(args),
		        'last_name'				: ckoUtility.getCustomerLastName(args),
		        'account_iban'			: paymentForm.get('sepa_iban').value() + paymentForm.get('sepa_bic').value(),
		        'billing_descriptor'	: businessName,
		        'mandate_type'			: 'single'
		    }
		};
		
		return payObject;
	},
	
	/*
	 * Multibanco Pay Authorization
	 */
	multibancoPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'type'		: 'multibanco',
			'currency'	: ckoUtility.getCurrency(args),
			'source'	: {
				'type'					: 'multibanco',
				'payment_country'		: ckoUtility.getBillingCountry(args),
				'account_holder_name'	: ckoUtility.getCustomerName(args),
				'billing_descriptor'	: businessName
			}
		};
		
		return payObject;
	},
	
	/*
	 * Poli Pay Authorization
	 */
	poliPayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'type'		: 'poli',
			'currency'	: ckoUtility.getCurrency(args),
			'source'	: {
				'type'		: 'poli'
			}
		};
		
		return payObject;
	},

	/*
	 * P24 Pay Authorization
	 */
	p24PayAuthorization: function(args) {
		// Building pay object
		var payObject = {
			'type'			: 'p24',
			'currency'		: ckoUtility.getCurrency(args),
			'source'		: {
				'type'					: 'p24',
				'payment_country'		: ckoUtility.getBillingCountry(args),
				'account_holder_name'	: ckoUtility.getCustomerName(args),
				'account_holder_email'	: ckoUtility.getCustomer(args).email,
				'billing_descriptor'	: businessName
			}
		};
	
		return payObject;
	},

	/*
	 * Klarna Pay Authorization
	 */
	klarnaPayAuthorization: function(args) {
		// Gdt the order
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// Klarna Form Inputs
		var klarna_approved = paymentForm.get('klarna_approved').value();
		
		if (klarna_approved) {
			// Build the payment object
			var payObject = {
				'type'		: 'klarna',
			    'amount'	: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency(args)),
			    'currency'	: ckoUtility.getCurrency(args),
			    'capture'	: false,
			    'source'	: {
			        'type'					: 'klarna',
			        'authorization_token'	: paymentForm.get('klarna_token').value(),
			        'locale'				: ckoUtility.getLanguage(),
			        'purchase_country'		: ckoUtility.getBillingObject(args).country,
			        'tax_amount'			: ckoUtility.getFormattedPrice(order.totalTax.value, ckoUtility.getCurrency(args)),
			        'billing_address'		: ckoUtility.getOrderBasketAddress(args),
					'products'				: ckoUtility.getOrderBasketObject(args)
				}
			};
			 
			return payObject;
			
		}
		else {
			return {success: false};
		}
	},

	/*
	 * Paypal Pay Authorization
	 */
	paypalPayAuthorization: function(args) {
		// Build the payment object
		var payObject = {
			'type'			: 'paypal',
			'currency'		: ckoUtility.getCurrency(args),
			'source'		: {
				'type'				: 'paypal',
				'invoice_number'	: args.OrderNo
			}
		};

		return payObject;
	},
	
	/*
	 * Oxxo Pay Object
	 */
	oxxoPayAuthorization: function(args) {
		// Build the payment object
		var payObject = {
		    'source': {
		        'type': 'oxxo',
		        'integration_type': 'redirect',
		        'country': ckoUtility.getBillingObject(args).country,
		        'payer': {
		            'name': ckoUtility.getCustomerName(args),
		            'email': ckoUtility.getCustomer(args).email,
		            'document': paymentForm.get('oxxo_identification').value()
		        }
		    },
	    	'type'			: 'oxxo',
	    	'currency'		: ckoUtility.getCurrency(args),
		};
		
		return payObject;
	}
}

/*
* Module exports
*/
module.exports = ckoApmConfig;