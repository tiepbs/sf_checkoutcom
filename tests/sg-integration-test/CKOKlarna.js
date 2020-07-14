const request = require('request-promise');
const { assert, expect } = require('chai');
const config = require('../config');
const Url = config.sgUrl;

describe('CKO Klarna Controller Test', function() {
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
    context('CKO Klarna Session', function() {
        const path = "CKOKlarna-KlarnaSession";
        it('CKOKlarna-KlarnaSession should return a string that includes: Basket Not Found', function() {
            options.uri = Url + path;
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Basket Not Found');
                });
        });


    });
});
