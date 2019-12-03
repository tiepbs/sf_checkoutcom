'use strict';

/**
 * Controller example for a product review form.
 */

/* Script Modules */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('cko_pay_test_StorefrontController');
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

//function start() {
//	app.getView({
//	    ContinueURL: URLUtils.https('Sepa-HandleForm')
//	    }).render('helloform');
//}

function mandate() {
	var url = session.privacy.redirectUrl;
	
	if(url){
		app.getView({
		    ContinueURL: URLUtils.https('Sepa-HandleMandate')
		    }).render('helloform');
	}else{
		// print out a message
		response.getWriter().println('Error!');
	}
}

function handleMandate() {
	session.privacy.redirectUrl = null;
	
	var gatewayResponse = false;
	var orderId = util.getOrderId();
	
    app.getForm('helloform').handleAction({
        cancel: function () {
            app.getForm('helloform').clear();
            
            if(orderId){
        		// load the order
        		var order = OrderMgr.getOrder(orderId);
                var basket = util.checkAndRestoreBasket(order);
            }
            
            //response.redirect(URLUtils.https('Home-Show'));
            app.getController('COBilling').Start();
        },
        submit: function () {  
        	var sepa = app.getForm('helloform');
        	var mandate = sepa.get('mandate').value();
        	
        	// mandate is true
        	if(mandate){
            	if(orderId){
            		// load the order
            		var order = OrderMgr.getOrder(orderId);
            		
                	var confirmation = app.getController('COSummary');
                	
            		
            		//app.getView().render('helloformresult');
            		confirmation.ShowConfirmation(order);
            	}else{
            		// print out a message
            		response.getWriter().println('Order Not Found!');
            	}
            	
            	
        	}else{
        		// print out a message
        		response.getWriter().println('Mandate is Required!');
        	}
        }
    });
}


/** Shows the template page. */
exports.Mandate = guard.ensure(['get'], mandate);
//exports.Start = guard.ensure(['get'], start);
exports.HandleMandate = guard.ensure(['post'], handleMandate);