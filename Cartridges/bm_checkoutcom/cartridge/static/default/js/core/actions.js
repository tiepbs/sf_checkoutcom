'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the button events
    initButtons();
}, false);

function initButtons()
{
    // Close the modal window
    jQuery('.ckoModal .modal-content .close').click(function(e) {
        jQuery('.ckoModal .modal-content input').val('');
        jQuery('.ckoModal .modal-content span').not('.close, .label').empty();
        jQuery('.ckoModal').hide();
    });

    // Define the transaction buttons click events
    document.addEventListener('click', function (e) {
        // Prevent double click
        if (typeof e.target.className === 'string' && e.target.className.indexOf('ckoAction') !== -1) {
            // Ignore double cliks
            if (e.detail > 1) {
                return;
            }

            // Open the modal
            openModal(e.target);
        }
    },  true);
    
    // Submit the action request
    jQuery('.ckoModal .modal-content .submit').click(function () {
        // Prepare the origin element id members
        var elt = jQuery(this).closest('.modal-content').find('input');
        var members = elt.attr('id').split('_');

        // Get the transaction task
        var task = members[0];

        // Perform the requested action
        performAction(task);               
    });
}

function openModal(elt)
{
    // Prepare the origin element id members
    var members = elt.id.split('-');

    // Get the transaction data
    var tidExists = members[2] != null && members[2] != 'undefined';
    var isValidTid = members[2].length > 0 && members[2].indexOf('act_') == 0;
    if (tidExists && isValidTid) {
        getTransactionData(members);
    } else {
        alert(l.transactionMissing);
    }
}

function getTransactionData(members)
{
    // Prepare the controller URL for the AJAX request
    var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();

    // Set the transaction action
    var task = members[0];

    // Set the transaction id
    var transactionId = members[2];

    // Set the modal window id
    var modalId = '[id="' + task + '_modal"]';

    // Send the AJAX request
    jQuery.ajax({
        type: 'POST',
        url: controllerUrl,
        data: {tid: transactionId},
        success: function (data) {
            // Get the data
            var transaction = JSON.parse(data)[0];

            // Set the transation data field ids
            var field1Id = '[id="' + task + '_value"]';
            var field2Id = '[id="' + task + '_currency"]';
            var field3Id = '[id="' + task + '_transaction_id"]';
            var field4Id = '[id="' + task + '_payment_id"]';
            var field5Id = '[id="' + task + '_full_amount"]';
            var field6Id = '[id="' + task + '_order_no"]';
            var field7Id = '[id="' + task + '_refundable_amount"]';

            // Handle the capture case transation amount value
            if (transaction.data_type == 'CAPTURE') {
                jQuery(field1Id).val(transaction.refundable_amount);
                jQuery(field7Id).append(transaction.refundable_amount + ' ' + transaction.currency);
            }
            else {
                jQuery(field1Id).val(transaction.amount);
            }

            // Add the remaining values
            jQuery(field2Id).append(transaction.currency);
            jQuery(field3Id).append(transaction.transaction_id);
            jQuery(field4Id).append(transaction.payment_id);
            jQuery(field5Id).append(transaction.amount + ' ' + transaction.currency);
            jQuery(field6Id).append(transaction.order_no);

            // Show the modal window
            jQuery(modalId).show();
        },
        error: function (request, status, error) {
            console.log(error);
        }
    });
}

function showErrorMessage(selector)
{
    // Show the error message
    jQuery('.' + selector).show(
        'fast',
        function () {
            setTimeout(function () {
                jQuery('.' + selector).hide();
            }, 7000);
        }
    );
}

function performAction(task)
{
    // Prepare the action URL
    var actionUrl = jQuery('[id="actionControllerUrl"]').val();
    
    // Set the transaction id
    var paymentId = jQuery('[id="' + task + '_payment_id"]').text();

    // Set the transaction value field id
    var amount = jQuery('[id="' + task + '_value"]').val();

    // Prepare the action data
    var data = {
        pid: paymentId,
        task: task,
        amount: amount
    }

    // Send the AJAX request
    jQuery.ajax({
        type: 'POST',
        url: actionUrl,
        data: data,
        success: function (res) {
            var success = JSON.parse(res);
            if (!success) {
                showErrorMessage('ckoErrorMessage');
            } else {
                // Close the modal window
                jQuery('.ckoModal .modal-content .close').trigger('click');

                // Reload the table data (getTransactions(reloadTable))
                window.location.reload();
            }
        },
        error: function (request, status, error) {
            console.log(error);
        }
    });
}