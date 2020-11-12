'use strict';

/* Business Name */
var Site = require('dw/system/Site');
var businessName = Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

/**
 * Module ckoApmConfig.
 */
var ckoApmConfig = {
    /**
     * Ideal authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    idealAuthorization: function(args) {
        var params = {
            source: {
                type: 'ideal',
                bic: args.paymentData.ideal_bic.value.toString(),
                description: args.order.orderNo,
                language: ckoHelper.getLanguage(),
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * Boleto authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    boletoAuthorization: function(args) {
        var params = {
            source: {
                type: 'boleto',
                integration_type: 'redirect',
                country: ckoHelper.getBillingCountry(args),
                payer: {
                    name: ckoHelper.getCustomerName(args),
                    email: ckoHelper.getCustomer(args).email,
                    document: args.paymentData.boleto_cpf.value.toString(),
                },
            },
            purpose: businessName,
            currency: ckoHelper.getCurrency(args),
        };

        return params;
    },

    /**
     * Bancontact authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    bancontactAuthorization: function(args) {
        var params = {
            source: {
                type: 'bancontact',
                payment_country: ckoHelper.getBillingCountry(args),
                account_holder_name: ckoHelper.getCustomerName(args),
                billing_descriptor: businessName,
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * Benefit Pay authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    benefitpayAuthorization: function(args) {
        var params = {
            source: {
                type: 'benefitpay',
                integration_type: 'web',
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * Giro Pay authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    giropayAuthorization: function(args) {
        var params = {
            source: {
                type: 'giropay',
                purpose: businessName,
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * EPS authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    epsAuthorization: function(args) {
        var params = {
            source: {
                type: 'eps',
                purpose: businessName,
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * Sofort authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    sofortAuthorization: function(args) {
        var params = {
            source: {
                type: 'sofort',
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * Knet authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    knetAuthorization: function(args) {
        var params = {
            source: {
                type: 'knet',
                language: ckoHelper.getLanguage().substr(0, 2),
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * QPay authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    qpayAuthorization: function(args) {
        var params = {
            source: {
                type: 'qpay',
                description: businessName,
                language: ckoHelper.getLanguage().substr(0, 2),
                quantity: ckoHelper.getProductQuantity(args),
                national_id: args.paymentData.qpay_national_id.value.toString(),
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * Fawry authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    fawryAuthorization: function(args) {
        var params = {
            source: {
                type: 'fawry',
                description: businessName,
                customer_mobile: ckoHelper.getPhone(args).number,
                customer_email: ckoHelper.getCustomer(args).email,
                products: ckoHelper.getProductInformation(args),
            },
            purpose: businessName,
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },

    /**
     * SEPA authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    sepaAuthorization: function(args) {
        var params = {
            type: 'sepa',
            currency: args.order.getCurrencyCode(),
            billingAddress: ckoHelper.getBilling(args),
            source_data: {
                first_name: args.order.billingAddress.firstName,
                last_name: args.order.billingAddress.lastName,
                account_iban: args.paymentData.sepa_iban.value.toString(),
                billing_descriptor: businessName,
                mandate_type: 'single',
            },
        };

        return params;
    },

    /**
     * Multibanco authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    multibancoAuthorization: function(args) {
        var params = {
            currency: args.order.getCurrencyCode(),
            source: {
                type: 'multibanco',
                payment_country: ckoHelper.getBillingCountry(args),
                account_holder_name: ckoHelper.getCustomerName(args),
                billing_descriptor: businessName,
            },
        };

        return params;
    },

    /**
     * Poli authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    poliAuthorization: function(args) {
        var params = {
            currency: args.order.getCurrencyCode(),
            source: {
                type: 'poli',
            },
        };

        return params;
    },

    /**
     * P24 authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    p24Authorization: function(args) {
        var params = {
            currency: args.order.getCurrencyCode(),
            source: {
                type: 'p24',
                payment_country: ckoHelper.getBillingCountry(args),
                account_holder_name: ckoHelper.getCustomerName(args),
                account_holder_email: ckoHelper.getCustomer(args).email,
                billing_descriptor: businessName,
            },
        };

        return params;
    },

    /**
     * Klarna authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    klarnaAuthorization: function(args) {
        // Klarna Form Inputs
        var klarnaApproved = args.paymentData.klarna_approved.value.toString();

        // Process the payment
        if (klarnaApproved) {
            // Build the payment object
            var params = {
                amount: ckoHelper.getFormattedPrice(
                    args.order.totalGrossPrice.value.toFixed(2),
                    args.order.getCurrencyCode()
                ),
                currency: args.order.getCurrencyCode(),
                capture: false,
                source: {
                    type: 'klarna',
                    authorization_token: args.paymentData.klarna_token.value.toString(),
                    locale: ckoHelper.getLanguage(),
                    purchase_country: ckoHelper.getBilling(args).country,
                    tax_amount: ckoHelper.getFormattedPrice(
                        args.order.totalTax.value,
                        args.order.getCurrencyCode()
                    ),
                    billing_address: ckoHelper.getOrderAddress(args),
                    products: ckoHelper.getOrderBasketObject(args),
                },
            };

            return params;
        }

        return { success: false };
    },

    /**
     * Paypal authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    paypalAuthorization: function(args) {
        var params = {
            currency: args.order.getCurrencyCode(),
            source: {
                type: 'paypal',
                invoice_number: args.order.orderNo,
            },
        };

        return params;
    },

    /**
     * Alipay authorization.
     * @param {Object} args The payment method parameters
     * @returns {Object} The payment method config
     */
    alipayAuthorization: function(args) {
        var params = {
            source: {
                type: 'alipay',
            },
            currency: args.order.getCurrencyCode(),
        };

        return params;
    },
};

/**
 * Module exports
 */
module.exports = ckoApmConfig;
