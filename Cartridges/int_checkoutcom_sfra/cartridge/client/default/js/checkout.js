'use strict';

var processInclude = require('./util');
processInclude(require('./components/toolTip'));

$(document).ready(function () {
    processInclude(require('./checkout/checkout'));
    if (window.dw &&
        window.dw.applepay &&
        window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
        $('body').addClass('apple-pay-enabled');
    }
});
