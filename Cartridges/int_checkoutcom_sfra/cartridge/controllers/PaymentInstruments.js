'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/* Utility */
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

server.replace('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');
    var paymentInstruments = cardHelper.getSavedCards(req.currentCustomer.profile.customerNo);

    res.render('account/payment/payment', {
        paymentInstruments: paymentInstruments,
        actionUrl: URLUtils.url('PaymentInstruments-DeletePayment').toString(),
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ]
    });
    next();
});

module.exports = server.exports();
