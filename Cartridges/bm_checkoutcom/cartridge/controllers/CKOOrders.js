'use strict';

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var PaymentTransaction = require('dw/order/PaymentTransaction');

/* Checkout.com Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Get the orders list
 */
function listOrders() {
	// Prepare the output array
	var data = CKOHelper.getCkoOrders();
    
    // Render the template
    ISML.renderTemplate('orders/list', {data: data});
}

/**
 * View an order
 */
function viewOrder() {
    // Load the order
    var order = CKOHelper.loadOrderFromRequest();

    // Render the template
    ISML.renderTemplate('orders/detail', {
        item: order,
        PaymentTransaction: PaymentTransaction
    });
}

/*
* Web exposed methods
*/
exports.ListOrders = guard.ensure(['https'], listOrders);
exports.ViewOrder = guard.ensure(['https'], viewOrder);
