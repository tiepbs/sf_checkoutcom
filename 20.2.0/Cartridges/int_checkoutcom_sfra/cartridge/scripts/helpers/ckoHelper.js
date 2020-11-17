'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

/* Card Currency Config */
var ckoCurrencyConfig = require('~/cartridge/scripts/config/ckoCurrencyConfig');
var madaBins = require('~/cartridge/scripts/config/ckoMadaConfig');

/* Sensitive Data Helper */
var sensitiveDataHelper = require('~/cartridge/scripts/helpers/sensitiveDataHelper.js');

/**
 * Utility functions.
 */
var ckoHelper = {
    /**
     * Get a failed payment error message.
     * @returns {string} The message string
     */
    getPaymentFailureMessage: function() {
        return Resource.msg('cko.transaction.failedMessage1', 'cko', null)
        + ' ' + Resource.msg('cko.transaction.failedMessage2', 'cko', null);
    },

    /**
     * Get a failed order error message.
     * @returns {string} The message string
     */
    getOrderFailureMessage: function() {
        return Resource.msg('cko.transaction.failedMessage1', 'cko', null)
        + ' ' + Resource.msg('cko.transaction.failedMessage3', 'cko', null);
    },


    /**
     * Get the user language.
     * @returns {string} The user language code
     */
    getLanguage: function() {
        // eslint-disable-next-line
        return request.locale.replace('_', '-');
    },

    /**
     * Get the site name.
     * @returns {string} The site name
     */
    getSiteName: function() {
        return Site.getCurrent().name;
    },

    /**
     * Get the site hostname.
     * @returns {string} The site host name
     */
    getSiteHostName: function() {
        return Site.getCurrent().httpHostName;
    },

    /**
     * Check if the gateway response is valid.
     * @param {Object} req The HTTP response data
     * @returns {boolean} Is the private shared key valid
     */
    isValidResponse: function(req) {
        var requestKey = req.httpHeaders.authorization;
        var privateSharedKey = this.getAccountKeys().privateSharedKey;

        return requestKey === privateSharedKey;
    },

    /**
     * Get value from custom preferences.
     * @param {string} field The field id
     * @returns {string} The preference value
     */
    getValue: function(field) {
        return Site.getCurrent().getCustomPreferenceValue(field);
    },

    /**
     * Get the site country code from locale.
     * @returns {string} The site  country code
     */
    getSiteCountryCode: function() {
        return Site.getCurrent().defaultLocale.split('_')[1];
    },

    /**
     * Handles string translation with language resource files.
     * @param {string} strValue The string value
     * @param {string} strFile The file name
     * @returns {string} The translated string value
     */
    _: function(strValue, strFile) {
        return Resource.msg(strValue, strFile, null);
    },

    /**
     * Write gateway information to the website's custom log file.
     * @param {string} dataType The data type
     * @param {Object} gatewayData The gateway data
     */
    log: function(dataType, gatewayData) {
        // Create's a deep copy gatewayData, this will prevent data being deleted.
        var cloneGatewayData = JSON.parse(JSON.stringify(gatewayData));
        if (this.getValue('ckoDebugEnabled') === true) {
            // Get the logger
            var logger = Logger.getLogger('ckodebug');

            // Remove sensitive data
            var cleanData = this.removeSensitiveData(cloneGatewayData);

            // Log the data
            if (logger) {
                logger.debug(
                    dataType + ' : {0}',
                    JSON.stringify(cleanData)
                );
            }
        }
    },

    /**
     * Remove sentitive data from the logs.
     * @param {Object} rawData The log data
     * @returns {Object} The filtered data
     */
    removeSensitiveData: function(rawData) {
        var data = rawData;
        if (data) {
            if (Object.prototype.hasOwnProperty.call(data, 'response_data')) {
                if (Object.prototype.hasOwnProperty.call(data.response_data, 'mandate_reference')) { data.response_data.mandate_reference = String.prototype.replace.call(data.response_data.mandate_reference, /\w/gi, '*'); }
            }
            if (Object.prototype.hasOwnProperty.call(data, 'source_data')) {
                data.source_data = sensitiveDataHelper.cleanSourceDataObject(data.source_data);
            }
            if (Object.prototype.hasOwnProperty.call(data, 'source')) {
                data.source = sensitiveDataHelper.cleanSourceObject(data.source);
            }

            if (Object.prototype.hasOwnProperty.call(data, 'customer')) {
                data.customer = sensitiveDataHelper.cleanCustomerObject(data.customer);
            }

            if (Object.prototype.hasOwnProperty.call(data, 'shipping')) {
                data.shipping = sensitiveDataHelper.cleanShippingObject(data.shipping);
            }

            if (Object.prototype.hasOwnProperty.call(data, 'billing_address')) {
                data.billing_address = sensitiveDataHelper.cleanBillingAddress(data.billing_address);
            }
        }

        return data;
    },

    /**
     * Return an order id.
     * @returns {string} The order id
     */
    getOrderId: function() {
        // eslint-disable-next-line
        var orderId = (this.getValue('cko3ds')) ? request.httpParameterMap.get('reference').stringValue : request.httpParameterMap.get('reference').stringValue;
        if (orderId === null) {
            // eslint-disable-next-line
            orderId = session.privacy.ckoOrderId;
        }

        return orderId;
    },

    /**
     * Get the cartridge metadata.
     * @returns {string} The platform data
     */
    getCartridgeMeta: function() {
        return this.getValue('ckoSfraPlatformData');
    },

    /**
     * Get a customer full name.
     * @param {Object} customerProfile The customer profile instance
     * @returns {string} The customer name
     */
    getCustomerFullName: function(customerProfile) {
        var customerName = '';
        customerName += customerProfile.firstName;
        customerName += ' ' + customerProfile.lastName;

        return customerName;
    },

    /**
     * Get the account API keys.
     * @returns {Object} The account keys object
     */
    getAccountKeys: function() {
        var keys = {};
        var str = this.getValue('ckoMode') === 'live' ? 'Live' : 'Sandbox';

        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.secretKey = this.getValue('cko' + str + 'SecretKey');
        keys.privateSharedKey = this.getValue('cko' + str + 'PrivateSharedKey');

        return keys;
    },

    /**
     * Create an HTTP client to handle request to gateway.
     * @param {string} serviceId The service id
     * @param {Object} data The request data
     * @param {string} method The HTTP request method
     * @returns {Object} The HTTP response object
     */
    gatewayClientRequest: function(serviceId, data, method) {
        // eslint-disable-next-line
        method = method || 'POST';
        var serv = this.getService(serviceId);
        var requestData = data;

        // Prepare the request URL and data
        if (Object.prototype.hasOwnProperty.call(requestData, 'chargeId')) {
            var requestUrl = serv.getURL().replace('chargeId', requestData.chargeId);
            serv.setURL(requestUrl);
            delete requestData.chargeId;
        }

        // Set the request method
        serv.setRequestMethod(method);

        // Call the service
        var resp = serv.call(requestData);
        if (resp.status !== 'OK') {
            return resp.error;
        }

        return resp.object;
    },

    /**
     * Get an HTTP service.
     * @param {string} serviceId The service id
     * @returns {Object} The HTTP service instance
     */
    getService: function(serviceId) {
        var parts = serviceId.split('.');
        var entity = parts[1];
        var action = parts[2];
        var mode = parts[3];
        var svcFile = entity + action.charAt(0).toUpperCase() + action.slice(1);
        var svcClass = require('~/cartridge/scripts/services/' + svcFile);

        return svcClass[mode]();
    },

    /**
     * Currency conversion mapping.
     * @param {string} currency The currency code
     * @returns {number} The conversion factor
     */
    getCkoFormatedValue: function(currency) {
        if (ckoCurrencyConfig.x1.currencies.match(currency)) {
            return ckoCurrencyConfig.x1.multiple;
        } else if (ckoCurrencyConfig.x1000.currencies.match(currency)) {
            return ckoCurrencyConfig.x1000.multiple;
        }
        return 100;
    },

    /**
     * Format a price for a gateway request.
     * @param {number} price The price to format
     * @param {string} currency The currency code
     * @returns {number} The formatted price
     */
    getFormattedPrice: function(price, currency) {
        var ckoFormateBy = this.getCkoFormatedValue(currency);
        var orderTotalFormated = price * ckoFormateBy;

        return orderTotalFormated.toFixed();
    },

    /**
     * Get the Checkout.com orders.
     * @param {string} orderNo The order number
     * @returns {Array} The list of orders
     */
    getOrders: function(orderNo) {
        // Prepare the output array
        var data = [];

        // Query the orders
        var result = SystemObjectMgr.querySystemObjects('Order', 'orderNo = {0}', 'creationDate desc', orderNo);

        // Loop through the results
        while (result.hasNext()) {
            // Get the payment instruments
            var item = result.next();
            var paymentInstruments = item.getPaymentInstruments();

            // Loop through the payment instruments
            for (var i = 0; i < paymentInstruments.length; i++) {
                if (this.isCkoItem(paymentInstruments[i].paymentMethod) && !this.containsObject(item, data)) {
                    data.push(item);
                }
            }
        }

        return data;
    },

    /**
     * Checks if an object already exists in an array.
     * @param {Object} obj The object
     * @param {Array} list The list of objects
     * @returns {boolean} If the object is found
     */
    containsObject: function(obj, list) {
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
     * @param {Object} item The payment instrument instance
     * @returns {boolean} If the instance matches conditions
     */
    isCkoItem: function(item) {
        return item.length > 0 && item.indexOf('CHECKOUTCOM_') >= 0;
    },

    /**
     * Return the customer data.
     * @param {Object} order The order instance
     * @returns {Object} The customer data
     */
    getCustomer: function(order) {
        return {
            email: order.customerEmail,
            name: order.customerName,
        };
    },

    /**
     * Return a phone object.
     * @param {Object} billingAddress The billing data
     * @returns {Object} The phone object
     */
    getPhone: function(billingAddress) {
        return {
            country_code: null,
            number: billingAddress.getPhone(),
        };
    },

    /**
     * Strip spaces form a card number.
     * @param {string} num The number to process
     * @returns {string} The processed number
     */
    getFormattedNumber: function(num) {
        return num.toString().replace(/\s/g, '');
    },

    /**
     * Build the shipping data.
     * @param {Object} order The order instance
     * @returns {Object} The shipping data
     */
    getShipping: function(order) {
        // Get shipping address
        var shippingAddress = order.getDefaultShipment().getShippingAddress();

        // Create the address data
        var shippingDetails = {
            address_line1: shippingAddress.getAddress1(),
            address_line2: shippingAddress.getAddress2(),
            city: shippingAddress.getCity(),
            state: shippingAddress.getStateCode(),
            zip: shippingAddress.getPostalCode(),
            country: shippingAddress.getCountryCode().value,
        };

        // Build the shipping data
        var shipping = {
            address: shippingDetails,
            phone: this.getPhone(order.billingAddress),
        };

        return shipping;
    },

    /**
     * Confirm is a payment is valid from API response code.
     * @param {Object} gatewayResponse The gateway response
     * @returns {boolean} The payment success or failure
     */
    paymentSuccess: function(gatewayResponse) {
        if (gatewayResponse && Object.prototype.hasOwnProperty.call(gatewayResponse, 'response_code')) {
            return gatewayResponse.response_code === '10000'
            || gatewayResponse.response_code === '10100'
            || gatewayResponse.response_code === '10200';
        }

        return false;
    },

    /**
     * Confirm is a payment is valid from API redirect response code.
     * @param {Object} gatewayResponse The gateway response
     * @returns {boolean} Is redirection needed
     */
    redirectPaymentSuccess: function(gatewayResponse) {
        if (Object.prototype.hasOwnProperty.call(gatewayResponse, 'actions')) {
            return gatewayResponse
          && (gatewayResponse.actions[0].response_code === '10000'
          || gatewayResponse.actions[0].response_code === '10100'
          || gatewayResponse.actions[0].response_code === '10200');
        }

        if (Object.prototype.hasOwnProperty.call(gatewayResponse.source, 'type') && gatewayResponse.source.type === 'sofort') {
            return true;
        }

        return false;
    },

    /**
     * Write the order information to session for the current shopper.
     * @param {Object} gatewayResponse The gateway response
     */
    updateCustomerData: function(gatewayResponse) {
        if ((gatewayResponse) && Object.prototype.hasOwnProperty.call(gatewayResponse, 'card')) {
            Transaction.wrap(function() {
                // eslint-disable-next-line
                if (session.customer.profile !== null) {
                    // eslint-disable-next-line
                    session.customer.profile.custom.ckoCustomerId = gatewayResponse.card.customerId;
                }
            });
        }
    },

    /**
     * Get the basket quantities.
     * @param {Object} args The method arguments
     * @returns {number} The basked quantities
     */
    getQuantity: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        var quantity = order.getProductQuantityTotal();

        return quantity;
    },

    /**
     * Get the billing descriptor object from custom preferences.
     * @returns {Object} The billing descriptor data
     */
    getBillingDescriptor: function() {
        var billingDescriptor = {
            name: this.getValue('ckoBillingDescriptor1'),
            city: this.getValue('ckoBillingDescriptor2'),
        };

        return billingDescriptor;
    },

    /**
     * Get the products information.
     * @param {Object} args The method arguments
     * @returns {Object} The product information
     */
    getProductInformation: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);
        var it = order.productLineItems.iterator();
        var products = [];

        // Loop through the itemd
        while (it.hasNext()) {
            var pli = it.next();

            // Product id
            var product = {
                product_id: pli.productID,
                quantity: pli.quantityValue,
                price: this.getFormattedPrice(
                    pli.adjustedPrice.value.toFixed(2),
                    args.order.getCurrencyCode()
                ),
                description: pli.productName,
            };

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

    /**
     * Return the tax object.
     * @param {Object} args The method arguments
     * @returns {Object} The tax data
     */
    getTaxObject: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Prepare the tax data
        var tax = {
            product_id: args.orderNo,
            quantity: 1,
            price: this.getFormattedPrice(
                order.getTotalTax().valueOf().toFixed(2),
                args.order.getCurrencyCode()
            ),
            description: 'Order Tax',
        };

        // Test the order
        if (order.getTotalTax().valueOf() > 0) {
            return tax;
        }
        return false;
    },

    /**
     * Return the shipping object.
     * @param {Object} args The method arguments
     * @returns {Object} The shipping data
     */
    getShippingValue: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Get shipping address object
        var shipping = order.getDefaultShipment();

        // Check if shipping cost is applicable to this order
        if (shipping.getShippingTotalPrice().valueOf() > 0) {
            var shippment = {
                product_id: shipping.getShippingMethod().getID(),
                quantity: 1,
                price: this.getFormattedPrice(shipping.adjustedShippingTotalPrice.value.toFixed(2), this.getCurrency()),
                description: shipping.getShippingMethod().getDisplayName() + ' Shipping : ' + shipping.getShippingMethod().getDescription(),
            };

            return shippment;
        }
        return null;
    },

    /**
     * Return the order currency code.
     * @param {Object} args The method arguments
     * @returns {string} The currency code
     */
    getCurrencyCode: function(args) {
        // Get the order
        var order = OrderMgr.getOrder(args.orderNo);

        // Get shipping address object
        var shipping = order.getDefaultShipment().getShippingMethod();
        var shippingCurrency = shipping.getCurrencyCode();

        return shippingCurrency;
    },

    /**
     * Get the product names.
     * @param {Object} args The method arguments
     * @returns {Array} The products list
     */
    getProductNames: function(args) {
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

    /**
     * Get the product price array.
     * @param {Object} args The method arguments
     * @returns {Array} The prices list
     */
    getProductPrices: function(args) {
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

    /**
     * Get the product IDs.
     * @param {Object} args The method arguments
     * @returns {Array} The product ids list
     */
    getProductIds: function(args) {
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

    /**
     * Get each product quantity.
     * @param {Object} args The method arguments
     * @returns {Array} The product quantities list
     */
    getProductQuantity: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Prepare the iterator
        var it = order.productLineItems.iterator();

        // Loop through the items
        var productsQuantities = 0;
        while (it.hasNext()) {
            var pli = it.next();
            productsQuantities += pli.quantityValue;
        }

        return productsQuantities;
    },

    /**
     * Return an order amount.
     * @param {Object} order The order instance
     * @returns {number} The amount
     */
    getAmount: function(order) {
        var amount = this.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), order.getCurrencyCode());
        return amount;
    },

    /**
     * Return a customer full name.
     * @param {Object} args The method arguments
     * @returns {string} The customer name
     */
    getCustomerName: function(args) {
        // Load the order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var fullname = billingAddress.getFullName();

        return fullname;
    },

    /**
     * Return the capture time.
     * @returns {Object} The capture time
     */
    getCaptureTime: function() {
        // Get the current date/time in milliseconds
        var now = Date.now();

        // Get the capture time configured, or min time 0.5 minute if 0
        var configCaptureTime = this.getValue('ckoAutoCaptureTime');
        var captureOnMin = configCaptureTime < 2 ? 2 : configCaptureTime;

        // Convert the capture time from minutes to milliseconds
        var captureOnMs = now + (parseInt(captureOnMin) * 60000);

        // Convert the capture time to ISO 8601 format
        return new Date(captureOnMs).toISOString();
    },

    /**
     * Build a 3ds object.
     * @returns {Object} The 3ds data
     */
    get3Ds: function() {
        // 3ds object
        var treeDs = {
            enabled: this.getValue('cko3ds'),
            attempt_n3d: this.getValue('ckoN3ds'),
        };

        return treeDs;
    },

    /**
     * Build metadata object.
     * @param {Object} data The request data
     * @param {string} processorId The processor id
     * @returns {Object} The metadata
     */
    getMetadata: function(data, processorId) {
        // Prepare the base metadata
        var meta = {
            integration_data: this.getCartridgeMeta(),
            platform_data: this.getValue('ckoSfraPlatformData'),
        };

        // Add the data info if needed
        if (Object.prototype.hasOwnProperty.call(data, 'type')) {
            meta.udf1 = data.type;
        }

        // Add the payment processor to the metadata
        meta.payment_processor = processorId;

        return meta;
    },

    /**
     * Returns true if card is a mada card
     * @param {string} card number 
     * @returns {boolean} card type
     */
    isMadaCard: function(card) {
        // First 6 card number
        var cardNumber = card.slice(0,6);
        // First card number
        var firstNumber = card.charAt(0);
        
        switch(firstNumber) {
            case '4':
                return madaBins.four.some(function(element){ return element === cardNumber });
            case '5':
                return madaBins.five.some(function(element){ return element === cardNumber });
            case '6':
                return madaBins.six.some(function(element){ return element === cardNumber });
            case '9':
                return madaBins.nine.some(function(element){ return element === cardNumber });
            default:
                return false
        }
    },

    /**
     * Get the billing country.
     * @param {Object} args The method arguments
     * @returns {string} The billing country code
     */
    getBillingCountry: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.orderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var country = billingAddress.getCountryCode().value;

        return country;
    },

    /**
     * Get the billing object.
     * @param {Object} args The method arguments
     * @returns {Object} The billing object
     */
    getBilling: function(args) {
        // Get billing address information
        var billingAddress = args.order.getBillingAddress();

        // Creating billing address object
        var billingDetails = {
            address_line1: billingAddress.getAddress1(),
            address_line2: billingAddress.getAddress2(),
            city: billingAddress.getCity(),
            state: billingAddress.getStateCode(),
            zip: billingAddress.getPostalCode(),
            country: billingAddress.getCountryCode().value,
        };

        return billingDetails;
    },

    /**
     * Get product quantities from a basket.
     * @param {Object} basket The basket instance
     * @returns {Array} The list of quantities
     */
    getBasketObject: function(basket) {
        var currency = basket.getCurrencyCode();
        var productsQuantities = [];
        var it = basket.productLineItems.iterator();
        while (it.hasNext()) {
            var pli = it.next();
            var productTaxRate = pli.taxRate * 100 * 100;
            var productQuantity = pli.quantityValue;
            var unitPrice = Math.round(this.getFormattedPrice(pli.adjustedGrossPrice.value.toFixed(2), currency) / productQuantity);
            var totalAmount = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency);
            var products = {
                name: pli.productName,
                quantity: productQuantity.toString(),
                unit_price: unitPrice.toString(),
                tax_rate: productTaxRate.toString(),
                total_amount: totalAmount.toString(),
                total_tax_amount: this.getFormattedPrice(pli.adjustedTax.value, currency),
            };

            productsQuantities.push(products);
        }
        var shippingTaxRate = basket.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
        var shipping = {
            name: basket.defaultShipment.shippingMethod.displayName + ' Shipping',
            quantity: '1',
            unit_price: this.getFormattedPrice(basket.shippingTotalGrossPrice.value, currency),
            tax_rate: shippingTaxRate.toString(),
            total_amount: this.getFormattedPrice(basket.shippingTotalGrossPrice.value, currency),
            total_tax_amount: this.getFormattedPrice(basket.shippingTotalTax.value, currency),
        };

        if (basket.shippingTotalPrice.value > 0) {
            productsQuantities.push(shipping);
        }

        return productsQuantities;
    },

    /**
     * Get product quantities from an order.
     * @param {Object} args The method arguments
     * @returns {Array} The list of quantities
     */
    getOrderBasketObject: function(args) {
        // Prepare some variables
        var currency = args.order.getCurrencyCode();
        var it = args.order.productLineItems.iterator();
        var productsQuantites = [];

        // Iterate through the products
        while (it.hasNext()) {
            var pli = it.next();
            var productTaxRate = pli.taxRate * 100 * 100;
            var productQuantity = pli.quantityValue;
            var unitPrice = Math.round(this.getFormattedPrice(pli.adjustedGrossPrice.value.toFixed(2), currency) / productQuantity);
            var totalAmount = this.getFormattedPrice(pli.adjustedGrossPrice.value, currency);
            var products = {
                name: pli.productName,
                quantity: productQuantity.toString(),
                unit_price: unitPrice.toString(),
                tax_rate: productTaxRate.toString(),
                total_amount: totalAmount.toString(),
                total_tax_amount: this.getFormattedPrice(pli.adjustedTax.value, currency),
            };

            productsQuantites.push(products);
        }

        // Set the shipping variables
        var shippingTaxRate = args.order.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
        var shipping = {
            name: args.order.defaultShipment.shippingMethod.displayName + ' Shipping',
            quantity: '1',
            unit_price: this.getFormattedPrice(args.order.shippingTotalGrossPrice.value, currency),
            tax_rate: shippingTaxRate.toString(),
            total_amount: this.getFormattedPrice(args.order.shippingTotalGrossPrice.value, currency),
            total_tax_amount: this.getFormattedPrice(args.order.shippingTotalTax.value, currency),
        };

        if (args.order.shippingTotalPrice.value > 0) {
            productsQuantites.push(shipping);
        }

        return productsQuantites;
    },

    /**
     * Return the basket billing address.
     * @param {Object} basket The basket instance
     * @returns {Object} The billing address
     */
    getBasketAddress: function(basket) {
        var address = {
            given_name: basket.billingAddress.firstName,
            family_name: basket.billingAddress.lastName,
            email: null,
            title: basket.billingAddress.title,
            street_address: basket.billingAddress.address1,
            street_address2: basket.billingAddress.address2,
            postal_code: basket.billingAddress.postalCode,
            city: basket.billingAddress.city,
            phone: basket.billingAddress.phone,
            country: basket.defaultShipment.shippingAddress.countryCode.valueOf(),
        };

        return address;
    },

    // /**
    //  * Return the order billing address.
    //  * @param {Object} args The method arguments
    //  * @returns {Object} The billing address
    //  */
    // getOrderAddress: function(args) {
    //     var address = {
    //         given_name: args.order.defaultShipment.shippingAddress.firstName,
    //         family_name: args.order.defaultShipment.shippingAddress.lastName,
    //         email: args.order.customerEmail,
    //         title: args.order.defaultShipment.shippingAddress.title,
    //         street_address: args.order.defaultShipment.shippingAddress.address1,
    //         street_address2: args.order.defaultShipment.shippingAddress.address2,
    //         postal_code: args.order.defaultShipment.shippingAddress.postalCode,
    //         city: args.order.defaultShipment.shippingAddress.city,
    //         phone: args.order.defaultShipment.shippingAddress.phone,
    //         country: args.order.defaultShipment.shippingAddress.countryCode.valueOf(),
    //     };

    //     return address;
    // },

        /**
     * Return the order billing address.
     * @param {Object} billing The method arguments
     * @returns {Object} The billing address
     */
    getBillingAddress: function() {
        var basket = BasketMgr.getCurrentBasket();
        var form = session.getForms();
        var shippingForm = form.shipping; 
        var addressFields = shippingForm.shippingAddress.addressFields;

        // Address line 2
        var address2 = addressFields.address2.htmlValue;

        // Address Coutry 
        var country1 = addressFields.country.htmlValue;
        var country2 = basket.defaultShipment.shippingAddress.countryCode.valueOf();

        var address = {
            given_name: addressFields.firstName.htmlValue,
            family_name: addressFields.lastName.htmlValue,
            email: null,
            title: null,
            street_address: addressFields.address1.htmlValue,
            street_address2: address2 ? address2 : null,
            postal_code: addressFields.postalCode.htmlValue,
            city: addressFields.city.htmlValue,
            phone: addressFields.phone.htmlValue,
            country: country1 ? country1 : country2,
        };

        return address;
    },

    /**
     * Return the order billing address.
     * @param {Object} args The method arguments
     * @returns {Object} The billing address
     */
    getOrderAddress: function(args) {
        var basket = BasketMgr.getCurrentBasket();
        var form = session.getForms();
        var shippingForm = form.shipping; 
        var addressFields = shippingForm.shippingAddress.addressFields;

        // Address line 2
        var address2 = addressFields.address2.htmlValue;

        // Address Coutry 
        var country1 = addressFields.country.htmlValue;
        var country2 = args.order.defaultShipment.shippingAddress.countryCode.valueOf();

        var address = {
            given_name: addressFields.firstName.htmlValue,
            family_name: addressFields.lastName.htmlValue,
            email: args.order.customerEmail,
            title: null,
            street_address: addressFields.address1.htmlValue,
            street_address2: address2 ? address2 : null,
            postal_code: addressFields.postalCode.htmlValue,
            city: addressFields.city.htmlValue,
            phone: addressFields.phone.htmlValue,
            country: country1 ? country1 : country2,
        };

        return address;
    },

    /**
     * Rebuild the basket contents after a failed payment.
     * @param {Object} order The order
     */
    checkAndRestoreBasket: function(order) {
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
                newGCLI = basket.createGiftCertificateLineItem(gcli.priceValue, gcli.recipientEmail);

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
};

/**
 * Module exports
 */
module.exports = ckoHelper;
