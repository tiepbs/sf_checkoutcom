"use strict";

//  Alternative Payment Form decorator object

// JQuery Ajax helpers on DOM ready
document.addEventListener('DOMContentLoaded', function () {
    alternativePaymentsFilter();
    initApmAccordion();
}, false);


/**
 * Accordion Function
 */
function initApmAccordion() {
	var acc = document.getElementsByClassName('cko-apm-accordion');
	var i;
	for (i = 0; i < acc.length; i++) {
	  acc[i].addEventListener('click', function() {

        // Remove all active classes
        $('.cko-apm-accordion').removeClass('cko-apm-active');
        $('.cko-apm-panel').css('display', 'none');

	    /* Toggle between adding and removing the "active" class,
	    to highlight the button that controls the panel */
	    this.classList.toggle('cko-apm-active');

	    // Toggle between hiding and showing the active panel
	    var panel = this.nextElementSibling;
	    var currentInput = this.querySelector('input[name="apm_list"');
	    currentInput.checked = true;

        // Set alternative payment value
        var apmSelect = $('#dwfrm_alternativePaymentForm_alternative__payments');
        apmSelect.val(currentInput.value);
	    if (panel) {
			if (panel.style.minHeight) {
				panel.style.minHeight = null;
				panel.style.display = "block";
			} else {
				panel.style.minHeight = panel.scrollHeight + "px";
				panel.style.display = "block";
			}
	    }
	  });
	}
}


/**
 * Get the APMs filter
 */
function alternativePaymentsFilter() {

	// Retrieves the Apm Filter Url to controllerUrl variable
    var controllerUrl = $('#ckoApmFilterUrl').val();

    // Creates a new xmlHttp Request object
    var xhttpFilter = new XMLHttpRequest();

    // When request state changes
    xhttpFilter.onreadystatechange = function () {

    	// If request was successful and return 200
        if (this.readyState == 4 && this.status == 200) {

        	// Assign the request response to responseObject variable
            var responseObject = JSON.parse(this.responseText);

            /*
             * Assign the current filter Object (Current Country-Code and
             * Currency-Code) from the response object to filterObject variable
             */
            var filterObject = responseObject.filterObject;

            // Assign the apms filter Object from the response object to apmfilterObject variable
            var apmsFilterObject = responseObject.ckoApmFilterConfig;

            // Loops through the apmfilterObject
            for (var apms in apmsFilterObject) {
            	var condition1 = apmsFilterObject[apms].countries.includes(filterObject.country.toUpperCase());
            	var condition2 = apmsFilterObject[apms].countries.includes('*');
            	var condition3 = apmsFilterObject[apms].currencies.includes(filterObject.currency);
            	
            	/*
            	 * If the current apm country-code and currency-code in
            	 * the list of apms, match the current country-code and currency-code
            	 */
                if ((condition1 || condition2) && condition3) {

                	// Show Apm in template
                	$('#'+ apms).show();

                }
            }
        }
    };

    xhttpFilter.open('GET', controllerUrl, true);
    xhttpFilter.send();

}


/**
 * Get the Klarna controller
 */
function callKlarnaController(controllerUrl) {
    if (controllerUrl) {

    	// Creates a new xmlhttp request object
        var xhttp = new XMLHttpRequest();

        // When request state changes
        xhttp.onreadystatechange = function () {

        	// If request was successful and return 200
            if (this.readyState == 4 && this.status == 200) {

            	// Klarna session Id
                var sessionId = JSON.parse(this.responseText).session_id;

                // Klarna session token
                var token = JSON.parse(this.responseText).client_token;

                // Klarna available payments
                var categories = JSON.parse(this.responseText).payment_method_categories;

                // Klarna transaction / order object
                var requestObject = JSON.parse(this.responseText).requestObject;

                // Klarna customer address information
                var addressInfo = JSON.parse(this.responseText).addressInfo;

                // Initialize klarna payment form
                Klarna.Payments.init({client_token: token});

                // Klarna payment options button
                var klarnaBox = $('#klarna-buttons');

                // Empty klarna payment box in-other to eliminate duplicates
                klarnaBox.empty();

                // Builds and show klarna payment options buttons
                for (var i = 0; i < categories.length; i++) {
                    var klarnaButton = "<div class='klarnaButton'> " + categories[i].name
                    + " <input type='radio' name='payment_method_categories' value='" + categories[i].identifier + "' id='"
                    + categories[i].identifier + "' onclick='loadKlarna(`"+ categories[i].identifier
                    + "`, `" + JSON.stringify(requestObject) +"`,  `" + JSON.stringify(addressInfo) + "` ,`" + sessionId + "` )'><img src='"
                    + categories[i].asset_urls.descriptive + "' alt='Klarna' id='" + categories[i].identifier
                    + "_image' class='klarnaLogo'> <p id='" + categories[i].identifier
                    + "_aproved' class='klarnaAproved'><span class='klarnaBlack'>Klarna</span><span> &#10003;</span></p> <p class='klarnaFail' id='"
                    + categories[i].identifier + "_rejected'><span class='klarnaBlack'>Klarna</span><span> &#10007;</span></p><div>";
                    klarnaBox.append(klarnaButton);
                }
            }
        };

        // Creates a get request
        xhttp.open('GET', controllerUrl, true);

        // Makes the get request
        xhttp.send();
    }
}

/**
 * Loads Klarna Payments Widget
 */
function loadKlarna(paymentMethod, requestObject, addressInfo, sessionId) {

    // Converts request string to object
    var requestObject = JSON.parse(requestObject);

    // Converts address string to object
    var addressInfo = JSON.parse(addressInfo);

    // Empty the Klarna container
    $('#klarna-payments-container').empty();

    // Load Klarna content
    Klarna.Payments.load({
        container                   : '#klarna-payments-container',
        payment_method_category     : paymentMethod,
        instance_id                 : sessionId
        }, function (res) {

        	// Triggers Klarna Authorization
            klarnaAuthorizeButton('#klarna-payments-container', sessionId, paymentMethod, addressInfo, requestObject);
        }
    );
}

/**
 * Klarna Authorize button
 */
function klarnaAuthorizeButton(klarnaContainer, sessionId, paymentMethod, billingAddress, requestObject) {

    // Build Klarna authorization button
    var authorizeBtn = $('#klarnaConfirmBtn');
    authorizeBtn.show();
    authorizeBtn.click(function () {
    	klarnaAuthorize(sessionId, klarnaContainer, paymentMethod, JSON.stringify(billingAddress), JSON.stringify(requestObject));
    	$(this).hide();
    });
}

/**
 * Klarna Authorize
 */
function klarnaAuthorize(sessionId, klarnaContainer, paymentMethod, address, requestData) {

    // Converts request string to object
    var requestObject = JSON.parse(requestData);

    // Converts address string to object
    var billingAddress = JSON.parse(address);

    // Retrieve Customer email from Billing Form
    var emailAddress = $('input[name$="dwfrm_billing_billingAddress_email_emailAddress"]').val();

    // Add Customer Email to billing Address object
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

        	// Authorization is Successful
            if (response.approved) {

            	// Empty Klarna Payment Options Button
                $(klarnaContainer).empty();

                // Hides the Klarna Logo
                $('#' + paymentMethod + '_image').hide();

                // Show Payment Success tick
                $('#' + paymentMethod + '_aproved').show();

                // Hides Payment Not Successful star
                $('#' + paymentMethod + '_rejected').hide();

                // Save value to hidden klarna form
                $('#dwfrm_alternativePaymentForm_klarna__token').val(response.authorization_token);
                $('#dwfrm_alternativePaymentForm_klarna__approved').val(response.approved);
                $('#dwfrm_alternativePaymentForm_klarna__finalize__required').val(response.finalize_required);
            }

            // Authorization not Successful
            else {

            	// Empty Klarna Payment Options Button
                $(klarnaContainer).empty();

                // Hides the Klarna Logo
                $('#' + paymentMethod + '_image').hide();

                // Show Payment Not Successful star
                $('#' + paymentMethod + '_rejected').show();

                // Hide Payment Success tick
                $('#' + paymentMethod + '_aproved').hide();

                // Save value to hidden klarna form
                $('#dwfrm_alternativePaymentForm_klarna__token').val(response.authorization_token);
                $('#dwfrm_alternativePaymentForm_klarna__approved').val(response.approved);
                $('#dwfrm_alternativePaymentForm_klarna__finalize__required').val(response.finalize_required);
            }
        }
    );
}
