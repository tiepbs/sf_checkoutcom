'use strict';

/**
 * API includes.
 */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var PaymentMgr = require('dw/order/PaymentMgr');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

// Card Currency Config
var ckoCurrencyConfig = require('~/cartridge/scripts/config/ckoCurrencyConfig');

/**
 * Module ckoHelper.
 */
var ckoHelper = {
    /**
     * CKO Response object.
     * @param {Object} data Format a gateway response
     * @returns {string} The response JSON string
     */
    ckoResponse: function(data) {
        response.setBuffered(false); // eslint-disable-line
        response.setContentType('text/plain'); // eslint-disable-line
        var out = response.writer; // eslint-disable-line

        return out.println(JSON.stringify(data)); // eslint-disable-line
    },

    /**
     * Get the required value for each mode.
     * @param {string} sandboxValue The sandbox value
     * @param {string} liveValue The live value
     * @returns {string} The APM mode
     */
    getAppModeValue: function(sandboxValue, liveValue) {
        var appMode = this.getValue('ckoMode');
        if (appMode === 'sandbox') {
            return sandboxValue;
        }
        return liveValue;
    },

    /**
     * Get user language
     * @returns {string} The user language.
     */
    getLanguage: function() {
        // eslint-disable-next-line
        return request.locale.replace('_', '-');
    },

    /**
     * Get Site Name
     * @returns {string} The site name.
     */
    getSiteName: function() {
        return Site.getCurrent().name;
    },

    /**
     * Get site Hostname
     * @returns {string} The site host name.
     */
    getSiteHostName: function() {
        return Site.getCurrent().httpHostName;
    },

    /**
     * Check if the gateway response is valid
     * @returns {boolean} The gateway response status.
     */
    isValidResponse: function() {
        // eslint-disable-next-line
        var requestKey = request.httpHeaders.get('authorization');
        var privateSharedKey = this.getAccountKeys().privateSharedKey;

        return requestKey === privateSharedKey;
    },

    /**
     * Get value from custom preferences
     * @param {string} field The field id
     * @returns {string} The field value
     */
    getValue: function(field) {
        return Site.getCurrent().getCustomPreferenceValue(field);
    },

    /**
     * Change the first letter of a string to upper case.
     * @param {string} data The string to process
     * @returns {string} The processed string
     */
    upperCaseFirst: function(data) {
        if (data) {
            var upperChar = data.charAt(0).toUpperCase();
            return data.replace(data.charAt(0), upperChar);
        }

        return '';
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
        if (this.getValue('ckoDebugEnabled') === true) {
            var logger = Logger.getLogger('ckodebug');
            if (logger) {
                logger.debug(
                    this._('cko.gateway.name', 'cko') + ' ' + dataType + ' : {0}',
                    JSON.stringify(gatewayData)
                );
            }
        }
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
        return this.getValue('ckoSgPlatformData');
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
            return false;
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
     * Return the order currency code.
     * @returns {string} The currency code
     */
    getCurrency: function() {
        var orderId = this.getOrderId();

        // load the card and order information
        var order = OrderMgr.getOrder(orderId);
        var currency = order.getCurrencyCode();

        return currency;
    },

    /**
     * Strip spaces form a card number.
     * @param {string} cardNumber The number to process
     * @returns {string} The processed number
     */
    getFormattedNumber: function(cardNumber) {
        return cardNumber.replace(/\s/g, '');
    },

    /**
     * Confirm is a payment is valid from API response code.
     * @param {Object} gatewayResponse The gateway response
     * @returns {boolean} The payment success or failure
     */
    paymentSuccess: function(gatewayResponse) {
        if (Object.prototype.hasOwnProperty.call(gatewayResponse, 'response_code')) {
            return gatewayResponse.response_code === '10000' || gatewayResponse.response_code === '10100' || gatewayResponse.response_code === '10200';
        } else if (Object.prototype.hasOwnProperty.call(gatewayResponse, 'actions')) {
            return gatewayResponse.actions[0].response_code === '10000' || gatewayResponse.actions[0].response_code === '10100' || gatewayResponse.actions[0].response_code === '10200';
        } else if (Object.prototype.hasOwnProperty.call(gatewayResponse, 'source')) {
            return gatewayResponse.source.type === 'sofort' || 'bancontact';
        } else if (Object.prototype.hasOwnProperty.call(gatewayResponse, 'reference')) {
            return gatewayResponse.reference === this.getOrderId();
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
     * Return the customer data.
     * @param {Object} args The method arguments
     * @returns {Object} The customer data
     */
    getCustomer: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Customer object
        var customer = {
            email: order.customerEmail,
            name: order.customerName,
        };

        return customer;
    },

    /**
     * Get the basket quantities.
     * @param {Object} args The method arguments
     * @returns {number} The basked quantities
     */
    getQuantity: function(args) {
        // load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
        var quantity = order.getProductQuantityTotal();

        return quantity;
    },

    /**
     * Get the billing descriptor object from custom preferences.
     * @returns {Object} The billing descriptor data
     */
    getBillingDescriptorObject: function() {
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
        var order = OrderMgr.getOrder(args.OrderNo);
        var it = order.productLineItems.iterator();
        var products = [];

        // Loop through the itemd
        while (it.hasNext()) {
            var pli = it.next();

            // product id
            var product = {
                product_id: pli.productID,
                quantity: pli.quantityValue,
                price: this.getFormattedPrice(pli.adjustedPrice.value.toFixed(2), this.getCurrency()),
                description: pli.productName,
            };

            // Push to products array
            products.push(product);
        }
        if (this.getShippingValue(args)) {
            products.push(this.getShippingValue(args));
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
        var order = OrderMgr.getOrder(args.OrderNo);

        // Prepare the tax data
        var tax = {
            product_id: args.OrderNo,
            quantity: 1,
            price: this.getFormattedPrice(order.getTotalTax().valueOf().toFixed(2), this.getCurrency()),
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
        var order = OrderMgr.getOrder(args.OrderNo);

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

        return false;
    },

    /**
     * Return the order currency code.
     * @param {Object} args The method arguments
     * @returns {string} The currency code
     */
    getCurrencyCode: function(args) {
        // Get the order
        var order = OrderMgr.getOrder(args.OrderNo);

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
        var order = OrderMgr.getOrder(args.OrderNo);

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
        var order = OrderMgr.getOrder(args.OrderNo);

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
        var order = OrderMgr.getOrder(args.OrderNo);
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
        var order = OrderMgr.getOrder(args.OrderNo);

        // Prepare the iterator
        var it = order.productLineItems.iterator();

        // Loop through the items
        var productsQuantites = 0;
        while (it.hasNext()) {
            var pli = it.next();
            productsQuantites += pli.quantityValue;
        }

        return productsQuantites;
    },

    /**
     * Return the host IP.
     * @param {Object} args The method arguments
     * @returns {string} The host IP
     */
    getHost: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);
        var host = order.getRemoteHost();

        return host;
    },

    /**
     * Return an order amount.
     * @param {Object} order The order instance
     * @returns {number} The amount
     */
    getAmount: function(order) {
        var amount = this.getFormattedPrice(order.totalGrossPrice.value.toFixed(2), this.getCurrency());

        return amount;
    },

    /**
     * Return a phone object.
     * @param {Object} args The method arguments
     * @returns {Object} The phone object
     */
    getPhoneObject: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();

        // Creating phone object
        var phone = {
            country_code: null,
            number: billingAddress.getPhone(),
        };

        return phone;
    },

    /**
     * Get a customer full name.
     * @param {Object} args The method arguments
     * @returns {string} The customer full name
     */
    getCustomerName: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var fullname = billingAddress.getFullName();

        return fullname;
    },

    /**
     * Get a customer first name.
     * @param {Object} args The method arguments
     * @returns {string} The customer first name
     */
    getCustomerFirstName: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var firstname = billingAddress.getFirstName();

        return firstname;
    },

    /**
     * Get a customer last name.
     * @param {Object} args The method arguments
     * @returns {string} The customer last name
     */
    getCustomerLastName: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var lastname = billingAddress.getLastName();

        return lastname;
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
        var captureOnMin = configCaptureTime > 0 ? configCaptureTime : 0.5;

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
        var ds = {
            enabled: this.getValue('cko3ds'),
            attempt_n3d: this.getValue('ckoN3ds'),
        };

        return ds;
    },

    /**
     * Build the metadata object.
     * @param {Object} data The request data
     * @param {string} args The method arguments
     * @returns {Object} The metadata
     */
    getMetadataObject: function(data, args) {
        // Prepare the base metadata
        var meta = {
            integration_data: this.getCartridgeMeta(),
            platform_data: this.getValue('ckoSgPlatformData'),
        };

        // Add the data info if needed
        if (Object.prototype.hasOwnProperty.call(data, 'type')) {
            meta.udf1 = data.type;
        }

        // Get the payment processor
        var paymentInstrument = args.PaymentInstrument;
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

        // Add the payment processor to the metadata
        meta.payment_processor = paymentProcessor.getID();

        return meta;
    },

    /**
     * Build the metadata string.
     * @param {Object} data The request data
     * @param {string} args The method arguments
     * @returns {string} The metadata
     */
    getMetadataString: function(data, args) {
        // Prepare the base metadata
        var meta = 'integration_data' + this.getCartridgeMeta() + 'platform_data' + this.getValue('ckoSgPlatformData');

        // Add the data info if needed
        if (Object.prototype.hasOwnProperty.call(data, 'type')) {
            meta += 'udf1' + data.type;
        }

        // Get the payment processor
        var paymentInstrument = args.PaymentInstrument;
        var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

        // Add the payment processor to the metadata
        meta += 'payment_processor' + paymentProcessor.getID();

        return meta;
    },

    /**
     * Return the billing object.
     * @param {Object} args The method arguments
     * @returns {Object} The billing data
     */
    getBillingObject: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();

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
     * Get the billing country.
     * @param {Object} args The method arguments
     * @returns {string} The billing country code
     */
    getBillingCountry: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get billing address information
        var billingAddress = order.getBillingAddress();
        var country = billingAddress.getCountryCode().value;

        return country;
    },

    /**
     * Return the shipping object.
     * @param {Object} args The method arguments
     * @returns {Object} The shipping data
     */
    getShippingObject: function(args) {
        // Load the card and order information
        var order = OrderMgr.getOrder(args.OrderNo);

        // Get shipping address object
        var shippingAddress = order.getDefaultShipment().getShippingAddress();

        // Creating address object
        var shippingDetails = {
            address_line1: shippingAddress.getAddress1(),
            address_line2: shippingAddress.getAddress2(),
            city: shippingAddress.getCity(),
            state: shippingAddress.getStateCode(),
            zip: shippingAddress.getPostalCode(),
            country: shippingAddress.getCountryCode().value,
        };

        // Shipping object
        var shipping = {
            address: shippingDetails,
            phone: this.getPhoneObject(args),
        };

        return shipping;
    },

    /**
     * Get product quantities from a basket.
     * @param {Object} basket The basket instance
     * @returns {Array} The list of quantities
     */
    getBasketObject: function(basket) {
        var currency = this.getAppModeValue('GBP', basket.getCurrencyCode());
        var productsQuantites = [];
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

            productsQuantites.push(products);
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
            productsQuantites.push(shipping);
        }

        return productsQuantites;
    },

    /**
     * Get product quantities from an order.
     * @param {Object} args The method arguments
     * @returns {Array} The list of quantities
     */
    getOrderBasketObject: function(args) {
        // Prepare some variables
        var currency = this.getAppModeValue('GBP', this.getCurrencyCode(args));
        var order = OrderMgr.getOrder(args.OrderNo);
        var it = order.productLineItems.iterator();
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
        var shippingTaxRate = order.defaultShipment.standardShippingLineItem.getTaxRate() * 100 * 100;
        var shipping = {
            name: order.defaultShipment.shippingMethod.displayName + ' Shipping',
            quantity: '1',
            unit_price: this.getFormattedPrice(order.shippingTotalGrossPrice.value, currency),
            tax_rate: shippingTaxRate.toString(),
            total_amount: this.getFormattedPrice(order.shippingTotalGrossPrice.value, currency),
            total_tax_amount: this.getFormattedPrice(order.shippingTotalTax.value, currency),
        };

        if (order.shippingTotalPrice.value > 0) {
            productsQuantites.push(shipping);
        }

        return productsQuantites;
    },

    /**
     * Get the basket country code.
     * @param {Object} basket The basket instance
     * @returns {string} The site country code
     */
    getBasketCountyCode: function(basket) {
        var countyCode = basket.defaultShipment.shippingAddress.countryCode.valueOf();

        return countyCode;
    },

    /**
     * Get the basket address.
     * @param {Object} basket The basket instance
     * @returns {Object} The address
     */
    getBasketAddress: function(basket) {
        var address = {
            given_name: basket.defaultShipment.shippingAddress.firstName,
            family_name: basket.defaultShipment.shippingAddress.lastName,
            email: null,
            title: basket.defaultShipment.shippingAddress.title,
            street_address: basket.defaultShipment.shippingAddress.address1,
            street_address2: basket.defaultShipment.shippingAddress.address2,
            postal_code: basket.defaultShipment.shippingAddress.postalCode,
            city: basket.defaultShipment.shippingAddress.city,
            phone: basket.defaultShipment.shippingAddress.phone,
            country: basket.defaultShipment.shippingAddress.countryCode.valueOf(),
        };

        return address;
    },

    /**
     * Get the order address.
     * @param {Object} args The method arguments
     * @returns {Object} The address
     */
    getOrderBasketAddress: function(args) {
        var order = OrderMgr.getOrder(args.OrderNo);
        var address = {
            given_name: order.defaultShipment.shippingAddress.firstName,
            family_name: order.defaultShipment.shippingAddress.lastName,
            email: order.customerEmail,
            title: order.defaultShipment.shippingAddress.title,
            street_address: order.defaultShipment.shippingAddress.address1,
            street_address2: order.defaultShipment.shippingAddress.address2,
            postal_code: order.defaultShipment.shippingAddress.postalCode,
            city: order.defaultShipment.shippingAddress.city,
            phone: order.defaultShipment.shippingAddress.phone,
            country: order.defaultShipment.shippingAddress.countryCode.valueOf(),
        };

        return address;
    },
};

// Module exports
module.exports = ckoHelper;
