'use strict';

var currentSite = require('dw/system/Site').getCurrent();

/*
 * APM filters config.
 */
var ckoApmFilterConfig = {
    ideal: {
        countries: ['NL'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoIdealEnabled'),
    },
    boleto: {
        countries: ['BR'],
        currencies: ['BRL', 'USD'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoBoletoEnabled'),
    },
    bancontact: {
        countries: ['BE'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoBancontactEnabled'),
    },
    benefitpay: {
        countries: ['BH'],
        currencies: ['BHD'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoBenefitEnabled'),
    },
    giropay: {
        countries: ['DE'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoGiroEnabled'),
    },
    eps: {
        countries: ['AT'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoEpsEnabled'),
    },
    sofort: {
        countries: ['AT', 'BE', 'DE', 'ES', 'IT', 'NL'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoSofortEnabled'),
    },
    knet: {
        countries: ['KW'],
        currencies: ['KWD'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoKnetEnabled'),
    },
    qpay: {
        countries: ['QA'],
        currencies: ['QAR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoQpayEnabled'),
    },
    fawry: {
        countries: ['EG'],
        currencies: ['EGP'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoFawryEnabled'),
    },
    multibanco: {
        countries: ['PT'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoMultibancoEnabled'),
    },
    poli: {
        countries: ['AU', 'NZ'],
        currencies: ['AUD', 'NZD'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoPoliEnabled'),
    },
    sepa: {
        countries: ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'AD', 'BG', 'CH', 'CZ', 'DK', 'GB', 'HR', 'HU', 'IS', 'LI', 'MC', 'NO', 'PL', 'RO', 'SM', 'SE', 'VA'],
        currencies: ['EUR'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoSepaEnabled'),
    },
    p24: {
        countries: ['PL'],
        currencies: ['EUR', 'PLN'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoP24Enabled'),
    },
    klarna: {
        countries: ['AT', 'DK', 'FI', 'DE', 'NL', 'NO', 'SE', 'UK', 'GB'],
        currencies: ['EUR', 'DKK', 'GBP', 'NOK', 'SEK'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoKlarnaEnabled'),
    },
    alipay: {
        countries: ['CN', 'US'],
        currencies: ['USD', 'CNY'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoAlipayEnabled'),
    },
    paypal: {
        countries: ['*'],
        currencies: ['AUD', 'BRL', 'CAD', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'INR', 'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'RUB', 'SGD', 'SEK', 'CHF', 'THB', 'USD'],
        enabled: currentSite.getCurrent().getCustomPreferenceValue('ckoPaypalEnabled'),
    },
};

/*
* Module exports
*/

module.exports = ckoApmFilterConfig;
