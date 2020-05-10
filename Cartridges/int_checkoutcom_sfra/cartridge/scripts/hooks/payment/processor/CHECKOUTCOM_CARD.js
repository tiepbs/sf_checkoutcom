'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var cardHelper = require('~/cartridge/scripts/helpers/cardHelper');

/**
 * Verifies that the payment data is valid.
 */
function Handle(basket, billingData, processorId, req) {
    var currentBasket = basket;
    var fieldErrors = {};
    var serverErrors = [];
    var success = true; 

    // Pre authorize the card
    if (!billingData.selectedCardUuid) {
        success = cardHelper.preAuthorizeCard(
            billingData.paymentInformation,
            currentBasket,
            req.currentCustomer.profile.customerNo,
            processorId
        );
    }

    if (!success) {
        serverErrors.push(
            Resource.msg('error.card.information.error', 'creditCard', null)
        );
    }

    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !success
    };
}

/**
 * Authorizes a payment using card details
 */
function Authorize(orderNumber, billingForm, processorId) {
    var serverErrors = [];
    var fieldErrors = {};
    var success = false;

    var logger = require('dw/system/Logger').getLogger('ckodebug');
	logger.debug('Authorize success before {0}', JSON.stringify('Authorize success before'));

    // Payment request
    success = cardHelper.handleRequest(
        orderNumber,
        billingForm,
        processorId
    );

    var logger = require('dw/system/Logger').getLogger('ckodebug');
	logger.debug('Authorize success after {0}', JSON.stringify(success));

    // Handle errors
    if (!success) {
        serverErrors.push(
            ckoHelper.getPaymentFailureMessage()
        );
    }
   
    return {
        fieldErrors: fieldErrors,
        serverErrors: serverErrors,
        error: !success
    };
}

exports.Handle = Handle;
exports.Authorize = Authorize;