'use strict'

// Site controller
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');

// API Includes
var OrderMgr = require('dw/order/OrderMgr');
var app = require(SiteControllerName + '/cartridge/scripts/app');

// Business Name
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

// Get apms form
var paymentForm = app.getForm('alternativePaymentForm');

// Utility 
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

// All apm config objects
var ckoApmConfig = {
    
    /**
     * Ideal Pay Authorization
     */
    idealPayAuthorization: function (args) {
        
        // building ideal pay object
        var payObject = {
            'source'    : {
                'type'          : 'ideal',
                'bic'           : paymentForm.get('ideal_bic').value(),
                'description'   : args.OrderNo,
                'language'      : ckoHelper.getLanguage()
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Boleto Pay Authorization
     */
    boletoPayAuthorization: function (args) {
        
        // Building pay object
        var payObject = {
            'source'        : {
                'type'  : 'boleto',
                'integration_type': 'redirect',
                'country': ckoHelper.getBillingCountry(args),
                'payer': {
                    'name' : ckoHelper.getCustomerName(args),
                	'email': ckoHelper.getCustomer(args).email,
                    'document'       : paymentForm.get('boleto_cpf').value()
                }
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /**
     * Bancontact Pay Authorization
     */
    bancontactPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'        : {
                'type'                  : 'bancontact',
                'payment_country'       : ckoHelper.getBillingCountry(args),
                'account_holder_name'   : ckoHelper.getCustomerName(args),
                'billing_descriptor'    : businessName
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Benefit Pay Authorization
     */
    benefitPayAuthorization: function (args) {
    	
        // Process benefit pay
        var payObject = {
            'source' : {
                'type'              : 'benefitpay',
                'integration_type'  : 'web'
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /**
     * Giro Pay Authorization
     */
    giroPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'        : {
                'type'          : 'giropay',
                'purpose'       : businessName
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Eps Pay Authorization
     */
    epsPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'    : {
                'type'      : 'eps',
                'purpose'   : businessName
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Sofort Pay Authorization
     */
    sofortPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'    : {
                'type'  : 'sofort'
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Knet Pay Authorization
     */
    knetPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'    :   {
                'type'          : 'knet',
                'language'      : ckoHelper.getLanguage().substr(0, 2)
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /**
     * Q Pay Authorization
     */
    qpayPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'    : {
                'type'          : 'qpay',
                'description'   : businessName,
                'language'      : ckoHelper.getLanguage().substr(0, 2),
                'quantity'      : ckoHelper.getProductQuantity(args),
                'national_id'   : paymentForm.get('qpay_national_id').value()
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /**
     * Fawry Pay Authorization
     */
    fawryPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'source'    : {
                'type'              : 'fawry',
                'description'       : businessName,
                'customer_mobile'   : ckoHelper.getPhoneObject(args).number,
                'customer_email'    : ckoHelper.getCustomer(args).email,
                'products'          : ckoHelper.getProductInformation(args)
            },
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Sepa Pay Authorization
     */
    sepaPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'type'          : 'sepa',
            'currency'      : ckoHelper.getCurrency(args),
            'source_data'   : {
                'first_name'            : ckoHelper.getCustomerFirstName(args),
                'last_name'             : ckoHelper.getCustomerLastName(args),
                'account_iban'          : paymentForm.get('sepa_iban').value(),
                'billing_descriptor'    : businessName,
                'mandate_type'          : 'single'
            }
        };
        
        return payObject;
    },
    
    /**
     * Multibanco Pay Authorization
     */
    multibancoPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'currency'  : ckoHelper.getCurrency(args),
            'source'    : {
                'type'                  : 'multibanco',
                'payment_country'       : ckoHelper.getBillingCountry(args),
                'account_holder_name'   : ckoHelper.getCustomerName(args),
                'billing_descriptor'    : businessName
            }
        };
        
        return payObject;
    },
    
    /**
     * Poli Pay Authorization
     */
    poliPayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'currency'  : ckoHelper.getCurrency(args),
            'source'    : {
                'type'      : 'poli'
            }
        };
        
        return payObject;
    },

    /**
     * P24 Pay Authorization
     */
    p24PayAuthorization: function (args) {
    	
        // Building pay object
        var payObject = {
            'currency'      : ckoHelper.getCurrency(args),
            'source'        : {
                'type'                  : 'p24',
                'payment_country'       : ckoHelper.getBillingCountry(args),
                'account_holder_name'   : ckoHelper.getCustomerName(args),
                'account_holder_email'  : ckoHelper.getCustomer(args).email,
                'billing_descriptor'    : businessName
            }
        };
    
        return payObject;
    },

    /**
     * Klarna Pay Authorization
     */
    klarnaPayAuthorization: function (args) {
    	
        // Gdt the order
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Klarna Form Inputs
        var klarna_approved = paymentForm.get('klarna_approved').value();
        
        if (klarna_approved) {
        	
            // Build the payment object
            var payObject = {
                'amount'    : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency(args)),
                'currency'  : ckoHelper.getCurrency(args),
                'capture'   : false,
                'source'    : {
                    'type'                  : 'klarna',
                    'authorization_token'   : paymentForm.get('klarna_token').value(),
                    'locale'                : ckoHelper.getLanguage(),
                    'purchase_country'      : ckoHelper.getBillingObject(args).country,
                    'tax_amount'            : ckoHelper.getFormattedPrice(order.totalTax.value, ckoHelper.getCurrency(args)),
                    'billing_address'       : ckoHelper.getOrderBasketAddress(args),
                    'products'              : ckoHelper.getOrderBasketObject(args)
                }
            };
             
            return payObject;
        } else {
        	
            return {success: false};
        }
    },

    /**
     * Paypal Pay Authorization
     */
    paypalPayAuthorization: function (args) {
    	
        // Build the payment object
        var payObject = {
            'currency'      : ckoHelper.getCurrency(args),
            'source'        : {
                'type'              : 'paypal',
                'invoice_number'    : args.OrderNo
            }
        };

        return payObject;
    },
    
    /**
     * Oxxo Pay Object
     */
    oxxoPayAuthorization: function (args) {
    	
        // Build the payment object
        var payObject = {
            'source': {
                'type': 'oxxo',
                'integration_type': 'redirect',
                'country': ckoHelper.getBillingObject(args).country,
                'payer': {
                    'name': ckoHelper.getCustomerName(args),
                    'email': ckoHelper.getCustomer(args).email,
                    'document': paymentForm.get('oxxo_identification').value()
                }
            },
            'currency'      : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /**
     * Ali Pay Object
     */
    aliPayAuthorization: function (args) {
    	
        // Build the payment object
        var payObject = {
            'source': {
                'type': 'alipay'
            },
            'currency'      : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    }
}

// Module exports
module.exports = ckoApmConfig;