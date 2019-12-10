"use strict";



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

        if(fNumber){
            switch(fNumber){
                case 4: 
                    var result = this.cards.four.includes(cardNumber);
                    if(result) return "mada";
                    break;
                case 5:
                    var result = this.cards.five.includes(cardNumber);
                    if(result) return "mada";
                    break;
                case 6:
                    var result = this.cards.six.includes(cardNumber);
                    if(result) return "mada";
                    break;
                case 9:
                    var result = this.cards.nine.includes(cardNumber);
                    if(result) return "mada";
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

export default Mada;