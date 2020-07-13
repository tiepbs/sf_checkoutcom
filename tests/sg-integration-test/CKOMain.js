const request = require('request-promise');
const { assert, expect } = require('chai');

describe('CKO Main Controller Test', function() {
    this.timeout(25000);
    beforeEach(function() {
        // ...some logic before each test is run
    });

    var options = {
        method: '',
        uri: '',
        json: true,
        headers: {
            'User-Agent': 'Request-Promise'
        }
    };
    context('CKO Main HandleRequest', function() {
        it('CKOMain-HandleReturn should return a string that includes: Order Not Found', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOMain-HandleReturn';
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Order Not Found');
                });
        });
    });
    context('CKO Main HandleFail', function() {
        it('CKOMain-HandleFail should return a string that includes: Order Failed', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOMain-HandleFail';
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Order Failed');
                });
        });
    });
    context('CKO Main HandleWebhook', function() {
        it('CKOMain-HandleWebhook should return a string that includes: Invalid Response', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOMain-HandleWebhook';
            options.method = 'POST';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Invalid Response');
                });
        });
    });
    context('CKO Main GetCardsList', function() {
        it('CKOMain-GetCardsList should return a string that includes: Failed Authentication', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOMain-GetCardsList';
            options.method = 'POST';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Failed Authentication');
                });
        });
    });
    context('CKO Main GetApmFilter', function() {
        it('CKOMain-GetApmFilter should return a string that includes: Shipping Address Not Found', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOMain-GetApmFilter';
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Basket Not Found');
                });
        });
    });
    context('CKO Main GetMadaBin', function() {
        it('CKOMain-GetMadaBin should return an object', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOMain-GetMadaBin';
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.an('object');
                });
        });
    });
});
