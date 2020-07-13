const {assert, expect} = require('chai');
const Request = require('superagent');

describe('CKO Klarna Controller Tests', () => {
    const Url = "https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-RefArchGlobal-Site/en_GB/";
    context('Klarna Session', () => {
        const Path = "CKOKlarna-KlarnaSession";
        it('Should return a 500 response statusCode', () => {
            return Request.get(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                });
        });
    });
});