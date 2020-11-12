'use strict';
/*
 * jQuery Ajax helpers on DOM ready.
 */
document.addEventListener('DOMContentLoaded', function () {
	
    // Initialize the settings page accordion display function
	initSettingsAccordion();
	
	// Initialize the settings page form submission
	initializeFormSubmit();
	
	// Initialize input toggle
	toggleCKOInput();
}, false);

/*
 * Toggles the settings menu and the forms display
 */
function initSettingsAccordion() {
	var acc = document.getElementsByClassName('cko-settings-accordion');
	var i;
	for (i = 0; i < acc.length; i++) {
		acc[i].addEventListener('click', function() { 
			
	        // Remove all active classes
	        jQuery('.cko-settings-accordion').removeClass('cko-settings-active');
	        jQuery('.cko-settings-panel').css('display', 'none');
	        
			/* Toggle between adding and removing the "active" class,
			to highlight the button that controls the panel */
			this.classList.toggle('cko-settings-active');
			var panel = this.nextElementSibling;
			var currentForm = panel.firstElementChild;
			var settingsUrl = currentForm.firstElementChild.value;
			
			/* Toggle between hiding and showing the active panel */
			if (panel) {
				if (panel.style.minHeight) {
					panel.style.minHeight = null;
					panel.style.display = 'none';
				} else {
					
					// Get and Set the Default CKO Custom Values
					getCkoCustomObjects(settingsUrl, currentForm);
					
					panel.style.minHeight = panel.scrollHeight + 'px';
					panel.style.display = 'block';
				}
			}
		});
	}
}

/*
 * Hides and show capture time 
 */
function toggleCKOInput() {
	var ckoAutoCapture = document.getElementById('ckoAutoCapture');
	ckoAutoCapture.addEventListener('click', function(){
		var ckoAutoCaptureTime = document.getElementById('ckoAutoCaptureTime');
		if (ckoAutoCapture.checked == true) {
			ckoAutoCaptureTime.parentNode.style.display = 'block';
		} else {
			ckoAutoCaptureTime.parentNode.style.display = 'none';
		}
	});
}

/*
 * Targets each forms, prevent default submission actions and serialise form inputs 
 * Also shows the spinner, makes and ajax request and close the spinner after the ajax response.
 */
function initializeFormSubmit() {
	jQuery( 'form' ).on( 'submit', function( event ) {
		  event.preventDefault();
		  
		  // Parsley front end form validation
		  $(function () {
			 this.parsley().on('form:validate', function (formInstance) { 
			    var ok = formInstance.isValid({group: 'block1', force: true}) || formInstance.isValid({group: 'block2', force: true});
			    if (!ok){	
			    	
			    	return; 
			    }  
			 });
		  });  
		  
		// Ajax action url
		var actionUrl = this.action;
		
		// Returns the spinner element in this form
		var spinner = this.getElementsByClassName('spinner-border'); 
		
		if (spinner.length > 0) {
			// Show the spinner element
			spinner[0].style.display = 'block'; 
		}
		
		// Serialize all the form inputs as a string 
		var rawData = $( this ).serialize(); 
		
		var currentForm = this;
		
		// Form fields
		var properties = getFormInputsObject(currentForm);
		
		// Formated serialized form data
		var formatedData = serializeData(rawData);
		
		// Ajax request util function
		ajaxPostCall(actionUrl, properties, formatedData, spinner); 
	});
}

/*
 * Makes the ajax request to the relevant controller method with the form data
 */
function ajaxPostCall(actionUrl, properties, formatedData, spinner) {
	var stringPropertiedData = JSON.stringify(properties);
	var stringFormatedData = JSON.stringify(formatedData);
	var urlandData = actionUrl + '?cko-data=' + stringFormatedData + '&cko-properties=' + stringPropertiedData;
	if (actionUrl) {	
		
		// Creates a new xmlhttp request object
		var xhttp = new XMLHttpRequest();
		
		// When request state changes
		xhttp.onreadystatechange = function(){
			
        	// If request was successful and return 200
            if (this.readyState == 4 && this.status == 200) {
            	removeCKOSpinner(spinner[0])	
            }
		};
		
		// Creates a get request
		xhttp.open('GET', urlandData, true);
		
		// Makes the get request
		xhttp.send();
	}	
}

/*
 * Removes CKO Form Spinner
 */
function removeCKOSpinner(ckoNode) {
	if (ckoNode) {
		setTimeout(function(){ 
			ckoNode.style.display = 'none';
			
			// Add cko tick to form
			addCkoTick(ckoNode)
		}, 2000);
	}
}

/*
 * Adds a tick to the form on Success
 */
function addCkoTick(ckoNode) {
	
	// Show cko tick on success
	var ckoTick = ckoNode.nextElementSibling.firstElementChild;
	
	if (ckoTick) {
		ckoTick.style.display = 'block';
	}
	
	// Hide cko tick 
	setTimeout(function(){ 
		ckoTick.style.display = 'none';
	}, 2000);
}

/*
 * Ajax Request Function
 * Makes the ajax request to the relevant controller method with the controller url
 */
function getCkoCustomObjects(actionUrl, currentForm) {
	var stringData = JSON.stringify(getFormInputsObject(currentForm));
	var urlandData = actionUrl + '?cko-data=' + stringData;
	if (actionUrl) {
		
		// Creates a new xmlhttp request object
		var xhttp = new XMLHttpRequest();
		
		// When request state changes
		xhttp.onreadystatechange = function(){
			
        	// If request was successful and return 200
            if (this.readyState == 4 && this.status == 200) {
            	
            	//Return this.responseText;
            	var responseObject = JSON.parse(this.responseText);
            	
            	if (!responseObject.hasOwnProperty('error')) {
            		
            		// Sets Populates Input with Default Data
            		setInputDefaultVals(responseObject,currentForm);	
            	}
            }
		};
		
		// Creates a get request
		xhttp.open('GET', urlandData, true);
		
		// Makes the get request
		xhttp.send();
	}
}

/*
 * Sets the Form Default Input Values
 */
function setInputDefaultVals(responseObject, currentForm) {
	// Current form div tags
	var currentFormDiv = currentForm.getElementsByClassName('form-group');
	for (var i = 0; i < currentFormDiv.length; i++ ) {
		var currentDiv = currentFormDiv[i];
		var currentInputId = currentDiv.lastElementChild.id
		var currentInputType = currentDiv.lastElementChild.type
		if (currentInputType == 'text') {
			
    		// Assign default values
    		currentDiv.lastElementChild.value = responseObject[currentInputId];
		} else {
			if (currentInputType == 'checkbox') {
				currentDiv.lastElementChild.checked = responseObject[currentInputId];
				if (currentDiv.lastElementChild.id == 'ckoAutoCapture' && responseObject[currentInputId]) {
					var ckoAutoCaptureTime = document.getElementById('ckoAutoCaptureTime');
					ckoAutoCaptureTime.parentNode.style.display = 'block';
				}
			} else {
				
        		// Assign default values
        		currentDiv.lastElementChild.value = responseObject[currentInputId];
			}
		}   		
	}
}

/*
 * Gets the Current 
 */
function getFormInputsObject(currentForm) {
	var inputDivs = currentForm.getElementsByClassName('form-group');
	var inputNames = [];
	for (var i = 0; i < inputDivs.length; i++) {
		var currentId = inputDivs[i].lastElementChild.id;
		inputNames[i] = currentId;
	}
	
	return inputNames;
}

/*
 * Form Data Serialise Function
 * Transforms the form data from a string to a useful object.
 */
function serializeData(data) {
	var newData = JSON.parse('{"' + decodeURI(data.replace(/&/g, "\",\"").replace(/=/g,"\":\"")) + '"}');
	var serializeData = {};
	for (let [key, value] of Object.entries(newData)) {
		if (value !== '' & key !== 'csrf_token') {
			serializeData[key] = value;
		}
	}
	
	return serializeData;
}