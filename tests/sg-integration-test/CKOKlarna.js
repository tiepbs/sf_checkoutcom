const request = require('request-promise');
const { assert, expect } = require('chai');

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
        it('CKOKlarna-KlarnaSession should return a string that includes: Basket Not Found', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOKlarna-KlarnaSession';
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Basket Not Found');
                });
        });


    });
});
