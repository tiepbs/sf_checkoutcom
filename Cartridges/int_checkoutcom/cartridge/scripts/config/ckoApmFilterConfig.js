'use strict';

var ckoApmFilterConfig = {
    ideal: {
        countries: ['NL'],
        currencies: ['EUR'],
    },
    boleto: {
        countries: ['BR'],
        currencies: ['BRL', 'USD'],
    },
    bancontact: {
        countries: ['BE'],
        currencies: ['EUR'],
    },
    benefit: {
        countries: ['BH'],
        currencies: ['BHD'],
    },
    giro: {
        countries: ['DE'],
        currencies: ['EUR'],
    },
    eps: {
        countries: ['AT'],
        currencies: ['EUR'],
    },
    sofort: {
        countries: ['AT', 'BE', 'DE', 'ES', 'IT', 'NL'],
        currencies: ['EUR'],
    },
    knet: {
        countries: ['KW'],
        currencies: ['KWD'],
    },
    qpay: {
        countries: ['QA'],
        currencies: ['QAR'],
    },
    fawry: {
        countries: ['EG'],
        currencies: ['EGP'],
    },
    multibanco: {
        countries: ['PT'],
        currencies: ['EUR'],
    },
    poli: {
        countries: ['AU', 'NZ'],
        currencies: ['AUD', 'NZD'],
    },
    sepa: {
        countries: ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK', 'AD', 'BG', 'CH', 'CZ', 'DK', 'GB', 'HR', 'HU', 'IS', 'LI', 'MC', 'NO', 'PL', 'RO', 'SM', 'SE', 'VA'],
        currencies: ['EUR'],
    },
    p24: {
        countries: ['PL'],
        currencies: ['EUR', 'PLN'],
    },
    klarna: {
        countries: ['AT', 'DK', 'FI', 'DE', 'NL', 'NO', 'SE', 'UK', 'GB'],
        currencies: ['EUR', 'DKK', 'GBP', 'NOK', 'SEK'],
    },
    oxxo: {
        countries: ['MX'],
        currencies: ['MXN'],
    },
    alipay: {
        countries: ['CN'],
        currencies: ['USD', 'CNY'],
    },
    paypal: {
        countries: ['*'],
        currencies: ['AUD', 'BRL', 'CAD', 'CZK', 'DKK', 'EUR', 'HKD', 'HUF', 'INR', 'ILS', 'JPY', 'MYR', 'MXN', 'TWD', 'NZD', 'NOK', 'PHP', 'PLN', 'GBP', 'RUB', 'SGD', 'SEK', 'CHF', 'THB', 'USD'],
    },
};


// Module exports
module.exports = ckoApmFilterConfig;
