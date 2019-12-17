'use strict';


/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var BasketMgr = require('dw/order/BasketMgr');
var ServiceRegistry = require('dw/svc/ServiceRegistry');



/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');


/**
 * Utility functions for the Checkout.com cartridge integration.
 */
var CKOUtils = {
		
		
	/*
	 * get user language
	 */	
	getLanguage: function(){
		return dw.system.Site.getCurrent().defaultLocale;
	},
		
    /**
     * Handles string translation with language resource files.
     */
	_: function (strValue, strFile) {
		return Resource.msg(strValue, strFile, null);
	},
	

    /**
     * Get live or sandbox account keys.
     */
    getAccountKeys: function() {
        var keys = {};
        var str = this.getValue('ckoMode') == 'live' ? 'Live' : 'Sandbox';

        keys.privateKey = this.getValue('cko' +  str + 'PrivateKey');
        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.secreteKey = this.getValue('cko' +  str + 'SecreteKey');

        return keys;
    },
    
    /**
     * Checks if a payment is valid via the response code.
     */  
    paymentIsValid: function(gResponse) {
		return gResponse.response_code == "10000" || gResponse.response_code == '10100' || gResponse.response_code == '10200';
    },
    

    /**
     * Returns a date formatted for processing by the gateway.
     */
    getFormattedDate: function(secs) {
        var d = new Date(secs * 1000);
        return d.toISOString();
    },
    


    /**
     * Writes gateway information to the website's custom log files.
     */
    logThis: function(dataType, gatewayData) {
        if (this.getValue('ckoDebugEnabled') == 'true' && (gatewayData)) {
            var logger = Logger.getLogger('ckodebug');
            if (logger) {
                logger.debug(this._('cko.gateway.name', 'cko') + ' ' + dataType + ' : {0}', gatewayData);
            }
        }
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
	 * Build the Gateway Object
	 */
	gatewayObject: function(cardData, args){
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);

		// Prepare chargeData object
		var chargeData = {
				"source"			: this.getCardSourceObject(cardData, args),
				"amount"			: this.getFormattedPrice(order),	
				"currency"			: this.getOrderCurrency(args),
				"reference"			: args.OrderNo,
				"capture"			: this.getValue('ckoAutoCapture'),
				"capture_on"		: this.getCaptureTime(),
				"customer"			: this.getOrderCustomer(args),
				"shipping"			: this.getCardShippingObject(args),
				"3ds"				: this.get3Ds(),
				"risk"				: {enabled: true},
				"payment_ip"		: this.getHost(args),
				"metadata"			: this.getMetadataObject(cardData),
			};
		
		return chargeData;
		
	},
    
	
	/*
	 * Build Gateway Source Object
	 */
	getCardSourceObject: function(cardData, args){
		
		// source object
		var source = {
			type				: "card",
			number				: cardData.number,
			expiry_month		: cardData.expiryMonth,
			expiry_year			: cardData.expiryYear,
			name				: cardData.name,
			cvv					: cardData.cvv,
			billing_address		: this.getBillingAddressObject(args),
			phone				: this.getPhoneObject(args)

		}
		
		return source;
		
	},
	
	
	
	/*
	 * Build the Shipping Address object
	 */
	getCardShippingObject: function(args){
		
		// shipping object
		var shippingObject = {
			address				: this.getShippingAddressObject(args),
			phone				: this.getPhoneObject(args)
		};
		
		return shippingObject;
	},
	
	

	/*
	 * Build the Billing object
	 */
	getBillingAddressObject: function(args){
		
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
	 * Build the Shipping Address object
	 */
	getShippingAddressObject: function(args){
		
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
		
		return shippingDetails;
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
	 * return order amount
	 */
	getAmount: function(order){
		
		var amount = this.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order);
		
		return amount;
		
	},
	
	
	
	/*
	 * return order amount
	 */
	getOrderPrice: function(order){
		
		var price = order.totalGrossPrice.value.toFixed(2);
		
		return price;
		
	},
	
	
	
	/*
	 * Format price for cko gateway
	 */
	getFormattedPrice: function(order){
		
		var price = this.getOrderPrice(order);
		
		var currency = this.getOrderCurrency();
		
		var currencyMultiplier = this.getCurrencyMultiplier(currency);
		
		var orderTotalFormated = price * currencyMultiplier;
		
		return orderTotalFormated.toFixed();
	},
	
	
	/*
	 * Currency Conversion Ratio
	 */
	getCurrencyMultiplier: function(currency){
		
		// 100% of value
		var zeroMultiplier = {
			currencies 	: "BIF DJF GNF ISK KMF XAF CLF XPF JPY PYG RWF KRW VUV VND XOF",
			multiplier 	: ''
		}
		
		// 10x 100% of value
		var threeMultiplier = {
			currencies	: "BHD LYD JOD KWD OMR TND",
			multiplier	: '1000'
		}
		
		if(zeroMultiplier.currencies.match(currency)){
			
			return zeroMultiplier.multiple;
			
		}else if(threeMultiplier.currencies.match(currency)){
			
			return threeMultiplier.multiplier;
			
		}else{
			
			return 100;
			
		}
		
	},
	
	

	/*
	 * get Order Currency
	 */
	getOrderCurrency : function(){
		
		var orderId = this.getOrderId();
		
		// load the card and order information
		var order = OrderMgr.getOrder(orderId);
		
		var currency = order.getCurrencyCode();
		
		return currency;
		
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
	 * return customer object
	 */
	getOrderCustomer: function(args){
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
	 * Build 3ds object
	 */
	get3Ds:	function(){
		
		// 3ds object
		var threeDs = {
			"enabled"				: this.getValue('cko3ds'),
			"attempt_n3d"			: this.getValue('ckoN3ds')
		}
		
		return threeDs;
	},
	
	
	
	/*
	 * get Host IP
	 */
	getHost: function(args){
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		var hostIp = order.getRemoteHost()
		
		return hostIp;
	},
	
	
	/*
	 * Build metadata object
	 */
	getMetadataObject: function(Data){
		
		// build the meta data object
		var metaData = {
			udf1				: Data.type,
			integration_data	: this.getCartridgeMeta(),
			platform_data		: "SiteGenesis Version: 19.10 Last Updated: Oct 21, 2019 (Compatibility Mode: 16.2)"
		}

		
		return metaData;
	},
	
	

    /**
     * The cartridge metadata.
     */
    getCartridgeMeta: function() {
        return this.getValue('ckoUserAgent') + ' ' + this.getValue('ckoVersion');
    },
    
    
	
	/*
	 * Return order id
	 */
	getOrderId: function(){
		var orderId = (this.getValue('cko3ds')) ? request.httpParameterMap.get('reference').stringValue : request.httpParameterMap.get('reference').stringValue;
		if(orderId === null){
			orderId = session.privacy.ckoOrderId;
		}
		
		return orderId;
	},
    

    /**
     * Handle a failed payment response.
     */  
    handleFail: function(gResponse) {
        if (gResponse) {
            // Logging
            this.logThis('checkout.com fail response', gResponse);
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
	 * Create an HTTP client to handle request to gateway
	 */
	gatewayClientRequest: function(serviceId, requestData){
		
        var responseData = false;
        var service = ServiceRegistry.get(serviceId);
	    var response = service.call(requestData);
	    
        if (response.status == 'OK') {
        	
            responseData = response.object
            
        }
        
        return responseData;
	},
	
	
		
	/* 
	 * get value from custom preferences
	 */
	getValue: function(field){
		return dw.system.Site.getCurrent().getCustomPreferenceValue(field);
	},
	
	
		
	/*
	 * get the required value for each mode
	 */
	getAppMode: function(){
		
		var appMode = this.getValue('ckoMode');
		
		return appMode;
		
	},
		
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
		
	}
    
    
};

/*
 * Module exports
 */

module.exports = CKOUtils;