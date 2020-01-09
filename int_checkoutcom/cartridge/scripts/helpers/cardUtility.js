"use strict"


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/** Utility **/
var ckoUtility = require('~/cartridge/scripts/helpers/ckoUtility');


/*
* Utility functions for my cartridge integration.
*/
var cardUtility = {
	
	
	/*
	 * Handle full charge Request to CKO API
	 */
	handleCardRequest: function(cardData, args){
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// creating billing address object
		var gatewayObject = this.gatewayObject(cardData, args);
		
		// Pre_Authorize card
		//var preAuthorize = this.preAuthorizeCard(gatewayObject);
		var preAuthorize = true;
		
		if(preAuthorize){
			// Perform the request to the payment gateway
			var gatewayResponse = ckoUtility.gatewayClientRequest("cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleFullChargeResponse(gatewayResponse, order);
				return gatewayResponse;
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				ckoUtility.checkAndRestoreBasket(order);
				
				return false;
			}
			
		}else{
			return false;
		}
		
	},
	
	
	/*
	 * Handle full charge Response from CKO API
	 */
	handleFullChargeResponse: function(gatewayResponse, order){
		
		// Logging
		ckoUtility.doLog('response', JSON.stringify(gatewayResponse));	
		
		// Update customer data
		ckoUtility.updateCustomerData(gatewayResponse);
		
		var gatewayLinks = gatewayResponse._links;
		
		// Add 3DS redirect URL to session if exists
		if(gatewayLinks.hasOwnProperty('redirect')){
			session.privacy.redirectUrl = gatewayLinks.redirect.href
		}

		ckoUtility.buildResponseNote(gatewayResponse, order);

	},
	

	
	/*
	 * Pre_Authorize card with zero value
	 */
	preAuthorizeCard: function(chargeData){
		
		// Prepare the 0 auth charge
		var authData = JSON.parse(JSON.stringify(chargeData));
		
		authData['3ds'].enabled = false;
		authData.amount = 0;
		authData.currency = "USD";	
		
		var authResponse = ckoUtility.gatewayClientRequest("cko.card.charge." + ckoUtility.getValue('ckoMode') + ".service", authData);
		
		if(ckoUtility.paymentValidate(authResponse)){
			return true;
		}
		
		return false;
	},
	
	
		
	/*
	 * Build the Gateway Object
	 */
	gatewayObject: function(cardData, args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Prepare chargeData object
		var chargeData = {
				"source"				: this.getSourceObject(cardData, args),
				"amount"				: ckoUtility.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), ckoUtility.getCurrency()),	
				"currency"				: ckoUtility.getCurrency(),
				"reference"				: args.OrderNo,
				"capture"				: ckoUtility.getValue('ckoAutoCapture'),
				"capture_on"			: ckoUtility.getCaptureTime(),
				"customer"				: ckoUtility.getCustomer(args),
				"billing_descriptor"	: ckoUtility.getBillingDescriptorObject(),
				"shipping"				: this.getShippingObject(args),
				"3ds"					: this.get3Ds(),
				"risk"					: {enabled: true},
				"payment_ip"			: ckoUtility.getHost(args),
				"metadata"				: ckoUtility.getMetadataObject(cardData)
			};
		
		return chargeData;
	},	
	
	
	
	/*
	 * Build Gateway Source Object
	 */
	getSourceObject: function(cardData, args){
		// source object
		var source = {
			type				: "card",
			number				: cardData.number,
			expiry_month		: cardData.expiryMonth,
			expiry_year			: cardData.expiryYear,
			name				: cardData.name,
			cvv					: cardData.cvv,
			billing_address		: this.getBillingObject(args),
			phone				: ckoUtility.getPhoneObject(args)

		}
		
		return source;
	},
	
	
	/*
	 * Build 3ds object
	 */
	get3Ds:	function(){
		
		// 3ds object
		var ds = {
			"enabled"				: ckoUtility.getValue('cko3ds'),
			"attempt_n3d"			: ckoUtility.getValue('ckoN3ds')
		}
		
		return ds;
	},
	
	/*
	 * Build the Billing object
	 */
	getBillingObject: function(args){
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();
		// creating billing address object
		var billingDetails = {
			address_line1		: billingAddress.getAddress1(),
			address_line2		: billingAddress.getAddress2(),
			city				: billingAddress.getCity(),
			state				: billingAddress.getStateCode(),
			zip					: billingAddress.getPostalCode(),
			country				: billingAddress.getCountryCode().value
		};
		
		return billingDetails;
	},
	
	
	/*
	 * Build the Shipping object
	 */
	getShippingObject: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get shipping address object
		var shippingAddress = order.getDefaultShipment().getShippingAddress();
		
		// creating address object
		var shippingDetails = {
			address_line1		: shippingAddress.getAddress1(),
			address_line2		: shippingAddress.getAddress2(),
			city				: shippingAddress.getCity(),
			state				: shippingAddress.getStateCode(),
			zip					: shippingAddress.getPostalCode(),
			country				: shippingAddress.getCountryCode().value
		};
		
		// shipping object
		var shipping = {
			address				: shippingDetails,
			phone				: ckoUtility.getPhoneObject(args)
		};
		
		return shipping;
	}
	
	
	
}



/*
* Module exports
*/

module.exports = cardUtility;