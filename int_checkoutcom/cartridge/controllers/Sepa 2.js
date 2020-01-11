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

function mandate() {
	var url = session.privacy.redirectUrl;
	var orderId = ckoUtility.getOrderId();
	var order = OrderMgr.getOrder(orderId);
	
	if(url){
		app.getView({
			creditAmount: order.totalGrossPrice.value.toFixed(2),
			formatedAmount: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), 'EUR'),
			debtor:	order.defaultShipment.shippingAddress.firstName + " " + order.defaultShipment.shippingAddress.lastName,
			debtorAddress1: order.billingAddress.address1,
			debtorAddress2: order.billingAddress.address2,
			debtorCity:	order.billingAddress.city,
			debtorPostCode: order.billingAddress.postalCode,
			debtorStateCode: order.billingAddress.stateCode,
			debtorCountryCode: order.billingAddress.countryCode,
			
			creditor: ckoUtility.getValue('ckoBusinessName'),
			creditorAddress1: ckoUtility.getValue('ckoBusinessAddressLine1'),
			creditorAddress2: ckoUtility.getValue('ckoBusinessAddressLine2'),
			creditorCity: ckoUtility.getValue('ckoBusinessCity'),
			creditorCountry: ckoUtility.getValue('ckoBusinessCountry'),
		    ContinueURL: URLUtils.https('Sepa-HandleMandate')
		    }).render('sepaform');
	}else{
		// print out a message
		response.getWriter().println('Error!');
	}
}

function handleMandate() {
	
	// set session redirect url to null
	session.privacy.redirectUrl = null;
	var orderId = ckoUtility.getOrderId();
	
    app.getForm('sepaForm').handleAction({
        cancel: function () {
        	// clear form
            app.getForm('sepaForm').clear();
            
            if(orderId){
        		// load the order
        		var order = OrderMgr.getOrder(orderId);
                ckoUtility.checkAndRestoreBasket(order);
            }
            
            app.getController('COBilling').Start();
        },
        submit: function () {  
        	var sepa = app.getForm('sepaForm');
        	var mandate = sepa.get('mandate').value();
        	
        	// mandate is true
        	if(mandate){
        		// clear form
                app.getForm('sepaForm').clear();
                
                // get the response object from session
                var responseObject = session.privacy.sepaResponse;
        		
            	if(orderId){
            		
            		// load the order
            		var order = OrderMgr.getOrder(orderId);
            		
            		var payObject = {
	        			    "source": {
	        			        "type": "id",
	        			        "id": responseObject.id
	        			    },
	        			    "amount": ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), 'EUR'),
	        			    "currency": "EUR",
	        			    "reference": orderId
	            		};
            		
            		session.privacy.sepaResponse = null;
            		
            		apmUtility.handleSepaRequest(payObject, order);
            		
                	var confirmation = app.getController('COSummary');
                	
            		confirmation.ShowConfirmation(order);
            	}else{
                    
                    app.getController('COBilling').Start();
            	}
            	
            	
        	}else{
        		
        		app.getView().render('sepaform');
        	}
        }
    });
}


/** Shows the template page. */
exports.Mandate = guard.ensure(['get'], mandate);
exports.HandleMandate = guard.ensure(['post'], handleMandate);