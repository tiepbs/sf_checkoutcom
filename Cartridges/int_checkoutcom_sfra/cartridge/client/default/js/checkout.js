'use strict';

require('base/checkout');
var processInclude = require('base/util');
processInclude(require('base/components/toolTip'));

$(document).ready(function () {
    if (window.dw &&
        window.dw.applepay &&
        window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
        $('body').addClass('apple-pay-enabled');
    }
});
