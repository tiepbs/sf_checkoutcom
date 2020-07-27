'use strict';

/* Server */
var server = require('server');

/* Script Modules */
var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');
var paymentHelper = require('~/cartridge/scripts/helpers/paymentHelper');

/**
 * Initiate the SEPA mandate session.
 * @returns {string} The controller response
 */
server.get('Mandate', server.middleware.https, function(req, res, next) {
    // Prepare the variables
    var sepaResponseId = req.querystring.sepaResponseId;
    var orderId = req.querystring.orderNumber;
    var order = OrderMgr.getOrder(orderId);

    // Process the URL
    if (order) {
        res.render('sepaForm', {
            // Prepare the view parameters
            creditAmount: order.totalGrossPrice.value.toFixed(2),
            formatedAmount: ckoHelper.getFormattedPrice(
                order.totalGrossPrice.value.toFixed(2),
                order.getCurrencyCode()
            ),
            debtor: order.defaultShipment.shippingAddress.firstName + ' ' + order.defaultShipment.shippingAddress.lastName,
            debtorAddress1: order.billingAddress.address1,
            debtorAddress2: order.billingAddress.address2,
            debtorCity: order.billingAddress.city,
            debtorPostCode: order.billingAddress.postalCode,
            debtorStateCode: order.billingAddress.stateCode,
            debtorCountryCode: order.billingAddress.countryCode,

            // Prepare the creditor information
            creditor: ckoHelper.getValue('ckoBusinessName'),
            creditorAddress1: ckoHelper.getValue('ckoBusinessAddressLine1'),
            creditorAddress2: ckoHelper.getValue('ckoBusinessAddressLine2'),
            creditorCity: ckoHelper.getValue('ckoBusinessCity'),
            creditorCountry: ckoHelper.getValue('ckoBusinessCountry'),
            orderNumber: orderId,
            sepaResponseId: sepaResponseId,
            ContinueURL: URLUtils.https('CKOSepa-HandleMandate'),
        });
    } else {
        return next(
            new Error(
                Resource.msg(
                    'cko.payment.invalid',
                    'cko',
                    null
                )
            )
        );
    }

    return next();
});

/**
 * Handle the SEPA mandates.
 * @returns {string} The controller response
 */
server.post('HandleMandate', server.middleware.https, function(req, res, next) {
    // Get the form
    var sepaForm = req.form;

    // Get the order id from mandate form
    var orderId = sepaForm.orderNumber;
    var sepaResponseId = sepaForm.sepaResponseId;

    // Validation
    if (sepaForm) {
        var mandate = sepaForm.mandate;
        this.on('route:BeforeComplete', function() {
            // Mandate is true
            if (mandate) {
                var mandateForm = server.forms.getForm('sepaForm'); // gets the mandate form object
                mandateForm.clear();

                // Get the response object from session
                var responseObjectId = sepaResponseId;
                if (responseObjectId) {
                    if (orderId) {
                        // Load the order
                        var order = OrderMgr.getOrder(orderId);

                        // Prepare the payment object
                        var payObject = {
                            source: {
                                type: 'id',
                                id: responseObjectId,
                            },
                            amount: ckoHelper.getFormattedPrice(
                                order.totalGrossPrice.value.toFixed(2),
                                order.getCurrencyCode()
                            ),
                            currency: order.getCurrencyCode(),
                            reference: orderId,
                        };

                        // Handle the SEPA request
                        apmHelper.handleSepaRequest(payObject, order);

                        // Show the confirmation screen
                        paymentHelper.getConfirmationPageRedirect(res, order);
                    } else {
                        paymentHelper.getFailurePageRedirect(res);
                    }
                } else {
                    return next(
                        new Error(
                            Resource.msg(
                                'cko.payment.invalid',
                                'cko',
                                null
                            )
                        )
                    );
                }
            } else {
                return next(
                    new Error(
                        Resource.msg(
                            'cko.payment.invalid',
                            'cko',
                            null
                        )
                    )
                );
            }

            return next();
        });
    } else {
        return next(
            new Error(
                Resource.msg(
                    'cko.payment.invalid',
                    'cko',
                    null
                )
            )
        );
    }

    return next();
});

/*
 * Module exports
 */
module.exports = server.exports();
