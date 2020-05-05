"use strict";

var apm_selected = false;
var apm_selected_box = false;

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Init the APM accordion
    initApmAccordion();
}, false);

/*
 * Alternative Payments
 */
function initCheckoutcomApmValidation() {
    // Click event
    $('button.submit-payment').off('click touch').on('click touch', function (e) {
        if ($('#selectedPaymentOption').val() == 'CHECKOUTCOM_APM') {
            // Reset the error messages
            $('.invalid-field-message').empty();
            $('#cko-apm-content input').removeClass('is-invalid');

            // Prevent the default button click behaviour
            e.preventDefault();
            e.stopImmediatePropagation();

            // Prepare the errors array
            var ckoFormErrors = [];
            
            // Card number validation
            ckoFormErrors[0] = checkApmFields();

            // Invalidate the button click if errors found
            if ($.inArray(1, ckoFormErrors) !== -1) {
                return false;
            }
            else {
                // Send the place order request
                placeOrder();
            }
        }
    }); 

    // Boleto birth date formatter
    var cleave = new Cleave('#boleto_birthDate', {
        date: true,
        delimiter: '-',
        datePattern: ['Y', 'm', 'd']
    });
}

function checkApmFields() {
    var errors = 0;
    // Ideal form validation
    var idealField = $('#ideal_bic');
    if ($('#ideal_apm_radio_btn').is(':checked') && idealField.val() == '') {
        $('#ideal_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        idealField.addClass('is-invalid');
        errors++;
    }

    // Boleto form validation
    var boletoField1 = $('#boleto_birthDate');
    if ($('#boleto_apm_radio_btn').is(':checked') && boletoField1.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField1.addClass('is-invalid');
        errors++;
    }

    var boletoField2 = $('#boleto_cpfe');
    if ($('#boleto_apm_radio_btn').is(':checked') && boletoField2.val() == '') {
        $('#boleto_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        boletoField2.addClass('is-invalid');
        errors++;
    }

    // QPAY form validation
    var qpayField = $('#qpay_national_id');
    if ($('#qpay_apm_radio_btn').is(':checked') && qpayField.val() == '') {
        $('#qpay_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        qpayField.addClass('is-invalid');
        errors++;
    }

    // SEPA form validation
    var sepaField1 = $('#sepa_iban');
    if ($('#sepa_apm_radio_btn').is(':checked') && sepaField1.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        sepaField1.addClass('is-invalid');
        errors++;
    }

    var sepaField2 = $('#sepa_bic');
    if ($('#sepa_apm_radio_btn').is(':checked') && sepaField2.val() == '') {
        $('#sepa_pay_box .invalid-field-message').text(
            window.ckoLang.apmFieldInvalid
        );
        sepaField2.addClass('is-invalid');
        errors++;
    }

    return errors;
}

/*
 * Set APM Forms
 */
function initApmAccordion()
{
    
    // Filter the APM
    filterApm();
    // List item radio click action
    $('.cko-apm-accordion input[type="radio"]').on('click touch', function(e) {
        e.stopPropagation();

        $(this).parents('.cko-apm-accordion').trigger('click');
    });

    // List item click action
    $('.cko-apm-accordion').on('click touch', function(e) {
        // Prevent the form submission
        e.preventDefault();

        // Activate the input
        $(this).children('input[type="radio"]').prop('checked', true);

        // Remove all active classes
        $('.cko-apm-accordion').removeClass('cko-apm-active');

        // Close all items
        $('.cko-apm-panel').css('maxHeight', '0px');
        $('.cko-apm-panel').removeClass('cko-apm-panel-opened');

        // Set the active element
        $(this).addClass('cko-apm-active');

        // Open the sibling panel
        var panel = $(this).next();
        panel.addClass('cko-apm-panel-opened');
        if (panel.css('maxHeight') != '0px') {
            panel.css('maxHeight', '0px');
        } else {
            panel.css('maxHeight', panel.prop('scrollHeight') + 'px');
        } 
    });
}

/*
 * Get the APMs filter
 */
function filterApm()
{   
    // Get the APM controller URL
    var controllerUrl = $('#ckoApmFilterUrl').val();

    // Send the APM filter AJAX request
    var xhttpFilter = new XMLHttpRequest();
    xhttpFilter.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            // Get the APM countries and currencies list
            var apmList = JSON.parse(this.responseText);

            // Get the user country and currency
            var userData = apmList.filterObject;

            // Display only the allowed APM for the user
            var dataArray = apmList.ckoApmFilterConfig;
            for (var item in dataArray) {                    
                //if (dataArray[item].countries.includes(userData.country.toUpperCase()) && dataArray[item].currencies.includes(userData.currency)) {
                    $('#'+ item).css('display', 'block');
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
                    var klarnaButton = "<div class='klarna-button'> " + categories[i].name
                    + " <input type='radio' name='payment_method_categories' value='" + categories[i].identifier + "' id='"
                    + categories[i].identifier + "' onclick='loadKlarna(`"+ categories[i].identifier
                    + "`, `" + JSON.stringify(requestObject) +"`,  `" + JSON.stringify(addressInfo) + "` ,`" + sessionId + "` )'><img src='"
                    + categories[i].asset_urls.descriptive + "' id='" + categories[i].identifier
                    + "_image'><p id='" + categories[i].identifier
                    + "_aproved'><span>&#10003;</span> Approved By <span>Klarna</span></p><p style='color: #990000; float: right; display: none;' id='"
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
    var emailAddress = $('input[name$="dwfrm_billing_contactInfoFields_email"]').val();
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
