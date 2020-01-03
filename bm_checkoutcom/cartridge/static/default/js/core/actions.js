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
		jQuery('.ckoModal').hide();
	});
}

function openModal(elt) {
	// Prepare the origin element id
	var members = elt.id.split('-');

	// Get the transaction data
	getTransactionData(members[2]);


	// Open the target modal
	var modalId = members[0] + '_modal';
	jQuery('[id="' + modalId + '"]').show();
}

function getTransactionData(transactionId) {
	var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();
	jQuery.ajax({
		type: 'POST',
		url: controllerUrl,
		data: {tid: transactionId},
		success: function (data) {
			console.log(data);
		},
		error: function (request, status, error) {
			console.log(error);
		}
	});
}