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

// Sets schema box
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

// Sets the expiration years in the form
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

// Sets schema image in box
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

// Sets mada image in box
var setMada = function () {
    var input = document.getElementById('dwfrm_cardPaymentForm_number');
    input.addEventListener('keyup', function () {
        var value = this.value;
        if (value.length > 6) {
            var cardNumber = value.replace(/\s/g, "");
            
            // Match cardnumber with mada bins
            var result = Mada.compare(cardNumber);
            
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
        } else if (value.length < 6) {
            if (!isSet) {
                setImage('default_thumb');
            }
        }
    });
}

// Set schema card image
var setImage = function (element) {
    // If image is already set
    if (isSetId) {
        isSetId.style.display = "none";
        var id = document.getElementById(element);
        id.style.display = "block";
        isSetId = id;
    } else {
        var id = document.getElementById(element);
        id.style.display = "block";
        isSetId = id;
    }
}

// Get image id
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

var Mada = {
    // MADA BINs
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
    compare: function (cardNumber) {
        // Get first number
        var fNumber = this.firstNumber(cardNumber);
        var number = cardNumber.substr(0, 6);

        if (fNumber) {
            switch (fNumber) {
                case '4':
                    var result = this.cards.four.includes(number);
                    if (result) {
                        return "mada";
                    }
                    break;
                case '5':
                    var result = this.cards.five.includes(number);
                    if (result) {
                        return "mada";
                    }
                    break;
                case '6':
                    var result = this.cards.six.includes(number);
                    if (result) {
                        return "mada";
                    }
                    break;
                case '9':
                    var result = this.cards.nine.includes(number);
                    if (result) {
                        return "mada";
                    }
                    break;
                default:
                    return false;
            }
        }
        else {
            return "error";
        }
    },

    // Returns the first number of the card
    firstNumber: function (cardNumber) {
        // Get first number
        return cardNumber.charAt(0);
    }
}