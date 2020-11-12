'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function() {
    // Load the translation strings
    // eslint-disable-next-line
    loadTranslations();

    // Build the navigation tabs
    // eslint-disable-next-line
    buildTabs();

    // Get the transactions
    // eslint-disable-next-line
    getTransactions(initTable);
}, false);

/**
 * Load the transactions.
 */
function loadTranslations() {
    window.ckoLang = JSON.parse(jQuery('[id="translationStrings"]').val());
}

/**
 * Build the tabs.
 */
function buildTabs() {
    // Get the active tab id
    // eslint-disable-next-line
    var activeId = '[id="' + getCookie('ckoTabs') + '"]';

    // Activate current
    jQuery(activeId).removeClass('table_tabs_dis').addClass('table_tabs_en');
    jQuery(activeId).parent('td').removeClass('table_tabs_dis_background').addClass('table_tabs_en_background');
}

/**
 * Get a cookie value.
 * @param {string} cname The cookie name
 * @returns {string} The cookie value
 */
function getCookie(cname) {
    var name = cname + '=';
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

/**
 * Get transactions.
 * @param {string} callBackFn The callback function
 */
function getTransactions(callBackFn) {
    var controllerUrl = jQuery('[id="transactionsControllerUrl"]').val();
    jQuery.ajax({
        type: 'POST',
        url: controllerUrl,
        success: function(data) {
            callBackFn(data);
        },
        error: function(request, status, error) {
            // eslint-disable-next-line no-console
            console.log(error);
        },
    });
}

/**
 * Initialise the table.
 * @param {string} tableData The table data
 */
function initTable(tableData) {
    // Build the table instance
    // eslint-disable-next-line
    window.ckoTransactionsTable = new Tabulator('#transactions-table', {
        index: 'id',
        responsiveLayout: true,
        selectable: 'highlight',
        headerFilterPlaceholder: '>',
        placeholder: window.ckoLang.noResults,
        layout: 'fitColumns',
        data: JSON.parse(tableData),
        pagination: 'local',
        paginationSize: 50,
        columns: getTableColumns(), // eslint-disable-line
        langs: getTableStrings(), // eslint-disable-line
        tableBuilt: function() {
            // Set the pagination controls
            // eslint-disable-next-line
            setPagination(this);
        },
    });
}

/**
 * Get the table strings.
 * @returns {Object} The trannslated strings object
 */
function getTableStrings() {
    // eslint-disable-next-line
    var tableLocale = getTableLocale();
    return {
        tableLocale: {
            columns: {
                id: window.ckoLang.rowId,
                order_no: window.ckoLang.orderNo,
                transaction_id: window.ckoLang.transactionId,
                payment_id: window.ckoLang.paymentId,
                amount: window.ckoLang.amount,
                currency: window.ckoLang.currency,
                date: window.ckoLang.date,
                type: window.ckoLang.type,
                opened: window.ckoLang.opened,
                processor: window.ckoLang.processor,
                actions: window.ckoLang.actions,
            },
            pagination: {
                first: window.ckoLang.first,
                first_title: window.ckoLang.firstTitle,
                last: window.ckoLang.last,
                last_title: window.ckoLang.lastTitle,
                prev: window.ckoLang.prev,
                prev_title: window.ckoLang.prevTitle,
                next: window.ckoLang.next,
                next_title: window.ckoLang.nextTitle,
            },
        },
    };
}

/**
 * Get the table locale.
 * @returns {string} The table locale
 */
function getTableLocale() {
    var currentLocale = jQuery('[id="currentLocale"]').val();
    return currentLocale + '-' + currentLocale;
}

/**
 * Set the table pagination.
 * @param {Object} table table data
 */
function setPagination(table) {
    // Add the pager event
    jQuery('.transactions-table-controls .transactions-table-pager').change(function() {
        var selectedVal = jQuery(this).val();
        jQuery(this).val(selectedVal);
        table.setPageSize(selectedVal);
    });
}

/**
 * Get the table columns.
 * @returns {Object} The table columns object
 */
function getTableColumns() {
    return [
        { title: 'Id', field: 'id', visible: false },
        { title: 'Order No', field: 'order_no', width: 120, formatter: 'html', headerFilter: 'input' },
        { title: 'Transaction id', field: 'transaction_id', headerFilter: 'input' },
        { title: 'Payment id', field: 'payment_id', headerFilter: 'input' },
        {
            title: 'Amount',
            field: 'amount',
            headerFilter: 'input',
            formatter: function(cell, formatterParams, onRendered) {
                var rowData = cell.getRow().getData();
                return cell.getValue() + ' ' + rowData.currency;
            },
        },
        { title: 'Currency', field: 'currency', visible: false },
        { title: 'Date', field: 'creation_date', headerFilter: 'input' },
        { title: 'Type', field: 'type', headerFilter: 'input' },
        { title: 'State', field: 'opened', formatter: 'tickCross', visible: false },
        { title: 'Processor', field: 'processor', width: 200, headerFilter: 'input' },
        {
            title: 'Actions',
            field: 'actions',
            width: 230,
            headerSort: false,
            align: 'center',
            formatter: function(cell, formatterParams, onRendered) {
                // eslint-disable-next-line
                return getButtonsHtml(cell);
            },
        },
    ];
}

/**
 * Get the HTML buttons.
 * @param {Object} cell the table cell
 * @returns {string} The buttons HTML
 */
function getButtonsHtml(cell) {
    // Get the row data
    var rowData = cell.getRow().getData();

    // Prepare the variable
    var html = '';

    // Build the action buttons
    if (JSON.parse(rowData.opened) && rowData.type !== 'CREDIT') {
        // Capture
        if (rowData.type === 'AUTH') {
            html += '<button type="button" id="void-button-' + rowData.transaction_id + '" class="btn btn-default ckoAction">' + window.ckoLang.void + '</button>';
            html += '<button type="button" id="capture-button-' + rowData.transaction_id + '" class="btn btn-info ckoAction">' + window.ckoLang.capture + '</button>';
        }

        // Void
        if (rowData.type === 'CAPTURE') {
            html += '<button type="button" id="refund-button-' + rowData.transaction_id + '" class="btn btn-secondary ckoAction">' + window.ckoLang.refund + '</button>';
        }
    } else {
        html += '<div class="ckoLocked">&#x1f512;</div>';
    }

    return html;
}
