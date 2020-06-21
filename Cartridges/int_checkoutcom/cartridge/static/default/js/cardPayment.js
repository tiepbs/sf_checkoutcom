'use strict'

var isSet = true;
var isSetId = document.getElementById('default_thumb');

// set event on page load
document.addEventListener('DOMContentLoaded', function () {
	
    // Set schema box
    setBox();
    
    // Set schema image
    setSchema('#dwfrm_cardPaymentForm_number');

    // Add expiration years
    setExpirationYears();
});

/**
 * Sets schema box
 */
var setBox = function () {
	
    // Card number input styling
    $('#dwfrm_cardPaymentForm_number').css("padding", '0');
    $('#dwfrm_cardPaymentForm_number').css("padding-left", '40px');
    
    // Get object
    var box = document.getElementById('dw_cardTypeDone');
    var input = document.getElementById('dwfrm_cardPaymentForm_number');
    if (input) {
        $(input.parentNode).prepend(box);
    }
}

/**
 * Sets the expiration years in the form
 */
var setExpirationYears = function() {
	
    // Get the current year
    var d = new Date();
    var currentYear = d.getFullYear();

    // Add the select list options
    for (var i = 0; i < 10; i++) {
        $('#dwfrm_cardPaymentForm_expiration_year').append(
            new Option(
                currentYear + i,
                currentYear + i
            )
        );
    }
}

/**
 * Sets schema image in box
 */
var setSchema = function (inputId) {
	
    // Format user input with cleave.js
    var cleaveCreditCard = new Cleave(inputId, {
        creditCard: true,
        onCreditCardTypeChanged: function (type) {
        	
            // Sets the schema id
            var imageId = getImageId(type);            
            if (imageId) {
            	
                // Set the schema image exist
                isSet = true;
                
                // Get element cardType from form
                var cardType = document.getElementById('dwfrm_cardPaymentForm_type');
                
                // If element cardType exist set value to type
                if (cardType) {
                    cardType.value = type;
                }
                
                // Set card shema image
                setImage(imageId);
            } else {
            	
                // Is mada enabled by shop
                var mada = document.getElementById('dwfrm_cardPaymentForm_mada');
                
                // If enabled do mada check
                if (mada) {
                    setMada();
                } else {
                    setImage('default_thumb');
                }
            }
        }
    });
}

/**
 * Set schema card image
 */
var setImage = function (element) {
    var id = document.getElementById(element);
	
    // If image is already set
    if (isSetId) {
        isSetId.style.display = "none";
        id.style.display = "block";
        isSetId = id;
    } else {
        id.style.display = "block";
        isSetId = id;
    }
}

/**
 * Get image id
 */
var getImageId  = function (schema) {
    switch (schema) {
        case 'visa':
            return "visacard_thumb";
            break;
        case 'mastercard':
            return "mastercard_thumb";
            break;
        case 'amex':
            return "amexcard_thumb";
            break;
        case 'discover':
            return "discovercard_thumb";
            break;
        case 'jcb':
            return "jcbcard_thumb";
            break;
        case 'diners':
            return "dinersclub_thumb";
        case 'mada':
            return "madacard_thumb";
        default:
            return false;
    }
}

/**
 * Compare card
 */
var ckoMadaFilter = function (cardNumber, bins) {
	
    // Get first number
    var firstNumber = cardNumber.charAt(0);
    var number = cardNumber.substr(0, 6);

    if (firstNumber) {
    	var result = null;
        switch (firstNumber) {
            case '4':
                result = bins.four.includes(number);
                if (result) {
                	
                    return "mada";
                }
                break;
            case '5':
                result = bins.five.includes(number);
                if (result) {
                	
                    return "mada";
                }
                break;
            case '6':
                result = bins.six.includes(number);
                if (result) {
                	
                    return "mada";
                }
                break;
            case '9':
                result = bins.nine.includes(number);
                if (result) {
                	
                    return "mada";
                }
                break;
            default:
            	
                return false;
        }
    }
    else {
    	
        return false;
    }
}

/**
 * Sets mada image in box
 */
var setMada = function () {
    var input = document.getElementById('dwfrm_cardPaymentForm_number');
    input.addEventListener('keyup', function () {
        var value = this.value;
        if (value.length == 7) {
            var cardNumber = value.replace(/\s/g, "");
            
            // Get Mata Config data Url
            var madaBinUrl = document.getElementById('ckoMadaBinUrl').value;
            var madaBinRequest = new XMLHttpRequest();
            
            madaBinRequest.onreadystatechange = function() {
            	
            	// If request was successful and return 200
                if (this.readyState == 4 && this.status == 200) {
                	
                	// Assign the request response to responseObject variable
                    var responseObject = JSON.parse(this.responseText);
                    var bins = responseObject;
                    //console.log(bins);
                    
                    // Match cardnumber with mada bins
                    var result = ckoMadaFilter(cardNumber, bins);
				  
                    // If result match mada card
                    if (result) {
                    	// Get element cardType from form
                    	var cardType = document.getElementById('dwfrm_cardPaymentForm_type');
				  
                    	// If element cardType exist set value to type
                    	if (cardType) {
                    		cardType.value = result;
                    	}
				  
                    	// Get card schema
                    	var imageId = getImageId(result);
				  
                    	// Set card schema image
                    	setImage(imageId);
                    } else {
				  	
                    	// If there is an active schema image don't change
                    	if (!isSet) {
                    		setImage('default_thumb');
                    	}
                    }
                    
                }
            }
            
            madaBinRequest.open('GET', madaBinUrl, true);
            madaBinRequest.send();
            
        } else if (value.length < 6) {
            if (!isSet) {
                setImage('default_thumb');
            }
        }
    });
}
