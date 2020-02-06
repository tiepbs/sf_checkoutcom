"use strict";

//                                                  //
//  Alternative Payment Form decorator object;      //
//                                                  //


var apm_selected = false;
var apm_selected_box = false;

/**
 * JQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    alternativePayments();
    alternativePaymentsFilter();
}, false);

/*
 * Alternative Payments
 */
function alternativePayments()
{
    $('input[name="apm_list"]').change(function () {
        switch (this.value) {
            case"ideal":
                idealPayBox();
            break;
            case"boleto":
                boletoPayBox();
            break;
            case"eps":
                epsPayBox();
            break;
            case"giro":
                giroPayBox();
            break;
            case"fawry":
                fawryPayBox();
            break;
            case"knet":
                knetPayBox();
            break;
            case"qpay":
                qPayBox();
            break;
            case"sepa":
                sepaPayBox();
            break;
            case"bancontact":
                bancontactPayBox();
            break;
            case"sofort":
                sofortPayBox();
            break;
            case"benefit":
                benefitPayBox();
            break;
            case"multibanco":
                multibancoPayBox();
            break;
            case"poli":
                poliPayBox();
            break;
            case"p24":
                p24PayBox();
            break;
            case"klarna":
                klarnaPayBox();
            break;
            case"paypal":
                paypalPayBox();
            break;
            case"oxxo":
                oxxoPayBox();
            break;
            default:
                console.log('Apm unknown');
        }
    });
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
    // Eps pay radio button element
    var eps = $('#epsPay_apm_radio_btn');
    
    // Eps pay input elements div
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
    var cleave = new Cleave('#dwfrm_alternativePaymentForm_boleto__birthDate', {
        date: true,
        delimiter: '-',
        datePattern: ['Y', 'm', 'd']
    });
    
    // Set input fields toggle
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
    // Poli pay radio button element
    var poliPay = $('#poliPay_apm_radio_btn');
    
    // Poli pay input elements div
    var poliPayBox = $('#poliPay_pay_box');
    
    // Set input fields toggle
    toggleApm(poliPay, poliPayBox);
}

/*
 * P24 Pay decorator
 */
function p24PayBox()
{
    // P24 pay radio button element
    var p24Pay = $('#p24Pay_apm_radio_btn');
    
    // P24 pay input elements div
    var p24PayBox = $('#p24Pay_pay_box');
    
    // Set input fields toggle
    toggleApm(p24Pay, p24PayBox);
}

/*
 * Paypal Pay decorator
 */
function paypalPayBox()
{
    // Paypal radio button element
    var paypalPay = $('#paypalPay_apm_radio_btn');
    
    // Paypal input elements div
    var paypalPayBox = $('#paypalPay_pay_box');
    
    // set input fields toggle
    toggleApm(paypalPay, paypalPayBox);
}

/*
 * Klarna Pay decorator
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
function alternativePaymentsFilter()
{   
    	
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
            	
            	/*
            	 * If the current apm country-code and currency-code in 
            	 * the list of apms match the current country-code and currency-code
            	 */
                if (apmsFilterObject[apms].countries.includes(filterObject.country.toUpperCase()) && apmsFilterObject[apms].currencies.includes(filterObject.currency)) {
                    
                	// Show Apm in template
                	$('#'+ apms).show();
                	
                }
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
                Klarna.Payments.init(
                // Options
                    {
                    	// Klarna Session token
                        client_token: token
                    }
                );
            
                // Klarna payment options button
                var klarnaBox = $('#klarna-buttons');
                
                // Empty klarna payment box in-other to eliminate duplicates
                klarnaBox.empty();
                
                // Builds and show klarna payment options buttons
                for (var i = 0; i < categories.length; i++) {
                    var klarnaButton = "<div class='klarnaButton'> " + categories[i].name
                    + " <input type='radio' name='payment_method_categories' value='" + categories[i].identifier + "'id='"
                    + categories[i].identifier + "' onclick='loadKlarna(`"+ categories[i].identifier
                    + "`, `" + JSON.stringify(requestObject) +"`,  `" + JSON.stringify(addressInfo) + "` ,`" + sessionId + "` )'><img src='"
                    + categories[i].asset_urls.descriptive + "' alt='Klarna Image' id='" + categories[i].identifier
                    + "_image' class='klarnaLogo'> <p id='" + categories[i].identifier
                    + "_aproved' class='klarnaAproved'><span>&#10003;</span> Approved By <span class='klarnaBlack'>Klarna</span></p> <p class='klarnaFail' id='"
                    + categories[i].identifier + "_rejected'><span>&#10007;</span>Rejected By <span class='klarnaBlack'>Klarna</span></p><div>";
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

/*
 * Loads Klarna Payments Widget
 */
function loadKlarna(paymentMethod, requestObject, addressInfo, sessionId)
{
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
            klarnaAuthorizeButton(
            		
            	// Klarna container id
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
    // Build Klarna authorization button   
    var AuthorizeBtn = "<button type='button' style='width: 100%; margin-top: 30px;' onclick='klarnaAuthorize(`" + sessionId
    + "`, `" + klarnaContainer + "`, `" + paymentMethod + "`, ` " + JSON.stringify(billingAddress) + " ` , ` " + JSON.stringify(requestObject) + " `)'>Klarna</button>";
    var klarna = $(klarnaContainer);
    
    // Append klarna authorization button
    klarna.append(AuthorizeBtn);
}

/*
 * Klarna Authorize
 */
function klarnaAuthorize(sessionId, klarnaContainer, paymentMethod, address, requestData)
{
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
