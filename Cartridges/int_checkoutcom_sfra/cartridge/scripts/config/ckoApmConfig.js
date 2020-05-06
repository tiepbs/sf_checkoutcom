'use strict'

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
                'bic'           : args.paymentData.ideal_bic.htmlValue,
                'description'   : args.order.orderNo,
                'language'      : ckoHelper.getLanguage(),
            },
            'type'      : 'ideal',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
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
                'birthDate' : args.paymentData.boleto_birthDate.htmlValue,
                'cpf'       : args.paymentData.boleto_cpf.htmlValue,
                'customerName' : ckoHelper.getCustomerName(args)
            },
            'type'      : 'boleto',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
                'national_id'   : args.paymentData.qpay_national_id.htmlValue
            },
            'type'      : 'qpay',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
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
            'currency'  : args.order.getCurrencyCode()
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
                'account_iban'          : args.paymentData.sepa_iban.htmlValue + args.paymentData.sepa_bic.htmlValue,
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
            'currency'  : args.order.getCurrencyCode(),
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
            'currency'  : args.order.getCurrencyCode(),
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
            'currency'      : args.order.getCurrencyCode(),
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
        // Get the order
        var order = OrderMgr.getOrder(args.orderNo);
        
        // Klarna Form Inputs
        var klarna_approved = args.paymentData.klarna_approved.htmlValue;
        
        if (klarna_approved) {
            // Build the payment object
            var payObject = {
                'type'      : 'klarna',
                'amount'    : ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency(args)),
                'currency'  : args.order.getCurrencyCode(),
                'capture'   : false,
                'source'    : {
                    'type'                  : 'klarna',
                    'authorization_token'   : args.paymentData.klarna_token.htmlValue,
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
            'currency'      : args.order.getCurrencyCode(),
            'source'        : {
                'type'              : 'paypal',
                'invoice_number'    : args.order.orderNo
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
                    'document': args.paymentData.oxxo_identification.htmlValue
                }
            },
            'type'          : 'oxxo',
            'currency'      : args.order.getCurrencyCode(),
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
            'currency'      : args.order.getCurrencyCode()
        };
        
        return payObject;
    }
}

/*
* Module exports
*/
module.exports = ckoApmConfig;