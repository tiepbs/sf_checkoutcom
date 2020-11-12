'use strict';

// jQuery Ajax helpers on DOM ready.
document.addEventListener('DOMContentLoaded', function() {
    launchGooglePay();
}, false);

function launchGooglePay() {
    jQuery('.cko-google-pay-button').click(function() {
        // Prepare the payment parameters
        var allowedPaymentMethods = ['CARD', 'TOKENIZED_CARD'];
        var allowedCardNetworks = ['VISA', 'MASTERCARD', 'AMEX', 'JCB', 'DISCOVER'];

        var tokenizationParameters = {
            tokenizationType: 'PAYMENT_GATEWAY',
            parameters: {
                gateway: 'checkoutltd',
                gatewayMerchantId: jQuery('[id="ckoGatewayMerchantId"]').val(),
            },
        };

        // Prepare the Google Pay client
        onGooglePayLoaded();

        // Show Google Pay chooser when Google Pay purchase button is clicked
        var paymentDataRequest = getGooglePaymentDataConfiguration();
        paymentDataRequest.transactionInfo = getGoogleTransactionInfo();

        var paymentsClient = getGooglePaymentsClient();
        paymentsClient.loadPaymentData(paymentDataRequest)
        .then(
            function(paymentData) {
                // handle the response
                processPayment(paymentData);
            }
        )
        .catch(
            function(error) {
                console.log(error);
            }
        );

        /**
         * Initialize a Google Pay API client
         *
         * @returns {google.payments.api.PaymentsClient} Google Pay API client
         */
        function getGooglePaymentsClient() {
            return (new google.payments.api.PaymentsClient(
                {
                    environment: jQuery('[id="ckoGooglePayEnvironment"]').val(),
                }
            ));
        }

        /**
         * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
         */
        function onGooglePayLoaded() {
            var paymentsClient = getGooglePaymentsClient();
            paymentsClient.isReadyToPay({ allowedPaymentMethods: allowedPaymentMethods })
            .then(
                function(response) {
                    if (response.result) {
                        prefetchGooglePaymentData();
                    }
                }
            )
            .catch(
                function(error) {
                    console.log(error);
                }
            );
        }

        /**
         * Configure support for the Google Pay API
         *
         * @see     {@link https://developers.google.com/pay/api/web/reference/object#PaymentDataRequest|PaymentDataRequest}
         * @returns {Object} PaymentDataRequest fields
         */
        function getGooglePaymentDataConfiguration() {
            return {
                merchantId: jQuery('[id="ckoGooglePayMerchantId"]').val(),
                paymentMethodTokenizationParameters: tokenizationParameters,
                allowedPaymentMethods: allowedPaymentMethods,
                cardRequirements: {
                    allowedCardNetworks: allowedCardNetworks,
                },
            };
        }

        /**
         * Provide Google Pay API with a payment amount, currency, and amount status
         *
         * @see     {@link https://developers.google.com/pay/api/web/reference/object#TransactionInfo|TransactionInfo}
         * @returns {Object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
         */
        function getGoogleTransactionInfo() {
            return {
                currencyCode: jQuery('[id="ckoGooglePayCurrency"]').val(),
                totalPriceStatus: 'FINAL',
                totalPrice: jQuery('[id="ckoGooglePayAmount"]').val(),
            };
        }

        /**
         * Prefetch payment data to improve performance
         */
        function prefetchGooglePaymentData() {
            var paymentDataRequest = getGooglePaymentDataConfiguration();

            // TransactionInfo must be set but does not affect cache
            paymentDataRequest.transactionInfo = {
                totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
                currencyCode: jQuery('[id="ckoGooglePayCurrency"]').val(),
            };

            var paymentsClient = getGooglePaymentsClient();
            paymentsClient.prefetchPaymentData(paymentDataRequest);
        }

        /**
         * Process payment data returned by the Google Pay API
         *
         * @param {Object} paymentData response from Google Pay API after shopper approves payment
         * @see   {@link https://developers.google.com/pay/api/web/reference/object#PaymentData|PaymentData object reference}
         */
        function processPayment(paymentData) {
            // Prepare the payload
            var payload = {
                signature: JSON.parse(paymentData.paymentMethodToken.token).signature,
                protocolVersion: JSON.parse(paymentData.paymentMethodToken.token).protocolVersion,
                signedMessage: JSON.parse(paymentData.paymentMethodToken.token).signedMessage,
            };

            // Store the payload
            jQuery('[id="dwfrm_googlePayForm_data"]').val(JSON.stringify(payload));
        }
    });
}
