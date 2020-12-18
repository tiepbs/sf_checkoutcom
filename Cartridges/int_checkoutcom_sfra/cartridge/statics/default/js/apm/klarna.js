'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
    initKlarnaEvent();
}, false);

/*
 * Load Klarna
 */
function initKlarnaEvent() {
    $('.klarna-tab').on('click touch', function() {
        resetFormErrors();

        // valid email address
        if (validateEmail() && validatePhone()) {
            callKlarnaController();
        }
    });
}

/**
 * Reset Form
 */
function resetFormErrors() {
    $('.contact-info-block .is-invalid').each(function() {
        $(this).removeClass('is-invalid');
    });
}

/**
 * Validate Email
 */
function validateEmail() {
    var emailAddress = $('input[name$="dwfrm_billing_contactInfoFields_email"]');

    // Check expiration month
    if (emailAddress.val() === '') {
        $('#emailInvalidMessage').text(
            window.ckoLang.apmEmailInvalid
        );
        emailAddress.addClass('is-invalid');

        return false;
    }

    return true;
}

/**
 * Validate Phone Number
 */
function validatePhone() {
    var phone = $('input[name$="dwfrm_billing_contactInfoFields_phone"]');

    // Check expiration month
    if (phone.val() === '') {
        $('#phoneInvalidMessage').text(
            window.ckoLang.apmPhoneNumberInvalid
        );
        phone.addClass('is-invalid');

        return false;
    }

    return true;
}

/*
 * Get the Klarna controller
 */
function callKlarnaController() {
    var controllerUrl = jQuery('[id="ckoKlarnaController"]').val();
    if (controllerUrl) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState === 4 && this.status === 200) {
                var sessionId = JSON.parse(this.responseText).session_id;
                var token = JSON.parse(this.responseText).client_token;
                var categories = JSON.parse(this.responseText).payment_method_categories;
                var requestObject = JSON.parse(this.responseText).requestObject;
                var addressInfo = JSON.parse(this.responseText).addressInfo;

                Klarna.Payments.init(
                    // Options
                    {
                        client_token: token,
                    }
                );

                // Prepare the Klarna box display
                var klarnaBox = $('#klarna-buttons');
                klarnaBox.empty();
                for (var i = 0; i < categories.length; i++) {
                    var klarnaButton = "<div class='klarna-button'> " + categories[i].name
                    + " <input type='radio' name='payment_method_categories' value='" + categories[i].identifier + "' id='"
                    + categories[i].identifier + "' onclick='loadKlarna(`" + categories[i].identifier
                    + '`, `' + JSON.stringify(requestObject) + '`,  `' + JSON.stringify(addressInfo) + '` ,`' + sessionId + "` )'><img src='"
                    + categories[i].asset_urls.descriptive + "' id='" + categories[i].identifier
                    + "_image'><p id='" + categories[i].identifier
                    + "_aproved'><span>&#10003;</span><span>Klarna</span></p><p style='color: #990000; float: right; display: none;' id='"
                    + categories[i].identifier + "_rejected'><span style='font-size:20px;'>&#10007;</span><span style='color: black;'>Klarna</span></p><div>";
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
function loadKlarna(paymentMethod, requestObject, addressInfo, sessionId) {
    
    // Prepare parameters
    var requestObject = JSON.parse(requestObject);
    var addressInfo = JSON.parse(addressInfo);

    // Empty the Klarna container
    $('#klarna-payments-container').empty();

    // Load Klarna content
    Klarna.Payments.load({
        container: '#klarna-payments-container',
        payment_method_category: paymentMethod,
        instance_id: sessionId,
    }, function(res) {
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
function klarnaAuthorizeButton(klarnaContainer, sessionId, paymentMethod, billingAddress, requestObject) {
    // Prepare paramters
    var authorizeBtn = "<button id='klarna_authorize_btn' type='button' onclick='klarnaAuthorize(`" + sessionId
    + '`, `' + klarnaContainer + '`, `' + paymentMethod + '`, ` ' + JSON.stringify(billingAddress) + ' ` , ` ' + JSON.stringify(requestObject) + " `)'>Authorize</button>";
    var klarna = $(klarnaContainer);

    // Append the button
    klarna.append(authorizeBtn);
}

/*
 * Klarna Authorize
 */
function klarnaAuthorize(sessionId, klarnaContainer, paymentMethod, address, requestData) {
    // Prepare the parameters
    var requestObject = JSON.parse(requestData);
    var billingAddress = JSON.parse(address);
    var emailAddress = $('input[name$="dwfrm_billing_contactInfoFields_email"]').val();
    billingAddress.email = emailAddress;

    // Authorize the Klarna charge
    Klarna.Payments.authorize(
    // Options
        {
            instance_id: sessionId,
            auto_finalize: false,
            payment_method_category: paymentMethod,
        },
        {
            purchase_country: requestObject.purchase_country,
            purchase_currency: requestObject.currency,
            locale: requestObject.locale,
            billing_address: billingAddress,
            order_amount: requestObject.amount,
            order_tax_amount: requestObject.tax_amount,
            order_lines: requestObject.products,
        },
        // Callback
        function(response) {

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
