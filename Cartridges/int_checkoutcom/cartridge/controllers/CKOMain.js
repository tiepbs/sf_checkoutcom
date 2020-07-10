'use strict';

// API Includes
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');
var app = require(siteControllerName + '/cartridge/scripts/app');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');

// Checkout.com Event functions
var eventsHelper = require('~/cartridge/scripts/helpers/eventsHelper');

// Utility
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');

// Apm Filter Configuration file
var ckoApmFilterConfig = require('~/cartridge/scripts/config/ckoApmFilterConfig');

// Card Mada Bins
var ckoMadaConfig = require('~/cartridge/scripts/config/ckoMadaConfig');

/**
 * Handles responses from the Checkout.com payment gateway
 */
function handleReturn() {

    // Prepare some variables
    var gResponse = false;
    var mode = ckoHelper.getValue('ckoMode');
    var orderId = ckoHelper.getOrderId();

    // If there is a track id
    if (orderId) {

        // Load the order
        var order = OrderMgr.getOrder(orderId);
        if (order) {

            // Check the payment token if exists
            var sessionId = request.httpParameterMap.get('cko-session-id').stringValue;

            // If there is a payment session id available, verify
            if (sessionId) {

                // Perform the request to the payment gateway
                gVerify = ckoHelper.gatewayClientRequest(
                    'cko.verify.charges.' + mode + '.service',
                    {'paymentToken': sessionId}
                );

                // If there is a valid response
                if (typeof(gVerify) === 'object' && gVerify.hasOwnProperty('id')) {
                    var verify = false;

                    // Logging
                    ckoHelper.doLog('Redirect response', gVerify);
                    if (ckoHelper.paymentSuccess(gVerify)) {

                        // Show order confirmation page
                        app.getController('COSummary').ShowConfirmation(order);
                    } else {

                        // Restore the cart
                        ckoHelper.checkAndRestoreBasket(order);

                        // Send back to the error page
                        ISML.renderTemplate('custom/common/response/failed.isml');
                    }
                } else {

                    // Restore the cart
                    ckoHelper.checkAndRestoreBasket(order);

                    // Send back to the error page
                    ISML.renderTemplate('custom/common/response/failed.isml');
                }
            }

            // Else it's a normal transaction
            else {

                // Get the response
                gResponse = JSON.parse(request.httpParameterMap.getRequestBodyAsString());

                // Process the response data
                if (ckoHelper.paymentIsValid(gResponse)) {
                    app.getController('COSummary').ShowConfirmation(order);
                } else {
                    ckoHelper.handleFail(gResponse);
                }
            }
        } else {
            ckoHelper.handleFail(null);
        }
    } else {
        ckoHelper.handleFail(null);
    }
}

/**
 * Handles a failed payment from the Checkout.com payment gateway
 */
function handleFail() {

    // Load the order
    var order = OrderMgr.getOrder(session.privacy.ckoOrderId);

    // Restore the cart
    ckoHelper.checkAndRestoreBasket(order);

    // Send back to the error page
    ISML.renderTemplate('custom/common/response/failed.isml');
}

/**
 * Handles webhook responses from the Checkout.com payment gateway
 */
function handleWebhook() {
    var isValidResponse = ckoHelper.isValidResponse();
    if (isValidResponse) {

        // Get the response as JSON object
        var hook = JSON.parse(request.httpParameterMap.getRequestBodyAsString());

        // Check the webhook event
        if (hook !== null && hook.hasOwnProperty('type')) {

            // Get a camel case function name from event type
            var func = '';
            var parts = hook.type.split('_');
            for (var i = 0; i < parts.length; i++) {
                func += (i == 0) ? parts[i] : parts[i].charAt(0).toUpperCase() + parts[i].slice(1);
            }
            if (eventsHelper.hasOwnProperty(func)) {

                // Call the event
                eventsHelper[func](hook);
            }
       }
    }
}

/**
 * Initializes the credit card list by determining the saved customer payment method
 */
function getCardsList() {
    var applicablePaymentCards;
    var data = [];

    // If user logged in
    if (customer.authenticated) {
        var profile = customer.getProfile();
        if (profile) {
            applicablePaymentCards = customer.profile.getWallet().getPaymentInstruments();
            for (let i = 0; i < applicablePaymentCards.length; i++) {
                data.push({
                    cardId: applicablePaymentCards[i].getUUID(),
                    cardNumber: applicablePaymentCards[i].getCreditCardNumber(),
                    cardHolder: applicablePaymentCards[i].creditCardHolder,
                    cardType: applicablePaymentCards[i].getCreditCardType(),
                    expiryMonth: applicablePaymentCards[i].creditCardExpirationMonth,
                    expiryYear: applicablePaymentCards[i].creditCardExpirationYear,
                });
            }
        }

        // Send the output for rendering
        ISML.renderTemplate('custom/ajax/output.isml', {data: JSON.stringify(data)});
    } else {
        app.getModel('Customer').logout();
        app.getView().render('csrf/csrffailed');
    }
}

/**
 * Apms filter helper
 */
function getApmFilter() {

    // Prepare some variables
    var basket = BasketMgr.getCurrentBasket();
    var currencyCode = basket.getCurrencyCode();
    var countryCode = basket.defaultShipment.shippingAddress.countryCode.valueOf();

    // Prepare the filter object
    var filterObject = {
        country     : countryCode,
        currency    : currencyCode
    }

    // Prepare the response object
    var responseObject = {
        'filterObject'          : filterObject,
        'ckoApmFilterConfig'    : ckoApmFilterConfig
    }

    // Write the response
    return ckoHelper.ckoResponse(responseObject);
}

/**
 * Mada Bins helper
 */
function getMadaBin() {
	var madaBins = ckoMadaConfig;

    // Write the response
    return ckoHelper.ckoResponse(madaBins);
}

// Module exports
exports.HandleReturn = guard.ensure(['get','https'], handleReturn);
exports.HandleFail = guard.ensure(['get','https'], handleFail);
exports.HandleWebhook = guard.ensure(['post', 'https'], handleWebhook);
exports.GetCardsList = guard.ensure(['post','https'], getCardsList);
exports.GetApmFilter = guard.ensure(['get','https'], getApmFilter);
exports.GetMadaBin = guard.ensure(['get', 'https'], getMadaBin);
