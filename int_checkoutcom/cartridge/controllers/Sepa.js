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


var Store = require('dw/catalog/Store');

function mandate() {
	var url = session.privacy.redirectUrl;
	
	if(url){
		app.getView({
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
        		
            	if(orderId){
            		// load the order
            		var order = OrderMgr.getOrder(orderId);
            		
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