'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
    // Load the translation strings
    loadTranslations();

    // Build the navigation tabs
    buildTabs();

    // Get the transactions
    getTransactions(initTable);
}, false);

function loadTranslations() {
    window.ckolang = JSON.parse(jQuery('[id="translationStrings"]').val());
}

function buildTabs()
{
    // Get the active tab id
    var activeId = '[id="' + getCookie('ckoTabs') + '"]';
        
    // Activate current
    jQuery(activeId).removeClass('table_tabs_dis').addClass('table_tabs_en');
    jQuery(activeId).parent('td').removeClass('table_tabs_dis_background').addClass('table_tabs_en_background');
}

function getCookie(cname)
{
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i <ca.length; i++) {
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

function getTransactions(callBackFn)
{
    var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();
    jQuery.ajax({
        type: 'POST',
        url: controllerUrl,
        success: function (data) {
            callBackFn(data);
        },
        error: function (request, status, error) {
            console.log(error);
        }
    });
}

function initTable(tableData)
{
    // Build the table instance
    window.ckoTransactionsTable = new Tabulator('#transactions-table', {
        index: 'id',
        responsiveLayout:true,
        selectable: 'highlight',
        headerFilterPlaceholder: '>',
        placeholder: window.ckolang.noResults,
        layout: 'fitColumns',
        data: JSON.parse(tableData),
        layout: 'fitColumns',
        pagination: 'local',
        paginationSize: 50,
        columns: getTableColumns(),
        langs: getTableStrings(),
        tableBuilt: function () {
            // Set the pagination controls
            setPagination(this);
        }
    });
}

function getTableStrings() {
    var tableLocale = getTableLocale();
    return {
        tableLocale: { 
            'columns': {
                'id': window.ckolang.rowId,
                'order_no': window.ckolang.orderNo,
                'transaction_id': window.ckolang.transactionId,
                'parent_transaction_id': window.ckolang.parentTransactionId,
                'payment_id': window.ckolang.paymentId,
                'amount': window.ckolang.amount,
                'currency': window.ckolang.currency,
                'date': window.ckolang.date,
                'type': window.ckolang.type,
                'opened': window.ckolang.opened,
                'processor': window.ckolang.processor,
                'actions': window.ckolang.actions
            },
            'pagination': {
                'first': window.ckolang.first,
                'first_title': window.ckolang.firstTitle,
                'last': window.ckolang.last,
                'last_title': window.ckolang.lastTitle,
                'prev': window.ckolang.prev,
                'prev_title': window.ckolang.prevTitle,
                'next': window.ckolang.next,
                'next_title': window.ckolang.nextTitle,
            }
        }
    };
}

function getTableLocale() {
    var currentLocale = jQuery('[id="currentLocale"]').val();
    return currentLocale + '-' + currentLocale;
}

function reloadTable(tableData)
{
    // Update the row data
    window.ckoTransactionsTable.replaceData(tableData);

    // Show the success message
    showSuccessMessage();
}

function showSuccessMessage()
{
    // Show the success message
    jQuery('.ckoSuccessMessage').show(
        'fast',
        function () {
            setTimeout(function () {
                jQuery('.ckoSuccessMessage').hide('fast');
            }, 7000);
        }
    );
}

function setPagination(table)
{
    // Add the pager event
    jQuery('.transactions-table-controls .transactions-table-pager').change(function () {
        var selectedVal = jQuery(this).val();
        jQuery(this).val(selectedVal);
        table.setPageSize(selectedVal);
    });
}

function getTableColumns()
{
    return [
        {title: 'Id', field: 'id', visible: false},
        {title: 'Order No', field: 'order_no', width: 120, formatter: 'html', headerFilter: 'input'},
        {title: 'Transaction id', field: 'transaction_id', headerFilter: 'input'},
        {title: 'Parent tranaction id', field: 'parent_transaction_id', headerFilter: 'input'},
        {title: 'Payment id', field: 'payment_id', headerFilter: 'input'},
        {
            title: 'Amount',
            field: 'amount',
            width: 120,
            headerFilter: 'input',
            formatter: function (cell, formatterParams, onRendered) {
                var rowData = cell.getRow().getData();
                return cell.getValue() + ' ' + rowData.currency;
            }
        },
        {title: 'Currency', field: 'currency', visible: false},
        {title: 'Date', field: 'creation_date', width: 140, headerFilter: 'input'},
        {title: 'Type', field: 'type', width: 110, headerFilter: 'input'},
        {title: 'State', field: 'opened', width: 110, formatter: 'tickCross', visible: false},
        {title: 'Processor', field: 'processor', width: 190, headerFilter: 'input'},
        {
            title: 'Actions',
            field: 'actions',
            headerSort: false,
            align: 'center',
            width: 200,
            formatter: function (cell, formatterParams, onRendered) {
                return getButtonsHtml(cell);
            }
        }
    ];
}

function getButtonsHtml(cell)
{
    // Get the row data
    var rowData = cell.getRow().getData();

    // Prepare the variable
    var html = '';
    
    // Build the action buttons
    if (JSON.parse(rowData.opened)) {
        // Capture
        if (rowData.type == 'AUTH') {
            html += '<button type="button" id="void-button-' + rowData.transaction_id + '" class="btn btn-default ckoAction">Void</button>';
            html += '<button type="button" id="capture-button-' + rowData.transaction_id + '" class="btn btn-info ckoAction">Capture</button>';
        }

        // Void
        if (rowData.type == 'CAPTURE') {
            html += '<button type="button" id="refund-button-' + rowData.transaction_id + '" class="btn btn-secondary ckoAction">Refund</button>';
        }
    } else {
        html += '<div class="ckoLocked">&#x1f512;</div>';
    }

    return html;
}