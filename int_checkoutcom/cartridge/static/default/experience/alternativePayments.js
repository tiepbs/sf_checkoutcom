//													//
//	Alternative Payment Form decorator object;		//
//													//

"use strict";


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
	
	$('input[name="apm_payment_types"]').change(function(){
		
		switch(this.value){
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
		default:
			console.log('Apm unknown');
		}
		
		
	});
	
}



/*
 * Ideal Pay decorator
 */
function idealPayBox(){
	// ideal pay radio button element
	var ideal = $('#ideal_apm_radio_btn');
	
	// ideal pay input elements div
	var idealBox = $('#ideal_pay_box');
	
	// input fields
	toggleAPMS(ideal, idealBox);
	
}

/*
 * Knet Pay decorator
 */
function knetPayBox(){
	// knet pay radio button element
	var knet = $('#knet_apm_radio_btn');
	
	// knet pay input elements div
	var knetBox = $('#knet_pay_box');
	
	// input fields
	toggleAPMS(knet, knetBox);
	
}

/*
 * Sepa Pay decorator
 */
function sepaPayBox(){
	// sepa pay radio button element
	var sepa = $('#sepa_apm_radio_btn');
	
	// sepa pay input elements div
	var sepaBox = $('#sepa_pay_box');
	
	// input fields
	toggleAPMS(sepa, sepaBox);
	
}

/*
 * Klarna Pay decorator
 */
function klarnaPayBox(){
	// klarna pay radio button element
	var klarna = $('#klarna_apm_radio_btn');
	
	// klarna pay input elements div
	var klarnaBox = $('#klarna_pay_box');
	
	// input fields
	toggleAPMS(klarna, klarnaBox);
	
}

/*
 * QPay decorator
 */
function qPayBox(){
	// Qpay radio button element
	var qpay = $('#qpay_apm_radio_btn');

	// Qpay input elements div
	var qpayBox = $('#qpay_pay_box');
	
	// input fields
	toggleAPMS(qpay, qpayBox);
	
}


/*
 * Fawry decorator
 */
function fawryPayBox(){
	// fawry pay radio button element
	var fawry = $('#fawry_apm_radio_btn');

	// fawry pay input elements div
	var fawrypayBox = $('#fawry_pay_box');
	
	// input fields
	toggleAPMS(fawry, fawrypayBox);
	
}


/*
 * Sofort Pay decorator
 */
function sofortPayBox(){
	// sofort pay radio button element
	var sofort = $('#sofort_apm_radio_btn');
	
	// sofort pay input elements div
	var sofortBox = $('#sofort_pay_box');
	
	// input fields
	toggleAPMS(sofort, sofortBox);
	
}


/*
 * EPS Pay decorator
 */
function epsPayBox(){
	// eps pay radio button element
	var eps = $('#epsPay_apm_radio_btn');
	
	// eps pay input elements div
	var epsBox = $('#epsPay_pay_box');
	
	// input fields
	toggleAPMS(eps, epsBox);
	
}


/*
 * Boleto Pay decorator
 */
function boletoPayBox(){
	// boleto pay radio button element
	var boleto = $('#boleto_apm_radio_btn');
	
	// boleto pay input elements div
	var boletoBox = $('#boleto_pay_box');
	
	// set input fields toggle
	toggleAPMS(boleto, boletoBox);
	
}


/*
 * Bancontact Pay decorator
 */
function bancontactPayBox(){
	// bancontact pay radio button element
	var bancontact = $('#bancontact_apm_radio_btn');
	
	// bancontact pay input elements div
	var bancontactBox = $('#bancontact_pay_box');
	
	// set input fields toggle
	toggleAPMS(bancontact, bancontactBox);
}


/*
 * Benefit Pay decorator
 */
function benefitPayBox(){
	// benefit pay radio button element
	var benefitPay = $('#benefit_apm_radio_btn');
	
	// benefit pay input elements div
	var benefitPayBox = $('#benefitPay_pay_box');
	
	// set input fields toggle
	toggleAPMS(benefitPay, benefitPayBox);
}


/*
 * Giro Pay decorator
 */
function giroPayBox(){
	// giro pay radio button element
	var giroPay = $('#giroPay_apm_radio_btn');
	
	// giro pay input elements div
	var giroPayBox = $('#giroPay_pay_box');
	
	// set input fields toggle
	toggleAPMS(giroPay, giroPayBox);
}


/*
 * Set APM Forms
 */
function toggleAPMS(apms, apmBox){
	
	// if another apm is selected
	if(apm_selected){
		apm_selected.toggle();
		apmBox.toggle();
		apm_selected = apmBox;
		
		// set alternative payment value
		var apmSelect = $('#dwfrm_alternativePaymentForm_alternative__payments');
		apmSelect.val(apms.val());
		
		// set shop url value
		var apmShopUrl = $('#dwfrm_alternativePaymentForm_store__url');
		apmShopUrl.val(location.hostname);
		
	}else{
		apmBox.toggle();
		apm_selected = apmBox;
		
		// set alternative payment value
		var apmSelect = $('#dwfrm_alternativePaymentForm_alternative__payments');
		apmSelect.val(apms.val());
		
		// set shop url value
		var apmShopUrl = $('#dwfrm_alternativePaymentForm_store__url');
		apmShopUrl.val(location.hostname);
		
	}

}


