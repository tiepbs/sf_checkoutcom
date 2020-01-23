"use strict"

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentTransaction = require('dw/order/PaymentTransaction');
var Transaction = require('dw/system/Transaction');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');


/* Utility */
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');

/*
* Utility functions for my cartridge integration.
*/
var apmUtility = {
  
	/*
	 * Creates Site Genesis Transaction Object
	 * @return object
	 */
	apmAuthorization: function(payObject, args){
		// Preparing payment parameters
		var paymentInstrument = args.PaymentInstrument;
		var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
		
		// perform the charge
		var apmRequest = this.handleApmRequest(payObject, args);
		
		// Handle apm result
		if (apmRequest) {
			if (session.privacy.redirectUrl) {
				// Create the authorization transaction
			    Transaction.wrap(function() {
			        paymentInstrument.paymentTransaction.transactionID = apmRequest.action_id;
					paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
					paymentInstrument.paymentTransaction.custom.ckoPaymentId = apmRequest.id;
					paymentInstrument.paymentTransaction.custom.ckoParentTransactionId = null;
					paymentInstrument.paymentTransaction.custom.ckoTransactionOpened = true;
					paymentInstrument.paymentTransaction.custom.ckoTransactionType = 'Authorization';
			        paymentInstrument.paymentTransaction.setType(PaymentTransaction.TYPE_AUTH);
				});
				
				// Set the redirection template
				var templatePath;
				if (payObject.type == "sepa") {
					templatePath = 'redirects/sepaMandate.isml';
				}
				else {
					templatePath = 'redirects/APM.isml';
				}

				// Redirect
				ISML.renderTemplate(templatePath, {
					redirectUrl: session.privacy.redirectUrl
				});
				
				return {authorized: true, redirected: true};
			}
			else {
				return {authorized: true};
			}
		} else {
			return false
		}
	},
		
	/*
	 * Handle APM charge Response from CKO API
	 */
	handleAPMChargeResponse: function(gatewayResponse){
		// clean the session
		session.privacy.redirectUrl = null;
		
		// Logging
		ckoUtility.doLog('response', JSON.stringify(gatewayResponse));	
		
		// Update customer data
		ckoUtility.updateCustomerData(gatewayResponse);
		
		var gatewayLinks = gatewayResponse._links;
		var type = gatewayResponse.type;
		
		// add redirect to sepa source reqeust
		if (type == 'Sepa'){
			session.privacy.redirectUrl = "${URLUtils.url('Sepa-Mandate')}";
			session.privacy.sepaResponseId = gatewayResponse.id;
		}
		
		// Add redirect URL to session if exists
		if (gatewayLinks.hasOwnProperty('redirect')){
			session.privacy.redirectUrl = gatewayLinks.redirect.href
		}
		
	},
	
	/*
	 * Apm Request
	 */
	handleApmRequest: function(payObject, args) {
		// Gateway response
		var gatewayResponse = false;
		
		// Load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// Creating billing address object
		var gatewayObject = this.apmObject(payObject, args);
		
		// Test SEPA
		if (payObject.type == "sepa") {
			// Prepare the charge data
			var chargeData = {
				"customer"				: ckoUtility.getCustomer(args),
				"amount"				: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), payObject.currency),
			    "type"					: payObject.type,
				"currency"				: payObject.currency,
				"billing_address"		: ckoUtility.getBillingObject(args),
			    "source_data"			: payObject.source_data,
				"reference"				: args.OrderNo,
				"payment_ip"			: ckoUtility.getHost(args),
			    "metadata"				: ckoUtility.getMetadataObject(payObject, args),
			    "billing_descriptor"	: ckoUtility.getBillingDescriptorObject()
			};
			
			// Perform the request to the payment gateway
			gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.sources." + ckoUtility.getValue('ckoMode') + ".service", chargeData);
		}
		else {
			// Perform the request to the payment gateway
			gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service", gatewayObject);
		}
		
		// If the charge is valid, process the response
		if (ckoUtility.paymentSuccess(gatewayResponse)) {
			this.handleAPMChargeResponse(gatewayResponse);
			return gatewayResponse;
		}
		else {
			// Update the transaction
			Transaction.wrap(function(){
				OrderMgr.failOrder(order, true);
			});
		}
	},
	
	/*
	 * return apm object
	 */
	apmObject: function(payObject, args) {
		// Charge data
		var chargeData = false;
		
		// Load the order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// Load the currency and amount
		var currency = ckoUtility.getCurrency(payObject.currency);
		var amount = ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), currency);
		
		// Object APM is SEPA
		if (payObject.type == 'klarna'){
			
			// Prepare chargeData object
			chargeData = {
				"customer"				: ckoUtility.getCustomer(args),
				"amount"				: amount,	
				"currency"				: currency,
				"capture"				: false,
			    "source"				: payObject.source,
				"reference"				: args.OrderNo,
				"payment_ip"			: ckoUtility.getHost(args),
			    "metadata"				: ckoUtility.getMetadataObject(payObject, args),
			    "billing_descriptor"	: ckoUtility.getBillingDescriptorObject()
			};
		}
		else
		{
			// Prepare chargeData object
			chargeData = {
				"customer"				: ckoUtility.getCustomer(args),
				"amount"				: amount,	
				"currency"				: currency,
			    "source"				: payObject.source,
				"reference"				: args.OrderNo,
				"payment_ip"			: ckoUtility.getHost(args),
			    "metadata"				: ckoUtility.getMetadataObject(payObject, args),
			    "billing_descriptor"	: ckoUtility.getBillingDescriptorObject()
			};
		}
		
		return chargeData;
	},
	
	/*
	 * Sepa apm Request
	 */
	handleSepaRequest: function(payObject, order) {
		// Gateway response
		var gatewayResponse = false;
		
		// Perform the request to the payment gateway
		gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service", payObject);
		
		// If the charge is valid, process the response
		if (gatewayResponse){
			this.handleAPMChargeResponse(gatewayResponse, order);
		}
		else {
			// Update the transaction
			Transaction.wrap(function(){
				OrderMgr.failOrder(order);
			});
			
			// Restore the cart
			ckoUtility.checkAndRestoreBasket(order);
			
			return false;
		}

		return true;
	}
}

/*
* Module exports
*/

module.exports = apmUtility;