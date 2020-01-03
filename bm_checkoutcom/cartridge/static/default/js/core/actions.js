'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function(){
	initButtons();
}, false);

function initButtons() {
	// Close the modal window
	jQuery('.ckoModal .modal-content .close').click(function() {
		jQuery('.ckoModal .modal-content input').val('');
		jQuery('.ckoModal .modal-content span').not('.close').empty();
		jQuery('.ckoModal').hide();
	});
}

function openModal(elt) {
	// Prepare the origin element id
	var members = elt.id.split('-');

	// Get the transaction data
	getTransactionData(members);
}

function getTransactionData(members) {
	var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();
	var action = members[0];
	var transactionId = members[2];
	var modalId = '[id="' + action + '_modal"]';
	jQuery.ajax({
		type: 'POST',
		url: controllerUrl,
		data: {tid: transactionId},
		success: function (data) {
			var transaction = JSON.parse(data)[0];
			var field1Id = '[id="' + action + '_value"]';
			var field2Id = '[id="' + action + '_currency"]';
			jQuery(field1Id).val(transaction.amount);
			jQuery(field2Id).append(transaction.currency);
			jQuery(modalId).show();

		},
		error: function (request, status, error) {
			console.log(error);
		}
	});
}