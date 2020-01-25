'use strict';

/**
 * Controller example for a product review form.
 */

/* Script Modules */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(siteControllerName + '/cartridge/scripts/app');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');


/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');
var apmUtility = require('~/cartridge/scripts/helpers/apmUtility');

// Initiate the mandate session
function mandate() {
	// Prepare the varirables
	var url = session.privacy.redirectUrl;
	var orderId = ckoUtility.getOrderId();
	var order = OrderMgr.getOrder(orderId);
	
	// Process the URL
	if (url) {
		app.getView({
			// Prepare the view parameters
			creditAmount: order.totalGrossPrice.value.toFixed(2),
			formatedAmount: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency()),
			debtor:	order.defaultShipment.shippingAddress.firstName + " " + order.defaultShipment.shippingAddress.lastName,
			debtorAddress1: order.billingAddress.address1,
			debtorAddress2: order.billingAddress.address2,
			debtorCity:	order.billingAddress.city,
			debtorPostCode: order.billingAddress.postalCode,
			debtorStateCode: order.billingAddress.stateCode,
			debtorCountryCode: order.billingAddress.countryCode,
			
			// Prepare the creditor information
			creditor: ckoUtility.getValue('ckoBusinessName'),
			creditorAddress1: ckoUtility.getValue('ckoBusinessAddressLine1'),
			creditorAddress2: ckoUtility.getValue('ckoBusinessAddressLine2'),
			creditorCity: ckoUtility.getValue('ckoBusinessCity'),
			creditorCountry: ckoUtility.getValue('ckoBusinessCountry'),
		    ContinueURL: URLUtils.https('Sepa-HandleMandate')
		}).render('sepaForm');
	}
	else {
		// Print out a message
		response.getWriter().println('Error!');
	}
}

function handleMandate() {
	// Set session redirect url to null
	session.privacy.redirectUrl = null;
	var orderId = ckoUtility.getOrderId();
	
    app.getForm('sepaForm').handleAction({
        cancel: function () {
        	// Clear form
            app.getForm('sepaForm').clear();
            
            if (orderId) {
        		// Load the order
        		var order = OrderMgr.getOrder(orderId);
                ckoUtility.checkAndRestoreBasket(order);
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
    	        			    "amount": ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency()),
    	        			    "currency": ckoUtility.getCurrency(),
    	        			    "reference": orderId
    	            		};
						
						// Reset the response in session
                		session.privacy.sepaResponseId = null;
						
						// Handle the SEPA request
                		apmUtility.handleSepaRequest(payObject, order);
						
						// Show the confirmation screen
                		app.getController('COSummary').ShowConfirmation(order);
					} 
					else {
                        app.getController('COBilling').Start();
                	}
				}
				else {
                	//app.getController('COBilling').Start();
                	// print out a message
            		response.getWriter().println('Error!');
                }
			}
			else {	
        		app.getView().render('sepaForm');
        	}
        }
    });
}

/*
 * Module exports
 */
exports.Mandate = guard.ensure(['get'], mandate);
exports.HandleMandate = guard.ensure(['post'], handleMandate);