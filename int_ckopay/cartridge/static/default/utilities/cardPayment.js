'use strict'

//import Mada from './libraries/mada/mada.js';

var cko_card_payment = true;
// set event on page load
document.addEventListener('DOMContentLoaded', function(){
	
	
	// Get card payments element by Id
	var card = $('#card_radio_btn');
	
	// set payment method to card
	$('#dwfrm_cardPaymentForm_payment__method').val('card');

	
	card.on("change", function(){
		
		// set value for alternative payment check box
		if( this.checked ){
			
			this.value = true;
			cko_card_payment = true;
			
			// set payment method to card
			$('#dwfrm_cardPaymentForm_payment__method').val('card');
			
			// set shop url
			$('#dwfrm_cardPaymentForm_shop__url').val(location.hostname);
			
			$('#card_payment_box').show('fast', function(){
				// hide alternative payments
				$('#alternative_payments_box').hide('fast');
			});
			
			if(apm_selected.checked){
				apm_selected.checked = false;
				apm_selected_box.hide();
			}
			
		}

	});
	
	// set schema box
	setBox();
	
	// set schema image
	setSchema('#dwfrm_cardPaymentForm_number');
	
});

var isSet = false;


/*
*	Show Alternative Payment Methods
*/
function showCardPayment(){
	// show box
	$('#card_payment_box').show();
}


/*
*	Hide Alternative Payment Methods
*/
function hideCardPayment(){
	// hide box
	$('#card_payment_box').hide();
}


// sets schema box
var setBox = function(){
	$('#dwfrm_cardPaymentForm_number').css("padding", '0');
	$('#dwfrm_cardPaymentForm_number').css("padding-left", '40px');
	var box = document.getElementById('dw_cardTypeDone');
	var input = document.getElementById('dwfrm_cardPaymentForm_number');
	if(input){
		$(input.parentNode).prepend(box);
	}
	
}

// sets schema image in box
var setSchema = function(inputId){
	
	// format user input with cleave.js
	var cleaveCreditCard = new Cleave(inputId, {
		creditCard: true,
		onCreditCardTypeChanged: function(type){
			// sets the schema id
			var schema = getSchema(type);
			//console.log(id);
			
			if (schema){
				// set the schema image exist
				isSet = true;
				
				// get element cardType from form
				var cardType = document.getElementById('dwfrm_cardPaymentForm_type');
				
				// if element cardType exist set value to type
				if(cardType)cardType.value = type;
				
				// set card shema image
				setImage(schema);
			}else{
				// is mada enabled by shop
				var mada = document.getElementById('dwfrm_cardPaymentForm_mada');
				
				// if enabled do mada check
				if(mada){
					//console.log(mada);
					setMada();
				}else{
					setDefault();
				}
				
				//setDefault();
			}
		}
	});
}

// sets mada image in box
var setMada = function(){
	// set default shema image
	setDefault();
	
	
	var input = document.getElementById('dwfrm_cardPaymentForm_number');
	input.addEventListener('keyup', function(){
		var value = this.value;
		if(value.length > 6){
			var cardNumber = value.replace(/\s/g, "");
			
			// match cardnumber with mada bins
			var result = Mada.compare(cardNumber);
			
			// if result match mada card
			if(result){
				// get element cardType from form
				var cardType = document.getElementById('dwfrm_cardPaymentForm_type');
				
				// if element cardType exist set value to type
				if(cardType)cardType.value = result;
				
				// get card schema
				var schema = getSchema(result);
				
				// set card schema image
				setMadaCard(schema);
			}else{
				// if there is an active schema image don't change
				if(!isSet)setDefault();
			}
		}else if(value.length < 6){
			
			if(!isSet)setDefault();
		}
	});
}

// creates cards objects
var cardTypes = {
		'visa': {
			'regex': '^[4][0-9]{12}|^[4][0-9]{15}',
			'image': 'blue',
			'url': '/static/images/thumbs/visacard.png',
			'id': 'visacard_thumb'
		},
		'mastercard': {
			'regex': '^[5][0-9]{15}',
			'image': 'red',
			'url': '/static/images/thumbs/mastercard.png',
			'id': 'mastercard_thumb'
		},
		'amex': {
			'regex': '^[3][4][0-9]{13}|^[3][7][0-9]{13}',
			'image': 'green',
			'url': '/static/images/thumbs/amexcard.png',
			'id': 'amexcard_thumb'
		},
		'discover': {
			'regex': '^[3][4][0-9]{13}|^[3][7][0-9]{13}',
			'image': 'yellow',
			'url': '/static/images/thumbs/discovercard.png',
			'id': 'discovercard_thumb'
		},
		'diners': {
			'regex': '^[3][4][0-9]{13}|^[3][7][0-9]{13}',
			'image': 'brown',
			'url': '/static/images/thumbs/card-schema.png',
			'id': 'dinersclub_thumb'
		},
		'jcb': {
			'regex': '^[3][4][0-9]{13}|^[3][7][0-9]{13}',
			'image': 'black',
			'url': '/static/images/thumbs/card-schema.png',
			'id': 'jcbcard_thumb'
		},
		'mada': {
			'regex': '^[3][4][0-9]{13}|^[3][7][0-9]{13}',
			'image': 'brown',
			'url': '/static/images/thumbs/mada.svg',
			'id': 'madacard_thumb'
		}
};

//set the mada card image
var setMadaCard = function(element){
	var a = document.getElementById('visacard_thumb');
	var b = document.getElementById('mastercard_thumb');
	var c = document.getElementById('amexcard_thumb');
	var d = document.getElementById('discovercard_thumb');
	var e = document.getElementById('jcbcard_thumb');
	var f = document.getElementById('dinersclub_thumb');
	var z = document.getElementById('default_thumb');
	
	var x = document.getElementById(element);
	//console.log(element);

	a.style.display = "none";
	b.style.display = "none";
	c.style.display = "none";
	d.style.display = "none";
	e.style.display = "none";
	f.style.display = "none";
	z.style.display = "none";
	
	x.style.display = "block";
	
}


// set schema card image
var setImage = function(element){
	var a = document.getElementById('visacard_thumb');
	var b = document.getElementById('mastercard_thumb');
	var c = document.getElementById('amexcard_thumb');
	var d = document.getElementById('discovercard_thumb');
	var e = document.getElementById('jcbcard_thumb');
	var f = document.getElementById('dinersclub_thumb');
	var g = document.getElementById('madacard_thumb');
	
	var z = document.getElementById('default_thumb');
	
	var x = document.getElementById(element);
	//console.log(element);
	
	if(x){
		a.style.display = "none";
		b.style.display = "none";
		c.style.display = "none";
		d.style.display = "none";
		e.style.display = "none";
		f.style.display = "none";
		g.style.display = "none";
		
		z.style.display = "none";
		
		x.style.display = "block";
	}
	
}


// set the default card image
var setDefault = function(){
	var a = document.getElementById('visacard_thumb');
	var b = document.getElementById('mastercard_thumb');
	var c = document.getElementById('amexcard_thumb');
	var d = document.getElementById('discovercard_thumb');
	var e = document.getElementById('jcbcard_thumb');
	var f = document.getElementById('dinersclub_thumb');
	var g = document.getElementById('madacard_thumb');
	
	var z = document.getElementById('default_thumb');
	//console.log(element);

	a.style.display = "none";
	b.style.display = "none";
	c.style.display = "none";
	d.style.display = "none";
	e.style.display = "none";
	f.style.display = "none";
	g.style.display = "none";
	
	z.style.display = "block";

	
}

// get image schema / id
var getSchema  = function(schema){
	
	switch(schema){
		case 'visa':
			return cardTypes.visa.id; 
			break;
		case 'mastercard':
			return cardTypes.mastercard.id;
			break;
		case 'amex':
			return cardTypes.amex.id;
			break;
		case 'discover':
			return cardTypes.discover.id;
			break;
		case 'jcb':
			return cardTypes.jcb.id;
			break;
		case 'diners':
			return cardTypes.diners.id;
		case 'mada':
			return cardTypes.mada.id;
		default:
			return false;
	}
}



var Mada = {

    // mada BINs
    cards: {
        four: [ 
                "484783", "489317", "410685", "446672", "428331", "419593", "440647", "493428", "417633", "446393", "486094", "489318", "432328", "483010", "439954",
                "440795", "468540", "462220", "486095", "489319", "428671", "434107", "483011", "407197", "446404", "468541", "400861", "455708", "486096", "445564",
                "428672", "431361", "422817", "483012", "407395", "457865", "468542", "409201", "428673", "422818", "468543", "458456", "455036", "440533", "401757",
                "422819"
            ],
        five: [ 
                "588845", "588846", "588850", "554180", "537767", "588982", "588851", "543357", "549760", "535989", "589005", "539931", "588847", "535825", "588849",
                "536023", "508160", "558848", "529415", "513213", "531095", "557606", "588848", "504300", "543085", "524514", "585265", "530906", "589206", "521076",
                "524130", "529741", "588983", "532013",
            ],
        six: [ "636120", "605141", "604906" ],
        nine: [ "968201", "968203", "968205", "968202", "968204", "968209", "968211", "968208", "968210", "968206", "968207" ]
    },

    // Compare card 
    compare: function(cardNumber){
        // get first number
        var fNumber = this.firstNumber(cardNumber);
        var number = cardNumber.substr(0, 6);
        //console.log(number);

        if(fNumber){
            switch(fNumber){
                case '4': 
                    var result = this.cards.four.includes(number);
                    if(result) return "mada";
                    break;
                case '5':
                    var result = this.cards.five.includes(number);
                    if(result) return "mada";
                    break;
                case '6':
                    var result = this.cards.six.includes(number);
                    if(result) return "mada";
                    break;
                case '9':
                    var result = this.cards.nine.includes(number);
                    if(result) return "mada";
                    break;
                default:
                	//console.log('not found');
                	return false;
            }
        }else{
            return "error";
        }


    },

    // returns the first number of the card
    firstNumber: function(cardNumber){
        // get first number
        return cardNumber.charAt(0);
    }

}








