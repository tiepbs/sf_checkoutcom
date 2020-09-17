'use strict';

// jQuery Ajax helpers on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    launchApplePay();
}, false);

function getLineItems() {
    return [];
}

function getSupportedNetworks() {
    return ['amex', 'masterCard', 'visa'];
}

function getMerchantCapabilities() {
    return ['supportsCredit', 'supportsDebit'];
}

function performValidation(valURL) {
    var controllerUrl = jQuery('[id="ckoApplePayValidationUrl"]').val();
    var validationUrl = controllerUrl + '?u=' + valURL;

    return new Promise(
        function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var data = JSON.parse(this.responseText);
                resolve(data);
            };
            xhr.onerror = reject;
            xhr.open('GET', validationUrl);
            xhr.send();
        }
    );
}

function sendPaymentRequest(paymentData) {
    return new Promise(
        function(resolve, reject) {
            resolve(true);
        }
    );
}

function launchApplePay() {
    // Check if the session is available
    if (window.ApplePaySession) {
        var merchantIdentifier = jQuery('[id="ckoApplePayMerchantId"]').val();
        var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
        promise.then(
            function(canMakePayments) {
                if (canMakePayments) {
                    jQuery('.ckoApplePayButton').show();
                } else {
                    jQuery('.ckoApplePayUnavailable').show();
                }
            }
        ).catch(
            function(error) {
                console.log(error);
            }
        );
    } else {
        jQuery('.ckoApplePayButton').hide();
        jQuery('.ckoApplePayIncompatible').show();
    }

    // Handle the events
    jQuery('.ckoApplePayButton').click(
        function(evt) {
            // Prepare the parameters
            var runningTotal = jQuery('[id="ckoApplePayAmount"]').val();

            // Build the payment request
            var paymentRequest = {
                currencyCode: jQuery('[id="ckoApplePayCurrency"]').val(),
                countryCode: jQuery('[id="ckoApplePaySiteCountry"]').val(),
                total: {
                    label: jQuery('[id="ckoApplePaySiteName"]').val(),
                    amount: runningTotal,
                },
                supportedNetworks: getSupportedNetworks(),
                merchantCapabilities: getMerchantCapabilities(),
            };

            // Start the payment session
            var session = new ApplePaySession(1, paymentRequest);

            // Merchant Validation
            session.onvalidatemerchant = function(event) {
                var promise = performValidation(event.validationURL);
                promise.then(
                    function(merchantSession) {
                        session.completeMerchantValidation(merchantSession);
                    }
                ).catch(
                    function(error) {
                        console.log(error);
                    }
                );
            };

            // Shipping contact
            session.onshippingcontactselected = function(event) {
                var status = ApplePaySession.STATUS_SUCCESS;

                // Shipping info
                var shippingOptions = [];
                var newTotal = {
                    type: 'final',
                    label: jQuery('[id="ckoApplePaySiteName"]').val(),
                    amount: runningTotal,
                };
                session.completeShippingContactSelection(status, shippingOptions, newTotal, getLineItems());
            };

            // Shipping method selection
            session.onshippingmethodselected = function(event) {
                var status = ApplePaySession.STATUS_SUCCESS;
                var newTotal = {
                    type: 'final',
                    label: jQuery('[id="ckoApplePaySiteName"]').val(),
                    amount: runningTotal,
                };
                session.completeShippingMethodSelection(status, newTotal, getLineItems());
            };

            // Payment method selection
            session.onpaymentmethodselected = function(event) {
                var newTotal = {
                    type: 'final',
                    label: jQuery('[id="ckoApplePaySiteName"]').val(),
                    amount: runningTotal,
                };
                session.completePaymentMethodSelection(newTotal, getLineItems());
            };

            // Payment method authorization
            session.onpaymentauthorized = function(event) {
                // Prepare the payload
                var payload = event.payment.token;

                // Send the request
                var promise = sendPaymentRequest(payload);
                promise.then(
                    function(success) {
                        var status;
                        if (success) {
                            status = ApplePaySession.STATUS_SUCCESS;
                        } else {
                            status = ApplePaySession.STATUS_FAILURE;
                        }

                        session.completePayment(status);

                        if (success) {
                            // Redirect to success page
                            jQuery('[id="dwfrm_applePayForm_data"]').val(JSON.stringify(payload));
                        }
                    }
                ).catch(
                    function(error) {
                        console.log(error);
                    }
                );
            };

            // Session cancellation
            session.oncancel = function(event) {
                console.log(event);
            };

            // Begin session
            session.begin();
        }
    );
}
