'use strict';

/* Business Name */
var businessName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoBusinessName');

/* Utility */
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

var ckoApmConfig = {
  /*
     * Ideal authorization
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

  /*
     * Boleto authorization
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

  /*
     * Bancontact authorization
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

  /*
     * Benefit Pay authorization
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

  /*
     * Giro Pay authorization
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

  /*
     * Eps authorization
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

  /*
     * Sofort authorization
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

  /*
     * Knet authorization
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

  /*
     * QPay authorization
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

  /*
     * Fawry authorization
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

  /*
     * Sepa authorization
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

  /*
     * Multibanco authorization
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

  /*
     * Poli authorization
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

  /*
     * P24 authorization
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

  /*
     * Klarna authorization
     */
  klarnaAuthorization: function(args) {
    // Klarna Form Inputs
    var klarna_approved = args.paymentData.klarna_approved.value.toString();

    // Process the payment
    if (klarna_approved) {
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
    } else {
      return {success: false};
    }
  },

  /*
     * Paypal authorization
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

  /*
     * Alipay authorization
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

/*
* Module exports
*/
module.exports = ckoApmConfig;
