'use strict';

// jQuery Ajax helpers on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    launchApplePay();
}, false);

function getSupportedNetworks() {
    return ['amex', 'masterCard', 'visa'];
}

function getMerchantCapabilities() {
    return ['supportsCredit', 'supportsDebit'];
}


async function performHttpRequest(validURL) {
    if (validURL) {
        return new Promise(
            function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.onload = function() {
                    var data = JSON.parse(this.responseText);
                    resolve(data);
                };
                xhr.onerror = reject;
                xhr.open('GET', validURL);
                xhr.send();
            }
        );
    } else {
        return null;
    }
}

function sendPaymentRequest(paymentData) {
    return new Promise(
        function(resolve, reject) {
            resolve(true);
        }
    );
}

async function launchApplePay() {
    // Get the applepay order url
    var applePayOrderUrl = jQuery('[id="ckoApplePayOrderUrl"]').val();
    // Get the appplepay order object
    var orderObject = await performHttpRequest(applePayOrderUrl);
    // Check if the session is available
    if (window.ApplePaySession) {
        var merchantIdentifier = orderObject.merchantId;
        var promise = ApplePaySession.canMakePaymentsWithActiveCard(merchantIdentifier);
        promise.then( function(canMakePayments) {
                if (canMakePayments) {
                    jQuery('#ckoApplePayButton').show();
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
        document.getElementById('is-CHECKOUTCOM_APPLE_PAY').parentElement.parentElement.style.display = 'none';
        jQuery('#ckoApplePayButton').hide();
        jQuery('.ckoApplePayIncompatible').show();
    }
}
