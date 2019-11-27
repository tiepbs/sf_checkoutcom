'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var ServiceRegistry = require('dw/svc/ServiceRegistry'); 

/* Site controller */
var SiteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');

/* App */
var app = require(SiteControllerName + '/cartridge/scripts/app');

/* Checkout.com Utility functions */
var CKOUtils = require('~/cartridge/scripts/helpers/CKOUtils');

/**
 * Helper functions for the Checkout.com cartridge integration.
 */
var CKOHelper = {
    /**
     * Handles string translation with language resource files.
     */
	_: function (strValue, strFile) {
		return Resource.msg(strValue, strFile, null);
	},

    /**
     * The cartridge metadata.
     */
    getCartridgeMeta: function() {
        return this.getValue('ckoUserAgent') + ' ' + this.getValue('ckoVersion');
    },

    /**
     * Find the order track id from various sources.
     */
    getTrackId: function() {
        var trackId = (this.getValue('cko3ds')) ? request.httpParameterMap.get('udf1').stringValue : request.httpParameterMap.get('trackId').stringValue;
        if (trackId === null) {
            trackId = session.privacy.ckoOrderId;
        }
        
        return trackId;
    },    

    /**
     * Check if the gateway response is valid.
     */
    isValidResponse: function() {
        var requestKey = request.httpHeaders.get("authorization");
        var privateSharedKey = this.getAccountKeys().privateSharedKey;
        
        if (requestKey == privateSharedKey) {
        	return true;
        }

        return false;
    },    

    /**
     * Returns the core cartridge name using site controller name.
     */
    getCoreCartridgeName: function(siteControllerName) {
        return siteControllerName.replace('_controllers', '_core');
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

    /**
     * Creates an HTTP Client to handle gateway queries.
     */
    getGatewayClient: function(serviceId, requestData) {
        var responseData = false;
        var serv = ServiceRegistry.get(serviceId);
	    var resp = serv.call(requestData);
        if (resp.status == 'OK') {
            responseData = resp.object
        }
        return responseData;
    },

    /**
     * Retrieves a custom preference value from the configuration.
     */
    getValue: function(fieldName) {
        return dw.system.Site.getCurrent().getCustomPreferenceValue(fieldName);
    },

    /**
     * Get live or sandbox account keys.
     */
    getAccountKeys: function() {
        var keys = {};
        var str = this.getValue('ckoMode') == 'live' ? 'Live' : 'Sandbox';

        keys.privateKey = this.getValue('cko' +  str + 'PrivateKey');
        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.privateSharedKey = this.getValue('cko' +  str + 'PrivateSharedKey');

        return keys;
    },

    /**
     * Writes complementary information to the session for the current shopper.
     */  
    updateCustomerData: function(gResponse) {
        if ((gResponse) && gResponse.hasOwnProperty('card')) {
            Transaction.wrap(function() {
                if (session.customer.profile !== null) {
                    session.customer.profile.custom.ckoCustomerId = gResponse.card.customerId;
                }
            });
        }
    },
    
    /**
     * Checks if a payment is valid via the response code.
     */  
    paymentIsValid: function(gResponse) {
        return gResponse.responseCode == '10000' || gResponse.responseCode == '10100' || gResponse.responseCode == '10200';
    },   

    /**
     * Handle the response for a payment request with full card details.
     */  
    handleFullChargeResponse: function(gResponse, order) {	
        // Assign this to self
        var self = this;
        
        // Logging
        this.logThis('response', JSON.stringify(gResponse));

        // Update customer data
        this.updateCustomerData(gResponse);
        
        // Add 3DS redirect URL to session if exists
        if (gResponse.hasOwnProperty('redirectUrl')) {
            session.privacy.redirectUrl = gResponse.redirectUrl;
        }   
 
        // Prepare the transaction info for the order
        var details = '';
        if (gResponse.hasOwnProperty('card') && gResponse.card.hasOwnProperty('customerId')) {
            details += this._('cko.customer.id', 'cko') + ': ' + gResponse.card.customerId + '\n';
        }
        details += this._('cko.transaction.status', 'cko') + ': ' + gResponse.status + '\n';
        details += this._('cko.response.code', 'cko') + ': ' + gResponse.responseCode + '\n';
        details += this._('cko.response.message', 'cko') + ': ' + gResponse.responseMessage + '\n';
        details += this._('cko.response.info', 'cko') + ': ' + gResponse.responseAdvancedInfo + '\n';
        details += this._('cko.response.last4', 'cko') + ': ' + gResponse.last4 + '\n';
        details += this._('cko.response.paymentMethod', 'cko') + ': ' + gResponse.paymentMethod + '\n';
        details += this._('cko.authorization.code', 'cko') + ': ' + gResponse.authCode + '\n';

        // Add risk flag information if applicable
        if (gResponse.responseCode == '10100') {
            details += this._('cko.risk.flag', 'cko') + ': ' + this._('cko.risk.info', 'cko') + '\n';
        }

        Transaction.wrap(function() {
            // Add the details to the order
            order.addNote(self._('cko.transaction.details', 'cko'), details);
        });

        // Confirm the payment
        Transaction.wrap(function() {
            order.setPaymentStatus(order.PAYMENT_STATUS_PAID);	
        });
    },

    /**
     * Handle the request for a payment with full card details.
     */  
    handleFullChargeRequest: function(cardData, args) {
        // Logging 
        this.logThis('request', JSON.stringify(cardData));

    	// Load the card and the order
        var order = OrderMgr.getOrder(args.OrderNo);
		var mode = this.getValue('ckoMode');

        // Prepare the charge data
        var ckoChargeData = {
            source: CKOUtils.getSource(cardData, order),
            amount: CKOUtils.getFormattedPrice(order.totalGrossPrice.value.toFixed(2)),
            currency: order.currencyCode,
            payment_type: "Regular",
            reference: order.orderNo,
            capture: CKOUtils.getCapture(this.getValue('ckoAutoCapture')),
            //capture_on: CKOUtils.getFormattedDate(this.getValue('ckoAutoCaptureTime')),
            capture_on: '2019-09-04T18:36:31Z',
            customer: CKOUtils.getCustomer(order),
            shipping: CKOUtils.getShipping(order),
            metadata: {orderNo: order.orderNo}
        };

        // Set the 3ds parameter
        ckoChargeData['3ds'] = CKOUtils.get3ds(this.getValue('cko3ds'), this.getValue('ckoN3ds'));

        // Perform the request to the payment gateway
        var gResponse = this.getGatewayClient('cko.card.charge.' + mode + '.service', 
            ckoChargeData
        );

        const logger = require('dw/system/Logger').getLogger('ckodebug');
        logger.debug('this is my test {0}', JSON.stringify(ckoChargeData));

        // If the charge is valid, process the response
        if ((gResponse) && this.paymentIsValid(gResponse)) {
            // Todo - return move the payment status check to handleFullChargeResponse
            // Todo - make handleFullChargeResponse return true or false
            this.handleFullChargeResponse(gResponse, order);
        }
        else {
            // Update the transaction
            Transaction.wrap(function() {
                OrderMgr.failOrder(order);
            });

            // Restore the cart
            this.checkAndRestoreBasket(order); 
        
            return false;
        }
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

    /**
     * Rebuild the basket contents after a failed payment.
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
    }
};

/*
 * Module exports
 */

module.exports = CKOHelper;