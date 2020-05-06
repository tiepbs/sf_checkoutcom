'use strict'

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

var ckoApmConfig = {
    /*
     * Ideal authorization
     */
    idealAuthorization: function (args) {  
        // Building ideal pay object
        var payObject = {
            'source'    : {
                'type'          : 'ideal',
                'bic'           : args.Form.ideal_bic,
                'description'   : args.OrderNo,
                'language'      : ckoHelper.getLanguage(),
            },
            'type'      : 'ideal',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Boleto authorization
     */
    boletoAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'        : {
                'type'  : 'boleto',
                'birthDate' : args.Form.boleto_birthDate,
                'cpf'       : args.Form.boleto_cpf,
                'customerName' : ckoHelper.getCustomerName(args)
            },
            'type'      : 'boleto',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /*
     * Bancontact authorization
     */
    bancontactAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'        : {
                'type'                  : 'bancontact',
                'payment_country'       : ckoHelper.getBillingCountry(args),
                'account_holder_name'   : ckoHelper.getCustomerName(args),
                'billing_descriptor'    : businessName
            },
            'type'      : 'bancontact',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Benefit Pay authorization
     */
    benefitpayAuthorization: function (args) {
        // Process benefit pay
        var payObject = {
            'source' : {
                'type'              : 'benefitpay',
                'integration_type'  : 'web'
            },
            'type'      : 'benefitpay',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /*
     * Giro Pay authorization
     */
    giropayAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'        : {
                'type'          : 'giropay',
                'purpose'       : businessName
            },
            'type'      : 'giropay',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Eps authorization
     */
    epsAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'    : {
                'type'      : 'eps',
                'purpose'   : businessName
            },
            'type'      : 'eps',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Sofort authorization
     */
    sofortAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'    : {
                'type'  : 'sofort'
            },
            'type'      : 'sofort',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Knet authorization
     */
    knetAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'    :   {
                'type'          : 'knet',
                'language'      : ckoHelper.getLanguage().substr(0, 2),
            },
            'type'      : 'knet',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /*
     * QPay authorization
     */
    qpayAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'    : {
                'type'          : 'qpay',
                'description'   : businessName,
                'language'      : ckoHelper.getLanguage().substr(0, 2),
                'quantity'      : ckoHelper.getProductQuantity(args),
                'national_id'   : args.Form.qpay_national_id
            },
            'type'      : 'qpay',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /*
     * Fawry authorization
     */
    fawryAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'source'    : {
                'type'              : 'fawry',
                'description'       : businessName,
                'customer_mobile'   : ckoHelper.getPhone(args).number,
                'customer_email'    : ckoHelper.getCustomer(args).email,
                'products'          : ckoHelper.getProductInformation(args)
            },
            'type'      : 'fawry',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Sepa authorization
     */
    sepaAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'type'          : 'sepa',
            'currency'      : ckoHelper.getCurrency(args),
            'source_data'   : {
                'first_name'            : ckoHelper.getCustomerFirstName(args),
                'last_name'             : ckoHelper.getCustomerLastName(args),
                'account_iban'          : args.Form.sepa_iban + args.Forms.epa_bic,
                'billing_descriptor'    : businessName,
                'mandate_type'          : 'single'
            }
        };
        
        return payObject;
    },
    
    /*
     * Multibanco authorization
     */
    multibancoAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'type'      : 'multibanco',
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
    
    /*
     * Poli authorization
     */
    poliAuthorization: function (args) {
        // Building pay object
        var payObject = {
            'type'      : 'poli',
            'currency'  : ckoHelper.getCurrency(args),
            'source'    : {
                'type'      : 'poli'
            }
        };
        
        return payObject;
    },

    /*
     * P24 authorization
     */
    p24Authorization: function (args) {
        // Building pay object
        var payObject = {
            'type'          : 'p24',
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

    /*
     * Klarna authorization
     */
    klarnaAuthorization: function (args) {
        // Gdt the order
        var order = OrderMgr.getOrder(args.OrderNo);
        
        // Klarna Form Inputs
        var klarna_approved = args.Form.klarna_approved;
        
        if (klarna_approved) {
            // Build the payment object
            var payObject = {
                'type'      : 'klarna',
                'amount'    : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency(args)),
                'currency'  : ckoHelper.getCurrency(args),
                'capture'   : false,
                'source'    : {
                    'type'                  : 'klarna',
                    'authorization_token'   : args.Form.klarna_token,
                    'locale'                : ckoHelper.getLanguage(),
                    'purchase_country'      : ckoHelper.getBilling(args).country,
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

    /*
     * Paypal authorization
     */
    paypalAuthorization: function (args) {
        // Build the payment object
        var payObject = {
            'type'          : 'paypal',
            'currency'      : ckoHelper.getCurrency(args),
            'source'        : {
                'type'              : 'paypal',
                'invoice_number'    : args.OrderNo
            }
        };

        return payObject;
    },
    
    /*
     * Oxxo authorization
     */
    oxxoAuthorization: function (args) {
        // Build the payment object
        var payObject = {
            'source': {
                'type': 'oxxo',
                'integration_type': 'redirect',
                'country': ckoHelper.getBilling(args).country,
                'payer': {
                    'name': ckoHelper.getCustomerName(args),
                    'email': ckoHelper.getCustomer(args).email,
                    'document': args.Form.oxxo_identification
                }
            },
            'type'          : 'oxxo',
            'currency'      : ckoHelper.getCurrency(args),
        };
        
        return payObject;
    },

    /*
     * Alipay authorization
     */
    alipayAuthorization: function (args) {
        // Build the payment object
        var payObject = {
            'source': {
                'type': 'alipay',
                'country': ckoHelper.getBillingObject(args).country
            },
            'type'          : 'alipay',
            'currency'      : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    }
}

/*
* Module exports
*/
module.exports = ckoApmConfig;