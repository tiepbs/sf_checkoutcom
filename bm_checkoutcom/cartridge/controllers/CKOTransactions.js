'use strict';

/* API Includes */
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoStorefrontController');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');

/* Checkout.com Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

/**
 * Get the transactions list
 */
function listTransactions() {
	// Prepare the output array
	var data = CKOHelper.getCkoTransactions();
	
    // Render the template
    ISML.renderTemplate('transactions/list', {data: data.result, orderMap: data.orderMap});
}

/**
 * View a transaction
 */
function viewTransaction() {
    // Load the transaction
    var paymentTransaction = CKOHelper.loadTransactionFromRequest();

    // Render the template
    ISML.renderTemplate('transactions/detail', {
        item: paymentTransaction
    });
}

/**
 * Perform a remote Hub Call
 */
function hubCall() {
    // Get the operating mode
    var mode = CKOHelper.getValue('ckoMode');
   
    // Get the transaction task
    var task = request.httpParameterMap.get('task');

    // Prepare the payload
    var ckoChargeData = {
        value: CKOHelper.getFormattedPrice(request.httpParameterMap.get('val').stringValue),
        chargeId: request.httpParameterMap.get('tid').stringValue
    }

    // Perform the request
    var gResponse = CKOHelper.getGatewayClient(
        'cko.transaction.' + task + '.' + mode + '.service',
        ckoChargeData
    );

    return JSON.stringify(ckoChargeData);
}

function transactionHistory() {
    // Get the transaction ID
    var chargeId = request.httpParameterMap.get('chargeId');

    // Get the transaction operation
    var operation = request.httpParameterMap.get('operation');

    // Get the operating mode
    var mode = CKOHelper.getValue('ckoMode');

    // Prepare the charge data
    var ckoChargeData = {chargeId: chargeId};

    // Send a gateway request to check the transaction status
    var gResponse = CKOHelper.getGatewayClient(
        'cko.charge.history.' + mode + '.service',
        ckoChargeData
    );

    ISML.renderTemplate('transactions/ajax.isml', { test: JSON.parse(gResponse) });
}

/*
* Web exposed methods
*/
exports.ListTransactions = guard.ensure(['https'], listTransactions);
exports.ViewTransaction = guard.ensure(['https'], viewTransaction);
exports.HubCall = guard.ensure(['https'], hubCall);
exports.TransactionHistory = guard.ensure(['https'], transactionHistory);
