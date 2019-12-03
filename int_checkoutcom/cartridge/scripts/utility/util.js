"use strict"


/* API Includes */
var HTTPclient = require('dw/net/HTTPClient');
var ISML = require('dw/template/ISML');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Store = require('dw/catalog/Store');
//var Shipment = require('dw/order/Shipment');
var Logger = require('dw/system/Logger');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var ServiceRegistry = require('dw/svc/ServiceRegistry');


/* Site Controller */
var SiteController = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* App */
var app = require(SiteController + "/cartridge/scripts/app");


/*
* Utility functions for my cartridge integration.
*/
var util = {
		
	/* 
	 * get value from custom preferences
	 */
	getValue: function(field){
		return dw.system.Site.getCurrent().getCustomPreferenceValue(field);
	},
	
	/*
	 * Handles string translation with language resource files.
	 */
	_: function(strValue, strFile){
		return Resource.msg(strValue, strFile, null);
	},
		
	/*
	 * Write gateway information to the website's custom log files.
	 */
	doLog: function(dataType, gatewayData){
		if (this.getValue("ckoDebugEnabled") == true && (gatewayData)){
			var logger = Logger.getLogger('ckodebug');
			if(logger){
				logger.debug(this._('cko.gateway.name', 'cko') + ' ' + dataType + ' : {0}', gatewayData);
			}
		}
	},
	
	/* return order id */
	getOrderId: function(){
		var orderId = (this.getValue('cko3ds')) ? request.httpParameterMap.get('reference').stringValue : request.httpParameterMap.get('reference').stringValue;
		if(orderId === null){
			orderId = session.privacy.ckoOrderId;
		}
		
		return orderId;
	},
	
	
	/* cartridge metadata. */
	getCartridgeMeta: function(catridge){
		return this.getValue("ckoUserAgent") + ' ' + this.getValue("ckoVersion");
	},
	
	/*
	 * get Account API Keys
	 */
	getAccountKeys: function(){
        var keys = {};
        var str = this.getValue('ckoMode') == 'live' ? 'Live' : 'Sandbox';

        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.secreteKey = this.getValue('cko' +  str + 'SecreteKey');
        keys.privateKey = this.getValue('cko' +  str + 'PrivateKey');

        return keys;
	},
	
	/*
	 * Create an HTTP client to handle request to gateway
	 */
	gatewayClientRequest: function(serviceId, requestData){
		
        var responseData = false;
        var serv = ServiceRegistry.get(serviceId);
	    var resp = serv.call(requestData);
	    
        if (resp.status == 'OK') {
        	
            responseData = resp.object
            
        }
        
        return responseData;
	},
	
	/*
	 * Format price for cko
	 */
	getFormattedPrice: function(price){
		var orderTotalFormated = price * 100;
		return orderTotalFormated.toFixed();
	},
	
	
	/*
	 * Stripe spaces form number
	 */
	getFormattedNumber: function(number){
		var num = number;
		var result = num.replace(/\s/g, "");
		return result;
	},
	
	/*
	 * Confirm is a payment is valid from API response code
	 */
	paymentValidate: function(gatewayResponse){
		return gatewayResponse.response_code == "10000" || gatewayResponse.response_code == '10100' || gatewayResponse.response_code == '10200';
	},
	
	/*
	 * Write order information to session for the current shopper.
	 */
	updateCustomerData: function(gatewayResponse){
		if((gatewayResponse) && gatewayResponse.hasOwnProperty('card')){
			Transaction.wrap(function(){
				if(session.customer.profile !== null){
					session.customer.profile.custom.ckoCustomerId = gatewayResponse.card.customerId;
				}
			});
		}
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
		
		var authResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", authData);
		
		if(this.paymentValidate(authResponse)){
			return true;
		}
		
		return false;
	},
	
	/*
	 * Handle a failed payment response
	 */
	handleFail: function(gatewayResponse){
		if(gatewayResponse){
			// Logging
			this.logThis('checkout.com cartridge failed response', gatewayResponse);
		}
		
		// Load the error template
		app.getController('COBilling').Start();
	},
	
	
	/*
	 * Rebuild basket contents after a failed payment.
	 */
	checkAndRestoreBasket: function(order){
		var basket = BasketMgr.getCurrentOrNewBasket();
		var it;
		var pli;
		var newPLI;
		var gcit;
		var gcli;
		var newGCLI;
		var billingAddress;
		var shippingAddress;
		
		if(order && basket && basket.productLineItems.size() === 0 && basket.giftCertificateLineItems.size() === 0){
			
			Transaction.begin();
			
			it = order.productLineItems.iterator();
			
			while (it.hasNext()){
				pli = it.next();
				newPLI = basket.createProductLineItem(pli.productID, basket.defaultShipment);
				newPLI.setQuantityValue(pli.quantity.value);
			}
			
			gcit = order.giftCertificateLineItems.iterator();
			while(gcit.hasNext()){
				gcli = it.next();
				newGCLI = basket.createGiftCertificateLineItems(gcli.priceValue, gcli.recipientEmail);
				
				newGCLI.setMessage(gcli.message);
				newGCLI.setRecipientName(gcli.recipientName);
				newGCLI.setSenderName(gcli.senderName);
				newGCLI.setProductListItem(gcli.productListItem);
			}
			
			// Handle email address
			basket.customerEmail = order.customerEmail;
			
			// Handle billing address
			billingAddress = basket.createBillingAddress();
			billingAddress.firstName = order.billingAddress.firstName;
			billingAddress.lastName = order.billingAddress.lastName;
			billingAddress.address1 = order.billingAddress.address1;
			billingAddress.address2 = order.billingAddress.address2;
			billingAddress.city = order.billingAddress.city;
			billingAddress.postalCode = order.billingAddress.postalCode;
			billingAddress.stateCode = order.billingAddress.stateCode;
			billingAddress.countryCode = order.billingAddress.countryCode;
			billingAddress.phone = order.billingAddress.phone;
			
			
			// Handle shipping address
			shippingAddress = basket.defaultShipment.createShippingAddress();
			shippingAddress.firstName = order.defaultShipment.shippingAddress.firstName;
			shippingAddress.lastName = order.defaultShipment.shippingAddress.lastName;
			shippingAddress.address1 = order.defaultShipment.shippingAddress.address1;
			shippingAddress.address2 = order.defaultShipment.shippingAddress.address2;
			shippingAddress.city = order.defaultShipment.shippingAddress.city;
			shippingAddress.postalCode = order.defaultShipment.shippingAddress.postalCode;
			shippingAddress.stateCode = order.defaultShipment.shippingAddress.stateCode;
			shippingAddress.countryCode = order.defaultShipment.shippingAddress.countryCode;
			shippingAddress.phone = order.defaultShipment.shippingAddress.phone;
			
			// Handle shipping method
			basket.defaultShipment.setShippingMethod(order.defaultShipment.getShippingMethod());
			
			Transaction.commit();
			
			
			
		}
	},
	
	/*
	 * Handle APM charge Response from CKO API
	 */
	handleAPMChargeResponse: function(gatewayResponse, order){
		// clean the session
		session.privacy.redirectUrl = null;
		// Assign this to self
		var self = this;
		
		// Logging
		this.doLog('response', JSON.stringify(gatewayResponse));	
		
		// Update customer data
		this.updateCustomerData(gatewayResponse);
		
		var gatewayLinks = gatewayResponse._links;
		var type = gatewayResponse.type;
		
		// add redirect to sepa source reqeust
		if(type == 'Sepa'){
			session.privacy.redirectUrl = "${URLUtils.url('Sepa-Mandate')}";
		}
		
		// Add redirect URL to session if exists
		if(gatewayLinks.hasOwnProperty('redirect')){
			session.privacy.redirectUrl = gatewayLinks.redirect.href
		}
		
		// Prepare the transaction info for the order
		var details = '';
		if (gatewayResponse.hasOwnProperty('id') && gatewayResponse.hasOwnProperty('customer')){	// todo
			details += this._("cko.transaction.id", "cko_pay_test") + ": " + gatewayResponse.id + "\n";
			details += this._("cko.customer.id", "cko_pay_test") + ": " + gatewayResponse.customer.id + "\n";		// todo
			details += this._("cko.transaction.status", "cko_pay_test") + ": " + gatewayResponse.status + "\n";
		}
		
		// Add the details to the order
		Transaction.wrap(function(){
			order.addNote(self._("cko.transaction.details", "cko_pay_test"), details);
		});
		
		// Confirm the payment
		Transaction.wrap(function(){
			order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
		});
	},
	
	
	/*
	 * Handle full charge Response from CKO API
	 */
	handleFullChargeResponse: function(gatewayResponse, order){
		// Assign this to self
		var self = this;
		
		// Logging
		this.doLog('response', JSON.stringify(gatewayResponse));	
		
		// Update customer data
		this.updateCustomerData(gatewayResponse);
		
		var gatewayLinks = gatewayResponse._links;
		
		// Add 3DS redirect URL to session if exists
		if(gatewayLinks.hasOwnProperty('redirect')){
			session.privacy.redirectUrl = gatewayLinks.redirect.href
		}
		
		// Prepare the transaction info for the order
		var details = '';
		if (gatewayResponse.hasOwnProperty('card') && gatewayResponse.card.hasOwnProperty('customer')){	// todo
			details += this._("cko.customer.id", "cko_pay_test") + ": " + gatewayResponse.card.customerId + "\n";		// todo
		}
		
		details += this._("cko.transaction.status", "cko_pay_test") + ": " + gatewayResponse.status + "\n";
		details += this._("cko.respnose.code", "cko_pay_test") + ": " + gatewayResponse.responseCode + "\n";
		details += this._("cko.response.message", "cko_pay_test") + ": " + gatewayResponse.responseMessage + "\n";
		details += this._("cko.response.info", "cko_pay_test") + ": " + gatewayResponse.responseAdvancedInfo + "\n";
		details += this._("cko.respnse.last4", "cko_pay_test") + ": " + gatewayResponse.last4 + "\n";
		details += this._("cko.response.paymentMethod", "cko_pay_test") + ": " + gatewayResponse.paymentMethod + "\n";
		details += this._("cko.authorization.code", "cko_pay_test") + ": " + gatewayResponse.authCode + "\n";
		
		// Add risk flag information if applicable
		if(gatewayResponse.responseCode = '10100'){
			details += this._("cko.risk.flag", "cko_pay_test") + ": " + this._("cko.risk.info", "cko_pay_test") + "\n";
		}
		
		// Add the details to the order
		Transaction.wrap(function(){
			order.addNote(self._("cko.transaction.details", "cko_pay_test"), details);
		})
		
		// Confirm the payment
		Transaction.wrap(function(){
			order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
		});
	},
	
	
	/*
	 * Handle APM charge Request to CKO API
	 */
	handleAPMChargeRequest: function(payObject, args){
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		switch(payObject.type){
		case 'ideal':
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "EUR", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case 'giropay':
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "EUR", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case 'bancontact':
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "BHD", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case 'benefit':
			// creating billing address object
			var gatewayObject = payObject;
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
		case 'boleto':

			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "BRL", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case "eps":
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "EUR", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case "sofort":
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "EUR", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case "knet":
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "KWD", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case "qpay":
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "QAR", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case "fawry":
			// creating billing address object
			var gatewayObject = this.gatewayAPMObject(payObject, "EGP", args);
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		case "sepa":
			// creating billing address object
			var gatewayObject = payObject;
			
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleAPMChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			return true;
			
		default:
			
			// update the transaction
			Transaction.wrap(function(){
				OrderMgr.failOrder(order);
			});
			
			// Restore the cart
			this.checkAndRestoreBasket(order);
			
			return false;
			
		}
	},
	
	
	/*
	 * Handle full charge Request to CKO API
	 */
	handleFullChargeRequest: function(cardData, args){
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		// creating billing address object
		var gatewayObject = this.gatewayObject(cardData, args);
		
		// Pre_Authorize card
		var preAuthorize = this.preAuthorizeCard(gatewayObject);
		
		if(preAuthorize){
			// Perform the request to the payment gateway
			var gatewayResponse = this.gatewayClientRequest("cko.card.charge." + this.getValue('ckoMode') + ".service", gatewayObject);
			
			// If the charge is valid, process the response
			if(gatewayResponse){
				this.handleFullChargeResponse(gatewayResponse, order);
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				this.checkAndRestoreBasket(order);
				
				return false;
			}
			
		}else{
			return false;
		}
		
		return true;
		
	},
	
	/*
	 * Handle the build of the APM Gateway Object
	 */
	gatewayAPMObject: function(payObject, currency, args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();

		// Get shipping address object
		var shippingAddress = order.getDefaultShipment().getShippingAddress();

		// creating phone object
		var phone = {
			country_code		: null,
			number				: billingAddress.getPhone()
		};
		
		
		// get billing Details Object
		var billingDetails = this.getBillingObject(billingAddress);

		// customer object
		var customer = {
			email				: order.customerEmail,
			name				: order.customerName
		};
		
		// Prepare chargeData object
		var chargeData = {
			"amount"			: this.getAmount(args),	
			
			// in live implementation this will have to be auto generated.
			//"currency"			: order.currencyCode,
			"currency"			: currency,
		    "source": payObject
		};
		
		return chargeData;
		
	},
	
	/*
	 * return customer object
	 */
	getCustomer: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// customer object
		var customer = {
			email				: order.customerEmail,
			name				: order.customerName
		};
		
		return customer;
	},
	
	/*
	 * get Basket Quantities
	 */
	getQuantity : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		var quantity = order.getProductQuantityTotal();
		
		return quantity;
		
	},
	
	/*
	 * get Products Information
	 */
	getProductInformation : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		it = order.productLineItems.iterator();

		var products = [];
		
		while (it.hasNext()){
			var pli = it.next();
			
			// product id
			var product = {
					"product_id" 	: pli.productID,
					"quantity"		: pli.quantityValue,
					"price"			: this.getFormattedPrice(pli.getPriceValue().toFixed(2)),
					"description"	: pli.productName
			}
			
			// push to products array
			products.push(product);
			
		}
		
		if(this.getShippingValue(args)){
			products.push(this.getShippingValue(args));
		}
		
		if(this.getTaxObject(args)){
			products.push(this.getTaxObject(args));
		}
		
		return products;
		
	},
	
	/*
	 * return tax object
	 */
	getTaxObject : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var tax = {
				"product_id"	: args.OrderNo,
				"quantity"		: 1,
				"price"			: this.getFormattedPrice(order.getTotalTax().valueOf().toFixed(2)),
				"description"	: "Order Tax"
		}
		
		if(order.getTotalTax().valueOf() > 0){
			return tax;
		}else{
			return false;
		}
		
	},
		
	/*
	 * return shipping object
	 */
	getShippingValue : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get shipping address object
		var shipping = order.getDefaultShipment();
		
		// Check if shipping cost is applicable to this order
		if(shipping.getShippingTotalPrice().valueOf() > 0){
		
			var ship = {
					"product_id"	: shipping.getShippingMethod().getID(),
					"quantity"		: 1,
					"price"			: this.getFormattedPrice(shipping.getShippingTotalPrice().valueOf().toFixed(2)),
					"description"	: shipping.getShippingMethod().getDisplayName() + " Shipping : " + shipping.getShippingMethod().getDescription()
			}
			
			return ship;
		
		}else{
			return false;
		}
	},

	
	/*
	 * get Product Names
	 */
	getProductShipping : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get shipping address object
		var shipping = order.getDefaultShipment();
		
		
		var shippingId = shipping.getID();
		var shippingMethodId = shipping.getShippingMethodID();
		var shippingGrossPrice = shipping.getShippingTotalGrossPrice().valueOf();
		var shippingTotalPrice = shipping.getShippingTotalPrice().valueOf();
		var shippingTotalTax = shipping.getTotalTax().valueOf();
		
		return order.getTotalTax().valueOf();
		
	},

	
	/*
	 * get Product Shipping Object
	 */
	getProductShippingObject : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get shipping address object
		var shipping = order.getDefaultShipment().getShippingMethod();
		
		var shippingName = shipping.getDisplayName();
		var shippingDescription = shipping.getDescription();
		var shippingCurrency = shipping.getCurrencyCode();
		var shippingId = shipping.getID();
		var shippingTaxId = shipping.getTaxClassID();
		
		return shipping.getTaxClassID();
		
	},

	
	/*
	 * get Product Names
	 */
	getProductNames : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var it = order.productLineItems.iterator();

		var products = [];
		
		while (it.hasNext()){
			var pli = it.next();
			products.push(pli.productName);
		}
		
		return products;
		
	},

	
	/*
	 * get Product price array
	 */
	getProductPrices : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var items = order.productLineItems.iterator();

		var products = [];
		
		while (items.hasNext()){
			var item = items.next();
			products.push(item.getPriceValue());
		}
		
		return products;
		
	},
	
	/*
	 * get Product IDs
	 */
	getProductId : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		it = order.productLineItems.iterator();

		var productIds = [];
		
		while (it.hasNext()){
			var pli = it.next();
			productIds.push(pli.productID);
		}
		
		return productIds;
		
	},
	
	/*
	 * get Each Product Quantity
	 */
	getProductQuantity : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		it = order.productLineItems.iterator();

		var products_quantites = [];
		
		while (it.hasNext()){
			var pli = it.next();
			products_quantites.push(pli.quantityValue);
		}
		
		return products_quantites;
		
	},
	
	/*
	 * get Order Quantities
	 */
	getCurrency : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		var currency = order.getCurrencyCode();
		
		return currency;
		
	},
		
	/*
	 * Handle the build of the Gateway Object
	 */
	gatewayObject: function(cardData, args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();

		// Get shipping address object
		var shippingAddress = order.getDefaultShipment().getShippingAddress();

		// creating phone object
		var phone = this.getPhone(args);
		
		
		// get billing Details Object
		var billingDetails = this.getBillingObject(billingAddress);

		// customer object
		var customer = this.getCustomer(args);

		// Prepare chargeData object
		var chargeData = {
				"source"			: this.getSourceObject(cardData, billingDetails, phone),
				"amount"			: this.getAmount(args),	
				"currency"			: order.currencyCode,
				"reference"			: order.orderNo,
				"capture"			: this.getValue('ckoAutoCapture'),
				"capture_on"		: this.getCaptureTime(),
				"customer"			: customer,
				"shipping"			: this.getShippingObject(shippingAddress, phone),
				"3ds"				: this.get3Ds(),
				"risk"				: {enabled: true},
				"payment_ip"		: order.getRemoteHost(),
				"metadata"			: this.getMetadata(cardData),
			};
		
		return chargeData;
	},
	
	/*
	 * return order amount
	 */
	getAmount: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var amount = this.getFormattedPrice(order.totalGrossPrice.value.toFixed(2));
		return amount;
	},
	
	
	/*
	 * return phone object
	 */
	getPhone: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		// creating phone object
		var phone = {
			country_code		: null,
			number				: billingAddress.getPhone()
		};
		
		return phone;
	},
	
	/*
	 * Return Customer Fullname
	 */
	getCustomerName: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		var fullname = billingAddress.getFullName();
		
		return fullname;
	},
		
	
	/*
	 * return capture time
	 */
	getCaptureTime: function(){
		var captureOn = this.getValue('ckoAutoCaptureTime');
		
		if(captureOn > 0){
			return captureOn;
		}
		
		return null;
	},
	
	/*
	 * Build 3ds object
	 */
	get3Ds:	function(){
		
		// 3ds object
		var ds = {
			"enabled"				: this.getValue('cko3ds'),
			"attempt_n3d"			: this.getValue('ckoN3ds')
		}
		
		return ds;
	},
	
	/*
	 * Build metadata object
	 */
	getMetadata: function(cardData){
		var meta;

		meta = {
			udf1				: cardData.type,
			integration_data	: this.getValue('ckoUserAgent') + " " + this.getValue('ckoVersion'),
			platform_data		: "SiteGenesis Version: 19.10 Last Updated: Oct 21, 2019 (Compatibility Mode: 16.2)"
		}

		
		return meta;
	},
	
	/*
	 * Build the Billing object
	 */
	getBillingObject: function(billingAddress){
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
	getShippingObject: function(shippingAddress, phone){
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
			phone				: phone
		};
		
		return shipping;
	},
	
	/*
	 * Build Gateway Source Object
	 */
	getSourceObject: function(cardData, billingDetails, phone){
		// source object
		var source = {
			type				: "card",
			number				: cardData.number,
			expiry_month		: cardData.expiryMonth,
			expiry_year			: cardData.expiryYear,
			name				: cardData.name,
			cvv					: cardData.cvv,
			billing_address		: billingDetails,
			phone				: phone

		}
		
		return source;
	}
	
}



/*
* Module exports
*/

module.exports = util;