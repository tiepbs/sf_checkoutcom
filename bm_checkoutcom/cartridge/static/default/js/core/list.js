'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
	buildTabs();
	buildTable();
}, false);

function buildTable() {
	// Prepare the table data
	var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();

	// Instantiate the table
	getTransactionsData(controllerUrl);
}

function buildTabs() {
	// Get the active tab id
	var activeId = '[id="' + getCookie('ckoTabs') + '"]';
		
	// Activate current
	jQuery(activeId).removeClass('table_tabs_dis').addClass('table_tabs_en');
	jQuery(activeId).parent('td').removeClass('table_tabs_dis_background').addClass('table_tabs_en_background');
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getTransactionsData(controllerUrl) {
	jQuery.ajax({
		type: 'POST',
		url: controllerUrl,
		success: function (data) {
			initTable(data);
		},
		error: function (request, status, error) {
			console.log(error);
		}
	});
}

function initTable(tableData) {
	// Build the table instance
	var table = new Tabulator('#transactions-table', {
		headerFilterPlaceholder: '>',
		placeholder: 'No results found for this request.',
		data: JSON.parse(tableData), 
		layout: 'fitColumns',
		pagination: 'local',
		paginationSize: 10,
		columns: getTableColumns(),
		tableBuilt: function() {
			// Set the pagination controls
			setPagination(this);
		}
	});
}

function setPagination(table) {
	// Add the pager event
	jQuery('.transactions-table-controls .transactions-table-pager').change(function() {
		var selectedVal = jQuery(this).val();
		jQuery(this).val(selectedVal);
		table.setPageSize(selectedVal);
	});
}

function getTableColumns() {
	return [
		{title: 'Order No', field: 'order_no', width: 150, formatter: 'html', headerFilter: 'input', headerFilterPlaceholder: ''},
		{title: 'Transaction Id', field:'transaction_id', headerFilter: 'input', headerFilterPlaceholder: ''},
		{
			title: 'Amount',
			field: 'amount',
			headerFilter: 'input',
			headerFilterPlaceholder: '',
			formatter: function (cell, formatterParams, onRendered) {
				var rowData = cell.getRow().getData();
				return cell.getValue() + ' ' + rowData.currency;
			}		
		},
		{title: 'Currency', field: 'currency', visible: false},
		{title: 'Date', field: 'creation_date', headerFilter: 'input'},
		{title: 'Type', field: 'type', headerFilter: 'input'},
		{title: 'Processor', field: 'processor', headerFilter: 'input'},
		{
			title:'Actions',
			field: 'actions',
			headerSort: false,
			formatter: function (cell, formatterParams, onRendered) {
				var transactionId = cell.getRow().getData().transaction_id;
				return getButtonsHtml(transactionId);
			}
		}
	];
}

function getButtonsHtml(transactionId) {
	// Prepare the variable
	var html = '';
	
	// Build the auth button
	html += '<button type="button" id="capture-button-' + transactionId + '" onclick="openModal(this)" class="btn btn-primary">Capture</button>';
	html += '<button type="button" id="void-button-' + transactionId + '" onclick="openModal(this)" class="btn btn-primary">Void</button>';
	html += '<button type="button" id="refund-button-' + transactionId + '" onclick="openModal(this)" class="btn btn-primary">Refund</button>';

	return html;
}
