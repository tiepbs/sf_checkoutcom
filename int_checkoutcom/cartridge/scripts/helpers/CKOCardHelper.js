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
var CKOCardHelper = {

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
        var str = CKOUtils.getValue('ckoMode') == 'live' ? 'Live' : 'Sandbox';

        keys.privateKey = this.getValue('cko' +  str + 'PrivateKey');
        keys.publicKey = this.getValue('cko' + str + 'PublicKey');
        keys.secreteKey = this.getValue('cko' +  str + 'SecreteKey');

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
    
	
	/*
	 * Pre_Authorize card with zero value
	 */
	preAuthorizeCard: function(chargeData){
		
		// Prepare the 0 auth charge
		var authData = JSON.parse(JSON.stringify(chargeData));
		
		authData['3ds'].enabled = false;
		authData.amount = 0;
		authData.currency = "USD";	
		
		var authResponse = CKOUtils.gatewayClientRequest("cko.card.charge." + CKOUtils.getAppMode() + ".service", authData);
		
		if(CKOUtils.paymentIsValid(authResponse)){
			return true;
		}
		
		return false;
	},
    
    
	/*
	 * Handle card charge Request to CKO API
	 */
	handleCardRequest: function(cardData, args){

		var mode = CKOUtils.getAppMode();
		
		// load the card and order information
		var order = OrderMgr.getOrder(args.OrderNo);
		
		// build the billing object
		var gatewayObject = CKOUtils.gatewayObject(cardData, args);
		
		// in sandbox mode log the billing object
        if(mode == 'sandbox'){
        	// Logging 
        	CKOUtils.logThis('request', JSON.stringify(gatewayObject));
        }
        
		// Pre_Authorize card
		//var preAuthorize = this.preAuthorizeCard(gatewayObject);
		var preAuthorize = true;
		
		if(preAuthorize){
			
			// Perform the request to the payment gateway
			var gatewayResponse = CKOUtils.gatewayClientRequest("cko.card.charge." + CKOUtils.getAppMode() + ".service", gatewayObject);
			
			// if payment is successful
			if(gatewayResponse){
				
				// handles the response from the gateway
				this.handleCardResponse(gatewayResponse, order);

				
			}else{
				
				// update the transaction
				Transaction.wrap(function(){
					OrderMgr.failOrder(order);
				});
				
				// Restore the cart
				CKOUtils.checkAndRestoreBasket(order);
				
				return false;
				
			}
	
		}else{
			return false;
		}
		
	},
    
    

    /**
     * Handle the response for a payment request with full card details.
     */  
    handleCardResponse: function(gResponse, order) {	
        
        // Logging
        CKOUtils.logThis('response', JSON.stringify(gResponse));

        // Update customer data
        this.updateCustomerData(gResponse);
		
		var gatewayLinks = gResponse._links;
		
		// Add 3DS redirect URL to session if exists
		if(gatewayLinks.hasOwnProperty('redirect')){
			session.privacy.redirectUrl = gatewayLinks.redirect.href
		}
        
 
        // Prepare the transaction info for the order
        var details = '';
        if (gResponse.hasOwnProperty('card') && gResponse.card.hasOwnProperty('customerId')) {
            details += CKOUtils._('cko.customer.id', 'cko') + ': ' + gResponse.card.customerId + '\n';
        }
        details += CKOUtils._('cko.transaction.status', 'cko') + ': ' + gResponse.status + '\n';
        details += CKOUtils._('cko.response.code', 'cko') + ': ' + gResponse.response_code + '\n';
        details += CKOUtils._('cko.response.message', 'cko') + ': ' + gResponse.responseMessage + '\n';
        details += CKOUtils._('cko.response.info', 'cko') + ': ' + gResponse.responseAdvancedInfo + '\n';
        details += CKOUtils._('cko.response.last4', 'cko') + ': ' + gResponse.last4 + '\n';
        details += CKOUtils._('cko.response.paymentMethod', 'cko') + ': ' + gResponse.paymentMethod + '\n';
        details += CKOUtils._('cko.authorization.code', 'cko') + ': ' + gResponse.authCode + '\n';

        // Add risk flag information if applicable
        if (gResponse.response_code == '10100') {
            details += CKOUtils._('cko.risk.flag', 'cko') + ': ' + CKOUtils._('cko.risk.info', 'cko') + '\n';
        }

        Transaction.wrap(function() {
            // Add the details to the order
            order.addNote(CKOUtils._('cko.transaction.details', 'cko'), details);
        });

        // Confirm the payment
        Transaction.wrap(function() {
            order.setPaymentStatus(order.PAYMENT_STATUS_PAID);	
        });
    }
	
	
};

/*
 * Module exports
 */

module.exports = CKOCardHelper;