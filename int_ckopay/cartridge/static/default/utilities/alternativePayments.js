//													//
//	Alternative Payment Form decorator object;		//
//													//

"use strict";


//APMC (alternative payment method chosen)
var alternative_payments = false;
var apm_selected = false;
var apm_selected_box = false;

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function(){
	
	AlternativePayments();
	
}, false);


/*
 * Alternative Payments
 */
function AlternativePayments(){
	// Get alternative payments(apms) element by Id
	var apms = $('#apm_radio_btn');
	
	apms.on('change', function(){
		
		// set value for alternative payment check box
		if( this.checked ){
			// show all apms
			$('#alternative_payments_box').show('fast', function(){
				// hide card payment
				$('#card_payment_box').hide('fast');
			});
			
			this.value = true;
			alternative_payments = true;
			
			// set payment method to apms
			$('#dwfrm_cardPaymentForm_payment__method').val('apms');
			
			// initialize all apms
			idealPayBox(this.value);
			boletoPayBox(this.value);
			bancontactPayBox(this.value);
			benefitPayBox(this.value);
			giroPayBox(this.value);
			epsPayBox(this.value);
			sofortPayBox(this.value);
			knetPayBox(this.value);
			qPayBox(this.value);
			fawryPayBox(this.value);
			sepaPayBox(this.value);
			klarnaPayBox(this.value);
			
		}
		
	});
}



/*
 * Ideal Pay decorator
 */
function idealPayBox(cBox){
	// ideal pay radio button element
	var ideal = $('#ideal_apm_radio_btn');
	
	// ideal pay input elements div
	var idealBox = $('#ideal_pay_box');
	
	// input fields
	toggleAPMS(ideal, idealBox, cBox);
	
}

/*
 * Knet Pay decorator
 */
function knetPayBox(cBox){
	// knet pay radio button element
	var knet = $('#knet_apm_radio_btn');
	
	// knet pay input elements div
	var knetBox = $('#knet_pay_box');
	
	// input fields
	toggleAPMS(knet, knetBox, cBox);
	
}

/*
 * Sepa Pay decorator
 */
function sepaPayBox(cBox){
	// sepa pay radio button element
	var sepa = $('#sepa_apm_radio_btn');
	
	// sepa pay input elements div
	var sepaBox = $('#sepa_pay_box');
	
	// input fields
	toggleAPMS(sepa, sepaBox, cBox);
	
}

/*
 * Klarna Pay decorator
 */
function klarnaPayBox(cBox){
	// klarna pay radio button element
	var klarna = $('#klarna_apm_radio_btn');
	
	// klarna pay input elements div
	var klarnaBox = $('#klarna_pay_box');
	
	// input fields
	toggleAPMS(klarna, klarnaBox, cBox);
	
}

/*
 * QPay decorator
 */
function qPayBox(cBox){
	// Qpay radio button element
	var qpay = $('#qpay_apm_radio_btn');

	// Qpay input elements div
	var qpayBox = $('#qpay_pay_box');
	
	// input fields
	toggleAPMS(qpay, qpayBox, cBox);
	
}


/*
 * Fawry decorator
 */
function fawryPayBox(cBox){
	// fawry pay radio button element
	var fawry = $('#fawry_apm_radio_btn');

	// fawry pay input elements div
	var fawrypayBox = $('#fawry_pay_box');
	
	// input fields
	toggleAPMS(fawry, fawrypayBox, cBox);
	
}


/*
 * Sofort Pay decorator
 */
function sofortPayBox(cBox){
	// sofort pay radio button element
	var sofort = $('#sofort_apm_radio_btn');
	
	// sofort pay input elements div
	var sofortBox = $('#sofort_pay_box');
	
	// input fields
	toggleAPMS(sofort, sofortBox, cBox);
	
}


/*
 * EPS Pay decorator
 */
function epsPayBox(cBox){
	// eps pay radio button element
	var eps = $('#epsPay_apm_radio_btn');
	
	// eps pay input elements div
	var epsBox = $('#epsPay_pay_box');
	
	// input fields
	toggleAPMS(eps, epsBox, cBox);
	
}


/*
 * Boleto Pay decorator
 */
function boletoPayBox(cBox){
	// boleto pay radio button element
	var boleto = $('#boleto_apm_radio_btn');
	
	// boleto pay input elements div
	var boletoBox = $('#boleto_pay_box');
	
	// set input fields toggle
	toggleAPMS(boleto, boletoBox, cBox);
	
}


/*
 * Bancontact Pay decorator
 */
function bancontactPayBox(cBox){
	// bancontact pay radio button element
	var bancontact = $('#bancontact_apm_radio_btn');
	
	// bancontact pay input elements div
	var bancontactBox = $('#bancontact_pay_box');
	
	// set input fields toggle
	toggleAPMS(bancontact, bancontactBox, cBox);
}


/*
 * Benefit Pay decorator
 */
function benefitPayBox(cBox){
	// benefit pay radio button element
	var benefitPay = $('#benefit_apm_radio_btn');
	
	// benefit pay input elements div
	var benefitPayBox = $('#benefitPay_pay_box');
	
	// set input fields toggle
	toggleAPMS(benefitPay, benefitPayBox, cBox);
}


/*
 * Giro Pay decorator
 */
function giroPayBox(cBox){
	// giro pay radio button element
	var giroPay = $('#giroPay_apm_radio_btn');
	
	// giro pay input elements div
	var giroPayBox = $('#giroPay_pay_box');
	
	// set input fields toggle
	toggleAPMS(giroPay, giroPayBox, cBox);
}


/*
 * Set toggle
 */
function toggleAPMS(apms, apmBox, cBox){
	
	apms.on('change', function(){
	
		// hide the apms not selected
		if(apm_selected && apm_selected.id != this.id){
			apm_selected_box.hide();
		}
		
		// if apm is selected
		if(this.checked){
			// set the selected apm to this apm
			apm_selected = this;
			
			// set the selected visible apm form this form
			apm_selected_box = apmBox;
			
			// if this apm is not benefit, giro and eps pay
			if(this.id == 'klarna_apm_radio_btn'){
				// set background color for this apm form
				apmBox.css('background-color', '#eee');
				
				try {
//					
//					$.ajax({
//						url: "https://api.sandbox.checkout.com/klarna-external/credit-sessions",
//					  		beforeSend: function( xhr ) {
//					  		xhr.overrideMimeType( "application/json;charset=UTF-8" );
//					  	}
//					}).done(function( data ) {
//						if ( console && console.log ) {
//						  console.log( "Sample of data:", data.slice( 0, 100 ) );
//						}
//					});
//					

					var apiKey = "pk_test_ba17643e-6872-4306-af8f-6e771ac95114";
					
					$.ajax({
						  method: "POST",
						  url: "https://api.sandbox.checkout.com/klarna-external/credit-sessions",
						  data: { name: "John", location: "Boston" },
						  beforeSend: function( xhr ) {
							  xhr.overrideMimeType( "application/json;charset=UTF-8" );
							  xhr.setRequestHeader('Authorization', apiKey);
						  }
					}).done(function( msg ) {
						  alert( "Data Saved: " + msg );
					});
					
					
//					var http = new XMLHttpRequest();
//					var apiKey = "pk_test_ba17643e-6872-4306-af8f-6e771ac95114";
//					var url = "https://api.sandbox.checkout.com/klarna-external/credit-sessions";
//					//var url1 = "https://en73yx2zg0vgo.x.pipedream.net/";
//					var method= "GET";
//					var data = {
//						    "purchase_country": "GB",
//						    "currency": "GBP",
//						    "locale": "en-GB",
//						    "amount": 1000,
//						    "tax_amount": 1,
//						    "products": [
//						        {
//						            "name": "Battery Power Pack 1",
//						            "quantity": 1,
//						            "unit_price": 1000,
//						            "tax_rate": 1,
//						            "total_amount": 1000,
//						            "total_tax_amount": 1
//						        }
//						    ]
//						};
//					
//					
//					
//					http.open(method, url, true);
//					http.withCredentials = true;
//					http.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
//					http.setRequestHeader('Authorization', apiKey);
//					http.onreadystatechange = function(){
//						if(http.readystate === XMLHttpRequest.DONE && http.status === 200){
//							console.log(JSON.parse(http.responseText));
//						}else if(http.readyState === XMLHttpRequest.DONE && http.status !== 200){
//							console.log('Error!');
//						}
//					};
//					
//					http.send(JSON.stringify(data));
//					
					
					
//					  Klarna.Payments.init({
//					    client_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmb28iOiJiYXIifQ.dtxWM6MIcgoeMgH87tGvsNDY6cHWL6MGW4LeYvnm1JA'
//					  });
				} catch (e) {
					  // Handle error.
					console.log(e);
				}
			}
			
			// set shop url
			$('#dwfrm_cardPaymentForm_shop__url').val(location.hostname);

			$('#dwfrm_alternativePaymentForm_store__url').val(location.href);

			
			// set alternative payment value
			$('#dwfrm_alternativePaymentForm_alternative__payments').val(this.value);
			
			// remove card payment form
			$('#card_payment_box').hide();
			
			// enables the submit button
			$('button[name$="_billing_save"]').prop('disabled', false);
			
			// show this apm form
			apmBox.show();
			
			console.log($('#dwfrm_alternativePaymentForm_store__url').val());
			
			return;
		}
		
	});

}


