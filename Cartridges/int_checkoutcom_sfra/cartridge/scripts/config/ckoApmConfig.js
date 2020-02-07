'use strict'

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');

/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

var ckoApmConfig = {
    /*
     * Ideal Pay Authorization
     */
    idealPayAuthorization: function (args) {  
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
     * Boleto Pay Authorization
     */
    boletoPayAuthorization: function (args) {
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
            'type'      : 'bancontact',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
     * Benefit Pay Authorization
     */
    benefitPayAuthorization: function (args) {
        // Process benefit pay
        var payObject = {
            'source' : {
                'type'              : 'benefitpay',
                'integration_type'  : 'web'
            },
            'type'      : 'benefit',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /*
     * Giro Pay Authorization
     */
    giroPayAuthorization: function (args) {
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
     * Eps Pay Authorization
     */
    epsPayAuthorization: function (args) {
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
     * Sofort Pay Authorization
     */
    sofortPayAuthorization: function (args) {
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
     * Knet Pay Authorization
     */
    knetPayAuthorization: function (args) {
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
                'national_id'   : args.Form.qpay_national_id
            },
            'type'      : 'qpay',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },

    /*
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
            'type'      : 'fawry',
            'purpose'   : businessName,
            'currency'  : ckoHelper.getCurrency(args)
        };
        
        return payObject;
    },
    
    /*
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
                'account_iban'          : args.Form.sepa_iban + args.Forms.epa_bic,
                'billing_descriptor'    : businessName,
                'mandate_type'          : 'single'
            }
        };
        
        return payObject;
    },
    
    /*
     * Multibanco Pay Authorization
     */
    multibancoPayAuthorization: function (args) {
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
     * Poli Pay Authorization
     */
    poliPayAuthorization: function (args) {
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
     * P24 Pay Authorization
     */
    p24PayAuthorization: function (args) {
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
     * Klarna Pay Authorization
     */
    klarnaPayAuthorization: function (args) {
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

    /*
     * Paypal Pay Authorization
     */
    paypalPayAuthorization: function (args) {
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
                    'document': args.Form.oxxo_identification
                }
            },
            'type'          : 'oxxo',
            'currency'      : ckoHelper.getCurrency(args),
        };
        
        return payObject;
    }
}

/*
* Module exports
*/
module.exports = ckoApmConfig;