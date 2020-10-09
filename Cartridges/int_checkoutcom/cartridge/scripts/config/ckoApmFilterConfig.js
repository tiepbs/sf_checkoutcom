'use strict';
var customPrefs = dw.system.Site.getCurrent().getPreferences().getCustom();
var ckoApmFilterConfig = {
    ideal: {
        countries: ['NL'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoIdealEnabled']
    },
    boleto: {
        countries: ['BR'],
        currencies: ['BRL', 'USD'],
        enabled: customPrefs['ckoBoletoEnabled']
    },
    bancontact: {
        countries: ['BE'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoBancontactEnabled']
    },
    benefit: {
        countries: ['BH'],
        currencies: ['BHD'],
        enabled: customPrefs['ckoBenefitEnabled']
    },
    giro: {
        countries: ['DE'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoGiroEnabled']
    },
    eps: {
        countries: ['AT'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoEpsEnabled']
    },
    sofort: {
        countries: ['AT', 'BE', 'DE', 'ES', 'IT', 'NL'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoSofortEnabled']
    },
    knet: {
        countries: ['KW'],
        currencies: ['KWD'],
        enabled: customPrefs['ckoKnetEnabled']
    },
    qpay: {
        countries: ['QA'],
        currencies: ['QAR'],
        enabled: customPrefs['ckoQpayEnabled']
    },
    fawry: {
        countries: ['EG'],
        currencies: ['EGP'],
        enabled: customPrefs['ckoFawryEnabled']
    },
    multibanco: {
        countries: ['PT'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoMultibancoEnabled']
    },
    poli: {
        countries: ['AU', 'NZ'],
        currencies: ['AUD', 'NZD'],
        enabled: customPrefs['ckoPoliEnabled']
    },
    sepa: {
        countries: ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'AD', 'BG', 'CH', 'CZ', 'DK', 'GB', 'HR', 'HU', 'IS', 'LI', 'MC', 'NO', 'PL', 'RO', 'SM', 'SE', 'VA'],
        currencies: ['EUR'],
        enabled: customPrefs['ckoSepaEnabled']
    },
    p24: {
        countries: ['PL'],
        currencies: ['EUR', 'PLN'],
        enabled: customPrefs['ckoP24Enabled']
    },
    klarna: {
        countries: ['AT', 'DK', 'FI', 'DE', 'NL', 'NO', 'SE', 'UK', 'GB'],
        currencies: ['EUR', 'DKK', 'GBP', 'NOK', 'SEK'],
        enabled: customPrefs['ckoKlarnaEnabled']
    },
    oxxo: {
        countries: ['MX'],
        currencies: ['MXN'],
        enabled: customPrefs['ckoOxxoEnabled']
    },
    alipay: {
        countries: ['CN'],
        currencies: ['USD', 'CNY'],
        enabled: customPrefs['ckoAlipayEnabled']
    },
    paypal: {
        countries: ['*'],
        currencies: ['AUD', 'BRL', 'CAD', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'INR', 'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'RUB', 'SGD', 'SEK', 'CHF', 'THB', 'USD'],
        enabled: customPrefs['ckoPaypalEnabled']
    },
};


// Module exports
module.exports = ckoApmFilterConfig;
