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

/*
* Utility functions
*/
var util = require('~/cartridge/scripts/utility/util');

function mandate() {
	var url = session.privacy.redirectUrl;
	var orderId = util.getOrderId();
	var order = OrderMgr.getOrder(orderId);
	
	if(url){
		app.getView({
			creditAmount: order.totalGrossPrice.value.toFixed(2),
			formatedAmount: util.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order),
			debtor:	order.defaultShipment.shippingAddress.firstName + " " + order.defaultShipment.shippingAddress.lastName,
			debtorAddress1: order.billingAddress.address1,
			debtorAddress2: order.billingAddress.address2,
			debtorCity:	order.billingAddress.city,
			debtorPostCode: order.billingAddress.postalCode,
			debtorStateCode: order.billingAddress.stateCode,
			debtorCountryCode: order.billingAddress.countryCode,
			creditor: util.getValue('ckoBusinessName'),
			creditorAddress1: util.getValue('ckoBusinessAddressLine1'),
			creditorAddress2: util.getValue('ckoBusinessAddressLine2'),
			creditorCity: util.getValue('ckoBusinessCity'),
			creditorCountry: util.getValue('ckoBusinessCountry'),
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
	
	var gatewayResponse = false;
	var orderId = util.getOrderId();
	
    app.getForm('sepaForm').handleAction({
        cancel: function () {
        	// clear form
            app.getForm('sepaForm').clear();
            
            if(orderId){
        		// load the order
        		var order = OrderMgr.getOrder(orderId);
                var basket = util.checkAndRestoreBasket(order);
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
	        			    "amount": util.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order),
	        			    "currency": "EUR",
	        			    "reference": orderId
	            		};
            		
            		session.privacy.sepaResponse = null;
            		
            		var request = util.handleSepaRequest(payObject, order);
            		
                	var confirmation = app.getController('COSummary');
                	
            		
            		//app.getView().render('helloformresult');
            		confirmation.ShowConfirmation(order);
            	}else{
            		// print out a message
            		//response.getWriter().println('Order Not Found!');
                    
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