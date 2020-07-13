const request = require('request-promise');
const { assert, expect } = require('chai');

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
        it('CKOSepa-Mandate should return a string that includes: Error', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOSepa-Mandate';
            options.method = 'GET';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.a('string').that.include('Error');
                });
        });
    });

    context('CKO Sepa HandleMandate', function() {
        it('CKOSepa-HandleMandate should return: undefined', function() {
            options.uri = 'https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-SiteGenesisGlobal-Site/en_GB/CKOSepa-HandleMandate';
            options.method = 'POST';
            return request(options)
                .then(function (response) {
                    expect(response).to.be.an('undefined');
                });
        });
    });
});
