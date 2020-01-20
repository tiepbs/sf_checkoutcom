"use strict"

/*
 * CKO Card Currency Conversion Object
 */

var ckoCardCurrency = {
		
	byZero	: {
			currencies 	: "BIF DJF GNF ISK KMF XAF CLF XPF JPY PYG RWF KRW VUV VND XOF",
			multiple 	: '1'
	},
		

	byThree	: {
			currencies	: "BHD LYD JOD KWD OMR TND",
			multiple	: '1000'
	}
		
		
}




/*
* Module exports
*/

module.exports = ckoCardCurrency;