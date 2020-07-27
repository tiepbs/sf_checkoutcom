const request = require('request-promise');
const { assert, expect } = require('chai');
const config = require('../config');
const Url = config.sgUrl;

describe('CKO Sepa Controller Test', function() {
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
    context('CKO Sepa Mandate', function() {
        const path = "CKOSepa-Mandate";
        it('CKOSepa-Mandate should return a string that includes: Error', function() {
            options.uri = Url + path;
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Error');
                });
        });
    });

    context('CKO Sepa HandleMandate', function() {
        const path = "CKOSepa-HandleMandate";
        it('CKOSepa-HandleMandate should return: undefined', function() {
            options.uri = Url + path;
            options.method = 'POST';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.an('undefined');
                });
        });
    });
});
