'use strict';

/**
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function(){
	buildTabs();
	buildTable();
}, false);

function buildTable() {
	//define some sample data
	var tabledata = [
		{id:1, name:"Oli Bob", age:"12", col:"red", dob:""},
		{id:2, name:"Mary May", age:"1", col:"blue", dob:"14/05/1982"},
		{id:3, name:"Christine Lobowski", age:"42", col:"green", dob:"22/05/1982"},
		{id:4, name:"Brendon Philips", age:"125", col:"orange", dob:"01/08/1980"},
		{id:5, name:"Margret Marmajuke", age:"16", col:"yellow", dob:"31/01/1999"}
	];

	//create Tabulator on DOM element with id "example-table"
	var table = new Tabulator("#example-table", {
		height:205, // set height of table (in CSS or here), this enables the Virtual DOM and improves render speed dramatically (can be any valid css height value)
		data:tabledata, //assign data to table
		layout:"fitColumns", //fit columns to width of table (optional)
		columns:[ //Define Table Columns
			{title:"Name", field:"name", width:150},
			{title:"Age", field:"age", align:"left", formatter:"progress"},
			{title:"Favourite Color", field:"col"},
			{title:"Date Of Birth", field:"dob", sorter:"date", align:"center"},
		],
		rowClick:function(e, row){ //trigger an alert message when the row is clicked
			alert("Row " + row.getData().id + " Clicked!!!!");
		},
	});
}

function buildTabs() {
	// Get the active tab id
	var activeId = '[id="' + getCookie('ckoTabs') + '"]';
		
	// Activate current
	jQuery(activeId).removeClass('table_tabs_dis').addClass('table_tabs_en');
	jQuery(activeId).parent('td').removeClass('table_tabs_dis_background').addClass('table_tabs_en_background');
}

function setNavigationstate(path) {
	// Get the path members
	var members = path.split('/');
		
	// Set the cookie with controller name
	document.cookie = 'ckoTabs=' + members[members.length-1];
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