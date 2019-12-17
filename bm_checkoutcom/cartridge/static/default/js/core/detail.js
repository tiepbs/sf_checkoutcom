'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	
}, false);

// Open the Modal
function openModal(id) {
    var targetItemId = '#' + id;
    jQuery(targetItemId).css('display', 'block')
    .removeClass('modal-closed')
    .addClass('modal-opened');
}
  
// Close the Modal
function closeModal(id) {
    var targetItemId = '#' + id;
    jQuery(targetItemId).css('display', 'none')
    .removeClass('modal-opened')
    .addClass('modal-closed');
}