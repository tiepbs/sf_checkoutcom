/**
 * A hello world controller.
 *
 * @module controllers/Hello
 */

var siteControllerName = dw.system.Site.getCurrent().getCustomPreferenceValue('cko_pay_test_StorefrontController');
var guard = require(siteControllerName + '/cartridge/scripts/guard');
//var rootFolder = require('dw/content/ContentMgr').getSiteLibrary().root;
var Store = require('dw/catalog/Store');


exports.World = function(){
    response.getWriter().println('Hello World!' + getShopInfo());
};

exports.World.public = true;
//exports.World = guard.ensure(['https'], World);

function show() {
	response.getWriter().println('Show Hello World!' + getShopInfo());
}

function getShopInfo(){
	var address = Store.email;
	return address;
}

exports.Show = guard.ensure(['get'], show);