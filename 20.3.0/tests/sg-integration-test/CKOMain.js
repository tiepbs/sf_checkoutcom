const request = require('request-promise');
const { assert, expect } = require('chai');
const config = require('../config');
const Url = config.sgUrl;

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
    context('CKO Main HandleWebhook', function() {
        const path = "CKOMain-HandleWebhook";
        it('CKOMain-HandleWebhook should return a null', function() {
            options.uri = Url + path;
            options.method = 'POST';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('null');
                });
        });
    });
    context('CKO Main GetApmFilter', function() {
        const path = "CKOMain-GetApmFilter";
        it('CKOMain-GetApmFilter should return a null', function() {
            options.uri = Url + path;
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('null');
                });
        });
    });
    context('CKO Main GetMadaBin', function() {
        const path = "CKOMain-GetMadaBin";
        it('CKOMain-GetMadaBin should return an object', function() {
            options.uri = Url + path;
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.an('object');
                });
        });
    });
});
