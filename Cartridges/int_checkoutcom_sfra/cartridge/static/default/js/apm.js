"use strict";

var apm_selected = false;
var apm_selected_box = false;

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Get the APM
    getApm();

    // Filter the APM
    filterApm();

    // Add APM form validation
    initApmFormValidation();

}, false);

/*
 * Alternative Payments
 */
function getApm()
{
    $('input[name="apm_list"]').change(function () {
        // Build the APM function name
        var apmFn = this.value + 'PayBox';

        // Run the APM call
        window[apmFn]();
    });
}

function initApmFormValidation() {
    $('#ckoSubmitPayment').on('click touch', function (e) {
        if ($('#selectedPaymentOption').val() == 'CHECKOUTCOM_APM') {
            // Reset the error messages
            $('.invalid-field-message').empty();
            
            // Prepare the errors array
            var ckoFormErrors = [];
            
            // Card number validation
            ckoFormErrors[0] = checkApmFields();

            // Invalidate the button click if errors found
            if ($.inArray(1, ckoFormErrors)) {
                e.preventDefault();
            }
        }
    }); 
}

function checkApmFields() {
    // Ideal form validation
    var idealField = $('#ideal_bic');
    if ($('#ideal_apm_radio_btn').is(':checked') && idealField.val() == '') {
        $('#ideal_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        idealField.addClass('is-invalid');
        return 1;
    }

    // Boleto form validation
    var boletoField1 = $('#boleto_birthDate');
    if ($('#boleto_apm_radio_btn').is(':checked') && boletoField1.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField1.addClass('is-invalid');
        return 1;
    }

    var boletoField2 = $('#boleto_cpfe');
    if ($('#boleto_apm_radio_btn').is(':checked') && boletoField2.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField2.addClass('is-invalid');
        return 1;
    }

    // QPAY form validation
    var qpayField = $('#qpay_national_id');
    if ($('#qpay_apm_radio_btn').is(':checked') && qpayField.val() == '') {
        $('#qpay_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        qpayField.addClass('is-invalid');
        return 1;
    }

    // SEPA form validation
    var sepaField1 = $('#sepa_iban');
    if ($('#sepa_apm_radio_btn').is(':checked') && sepaField1.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        sepaField1.addClass('is-invalid');
        return 1;
    }

    var sepaField2 = $('#sepa_bic');
    if ($('#sepa_apm_radio_btn').is(':checked') && sepaField2.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        sepaField2.addClass('is-invalid');
        return 1;
    }

    return 0;
}

/*
 * Ideal Pay decorator
 */
function idealPayBox()
{
    // Ideal pay radio button element
    var ideal = $('#ideal_apm_radio_btn');
    
    // Ideal pay input elements div
    var idealBox = $('#ideal_pay_box');
    
    // Input fields
    toggleApm(ideal, idealBox);
}

/*
 * Knet Pay decorator
 */
function knetPayBox()
{
    // Knet pay radio button element
    var knet = $('#knet_apm_radio_btn');
    
    // Knet pay input elements div
    var knetBox = $('#knet_pay_box');
    
    // Input fields
    toggleApm(knet, knetBox);
}

/*
 * Sepa Pay decorator
 */
function sepaPayBox()
{
    // Sepa pay radio button element
    var sepa = $('#sepa_apm_radio_btn');
    
    // Sepa pay input elements div
    var sepaBox = $('#sepa_pay_box');
    
    // Input fields
    toggleApm(sepa, sepaBox);
}

/*
 * Klarna Pay decorator
 */
function klarnaPayBox()
{
    // Klarna pay radio button element
    var klarna = $('#klarna_apm_radio_btn');
    
    // Klarna pay input elements div
    var klarnaBox = $('#klarna_pay_box');
    
    // Input fields
    toggleApm(klarna, klarnaBox);
}

/*
 * QPay decorator
 */
function qPayBox()
{
    // Qpay radio button element
    var qpay = $('#qpay_apm_radio_btn');

    // Qpay input elements div
    var qpayBox = $('#qpay_pay_box');
    
    // Input fields
    toggleApm(qpay, qpayBox);
}

/*
 * Fawry decorator
 */
function fawryPayBox()
{
    // Fawry pay radio button element
    var fawry = $('#fawry_apm_radio_btn');

    // Fawry pay input elements div
    var fawrypayBox = $('#fawry_pay_box');
    
    // Input fields
    toggleApm(fawry, fawrypayBox);
}

/*
 * Sofort Pay decorator
 */
function sofortPayBox()
{
    // Sofort pay radio button element
    var sofort = $('#sofort_apm_radio_btn');
    
    // Sofort pay input elements div
    var sofortBox = $('#sofort_pay_box');
    
    // Input fields
    toggleApm(sofort, sofortBox);
}

/*
 * EPS Pay decorator
 */
function epsPayBox()
{
    // EPS pay radio button element
    var eps = $('#epsPay_apm_radio_btn');
    
    // EPS pay input elements div
    var epsBox = $('#epsPay_pay_box');
    
    // Input fields
    toggleApm(eps, epsBox);
}

/*
 * Boleto Pay decorator
 */
function boletoPayBox()
{
    // Boleto pay radio button element
    var boleto = $('#boleto_apm_radio_btn');
    
    // Boleto pay input elements div
    var boletoBox = $('#boleto_pay_box');
    
    // Date formating
    var cleave = new Cleave('#boleto_birthDate', {
        date: true,
        delimiter: '-',
        datePattern: ['Y', 'm', 'd']
    });
    
    // set input fields toggle
    toggleApm(boleto, boletoBox);
}

/*
 * Bancontact Pay decorator
 */
function bancontactPayBox()
{
    // Bancontact pay radio button element
    var bancontact = $('#bancontact_apm_radio_btn');
    
    // Bancontact pay input elements div
    var bancontactBox = $('#bancontact_pay_box');
    
    // Set input fields toggle
    toggleApm(bancontact, bancontactBox);
}

/*
 * Benefit Pay decorator
 */
function benefitPayBox()
{
    // Benefit pay radio button element
    var benefitPay = $('#benefit_apm_radio_btn');
    
    // Benefit pay input elements div
    var benefitPayBox = $('#benefitPay_pay_box');
    
    // Set input fields toggle
    toggleApm(benefitPay, benefitPayBox);
}

/*
 * Giro Pay decorator
 */
function giroPayBox()
{
    // Giro pay radio button element
    var giroPay = $('#giroPay_apm_radio_btn');
    
    // Giro pay input elements div
    var giroPayBox = $('#giroPay_pay_box');
    
    // Set input fields toggle
    toggleApm(giroPay, giroPayBox);
}

/*
 * Multibanco Pay decorator
 */
function multibancoPayBox()
{
    // Multibanco pay radio button element
    var multibancoPay = $('#multibancoPay_apm_radio_btn');
    
    // Multibanco pay input elements div
    var giroPayBox = $('#multibancoPay_pay_box');
    
    // Set input fields toggle
    toggleApm(multibancoPay, giroPayBox);
}

/*
 * Poli Pay decorator
 */
function poliPayBox()
{
    // Multibanco pay radio button element
    var poliPay = $('#poliPay_apm_radio_btn');
    
    // Multibanco pay input elements div
    var poliPayBox = $('#poliPay_pay_box');
    
    // Set input fields toggle
    toggleApm(poliPay, poliPayBox);
}

/*
 * Poli Pay decorator
 */
function p24PayBox()
{
    // Multibanco pay radio button element
    var p24Pay = $('#p24Pay_apm_radio_btn');
    
    // Multibanco pay input elements div
    var p24PayBox = $('#p24Pay_pay_box');
    
    // Set input fields toggle
    toggleApm(p24Pay, p24PayBox);
}

/*
 * Paypal Pay decorator
 */
function paypalPayBox()
{
    // Multibanco pay radio button element
    var paypalPay = $('#paypalPay_apm_radio_btn');
    
    // Multibanco pay input elements div
    var paypalPayBox = $('#paypalPay_pay_box');
    
    // Set input fields toggle
    toggleApm(paypalPay, paypalPayBox);
}

/*
 * Poli Pay decorator
 */
function klarnaPayBox()
{
    // Klarna pay radio button element
    var klarnaPay = $('#klarna_apm_radio_btn');
    
    // Klarna pay input elements div
    var klarnaPayBox = $('#klarnaPay_pay_box');
    
    // Set input fields toggle
    toggleApm(klarnaPay, klarnaPayBox);
}

/*
 * Oxxo Pay decorator
 */
function oxxoPayBox()
{
    // Oxxo pay radio button element
    var oxxoPay = $('#oxxo_apm_radio_btn');
    
    // Oxxo pay input elements div
    var oxxoPayBox = $('#oxxo_pay_box');
    
    // Set input fields toggle
    toggleApm(oxxoPay, oxxoPayBox);
}

/*
 * Set APM Forms
 */
function toggleApm(apms, apmBox)
{
    // If another APM is selected
    if (apm_selected) {
        apm_selected.toggle();
        apmBox.toggle();
        apm_selected = apmBox;
        
        // Set alternative payment value
        var apmSelect = $('#dwfrm_alternativePaymentForm_alternative__payments');
        apmSelect.val(apms.val());
    } else {
        // Apply a state
        apmBox.toggle();
        apm_selected = apmBox;
        
        // Set alternative payment value
        var apmSelect = $('#dwfrm_alternativePaymentForm_alternative__payments');
        apmSelect.val(apms.val());
    }
}

/*
 * Get the APMs filter
 */
function filterApm()
{   
    var controllerUrl = $('#ckoApmFilterUrl').val();
    var xhttpFilter = new XMLHttpRequest();
    xhttpFilter.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var responseObject = JSON.parse(this.responseText);
            var filterObject = responseObject.filterObject;
            var apmsFilterObject = responseObject.ckoApmFilterConfig;
            for (var apms in apmsFilterObject) {                    
                //if (apmsFilterObject[apms].countries.includes(filterObject.country.toUpperCase()) && apmObjects.currencies.includes(filterObject.currency)) {
                    $('#'+ apms).show();
                //}
            }
        }
    };
    
    xhttpFilter.open('GET', controllerUrl, true);
    xhttpFilter.send();
}

/*
 * Get the Klarna controller
 */
function callKlarnaController(controllerUrl)
{    
    if (controllerUrl) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                var sessionId = JSON.parse(this.responseText).session_id;
                var token = JSON.parse(this.responseText).client_token;
                var categories = JSON.parse(this.responseText).payment_method_categories;
                var requestObject = JSON.parse(this.responseText).requestObject;
                var addressInfo = JSON.parse(this.responseText).addressInfo;
            
                Klarna.Payments.init(
                // Options
                    {
                        client_token: token
                    }
                );
            
                // Prepare the Klarna box display
                var klarnaBox = $('#klarna-buttons');
                klarnaBox.empty();
                for (var i = 0; i < categories.length; i++) {
                    var klarnaButton = "<div style='padding: 10px; border: solid 0.5px #eee; border-radius: 5px;'> " + categories[i].name
                    + " <input type='radio' name='payment_method_categories' value='" + categories[i].identifier + "'id='"
                    + categories[i].identifier + "' onclick='loadKlarna(`"+ categories[i].identifier
                    + "`, `" + JSON.stringify(requestObject) +"`,  `" + JSON.stringify(addressInfo) + "` ,`" + sessionId + "` )'><img src='"
                    + categories[i].asset_urls.descriptive + "' alt='Klarna Image' id='" + categories[i].identifier
                    + "_image' style='margin-top: 10px; float: right;'> <p id='" + categories[i].identifier
                    + "_aproved' style='color: #84bd00; float: right; display: none;'><span style='font-size:20px;'>&#10003;</span> Approved By <span style='color: black;'>Klarna</span></p> <p style='color: #990000; float: right; display: none;' id='"
                    + categories[i].identifier + "_rejected'><span style='font-size:20px;'>&#10007;</span>Rejected By <span style='color: black;'>Klarna</span></p><div>";
                    klarnaBox.append(klarnaButton);
                }
            }
        };
        xhttp.open('GET', controllerUrl, true);
        xhttp.send();
    }
}

/*
 * Load Klarna Widget
 */
function loadKlarna(paymentMethod, requestObject, addressInfo, sessionId)
{
    // Prepare parameters
    var requestObject = JSON.parse(requestObject);
    var addressInfo = JSON.parse(addressInfo);
    
    // Empty the Klarna container
    $('#klarna-payments-container').empty();
    
    // Load Klarna content
    Klarna.Payments.load({
        container                   : '#klarna-payments-container',
        payment_method_category     : paymentMethod,
        instance_id                 : sessionId
        }, function (res) {
            klarnaAuthorizeButton(
                '#klarna-payments-container',
                sessionId, paymentMethod, addressInfo, requestObject
            );
        }
    );
}

/*
 * Klarna Authorize button
 */
function klarnaAuthorizeButton(klarnaContainer, sessionId, paymentMethod, billingAddress, requestObject)
{   
    // Prepare paramters    
    var authorizeBtn = "<button id='klarna_authorize_btn' type='button' onclick='klarnaAuthorize(`" + sessionId
    + "`, `" + klarnaContainer + "`, `" + paymentMethod + "`, ` " + JSON.stringify(billingAddress) + " ` , ` " + JSON.stringify(requestObject) + " `)'>Authorize</button>";
    var klarna = $(klarnaContainer);
    
    // Append the button
    klarna.append(authorizeBtn);
}

/*
 * Klarna Authorize
 */
function klarnaAuthorize(sessionId, klarnaContainer, paymentMethod, address, requestData)
{
    // Prepare the parameters
    var requestObject = JSON.parse(requestData);
    var billingAddress = JSON.parse(address);
    var emailAddress = $('input[name$="dwfrm_billing_billingAddress_email_emailAddress"]').val();
    billingAddress.email = emailAddress;
    
    // Authorize the Klarna charge
    Klarna.Payments.authorize(
        // Options
        {
            instance_id         : sessionId,
            auto_finalize       : false,
            payment_method_category: paymentMethod
            },
        {
            purchase_country          : requestObject.purchase_country,
            purchase_currency         : requestObject.currency,
            locale                    : requestObject.locale,
            billing_address           : billingAddress,
            order_amount              : requestObject.amount,
            order_tax_amount          : requestObject.tax_amount,
            order_lines               : requestObject.products
        },
        // Callback
        function (response) {            
            if (response.approved) {
                $(klarnaContainer).empty();
                $('#' + paymentMethod + '_image').hide();
                $('#' + paymentMethod + '_aproved').show();
                $('#' + paymentMethod + '_rejected').hide();
                
                // save value to hidden klarna form
                $('#klarna_token').val(response.authorization_token);
                $('#klarna_approved').val(response.approved);
                $('#klarna_finalize_required').val(response.finalize_required);
            } else {
                $(klarnaContainer).empty();
                $('#' + paymentMethod + '_image').hide();
                $('#' + paymentMethod + '_rejected').show();
                $('#' + paymentMethod + '_aproved').hide();
                
                // save value to hidden klarna form
                $('#klarna_token').val(response.authorization_token);
                $('#klarna_approved').val(response.approved);
                $('#klarna_finalize_required').val(response.finalize_required);
            }
        }
    );
}
