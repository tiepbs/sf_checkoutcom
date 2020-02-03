'use strict'

// set event on page load
document.addEventListener('DOMContentLoaded', function () { 
    // Add expiration years
    setExpirationYears();
});

// Sets the expiration years in the form
function setExpirationYears() {
    // Get the current year
    var d = new Date();
    var currentYear = d.getFullYear();

    // Add the select list options
    for (var i = 0; i < 10; i++) {
        $('#expirationYear').append(
            new Option(
                currentYear + i,
                currentYear + i
            )
        );
    }
}