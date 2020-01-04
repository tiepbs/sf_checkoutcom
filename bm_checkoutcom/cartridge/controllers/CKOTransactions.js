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
    // Render the template
    ISML.renderTemplate('transactions/list');
}

/**
 * Get the transactions table data
 */
function getTransactionsData() {	
	// Prepare the output array
    var data = CKOHelper.getCkoTransactions();
    
    // Send the AJAX response
    ISML.renderTemplate('transactions/ajax', {data: JSON.stringify(data) });
}

/**
 * Perform a remote Hub Call
 */
function remoteCall() {
    // Get the operating mode
    var mode = CKOHelper.getValue('ckoMode');
   
    // Get the transaction task
    var task = request.httpParameterMap.get('task');

    // Prepare the payload
    var ckoChargeData = {
        amount: CKOHelper.getFormattedPrice(request.httpParameterMap.get('amount').stringValue),
        chargeId: request.httpParameterMap.get('tid').stringValue
    }

    // Perform the request
    var gResponse = CKOHelper.getGatewayClient(
        'cko.transaction.' + task + '.' + mode + '.service',
        ckoChargeData
    );

    return JSON.stringify(ckoChargeData);
}

/*
* Web exposed methods
*/
exports.ListTransactions = guard.ensure(['https'], listTransactions);
exports.GetTransactionsData = guard.ensure(['https'], getTransactionsData);
exports.RemoteCall = guard.ensure(['https'], remoteCall);