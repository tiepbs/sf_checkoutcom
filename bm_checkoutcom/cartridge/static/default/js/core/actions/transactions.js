'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	// Build the click actions
    buildTransactionActions();
    
}, false);

function buildTransactionActions() {
    // Initial action amount
    jQuery('.ckoAction-3').each(function(i) {
        jQuery(this).val(toFloat(jQuery(this).val()));
    });

    // On partial action click
    jQuery('.ckoAction-2').each(function(i) {
        jQuery(this).click(function () {
            jQuery(this).parents('.modal-content').find('.ckoAction-3').prop('disabled', false);
        });
    });

    // On full action click
    jQuery('.ckoAction-1').each(function(i) {
        jQuery(this).click(function () {
            jQuery(this).parents('.modal-content').find('.ckoAction-3').prop('disabled', true);
        });
    });

    // On validation button click
    jQuery('.modal-content button').unbind('click').click(function () {
        sendTransactionData(
            getTransactionData(jQuery(this))
        );
    });
}

function getTransactionData(targetElement) {    
    // Get the requested transaction type
    var task = targetElement.parents('.modal-opened')
    .find('input[name=task]').val();
    
    // Get the transaction amount
    var val = targetElement.parents('.modal-opened')
    .find('input[name=ckoTransactionAmount]').val();
    
    // Remove the currency from the value
    var cleanVal = val.replace( /[^\d\.]*/g, '');

    // Get the transaction id
    var tid = targetElement.parents('.modal-opened')
    .find('input[name=ckoTransactionId]').val();

    return {task: task, val: cleanVal, tid: tid};
}

function validateMax(elementId, amount) {
	var maxAmount = toFloat(amount);	
	var targetField = jQuery('#' + elementId);
    var currentAmount = toFloat(targetField.val());
    var finalAmount;
	
	if ((currentAmount > maxAmount) || currentAmount == 0) {
        finalAmount = maxAmount
    }
    else {
        finalAmount = currentAmount;
    }
    
    targetField.val(finalAmount);
}

function toFloat(val) {
    var output;
    
    if (val.constructor === String) {
        var parsed = /[+-]?\d+(?:\.\d+)?/g.exec(val);
        output = parsed === null ? 0 : parsed.pop()
    } else {
        return Math.abs(val).toFixed(2);
    }
    output = Math.abs(Number(output));
    if (String(output).split(".").length < 2 || String(output).split(".")[1].length<=2 ){
        output = output.toFixed(2);
    }
    
    return parseFloat(output).toFixed(2);
}