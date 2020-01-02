'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function(){
	initButtons();
}, false);

function initButtons() {
	// Close modal window
	jQuery('.ckoModal .modal-content .close').click(function() {
		jQuery('.ckoModal').hide();
	});
}

function openModal() {
	jQuery('.ckoModal').show();
}
