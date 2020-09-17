'use strict';

/* API Includes */
// eslint-disable-next-line
var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('ckoSgStorefrontControllers');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
var ISML = require('dw/template/ISML');
var Transaction = require('dw/system/Transaction');

/* Checkout.com Helper functions */
var CKOHelper = require('~/cartridge/scripts/helpers/CKOHelper');

// Saves the data from the http Get request in a requestData variable
// eslint-disable-next-line
var requestData = request.httpParameterMap.get('cko-data').stringValue;
// eslint-disable-next-line
var requestProperties = request.httpParameterMap.get('cko-properties').stringValue; 
var requestObject = JSON.parse(requestData);
var propertiesObject = JSON.parse(requestProperties);

/**
 * Get the settings list
 */
function listSettings() {
    // Render the template
    ISML.renderTemplate('settings/list');
}

/**
 * Save CKO Setting
 */
function saveCkoCustomPropertie() {
    Transaction.begin();
    try {
        var ckoObject = CKOHelper.storeCkoCustomProperties(propertiesObject, requestObject);
        Transaction.commit();
        CKOHelper.logThis(CKOHelper._('cko.ckoCustomSettings.success', 'cko'), JSON.stringify(ckoObject));
    } catch (e) {
        Transaction.rollback();
        CKOHelper.logThis(CKOHelper._('cko.ckoCustomSettings.error', 'cko'), JSON.stringify(e));
    }
}

/**
 * Gets CKO Account API Keys Custom Object
 */
function getCkoCustomPropertie() {
    var ckoCustomObjects = CKOHelper.getCkoCustomProperties(requestObject);
	// eslint-disable-next-line
    response.getWriter().println(ckoCustomObjects);
}

/*
 * Web exposed methods
 */
exports.ListSettings = guard.ensure(['https'], listSettings);
exports.SaveCkoCustomProperties = guard.ensure(['https'], saveCkoCustomPropertie);
exports.GetCkoCustomProperties = guard.ensure(['https'], getCkoCustomPropertie);
