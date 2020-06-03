"use strict"

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var BasketMgr = require('dw/order/BasketMgr');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

/* Card Currency Config */
var ckoCurrencyConfig = require('~/cartridge/scripts/config/ckoCurrencyConfig');

/*
* Utility functions for my cartridge integration.
*/
var ckoHelper = {  
    /*
     * Get the required value for each mode
     */
    getAppModeValue: function (sandboxValue, liveValue) {
        var appMode = this.getValue('ckoMode');
        if (appMode == 'sandbox') {
            return sandboxValue;
        } else {
            return liveValue;
        }
    },
    
    /*
     * Get a failed payment error message
     */
    getPaymentFailureMessage: function () {        
        return Resource.msg('cko.transaction.failedMessage1', 'cko', null)
        + '. ' + Resource.msg('cko.transaction.failedMessage2', 'cko', null);
    },

    /*
     * Get user language
     */
    getLanguage: function () {        
        return request.locale.replace('_', '-');
    },
    
    /*
     * Get Site Name
     */
    getSiteName: function () {        
        return dw.system.Site.getCurrent().name;
    },
    
    /*
     * Get site Hostname
     */
    getSiteHostName: function () {        
        return dw.system.Site.getCurrent().httpHostName;
    },
    
    /*
     * Check if the gateway response is valid.
     */
    isValidResponse: function (req) {
        var requestKey = req.httpHeaders['authorization'];
        var privateSharedKey = this.getAccountKeys().privateSharedKey;

        return requestKey == privateSharedKey;
    },
    
    /*
     * Get value from custom preferences
     */
    getValue: function (field) {
        return dw.system.Site.getCurrent().getCustomPreferenceValue(field);
    },

    /*
     * Get site country code from locale
     */
    getSiteCountryCode: function () {
        return Site.getCurrent().defaultLocale.split('_')[1];
    },
    
    /*
     * Handles string translation with language resource files.
     */
    _: function (strValue, strFile) {
        return Resource.msg(strValue, strFile, null);
    },
    
    /*
     * Write gateway information to the website's custom log files
     */
    doLog: function (dataType, gatewayData) {
        if (this.getValue("ckoDebugEnabled") == true) {
            var logger = Logger.getLogger('ckodebug');
            if (logger) {
                logger.debug(
                    dataType + ' : {0}',
                    JSON.stringify(gatewayData)
                );
            }
        }
    },

    /*
     * Return order id
     */
    getOrderId: function () {
        var orderId = (this.getValue('cko3ds')) ? request.httpParameterMap.get('reference').stringValue : request.httpParameterMap.get('reference').stringValue;
        if (orderId === null) {
            orderId = session.privacy.ckoOrderId;
        }
        
        return orderId;
    },
    
    /*
     * Cartridge metadata.
     */
    getCartridgeMeta: function () {
        return this.getValue("ckoUserAgent") + ' ' + this.getValue("ckoVersion");
    },
   
    /*
     * Get a customer full name
     */
    getCustomerFullName: function(customerProfile) { 
        var customerName = '';
        customerName += customerProfile.firstName;
        customerName += ' ' + customerProfile.lastName;
        
        return customerName;
    },

    /*
     * Get Account API Keys
     */
    getAccountKeys: function () {
        var keys = {};
        var str = this.getValue('ckoMode') == 'live' ? 'Live' : 'Sandbox';

        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.secretKey = this.getValue('cko' +  str + 'SecretKey');
        keys.privateSharedKey = this.getValue('cko' +  str + 'PrivateSharedKey');

        return keys;
    },
    
    /*
     * Create an HTTP client to handle request to gateway
     */
    gatewayClientRequest: function (serviceId, requestData, method) {
        var method = method || 'POST';
        var serv = this.getService(serviceId);
      
        // Prepare the request URL and data
        if (requestData.hasOwnProperty('chargeId')) {
            var requestUrl = serv.getURL().replace('chargeId', requestData.chargeId);
            serv.setURL(requestUrl);
            delete requestData['chargeId'];
        }

        // Set the request method
        serv.setRequestMethod(method);
             
        // Call the service
        var resp = serv.call(requestData);
        if (resp.status != 'OK') {
            return resp.error;
        }

        return resp.object;
    },

    getService: function (serviceId) {
        var parts  =  serviceId.split('.');
        var entity = parts[1];
        var action = parts[2];
        var mode = parts[3];
        var svcFile = entity + action.charAt(0).toUpperCase() + action.slice(1);
        var svcClass = require('~/cartridge/scripts/services/' + svcFile);

        return svcClass[mode]();
    },
    
    /*
     * Currency Conversion Ratio
     */
    getCkoFormatedValue: function (currency) {
        if (ckoCurrencyConfig.x1.currencies.match(currency)) {
            return ckoCurrencyConfig.x1.multiple;
        } else if (ckoCurrencyConfig.x1000.currencies.match(currency)) {
            return ckoCurrencyConfig.x1000.multiple;
        } else {
            return 100;
        }
    },
    
    /*
     * Format price for cko gateway
     */
    getFormattedPrice: function (price, currency) {
        var ckoFormateBy = this.getCkoFormatedValue(currency);
        var orderTotalFormated = price * ckoFormateBy;
        
        return orderTotalFormated.toFixed();
    },
    
    /**
     * Get the Checkout.com orders.
     */
    getOrders: function () {
        // Prepare the output array
        var data = [];
    
        // Query the orders
        var result  = SystemObjectMgr.querySystemObjects('Order', '', 'creationDate desc');
        
        // Loop through the results
        for each(var item in result) {
            // Get the payment instruments
            var paymentInstruments = item.getPaymentInstruments();
            
            // Loop through the payment instruments
            for each(var instrument in paymentInstruments) {
                if (this.isCkoItem(instrument.paymentMethod) && !this.containsObject(item, data)) {
                    data.push(item);
                }
            }
        }

        return data;
    },
    
    /**
     * Checks if an object already exists in an array.
     */
    containsObject: function (obj, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i] === obj) {
                return true;
            }
        }

        return false;
    },

    /**
     * Checks if a payment instrument is Checkout.com.
     */
    isCkoItem: function(item) {
        return item.length > 0 && item.indexOf('CHECKOUTCOM_') >= 0;
    },

    /*
     * Return the customer data
     */
    getCustomer: function(order) {        
        return {
            email: order.customerEmail,
            name: order.customerName
        };
    },

    /*
     * Return phone object
     */
    getPhone: function(billingAddress) {      
        return {
            country_code        : null,
            number              : billingAddress.getPhone()
        };
    },

    /*
     * Strip spaces form number
     */
    getFormattedNumber: function (num) {
        return num.toString().replace(/\s/g, '');
    },

    /*
     * Build the shipping data
     */
    getShipping: function (order) {
        // Get shipping address
        var shippingAddress = order.getDefaultShipment().getShippingAddress();
        
        // Create the address data
        var shippingDetails = {
            address_line1       : shippingAddress.getAddress1(),
            address_line2       : shippingAddress.getAddress2(),
            city                : shippingAddress.getCity(),
            state               : shippingAddress.getStateCode(),
            zip                 : shippingAddress.getPostalCode(),
            country             : shippingAddress.getCountryCode().value
        };
        
        // Build the shipping data
        var shipping = {
            address             : shippingDetails,
            phone               : this.getPhone(order.billingAddress)
        };
        
        return shipping;
    },
    
    /*
     * Confirm is a payment is valid from API response code
     */
    paymentSuccess: function (gatewayResponse) {
        if (gatewayResponse && gatewayResponse.hasOwnProperty('response_code')) {
            return gatewayResponse.response_code == "10000" 
            || gatewayResponse.response_code == '10100'
            || gatewayResponse.response_code == '10200';
        }

        return false;
    },
    
    /*
     * Confirm is a payment is valid from API redirect response code
     */
    redirectPaymentSuccess: function (gatewayResponse) {
        return gatewayResponse
        && (gatewayResponse.actions[0].response_code == "10000"
        || gatewayResponse.actions[0].response_code == '10100'
        || gatewayResponse.actions[0].response_code == '10200');
    },
    
    /*
     * Write order information to session for the current shopper.
     */
    updateCustomerData: function (gatewayResponse) {
        if ((gatewayResponse) && gatewayResponse.hasOwnProperty('card')) {
            Transaction.wrap(function () {
                if (session.customer.profile !== null) {
                    session.customer.profile.custom.ckoCustomerId = gatewayResponse.card.customerId;
                }
            });
        }
    },
    
    /*
     * Rebuild basket contents after a failed payment.
     */
    checkAndRestoreBasket: function (order) {
        var basket = BasketMgr.getCurrentOrNewBasket();
        var it;
        var pli;
        var newPLI;
        var gcit;
        var gcli;
        var newGCLI;
        var billingAddress;
        var shippingAddress;
        
        if (order && basket && basket.productLineItems.size() === 0 && basket.giftCertificateLineItems.size() === 0) {
            Transaction.begin();
            
            it = order.productLineItems.iterator();
            
            while (it.hasNext()) {
                pli = it.next();
                newPLI = basket.createProductLineItem(pli.productID, basket.defaultShipment);
                newPLI.setQuantityValue(pli.quantity.value);
            }
            
            gcit = order.giftCertificateLineItems.iterator();
            while (gcit.hasNext()) {
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
            
            // Commit the transaction
            Transaction.commit();
        }
    },
    
    /*
     * Get Basket Quantities
     */
    getQuantity : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        var quantity = order.getProductQuantityTotal();
        
        return quantity; 
    },
    
    /*
     * Get Billing Descriptor Object from custom preferences
     */
    getBillingDescriptor : function () {
        
        var billingDescriptor = {
            "name"  : this.getValue('ckoBillingDescriptor1'),
            "city"  : this.getValue('ckoBillingDescriptor2')
        }
        
        return billingDescriptor;
    },
    
    /*
     * Get Products Information
     */
    getProductInformation : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        var it = order.productLineItems.iterator();
        var products = [];

        // Loop through the itemd
        while (it.hasNext()) {
            var pli = it.next();
            
            // Product id
            var product = {
                "product_id"    : pli.productID,
                "quantity"      : pli.quantityValue,
                "price"         : this.getFormattedPrice(
                    pli.adjustedPrice.value.toFixed(2),
                    args.order.getCurrencyCode()
                ),
                "description"   : pli.productName
            }
            
            // Push to products array
            products.push(product);
        }
        
        if (this.getShippingValue(args)) {
            products.push(this.getShippingValue(args));
        }
        
        if (this.getTaxObject(args)) {
            products.push(this.getTaxObject(args));
        }
        
        return products;
    },
    
    /*
     * Return tax object
     */
    getTaxObject : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        
        // Prepare the tax data
        var tax = {
            "product_id"    : args.orderNo,
            "quantity"      : 1,
            "price"         : this.getFormattedPrice(
                order.getTotalTax().valueOf().toFixed(2),
                args.order.getCurrencyCode()
            ),
            "description"   : "Order Tax"
        }
        
        // Test the order
        if (order.getTotalTax().valueOf() > 0) {
            return tax;
        } else {
            return false;
        }
    },
        
    /*
     * return shipping object
     */
    getShippingValue : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Get shipping address object
        var shipping = order.getDefaultShipment();
        
        // Check if shipping cost is applicable to this order
        if (shipping.getShippingTotalPrice().valueOf() > 0) {
            var shippment = {
                "product_id"    : shipping.getShippingMethod().getID(),
                "quantity"      : 1,
                "price"         : this.getFormattedPrice(shipping.adjustedShippingTotalPrice.value.toFixed(2), this.getCurrency()),
                "description"   : shipping.getShippingMethod().getDisplayName() + " Shipping : " + shipping.getShippingMethod().getDescription()
            }
            
            return shippment;
        } else {
            return false;
        }
    },
    
    /*
     * Return Order Currency Code
     */
    getCurrencyCode: function (args) {
        // Get the order
        var order = OrderMgr.getOrder(args.orderNo);

        // Get shipping address object
        var shipping = order.getDefaultShipment().getShippingMethod();
        var shippingCurrency = shipping.getCurrencyCode();
        
        return shippingCurrency;
    },

    /*
     * Get Product Names
     */
    getProductNames : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Prepare the iterator
        var it = order.productLineItems.iterator();

        // Prepare the product array
        var products = [];
        while (it.hasNext()) {
            var pli = it.next();
            products.push(pli.productName);
        }
        
        return products;
    },

    /*
     * get Product price array
     */
    getProductPrices : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        
        // Get the product itemas
        var items = order.productLineItems.iterator();

        // Prepare the product array
        var products = [];
        while (items.hasNext()) {
            var item = items.next();
            products.push(item.getPriceValue());
        }
        
        return products;
    },
    
    /*
     * Get Product IDs
     */
    getProductIds : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        var it = order.productLineItems.iterator();
        var productIds = [];
        while (it.hasNext()) {
            var pli = it.next();
            productIds.push(pli.productID);
        }
        
        return productIds;
    },
    
    /*
     * Get Each Product Quantity
     */
    getProductQuantity : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        
        // Prepare the iterator
        var it = order.productLineItems.iterator();
        
        // Loop through the items
        var products_quantites = 0;
        while (it.hasNext()) {
            var pli = it.next();
            products_quantites += pli.quantityValue;
        }
        
        return products_quantites;
    },
        
    /*
     * Get Each Product Quantity
     */
    getProductQuantities : function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        
        // Prepare the iterator
        var it = order.productLineItems.iterator();

        // Loop through the items
        var products_quantites = [];
        while (it.hasNext()) {
            var pli = it.next();
            products_quantites.push(pli.quantityValue);
        }
        
        return products_quantites;
    },

    /*
     * Return order amount
     */
    getAmount: function (order) {
        var amount = this.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode());
        return amount;
    },
    
    /*
     * Return Customer FullName
     */
    getCustomerName: function (args) {
        // Load the order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var fullname = billingAddress.getFullName();
        
        return fullname;
    },
        
    /*
     * Return capture time
     */
    getCaptureTime: function () {
        // Get the current date/time in milliseconds
        var now = Date.now();

        // Get the capture time configured, or min time 0.5 minute if 0
        var configCaptureTime = this.getValue('ckoAutoCaptureTime');
        var captureOnMin = configCaptureTime > 0 ? configCaptureTime : 0.5;

        // Convert the capture time from minutes to milliseconds
        var captureOnMs = now + parseInt(captureOnMin) * 60000;

        // Convert the capture time to ISO 8601 format
        return new Date(captureOnMs).toISOString();
    },
    
    /*
     * Build 3ds object
     */
    get3Ds: function () {
        // 3ds object
        var ds = {
            "enabled"               : this.getValue('cko3ds'),
            "attempt_n3d"           : this.getValue('ckoN3ds')
        }
        
        return ds;
    },
    
    /*
     * Build metadata object
     */
    getMetadata: function (data, processorId) {
        // Prepare the base metadata
        var meta = {
            integration_data: this.getCartridgeMeta(),
            platform_data: this.getValue('ckoPlatformData')
        }

        // Add the data info if needed
        if (data.hasOwnProperty('type')) {
            meta.udf1 = data.type;
        }

        // Add the payment processor to the metadata
        meta.payment_processor = processorId;
    
        return meta;
    },
    
    /*
     * Get Billing Country
     */
    getBillingCountry: function (args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var country = billingAddress.getCountryCode().value
        
        return country;
    },

    // Build the Billing object
    getBilling: function (args) {

        // Get billing address information
        var billingAddress = args.order.getBillingAddress();
        
        // Creating billing address object
        var billingDetails = {
            address_line1       : billingAddress.getAddress1(),
            address_line2       : billingAddress.getAddress2(),
            city                : billingAddress.getCity(),
            state               : billingAddress.getStateCode(),
            zip                 : billingAddress.getPostalCode(),
            country             : billingAddress.getCountryCode().value
        };
        
        return billingDetails;
    },
    
    /*
     * Return Basket Item object
     */
    getBasketObject: function (basket) {
        var currency = this.getAppModeValue('GBP', basket.getCurrencyCode());
        var products_quantites = [];
        var it = basket.productLineItems.iterator();
        while (it.hasNext()) {
            var pli = it.next();
            var productTaxRate = pli.taxRate * 100 * 100;
            var productQuantity = pli.quantityValue;
            var unitPrice = Math.round(this.getFormattedPrice(pli.adjustedGrossPrice.value.toFixed(2), currency) / productQuantity);
            var totalAmount = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency);
            var products = {
                "name"              : pli.productName,
                "quantity"          : productQuantity.toString(),
                "unit_price"        : unitPrice.toString(),
                "tax_rate"          : productTaxRate.toString(),
                "total_amount"      : totalAmount.toString(),
                "total_tax_amount"  : this.getFormattedPrice(pli.adjustedTax.value, currency)
            }
            
            products_quantites.push(products);
        }
        var shippingTaxRate = basket.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
        var shipping = {
            "name"              : basket.defaultShipment.shippingMethod.displayName + " Shipping",
            "quantity"          : '1',
            "unit_price"        : this.getFormattedPrice(basket.shippingTotalGrossPrice.value, currency),
            "tax_rate"          : shippingTaxRate.toString(),
            "total_amount"      : this.getFormattedPrice(basket.shippingTotalGrossPrice.value, currency),
            "total_tax_amount"  : this.getFormattedPrice(basket.shippingTotalTax.value, currency)
        }
        
        if (basket.shippingTotalPrice.value > 0) {
            products_quantites.push(shipping);
        }
        
        return products_quantites;
    },
    
    /*
     * Return Basket Item object
     */
    getOrderBasketObject: function (args) {
        // Prepare some variables
        var order = OrderMgr.getOrder(args.orderNo);
        var currency = this.getAppModeValue('GBP', order.getCurrencyCode());
        var it = order.productLineItems.iterator();
        var products_quantites = [];
        
        // Iterate through the products
        while (it.hasNext()) {
            var pli = it.next();
            var productTaxRate = pli.taxRate * 100 * 100;
            var productQuantity = pli.quantityValue;
            var unitPrice = Math.round(this.getFormattedPrice(pli.adjustedGrossPrice.value.toFixed(2), currency) / productQuantity);
            var totalAmount = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency);
            var products = {
                "name"              : pli.productName,
                "quantity"          : productQuantity.toString(),
                "unit_price"        : unitPrice.toString(),
                "tax_rate"          : productTaxRate.toString(),
                "total_amount"      : totalAmount.toString(),
                "total_tax_amount"  : this.getFormattedPrice(pli.adjustedTax.value, currency)
            }
            
            products_quantites.push(products);
        }

        // Set the shipping variables
        var shippingTaxRate = order.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
        var shipping = {
            "name"              : order.defaultShipment.shippingMethod.displayName + " Shipping",
            "quantity"          : '1',
            "unit_price"        : this.getFormattedPrice(order.shippingTotalGrossPrice.value, currency),
            "tax_rate"          : shippingTaxRate.toString(),
            "total_amount"      : this.getFormattedPrice(order.shippingTotalGrossPrice.value, currency),
            "total_tax_amount"  : this.getFormattedPrice(order.shippingTotalTax.value, currency)
        }
        
        if (order.shippingTotalPrice.value > 0) {
            products_quantites.push(shipping);
        }
        
        return products_quantites;
    },
    
    /*
     * Return Basket Item CountryCode
     */
    getBasketCountyCode: function (basket) {
        var countyCode = basket.defaultShipment.shippingAddress.countryCode.valueOf();
        return countyCode;
    },
    
    /*
     * Return Basket Item CountryCode
     */
    getBasketAddress: function (basket) {
        var address = {
            given_name                  : basket.defaultShipment.shippingAddress.firstName,
            family_name                 : basket.defaultShipment.shippingAddress.lastName,
            email                       : null,
            title                       : basket.defaultShipment.shippingAddress.title,
            street_address              : basket.defaultShipment.shippingAddress.address1,
            street_address2             : basket.defaultShipment.shippingAddress.address2,
            postal_code                 : basket.defaultShipment.shippingAddress.postalCode,
            city                        : basket.defaultShipment.shippingAddress.city,
            phone                       : basket.defaultShipment.shippingAddress.phone,
            country                     : basket.defaultShipment.shippingAddress.countryCode.valueOf()
            
        }
        
        return address;
    },
    
    /*
     * Return Basket Item CountryCode
     */
    getOrderBasketAddress: function (args) {
        var order = OrderMgr.getOrder(args.orderNo);
        var address = {
            given_name                  : order.defaultShipment.shippingAddress.firstName,
            family_name                 : order.defaultShipment.shippingAddress.lastName,
            email                       : order.customerEmail,
            title                       : order.defaultShipment.shippingAddress.title,
            street_address              : order.defaultShipment.shippingAddress.address1,
            street_address2             : order.defaultShipment.shippingAddress.address2,
            postal_code                 : order.defaultShipment.shippingAddress.postalCode,
            city                        : order.defaultShipment.shippingAddress.city,
            phone                       : order.defaultShipment.shippingAddress.phone,
            country                     : order.defaultShipment.shippingAddress.countryCode.valueOf()
        }
        
        return address;
    }
}

/*
* Module exports
*/
module.exports = ckoHelper;