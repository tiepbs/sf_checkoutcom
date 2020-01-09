"use strict"


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var ServiceRegistry = require('dw/svc/ServiceRegistry');
var SiteController = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var app = require(SiteController + "/cartridge/scripts/app");


/*
* Utility functions for my cartridge integration.
*/
var ckoUtility = {
		
	/*
	 * get the required value for each mode
	 */
	getAppModeValue: function(sandboxValue, liveValue){
		
		var appMode = this.getValue('ckoMode');
		
		if(appMode == 'sandbox'){
			return sandboxValue;
		}else{
			return liveValue;
		}
		
	},	
	
	
	/*
	 * get user language
	 */	
	getLanguage: function(){
		
		var language = dw.system.Site.getCurrent().defaultLocale;
		
		language = language.replace('_', '-');
		
		return language;
	},
	
	
	
	/*
	 * get Site Name
	 */
	getSiteName: function(){
		
		var siteName = dw.system.Site.getCurrent().name;
		
		return siteName;
		
	},
	
	
	/*
	 * get site Hostname
	 */
	getSiteHostName: function(){
		var hostname = dw.system.Site.getCurrent().httpHostName;
		
		return hostname;
	},
	
    /**
     * Check if the gateway response is valid.
     */
    isValidResponse: function() {
        var requestKey = request.httpHeaders.get("Authorization");
        var privateSharedKey = this.getAccountKeys().privateKey;
		
		const logger = require('dw/system/Logger').getLogger('ckodebug');
		logger.debug('requestKey {0}', requestKey);
		logger.debug('privateSharedKey {0}',privateSharedKey);

		
        return requestKey == privateSharedKey
	}, 
	
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
	getCartridgeMeta: function(){
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
	 * Currency Conversion Ratio
	 */
	getCKOFormatedValue: function(currency){
		
		var byZero = {
			currencies 	: "BIF DJF GNF ISK KMF XAF CLF XPF JPY PYG RWF KRW VUV VND XOF",
			multiple 	: '1'
		}
		
		var byThree = {
			currencies	: "BHD LYD JOD KWD OMR TND",
			multiple	: '1000'
		}
		
		if(byZero.currencies.match(currency)){
			return byZero.multiple;
		}else if(byThree.currencies.match(currency)){
			return byThree.multiple;
		}else{
			return 100;
		}
		
	},
	
	
	/*
	 * Format price for cko gateway
	 */
	getFormattedPrice: function(price, currency){
		var ckoFormateBy = this.getCKOFormatedValue(currency);
		var orderTotalFormated = price * ckoFormateBy;
		
		return orderTotalFormated.toFixed();
	},
	
	

	/*
	 * get Order Quantities
	 */
	getCurrency : function(){
		var orderId = this.getOrderId();
		// load the card and order information
		var order = OrderMgr.getOrder(orderId);
		var currency = order.getCurrencyCode();
		
		return currency;
		
	},
	
	
	
	/*
	 * get Order Quantities
	 */
	getApmCurrency : function(currency){
		var orderId = this.getOrderId();
		// load the card and order information
		var order = OrderMgr.getOrder(orderId);
		
		if(this.getValue('ckoMode') == 'sandbox'){
			return currency;
		}else{
			currency = order.getCurrencyCode();
			
			return currency;
		}
		
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
	 * buildNote
	 */
	buildResponseNote: function(gatewayResponse, order){
		// Prepare the transaction info for the order
		var details = '';
		if (gatewayResponse.hasOwnProperty('customer') && gatewayResponse.customer.hasOwnProperty('id')){
			details += ckoUtility._("cko.customer.id", "cko") + ": " + gatewayResponse.customer.id + "\n";
		}
		
		details += ckoUtility._("cko.transaction.status", "cko") + ": " + gatewayResponse.status + "\n";
		details += ckoUtility._("cko.response.code", "cko") + ": " + gatewayResponse.response_code + "\n";
		details += ckoUtility._("cko.response.message", "cko") + ": " + gatewayResponse.response_summary + "\n";
		
		if (gatewayResponse.hasOwnProperty('source') && gatewayResponse.source.hasOwnProperty('last4')){
			details += ckoUtility._("cko.response.last4", "cko") + ": " + gatewayResponse.source.last4 + "\n";
		}
		
		if (gatewayResponse.hasOwnProperty('source') && gatewayResponse.source.hasOwnProperty('type')){
			details += ckoUtility._("cko.response.paymentMethod", "cko") + ": " + gatewayResponse.source.type + "\n";
		}
		
		details += ckoUtility._("cko.authorization.code", "cko") + ": " + gatewayResponse.auth_code + "\n";
		
		// Add risk flag information if applicable
		if(gatewayResponse.response_code == '10100'){
			details += ckoUtility._("cko.risk.flag", "cko") + ": " + ckoUtility._("cko.risk.info", "cko") + "\n";
		}
		
		// Add the details to the order
		Transaction.wrap(function(){
			order.addNote(ckoUtility._("cko.transaction.details", "cko"), details);
		});
		
		// Confirm the payment
		Transaction.wrap(function(){
			order.setPaymentStatus(order.PAYMENT_STATUS_PAID);
		});
		
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
	 * get Basket Quantities
	 */
	getBillingDescriptorObject : function(){
		
		var billingDescriptor = {
				"name"	: this.getValue('ckoBillingDescriptor1'),
				"city"	: this.getValue('ckoBillingDescriptor2')
		}
		
		return billingDescriptor;
		
	},
	
	/*
	 * get Products Information
	 */
	getProductInformation : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var it = order.productLineItems.iterator();

		var products = [];
		
		while (it.hasNext()){
			var pli = it.next();
			
			// product id
			var product = {
					"product_id" 	: pli.productID,
					"quantity"		: pli.quantityValue,
					"price"			: this.getFormattedPrice(pli.getPriceValue().toFixed(2), this.getCurrency()),
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
				"price"			: this.getFormattedPrice(order.getTotalTax().valueOf().toFixed(2), this.getCurrency()),
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
		
			var shippment = {
					"product_id"	: shipping.getShippingMethod().getID(),
					"quantity"		: 1,
					"price"			: this.getFormattedPrice(shipping.getShippingTotalPrice().valueOf().toFixed(2), this.getCurrency()),
					"description"	: shipping.getShippingMethod().getDisplayName() + " Shipping : " + shipping.getShippingMethod().getDescription()
			}
			
			return shippment;
		
		}else{
			return false;
		}
	},
	
	
	/*
	 * Return Order Currency Code
	 */
	getCurrencyCode: function(args){
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get shipping address object
		var shipping = order.getDefaultShipment().getShippingMethod();
		var shippingCurrency = shipping.getCurrencyCode();
		
		return shippingCurrency;
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
	getProductIds : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var it = order.productLineItems.iterator();

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
		
		var it = order.productLineItems.iterator();
		
		var products_quantites = 0;
		
		while (it.hasNext()){
			var pli = it.next();
			products_quantites += pli.quantityValue;
		}
		
		return products_quantites;
		
	},
	
	/*
	 * get Each Product Quantity
	 */
	getProductQuantities : function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var it = order.productLineItems.iterator();

		var products_quantites = [];
		
		while (it.hasNext()){
			var pli = it.next();
			products_quantites.push(pli.quantityValue);
		}
		
		return products_quantites;
		
	},
	
	/*
	 * get Host IP
	 */
	getHost: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		var host = order.getRemoteHost()
		
		return host;
	},
	
	
	/*
	 * return order amount
	 */
	getAmount: function(order){
		
		var amount = this.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), this.getCurrency());
		return amount;
	},
	
	
	/*
	 * return phone object
	 */
	getPhoneObject: function(args){
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
	 * Return Customer FullName
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
	 * Return Customer FirstName
	 */
	getCustomerFirstName: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		var firstname = billingAddress.getFirstName();
		
		return firstname;
	},
	
	/*
	 * Return Customer LastName
	 */
	getCustomerLastName: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		var lastname = billingAddress.getLastName();
		
		return lastname;
	},
		
	
	/*
	 * return capture time
	 */
	getCaptureTime: function(){
		var captureOn = this.getValue('ckoAutoCaptureTime');
		
		if(captureOn > 0){
			
			var t = new Date();
			t.setSeconds(t.getSeconds() + captureOn);
			
			return t;
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
	getMetadataObject: function(Data){
		var meta;

		meta = {
			udf1				: Data.type,
			integration_data	: this.getCartridgeMeta(),
			platform_data		: "SiteGenesis Version: 19.10 Last Updated: Oct 21, 2019 (Compatibility Mode: 16.2)"
		}

		
		return meta;
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
	 * get Billing Country
	 */
	getBillingCountry: function(args){
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Get billing address information
		var billingAddress = order.getBillingAddress();
		
		var country = billingAddress.getCountryCode().value
		
		return country;
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
			phone				: this.getPhoneObject(args)
		};
		
		return shipping;
	},
	
	/*
	 * Return Basket Item object
	 */
	getBasketObject: function(basket){
		
		var currency = this.getAppModeValue('GBP', basket.getCurrencyCode());
		
		var products_quantites = [];
		
		var it = basket.productLineItems.iterator();
		
		while (it.hasNext()){
			var pli = it.next();
			var productTaxRate = pli.taxRate * 100 * 100;
			var productQuantity = pli.quantityValue;
			var unitPrice = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency) / productQuantity;
			var totalAmount = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency);
			var products = {
				"name"				: pli.productName,
				"quantity"			: productQuantity.toString(),
				"unit_price"		: unitPrice.toString(),
				"tax_rate"			: productTaxRate.toString(),  
				"total_amount"		: totalAmount.toString(),
				"total_tax_amount"	: this.getFormattedPrice(pli.adjustedTax.value, currency)
			}
			
			products_quantites.push(products);
		}
		var shippingTaxRate = basket.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
		var shipping = {
			"name"				: basket.defaultShipment.shippingMethod.displayName + " Shipping",
			"quantity"			: '1',
			"unit_price"		: this.getFormattedPrice(basket.shippingTotalGrossPrice.value, currency),
			"tax_rate"			: shippingTaxRate.toString(),
			"total_amount"		: this.getFormattedPrice(basket.shippingTotalGrossPrice.value, currency),
			"total_tax_amount"	: this.getFormattedPrice(basket.shippingTotalTax.value, currency)
		}
		
		if(basket.shippingTotalPrice.value > 0){
			products_quantites.push(shipping);
		}
		
		return products_quantites;
	},
	
	
	/*
	 * Return Basket Item object
	 */
	getOrderBasketObject: function(args){
		
		var currency = this.getAppModeValue('GBP', this.getCurrencyCode(args));
		
		var order = OrderMgr.getOrder(args.OrderNo);
		
		var it = order.productLineItems.iterator();

		var products_quantites = [];
		
		while (it.hasNext()){
			var pli = it.next();
			var productTaxRate = pli.taxRate * 100 * 100;
			var productQuantity = pli.quantityValue;
			var unitPrice = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency) / productQuantity;
			var totalAmount = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency);
			var products = {
				"name"				: pli.productName,
				"quantity"			: productQuantity.toString(),
				"unit_price"		: unitPrice.toString(),
				"tax_rate"			: productTaxRate.toString(),
				"total_amount"		: totalAmount.toString(),
				"total_tax_amount"	: this.getFormattedPrice(pli.adjustedTax.value, currency)
			}
			
			products_quantites.push(products);
		}
		var shippingTaxRate = order.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
		var shipping = {
			"name"				: order.defaultShipment.shippingMethod.displayName + " Shipping",
			"quantity"			: '1',
			"unit_price"		: this.getFormattedPrice(order.shippingTotalGrossPrice.value, currency),
			"tax_rate"			: shippingTaxRate.toString(),
			"total_amount"		: this.getFormattedPrice(order.shippingTotalGrossPrice.value, currency),
			"total_tax_amount"	: this.getFormattedPrice(order.shippingTotalTax.value, currency)
		}
		
		if(order.shippingTotalPrice.value > 0){
			products_quantites.push(shipping);
		}
		
		return products_quantites;
		
	},
	
	/*
	 * Return Basket Item CountryCode
	 */
	getBasketCountyCode: function(basket){
		
		var countyCode = basket.defaultShipment.shippingAddress.countryCode.valueOf();
		
		return countyCode;
		
	},
	
	
	/*
	 * Return Basket Item CountryCode
	 */
	getBasketAddress: function(basket){
		
        var address = {
            given_name					: this.getAppModeValue('John', basket.defaultShipment.shippingAddress.firstName),
            family_name					: this.getAppModeValue('Doe', basket.defaultShipment.shippingAddress.lastName),
            email						: "john@doe.com",
            title						: this.getAppModeValue('Mr', basket.defaultShipment.shippingAddress.title),
            street_address				: this.getAppModeValue('13 New Burlington St', basket.defaultShipment.shippingAddress.address1),
            street_address2				: this.getAppModeValue('Apt 214', basket.defaultShipment.shippingAddress.address2),
            postal_code					: this.getAppModeValue('W13 3BG', basket.defaultShipment.shippingAddress.postalCode),
            city						: this.getAppModeValue('London', basket.defaultShipment.shippingAddress.city),
            phone						: this.getAppModeValue('01895808221', basket.defaultShipment.shippingAddress.phone),
            country						: this.getAppModeValue("GB", basket.defaultShipment.shippingAddress.countryCode.valueOf())
            
        }
		
		return address;
		
	},
	
	/*
	 * Return Basket Item CountryCode
	 */
	getOrderBasketAddress: function(args){
		
		var order = OrderMgr.getOrder(args.OrderNo);
		
        var address = {
            given_name					: this.getAppModeValue('John', order.defaultShipment.shippingAddress.firstName),
            family_name					: this.getAppModeValue('Doe', order.defaultShipment.shippingAddress.lastName),
            email						: this.getAppModeValue('john@doe.com', order.customerEmail),
            title						: this.getAppModeValue('Mr', order.defaultShipment.shippingAddress.title),
            street_address				: this.getAppModeValue('13 New Burlington St', order.defaultShipment.shippingAddress.address1),
            street_address2				: this.getAppModeValue('Apt 214', order.defaultShipment.shippingAddress.address2),
            postal_code					: this.getAppModeValue('W13 3BG', order.defaultShipment.shippingAddress.postalCode),
            city						: this.getAppModeValue('London', order.defaultShipment.shippingAddress.city),
            phone						: this.getAppModeValue('01895808221', order.defaultShipment.shippingAddress.phone),
            country						: this.getAppModeValue("GB", order.defaultShipment.shippingAddress.countryCode.valueOf())
            
        }
		
		return address;
		
	}
	
	
	
}



/*
* Module exports
*/

module.exports = ckoUtility;