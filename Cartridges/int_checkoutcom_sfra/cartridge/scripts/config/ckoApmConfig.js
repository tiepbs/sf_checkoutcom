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
        var params = {
            'source'    : {
                'type'          : 'ideal',
                'bic'           : args.paymentData.ideal_bic.value.toString(),
                'description'   : args.order.orderNo,
                'language'      : ckoHelper.getLanguage(),
            },
            'type'      : 'ideal',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
     
        return params;
    },
    
    /*
     * Boleto authorization
     */
    boletoAuthorization: function (args) {
        // Building pay object
        var params = {
            'source'        : {
                'type'  : 'boleto',
                'birthDate' : args.paymentData.boleto_birthDate.value.toString(),
                'cpf'       : args.paymentData.boleto_cpf.value.toString(),
                'customerName' : ckoHelper.getCustomerName(args)
            },
            'type'      : 'boleto',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },

    /*
     * Bancontact authorization
     */
    bancontactAuthorization: function (args) {
        // Building pay object
        var params = {
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
        
        return params;
    },
    
    /*
     * Benefit Pay authorization
     */
    benefitpayAuthorization: function (args) {
        // Process benefit pay
        var params = {
            'source' : {
                'type'              : 'benefitpay',
                'integration_type'  : 'web'
            },
            'type'      : 'benefitpay',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },

    /*
     * Giro Pay authorization
     */
    giropayAuthorization: function (args) {
        // Building pay object
        var params = {
            'source'        : {
                'type'          : 'giropay',
                'purpose'       : businessName
            },
            'type'      : 'giropay',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },
    
    /*
     * Eps authorization
     */
    epsAuthorization: function (args) {
        // Building pay object
        var params = {
            'source'    : {
                'type'      : 'eps',
                'purpose'   : businessName
            },
            'type'      : 'eps',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },
    
    /*
     * Sofort authorization
     */
    sofortAuthorization: function (args) {
        // Building pay object
        var params = {
            'source'    : {
                'type'  : 'sofort'
            },
            'type'      : 'sofort',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },
    
    /*
     * Knet authorization
     */
    knetAuthorization: function (args) {
        // Building pay object
        var params = {
            'source'    :   {
                'type'          : 'knet',
                'language'      : ckoHelper.getLanguage().substr(0, 2),
            },
            'type'      : 'knet',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },

    /*
     * QPay authorization
     */
    qpayAuthorization: function (args) {
        // Building pay object
        var params = {
            'source'    : {
                'type'          : 'qpay',
                'description'   : businessName,
                'language'      : ckoHelper.getLanguage().substr(0, 2),
                'quantity'      : ckoHelper.getProductQuantity(args),
                'national_id'   : args.paymentData.qpay_national_id.value.toString()
            },
            'type'      : 'qpay',
            'purpose'   : businessName,
            'currency'  : args.order.getCurrencyCode()
        };
        
        return params;
    },

    /*
     * Fawry authorization
     */
    fawryAuthorization: function (args) {
        // Building pay object
        var params = {
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
        
        return params;
    },
    
    /*
     * Sepa authorization
     */
    sepaAuthorization: function (args) {    
        // Building pay object
        var params = {
            'type'          : 'sepa',
            'currency'      : args.order.getCurrencyCode(),
            'source_data'   : {
                'first_name'            : args.order.billingAddress.firstName,
                'last_name'             : args.order.billingAddress.lastName,
                'account_iban'          : args.paymentData.sepa_iban.value.toString(),
                'bic'                   : args.paymentData.sepa_bic.value.toString(),
                'billing_descriptor'    : businessName,
                'mandate_type'          : 'single'
            }
        };
        
        return params;
    },
    
    /*
     * Multibanco authorization
     */
    multibancoAuthorization: function (args) {
        // Building pay object
        var params = {
            'type'      : 'multibanco',
            'currency'  : args.order.getCurrencyCode(),
            'source'    : {
                'type'                  : 'multibanco',
                'payment_country'       : ckoHelper.getBillingCountry(args),
                'account_holder_name'   : ckoHelper.getCustomerName(args),
                'billing_descriptor'    : businessName
            }
        };
        
        return params;
    },
    
    /*
     * Poli authorization
     */
    poliAuthorization: function (args) {
        // Building pay object
        var params = {
            'type'      : 'poli',
            'currency'  : args.order.getCurrencyCode(),
            'source'    : {
                'type'      : 'poli'
            }
        };
        
        return params;
    },

    /*
     * P24 authorization
     */
    p24Authorization: function (args) {
        // Building pay object
        var params = {
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
    
        return params;
    },

    /*
     * Klarna authorization
     */
    klarnaAuthorization: function (args) {        
        // Klarna Form Inputs
        var klarna_approved = args.paymentData.klarna_approved.value.toString();
        
        if (klarna_approved) {
            // Build the payment object
            var params = {
                'type'      : 'klarna',
                'amount'    : ckoHelper.getFormattedPrice(
                    args.order.totalGrossPrice.value.toFixed(2),
                    args.order.getCurrencyCode()
                ),
                'currency'  : args.order.getCurrencyCode(),
                'capture'   : false,
                'source'    : {
                    'type'                  : 'klarna',
                    'authorization_token'   : args.paymentData.klarna_token.value.toString(),
                    'locale'                : ckoHelper.getLanguage(),
                    'purchase_country'      : ckoHelper.getBilling(args).country,
                    'tax_amount'            : ckoHelper.getFormattedPrice(
                        args.order.totalTax.value,
                        args.order.getCurrencyCode()
                    ),
                    'billing_address'       : ckoHelper.getOrderBasketAddress(args),
                    'products'              : ckoHelper.getOrderBasketObject(args)
                }
            };
             
            return params;
        } else {
            return {success: false};
        }
    },

    /*
     * Paypal authorization
     */
    paypalAuthorization: function (args) {
        // Build the payment object
        var params = {
            'type'          : 'paypal',
            'currency'      : args.order.getCurrencyCode(),
            'source'        : {
                'type'              : 'paypal',
                'invoice_number'    : args.order.orderNo
            }
        };

        return params;
    },
    
    /*
     * Oxxo authorization
     */
    oxxoAuthorization: function (args) {
        // Build the payment object
        var params = {
            'source': {
                'type': 'oxxo',
                'integration_type': 'redirect',
                'country': ckoHelper.getBilling(args).country,
                'payer': {
                    'name': ckoHelper.getCustomerName(args),
                    'email': ckoHelper.getCustomer(args).email,
                    'document': args.paymentData.oxxo_identification.value.toString()
                }
            },
            'type'          : 'oxxo',
            'currency'      : args.order.getCurrencyCode(),
        };
        
        return params;
    },

    /*
     * Alipay authorization
     */
    alipayAuthorization: function (args) {
        // Build the payment object
        var params = {
            'source': {
                'type': 'alipay',
                'country': ckoHelper.getBilling(args).country
            },
            'type'          : 'alipay',
            'currency'      : args.order.getCurrencyCode()
        };
        
        return params;
    }
}

/*
* Module exports
*/
module.exports = ckoApmConfig;