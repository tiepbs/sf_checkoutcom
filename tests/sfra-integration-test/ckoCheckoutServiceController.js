const {assert, expect} = require('chai');
const Request = require('superagent');

describe('CKO Checkout Services Controller Tests', () => {
    const Url = "https://checkout01-tech-prtnr-eu02-dw.demandware.net/on/demandware.store/Sites-RefArchGlobal-Site/en_GB/";
    context('Checkout Services Get', () => {
        const Path = "CheckoutService-Get";
        it('Should return a 500 response statusCode', () => {
            return Request.get(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                });
        });
    });
    context('Checkout Services SubmitPayment', () => {
        const Path = "CheckoutService-SubmitPayment";
        it('Should return a 500 response statusCode', () => {
            return Request.get(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                });
        });
    });
    context('Checkout Services PlaceOrder', () => {
        const Path = "CheckoutService-PlaceOrder";
        it('Should return a 500 response statusCode', () => {
            return Request.get(Url + Path)
                .set('content-type', 'applicaiton/json')
                .end((data) => {
                    assert.equal(data.response.statusCode, 500, 'Should return a 500 response statusCode');
                });
        });
    });
});