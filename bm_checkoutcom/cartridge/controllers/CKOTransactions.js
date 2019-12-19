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
    //var data = CKOHelper.getCkoTransactions();
    
    var data = {
        order_no: '01234',
        transaction_id: 'tid445',
        amount: '222',
        creation_date: '13/09/76',
        type: 'TYPE_AUTH',
        processor: 'CHECKOUTCOM_CARD'
    }

    println(JSON.stringify(data));
}

/*
* Web exposed methods
*/
exports.ListTransactions = guard.ensure(['https'], listTransactions);
exports.GetTransactionsData = guard.ensure(['https'], getTransactionsData);