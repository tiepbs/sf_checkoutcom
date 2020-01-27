'use strict';

/* Server */
var server = require('server');
server.extend(module.superModule);

/* Script Modules */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(siteControllerName + '/cartridge/scripts/app');
var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');


/** Utility **/
var ckoHelper = require('~/cartridge/scripts/helpers/ckoHelper');
var apmHelper = require('~/cartridge/scripts/helpers/apmHelper');

// Initiate the mandate session
function mandate()
{
    // Prepare the varirables
    var url = session.privacy.redirectUrl;
    var orderId = ckoHelper.getOrderId();
    var order = OrderMgr.getOrder(orderId);
    
    // Process the URL
    if (url) {
        app.getView({
            // Prepare the view parameters
            creditAmount: order.totalGrossPrice.value.toFixed(2),
            formatedAmount: ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
            debtor: order.defaultShipment.shippingAddress.firstName + " " + order.defaultShipment.shippingAddress.lastName,
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
            ContinueURL: URLUtils.https('CKOSepa-HandleMandate')
        }).render('sepaForm');
    } else {
        // Print out a message
        response.getWriter().println('Error!');
    }
}

function handleMandate()
{
    // Set session redirect url to null
    session.privacy.redirectUrl = null;
    var orderId = ckoHelper.getOrderId();
    
    app.getForm('sepaForm').handleAction({
        cancel: function () {
            // Clear form
            app.getForm('sepaForm').clear();
            
            if (orderId) {
                // Load the order
                var order = OrderMgr.getOrder(orderId);
                ckoHelper.checkAndRestoreBasket(order);
            }
            
            app.getController('COBilling').Start();
        },
        submit: function () {
            var sepa = app.getForm('sepaForm');
            var mandate = sepa.get('mandate').value();
            
            // Mandate is true
            if (mandate) {
                // Clear form
                app.getForm('sepaForm').clear();
                
                // Get the response object from session
                var responseObjectId = session.privacy.sepaResponseId;
                if (responseObjectId) {
                    if (orderId) {
                        // Load the order
                        var order = OrderMgr.getOrder(orderId);
                        
                        // Prepare the payment object
                        var payObject = {
                            "source": {
                                "type": "id",
                                "id": responseObjectId
                            },
                            "amount": ckoHelper.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoHelper.getCurrency()),
                            "currency": ckoHelper.getCurrency(),
                            "reference": orderId
                        };
                        
                        // Reset the response in session
                        session.privacy.sepaResponseId = null;
                        
                        // Handle the SEPA request
                        apmHelper.handleSepaRequest(payObject, order);
                        
                        // Show the confirmation screen
                        app.getController('COSummary').ShowConfirmation(order);
                    } else {
                        app.getController('COBilling').Start();
                    }
                } else {
                    //app.getController('COBilling').Start();
                    // print out a message
                    response.getWriter().println('Error!');
                }
            } else {
                app.getView().render('sepaForm');
            }
        }
    });
}

/*
 * Module exports
 */
module.exports = server.exports();